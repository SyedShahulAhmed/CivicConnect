import type { Express } from "express";
import type { Types } from "mongoose";

import { type ComplaintCategory, departmentByCategory } from "../ai-engine/constants";
import { runAiPipeline } from "../ai-engine/pipeline";
import { uploadImageToCloudinary } from "../config/cloudinary";
import { HttpError } from "../middleware/errorHandler";
import { ComplaintModel, type ComplaintStatus } from "../models/Complaint";
import { DepartmentModel } from "../models/Department";
import { SlaRuleModel } from "../models/SlaRule";
import { UserModel } from "../models/User";
import { sendComplaintStatusEmail } from "./emailService";
import {
  createComplaintStatusNotification,
  notifyAdminsAboutNewComplaint,
} from "./notificationService";
import { createGeoPoint } from "../utils/geoUtils";
import { generateComplaintId } from "../utils/generateComplaintId";

const defaultDepartments = [
  {
    name: "Sanitation Department",
    description: "Handles garbage collection, waste overflow, and sanitation complaints.",
    headOfficer: "Municipal Sanitation Officer",
    contactEmail: "sanitation@civicconnect.gov",
  },
  {
    name: "Water Supply Department",
    description: "Handles water supply disruptions, leaks, contamination, and pressure issues.",
    headOfficer: "Chief Water Engineer",
    contactEmail: "water@civicconnect.gov",
  },
  {
    name: "Electricity Board",
    description: "Handles electrical faults, outages, sparking infrastructure, and unsafe power assets.",
    headOfficer: "Power Operations Director",
    contactEmail: "electricity@civicconnect.gov",
  },
  {
    name: "Roads & Infrastructure Department",
    description: "Handles potholes, damaged roads, missing barricades, and infrastructure repairs.",
    headOfficer: "Road Infrastructure Commissioner",
    contactEmail: "roads@civicconnect.gov",
  },
  {
    name: "Drainage Department",
    description: "Handles blocked drains, sewage overflow, manholes, and floodwater complaints.",
    headOfficer: "Drainage Superintendent",
    contactEmail: "drainage@civicconnect.gov",
  },
  {
    name: "Electrical Maintenance",
    description: "Handles faulty streetlights, dark stretches, and electrical maintenance in public spaces.",
    headOfficer: "Electrical Maintenance Supervisor",
    contactEmail: "streetlights@civicconnect.gov",
  },
  {
    name: "Traffic Police",
    description: "Handles signal failures, traffic congestion, wrong-side driving, and illegal parking issues.",
    headOfficer: "Traffic Control Inspector",
    contactEmail: "traffic@civicconnect.gov",
  },
  {
    name: "Transport Department",
    description: "Handles public bus service gaps, overcrowding, missing stops, and commuter complaints.",
    headOfficer: "Regional Transport Manager",
    contactEmail: "transport@civicconnect.gov",
  },
  {
    name: "Parks & Recreation",
    description: "Handles damaged parks, broken play equipment, poor upkeep, and unsafe recreation spaces.",
    headOfficer: "Parks Operations Manager",
    contactEmail: "parks@civicconnect.gov",
  },
  {
    name: "Municipal Enforcement",
    description: "Handles illegal encroachments on footpaths, roads, drains, and public land.",
    headOfficer: "Municipal Enforcement Officer",
    contactEmail: "enforcement@civicconnect.gov",
  },
  {
    name: "Environmental Department",
    description: "Handles air, noise, smoke, and dust pollution complaints across the city.",
    headOfficer: "Environmental Health Officer",
    contactEmail: "environment@civicconnect.gov",
  },
  {
    name: "Animal Control",
    description: "Handles stray animal attacks, dead animals, and nuisance animal complaints.",
    headOfficer: "Animal Welfare Supervisor",
    contactEmail: "animals@civicconnect.gov",
  },
] as const;

const defaultSlaRules: Record<ComplaintCategory, number> = {
  garbage: 36,
  water: 18,
  electricity: 10,
  road: 48,
  drainage: 12,
  streetlight: 18,
  traffic: 8,
  public_transport: 24,
  park: 72,
  encroachment: 48,
  pollution: 16,
  stray_animals: 14,
};

const categoryDepartmentMap: Record<ComplaintCategory, string> = departmentByCategory;

const closedComplaintStatuses: ComplaintStatus[] = ["Resolved", "Rejected"];
const FALSE_COMPLAINT_SUSPENSION_THRESHOLD = Math.max(1, Number(process.env.FALSE_COMPLAINT_SUSPENSION_THRESHOLD || 3));
const complaintStatusMessages: Record<ComplaintStatus, string> = {
  Pending: "Your complaint has been received and is awaiting review.",
  "In Progress": "The responsible department has started working on your complaint.",
  Resolved: "The department marked your complaint as resolved.",
  Rejected: "The complaint was reviewed and rejected by the admin team.",
};

