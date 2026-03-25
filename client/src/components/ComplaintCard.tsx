import { useState } from "react";
import {
  FiAlertCircle,
  FiClock,
  FiGitMerge,
  FiImage,
  FiMapPin,
  FiShield,
} from "react-icons/fi";

import type { Complaint } from "../services/api";
import { complaintStatusTone, isClosedComplaint } from "../utils/complaints";
import ImageLightbox from "./ImageLightbox";

const categoryStyles: Record<
  Complaint["category"],
  { label: string; accent: string; tint: string }
> = {
  garbage: {
    label: "Sanitation",
    accent: "border-l-emerald-500",
    tint: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
  },
  water: {
    label: "Water Supply",
    accent: "border-l-sky-500",
    tint: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-200",
  },
  electricity: {
    label: "Electricity",
    accent: "border-l-amber-500",
    tint: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
  },
  road: {
    label: "Roads",
    accent: "border-l-orange-500",
    tint: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200",
  },
  drainage: {
    label: "Drainage",
    accent: "border-l-indigo-500",
    tint: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200",
  },
  streetlight: {
    label: "Streetlight",
    accent: "border-l-yellow-400",
    tint: "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-100",
  },
  traffic: {
    label: "Traffic",
    accent: "border-l-rose-500",
    tint: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200",
  },
  public_transport: {
    label: "Public Transport",
    accent: "border-l-cyan-500",
    tint: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-200",
  },
  park: {
    label: "Park",
    accent: "border-l-lime-500",
    tint: "bg-lime-50 text-lime-700 dark:bg-lime-950/50 dark:text-lime-200",
  },
  encroachment: {
    label: "Encroachment",
    accent: "border-l-fuchsia-500",
    tint: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-200",
  },
  pollution: {
    label: "Pollution",
    accent: "border-l-slate-500",
    tint: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  },
  stray_animals: {
    label: "Stray Animals",
    accent: "border-l-teal-500",
    tint: "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-200",
  },
};

const priorityTone: Record<Complaint["priority"], string> = {
  Low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
  Medium: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
  High: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200",
};

const formatSlaState = (status: Complaint["status"], deadline: string) => {
  if (isClosedComplaint(status)) {
    return status;
  }

  const diff = new Date(deadline).getTime() - Date.now();

  if (diff <= 0) {
    return "Overdue";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m left`;
};

const formatUrgencyLabel = (sentimentScore: number) => {
  if (sentimentScore >= 0.85) {
    return "Critical urgency";
  }

  if (sentimentScore >= 0.65) {
    return "Urgent tone";
  }

  if (sentimentScore >= 0.4) {
    return "Elevated tone";
  }

  return "Calm tone";
};

const formatDuplicateLabel = (duplicateScore: number) => {
  if (duplicateScore > 0.85) {
    return "Likely duplicate";
  }

  if (duplicateScore > 0.65) {
    return "Similar reports found";
  }

  return "Distinct report";
};

interface ComplaintCardProps {
  complaint: Complaint;
  showCitizen?: boolean;
  showTimeline?: boolean;
}

const ComplaintCard = ({
  complaint,
  showCitizen = false,
  showTimeline = false,
}: ComplaintCardProps) => {
  const category = categoryStyles[complaint.category];
  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <>
      <article
        className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 ${category.accent} border-l-4`}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span>{complaint.complaintId}</span>
              <span className={`rounded-full px-3 py-1 ${category.tint}`}>
                {category.label}
              </span>
              <span
                className={`rounded-full px-3 py-1 ${priorityTone[complaint.priority]}`}
              >
                {complaint.priority} Priority
              </span>
            </div>

            <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
              {complaint.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {complaint.description}
            </p>

            <div className="mt-5 grid gap-4 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3 xl:grid-cols-6">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Priority
                </p>
                <p className="mt-2 flex items-center gap-2 font-medium">
                  <FiAlertCircle size={14} />
                  {complaint.priority}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Severity
                </p>
                <p className="mt-2 font-medium">
                  {complaint.severityScore}/100
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Department
                </p>
                <p className="mt-2 font-medium">{complaint.department}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Location
                </p>
                <p className="mt-2 flex items-center gap-2 font-medium">
                  <FiMapPin size={14} />
                  {complaint.address}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Urgency Signal
                </p>
                <p className="mt-2 flex items-center gap-2 font-medium">
                  <FiShield size={14} />
                  {formatUrgencyLabel(complaint.sentimentScore)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Duplicate Risk
                </p>
                <p className="mt-2 flex items-center gap-2 font-medium">
                  <FiGitMerge size={14} />
                  {formatDuplicateLabel(complaint.duplicateScore)}
                </p>
              </div>
            </div>

            {complaint.imageUrl ? (
              <button
                type="button"
                onClick={() => setIsImageOpen(true)}
                className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left transition hover:border-civic-teal dark:border-slate-800 dark:bg-slate-950"
              >
                <img
                  src={complaint.imageThumbnailUrl || complaint.imageUrl}
                  alt={complaint.title}
                  loading="lazy"
                  className="h-44 w-full object-cover"
                />
                <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <FiImage size={14} />
                  Tap to view full image
                </div>
              </button>
            ) : null}
          </div>

          <div className="flex min-h-[300px] flex-col gap-4 rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/70">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Status
              </p>
              <span
                className={`mt-3 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${complaintStatusTone[complaint.status]}`}
              >
                {complaint.status}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Timeline
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-civic-orange">
                <FiClock size={14} />
                {formatSlaState(complaint.status, complaint.slaDeadline)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Complaint Category
              </p>

              <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">
                {category.label}
              </p>

              <div className="mt-3 h-px w-full bg-slate-200 dark:bg-slate-700" />

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Assigned to{" "}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {complaint.department}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Created
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {new Date(complaint.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {showCitizen &&
        typeof complaint.citizenId === "object" &&
        complaint.citizenId ? (
          <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800">
            Reported by{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {complaint.citizenId.name}
            </span>{" "}
            � Ward {complaint.citizenId.ward}
          </div>
        ) : null}

        {showTimeline ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">
              Submitted
            </span>
            <span>�</span>
            <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">
              AI Analysis Complete
            </span>
            <span>�</span>
            <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">
              {complaint.status}
            </span>
          </div>
        ) : null}
      </article>

      <ImageLightbox
        imageUrl={complaint.imageUrl}
        title={complaint.title}
        isOpen={isImageOpen}
        onClose={() => setIsImageOpen(false)}
      />
    </>
  );
};

export default ComplaintCard;
