import type { Express } from "express";
import type { Types } from "mongoose";

import { runAiPipeline, type ComplaintCategory } from "../ai-engine/pipeline";
import { uploadImageToCloudinary } from "../config/cloudinary";
import { ComplaintModel } from "../models/Complaint";
import { DepartmentModel } from "../models/Department";
import { SlaRuleModel } from "../models/SlaRule";
import { HttpError } from "../middleware/errorHandler";
import { createGeoPoint } from "../utils/geoUtils";
import { generateComplaintId } from "../utils/generateComplaintId";

const defaultDepartments = [
  {
    name: "Sanitation Department",
    description: "Handles garbage collection and sanitation complaints.",
    headOfficer: "Municipal Sanitation Officer",
    contactEmail: "sanitation@civicconnect.gov",
  },
  {
    name: "Water Board",
    description: "Handles water supply and leakage issues.",
    headOfficer: "Chief Water Engineer",
    contactEmail: "water@civicconnect.gov",
  },
  {
    name: "Electrical Maintenance Wing",
    description: "Handles streetlights and electrical infrastructure issues.",
    headOfficer: "Electrical Operations Head",
    contactEmail: "electricity@civicconnect.gov",
  },
  {
    name: "Roads and Works Department",
    description: "Handles potholes, road damage, and repairs.",
    headOfficer: "Road Maintenance Commissioner",
    contactEmail: "roads@civicconnect.gov",
  },
  {
    name: "Drainage and Sewage Board",
    description: "Handles drainage blockages and overflow issues.",
    headOfficer: "Drainage Superintendent",
    contactEmail: "drainage@civicconnect.gov",
  },
] as const;

const defaultSlaRules: Record<ComplaintCategory, number> = {
  electricity: 12,
  water: 24,
  garbage: 48,
  road: 72,
  drainage: 36,
};

const categoryDepartmentMap: Record<ComplaintCategory, string> = {
  garbage: "Sanitation Department",
  water: "Water Board",
  electricity: "Electrical Maintenance Wing",
  road: "Roads and Works Department",
  drainage: "Drainage and Sewage Board",
};

const findComplaintByIdentifier = async (complaintIdentifier: string) => {
  return ComplaintModel.findOne(
    complaintIdentifier.startsWith("CMP-") ? { complaintId: complaintIdentifier } : { _id: complaintIdentifier },
  );
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
  const existingComplaints = await ComplaintModel.find({
    status: { $ne: "Resolved" },
  }).sort({ createdAt: -1 });

  const aiResult = runAiPipeline({
    title,
    description,
    categoryHint: category,
    existingComplaints,
  });
  const imageUrl = await uploadImageToCloudinary(image);
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
    department: resolveDepartmentName(aiResult.category),
    citizenId,
    imageUrl,
    location: createGeoPoint(longitude, latitude),
    address,
    slaDeadline,
  });

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

  if (actorRole === "citizen" && complaint.status === "Resolved") {
    throw new HttpError(400, "Resolved complaints cannot be updated");
  }

  const existingComplaints = await ComplaintModel.find({
    _id: { $ne: complaint._id },
    status: { $ne: "Resolved" },
  }).sort({ createdAt: -1 });

  const aiResult = runAiPipeline({
    title,
    description,
    categoryHint: category,
    existingComplaints,
  });
  const imageUrl = image ? await uploadImageToCloudinary(image) : complaint.imageUrl;
  const slaDeadline = await calculateSlaDeadline(aiResult.category);

  complaint.title = title;
  complaint.description = description;
  complaint.category = aiResult.category;
  complaint.priority = aiResult.priority;
  complaint.severityScore = aiResult.severityScore;
  complaint.sentimentScore = aiResult.sentimentScore;
  complaint.duplicateScore = aiResult.duplicateScore;
  complaint.department = resolveDepartmentName(aiResult.category);
  complaint.location = createGeoPoint(longitude, latitude);
  complaint.address = address;
  complaint.slaDeadline = slaDeadline;
  complaint.imageUrl = imageUrl;

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
}: {
  complaintIdentifier: string;
  status: "Pending" | "In Progress" | "Resolved";
  department?: string;
}) => {
  const complaint = await findComplaintByIdentifier(complaintIdentifier);

  if (!complaint) {
    throw new HttpError(404, "Complaint not found");
  }

  complaint.status = status;

  if (department) {
    complaint.department = department;
  }

  if (status === "Resolved") {
    complaint.severityScore = Math.max(0, complaint.severityScore - 20);
  }

  await complaint.save();
  return complaint;
};