const findComplaintByIdentifier = async (complaintIdentifier: string) => {
  return ComplaintModel.findOne(
    complaintIdentifier.startsWith("CMP-") ? { complaintId: complaintIdentifier } : { _id: complaintIdentifier },
  );
};

const assertCitizenCanSubmitComplaints = async (citizenId: string | Types.ObjectId) => {
  const citizen = await UserModel.findById(citizenId).lean();

  if (!citizen) {
    throw new HttpError(404, "Citizen account not found");
  }

  if (citizen.role === "citizen" && citizen.isSuspended) {
    throw new HttpError(
      403,
      citizen.suspensionReason || "Your account has been suspended because of multiple false complaints.",
    );
  }

  return citizen;
};

const syncCitizenSuspensionState = async (citizenId: string) => {
  const citizen = await UserModel.findById(citizenId);

  if (!citizen || citizen.role !== "citizen") {
    return;
  }

  const falseComplaintCount = await ComplaintModel.countDocuments({
    citizenId,
    status: "Rejected",
  });

  const shouldSuspend = falseComplaintCount >= FALSE_COMPLAINT_SUSPENSION_THRESHOLD;

  citizen.falseComplaintCount = falseComplaintCount;
  citizen.isSuspended = shouldSuspend;
  citizen.suspendedAt = shouldSuspend ? citizen.suspendedAt || new Date() : undefined;
  citizen.suspensionReason = shouldSuspend
    ? `Your account has been suspended after ${falseComplaintCount} rejected complaints.`
    : undefined;

  await citizen.save();
};

const handleComplaintStatusSideEffects = async ({
  complaintId,
  citizenId,
  title,
  status,
}: {
  complaintId: string;
  citizenId: string;
  title: string;
  status: ComplaintStatus;
}) => {
  const message = `Your complaint '${title}' is now ${status}.`;

  await createComplaintStatusNotification({
    userId: citizenId,
    complaintId,
    title: status === "Resolved" ? "Complaint resolved" : "Complaint status updated",
    message,
    type: status === "Resolved" ? "resolved" : "status_updated",
  });

  const citizen = await UserModel.findById(citizenId).lean();

  if (!citizen?.email) {
    return;
  }

  try {
    await sendComplaintStatusEmail({
      recipientEmail: citizen.email,
      complaintTitle: title,
      status,
      message: complaintStatusMessages[status],
    });
  } catch (error) {
    console.error("Failed to send complaint status email", error);
  }
};

export const seedReferenceData = async (): Promise<void> => {
  await Promise.all(
    Object.entries(defaultSlaRules).map(([category, deadlineHours]) =>
      SlaRuleModel.updateOne(
        { category },
        { $setOnInsert: { category, deadlineHours } },
        { upsert: true },
      ),
    ),
  );

  await Promise.all(
    defaultDepartments.map((department) =>
      DepartmentModel.updateOne({ name: department.name }, { $setOnInsert: department }, { upsert: true }),
    ),
  );
};

export const resolveDepartmentName = (category: ComplaintCategory): string => {
  return categoryDepartmentMap[category];
};

export const calculateSlaDeadline = async (category: ComplaintCategory): Promise<Date> => {
  const existingRule = await SlaRuleModel.findOne({ category }).lean();
  const deadlineHours = existingRule?.deadlineHours ?? defaultSlaRules[category];

  return new Date(Date.now() + deadlineHours * 60 * 60 * 1000);
};

export const createComplaintWithAi = async ({
  title,
  description,
  category,
  address,
  longitude,
  latitude,
  citizenId,
  image,
}: {
  title: string;
  description: string;
  category?: ComplaintCategory;
  address: string;
  longitude: number;
  latitude: number;
  citizenId: string | Types.ObjectId;
  image?: Express.Multer.File;
}) => {
  await assertCitizenCanSubmitComplaints(citizenId);

  const existingComplaints = await ComplaintModel.find({
    status: { $nin: closedComplaintStatuses },
  }).sort({ createdAt: -1 });

  const aiResult = runAiPipeline({
    title,
    description,
    categoryHint: category,
    existingComplaints,
  });
  const uploadedImage = await uploadImageToCloudinary(image);
  const slaDeadline = await calculateSlaDeadline(aiResult.category);

  const createdComplaint = await ComplaintModel.create({
    complaintId: generateComplaintId(),
    title,
    description,
    category: aiResult.category,
    priority: aiResult.priority,
    severityScore: aiResult.severityScore,
    sentimentScore: aiResult.sentimentScore,
    duplicateScore: aiResult.duplicateScore,
    status: "Pending",
    department: aiResult.department,
    citizenId,
    imageUrl: uploadedImage?.imageUrl,
    imageThumbnailUrl: uploadedImage?.thumbnailUrl,
    location: createGeoPoint(longitude, latitude),
    address,
    slaDeadline,
  });

  try {
    await notifyAdminsAboutNewComplaint({
      complaintId: createdComplaint._id,
      complaintTitle: createdComplaint.title,
      complaintAddress: createdComplaint.address,
      complaintIdLabel: createdComplaint.complaintId,
    });
  } catch (error) {
    console.error("Failed to create admin notification for new complaint", error);
  }

  return {
    complaint: createdComplaint,
    aiResult,
  };
};

export const updateComplaintWithAi = async ({
  complaintIdentifier,
  title,
  description,
  category,
  address,
  longitude,
  latitude,
  actorId,
  actorRole,
  image,
}: {
  complaintIdentifier: string;
  title: string;
  description: string;
  category?: ComplaintCategory;
  address: string;
  longitude: number;
  latitude: number;
  actorId: string;
  actorRole: "citizen" | "admin";
  image?: Express.Multer.File;
}) => {
  const complaint = await findComplaintByIdentifier(complaintIdentifier);

  if (!complaint) {
    throw new HttpError(404, "Complaint not found");
  }

  if (actorRole === "citizen" && complaint.citizenId.toString() !== actorId) {
    throw new HttpError(403, "You can only update your own complaints");
  }

  if (actorRole === "citizen") {
    await assertCitizenCanSubmitComplaints(actorId);
  }

  if (actorRole === "citizen" && closedComplaintStatuses.includes(complaint.status)) {
    throw new HttpError(400, "Closed complaints cannot be updated");
  }

  const existingComplaints = await ComplaintModel.find({
    _id: { $ne: complaint._id },
    status: { $nin: closedComplaintStatuses },
  }).sort({ createdAt: -1 });

  const aiResult = runAiPipeline({
    title,
    description,
    categoryHint: category,
    existingComplaints,
  });
  const uploadedImage = image ? await uploadImageToCloudinary(image) : undefined;
  const slaDeadline = await calculateSlaDeadline(aiResult.category);

  complaint.title = title;
  complaint.description = description;
  complaint.category = aiResult.category;
  complaint.priority = aiResult.priority;
  complaint.severityScore = aiResult.severityScore;
  complaint.sentimentScore = aiResult.sentimentScore;
  complaint.duplicateScore = aiResult.duplicateScore;
  complaint.department = aiResult.department;
  complaint.location = createGeoPoint(longitude, latitude);
  complaint.address = address;
  complaint.slaDeadline = slaDeadline;
  complaint.imageUrl = uploadedImage?.imageUrl || complaint.imageUrl;
  complaint.imageThumbnailUrl = uploadedImage?.thumbnailUrl || complaint.imageThumbnailUrl;

  await complaint.save();

  return {
    complaint,
    aiResult,
  };
};

export const updateComplaintStatus = async ({
  complaintIdentifier,
  status,
  department,
  remark,
  actorId,
  actorName,
}: {
  complaintIdentifier: string;
  status?: ComplaintStatus;
  department?: string;
  remark?: string;
  actorId?: string;
  actorName?: string;
}) => {
  const complaint = await findComplaintByIdentifier(complaintIdentifier);

  if (!complaint) {
    throw new HttpError(404, "Complaint not found");
  }

  const previousStatus = complaint.status;

  if (status) {
    complaint.status = status;
  }

  if (department) {
    complaint.department = department;
  }

  if (status === "Resolved" && previousStatus !== "Resolved") {
    complaint.severityScore = Math.max(0, complaint.severityScore - 20);
  }

  const cleanedRemark = remark?.trim();
  if (cleanedRemark) {
    complaint.remarks.push({
      message: cleanedRemark,
      authorId: actorId,
      authorName: actorName || "admin",
      createdAt: new Date(),
    });
  }

  await complaint.save();

  if (status && status !== previousStatus) {
    await handleComplaintStatusSideEffects({
      complaintId: complaint._id.toString(),
      citizenId: complaint.citizenId.toString(),
      title: complaint.title,
      status,
    });

    await syncCitizenSuspensionState(complaint.citizenId.toString());
  }

  return complaint;
};
