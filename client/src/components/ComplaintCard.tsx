// import type { Complaint } from "../services/api";

// const categoryStyles: Record<Complaint["category"], { label: string; accent: string }> = {
//   garbage: { label: "Sanitation", accent: "border-l-civic-green" },
//   water: { label: "Water Supply", accent: "border-l-sky-500" },
//   electricity: { label: "Electricity", accent: "border-l-amber-500" },
//   road: { label: "Road Damage", accent: "border-l-civic-road" },
//   drainage: { label: "Drainage", accent: "border-l-civic-purple" },
// };

// const formatSlaState = (status: Complaint["status"], deadline: string) => {
//   if (status === "Resolved") {
//     return "Resolved";
//   }

//   const diff = new Date(deadline).getTime() - Date.now();

//   if (diff <= 0) {
//     return "Overdue";
//   }

//   const hours = Math.floor(diff / (1000 * 60 * 60));
//   const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//   return `${hours}h ${minutes}m left`;
// };

// interface ComplaintCardProps {
//   complaint: Complaint;
//   showCitizen?: boolean;
//   showTimeline?: boolean;
// }

// const ComplaintCard = ({ complaint, showCitizen = false, showTimeline = false }: ComplaintCardProps) => {
//   const category = categoryStyles[complaint.category];

//   return (
//     <article className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900 ${category.accent} border-l-4`}>
//       <div className="flex flex-wrap items-start justify-between gap-4">
//         <div>
//           <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
//             <span>{complaint.complaintId}</span>
//             <span>{category.label}</span>
//           </div>
//           <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{complaint.title}</h3>
//           <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{complaint.description}</p>
//         </div>
//         <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right dark:bg-slate-800">
//           <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
//           <p className="font-semibold text-slate-900 dark:text-slate-100">{complaint.status}</p>
//           <p className="mt-1 text-sm text-civic-orange">{formatSlaState(complaint.status, complaint.slaDeadline)}</p>
//         </div>
//       </div>

//       <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-4">
//         <div>
//           <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Priority</p>
//           <p>{complaint.priority}</p>
//         </div>
//         <div>
//           <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Severity</p>
//           <p>{complaint.severityScore}/100</p>
//         </div>
//         <div>
//           <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Department</p>
//           <p>{complaint.department}</p>
//         </div>
//         <div>
//           <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Location</p>
//           <p>{complaint.address}</p>
//         </div>
//       </div>

//       {showCitizen && typeof complaint.citizenId === "object" && complaint.citizenId ? (
//         <p className="mt-4 text-sm text-slate-500">Reported by {complaint.citizenId.name} � {complaint.citizenId.ward}</p>
//       ) : null}

//       {showTimeline ? (
//         <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
//           <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">Submitted</span>
//           <span>{"->"}</span>
//           <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">AI Analysis Complete</span>
//           <span>{"->"}</span>
//           <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">{complaint.status}</span>
//         </div>
//       ) : null}
//     </article>
//   );
// };

// export default ComplaintCard;

import type { Complaint } from "../services/api";
import { FiMapPin, FiAlertCircle, FiClock } from "react-icons/fi";

const categoryStyles: Record<
  Complaint["category"],
  { label: string; accent: string }
> = {
  garbage: { label: "Sanitation", accent: "border-l-civic-green" },
  water: { label: "Water Supply", accent: "border-l-sky-500" },
  electricity: { label: "Electricity", accent: "border-l-amber-500" },
  road: { label: "Road Damage", accent: "border-l-civic-road" },
  drainage: { label: "Drainage", accent: "border-l-civic-purple" },
};

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const formatSlaState = (status: Complaint["status"], deadline: string) => {
  if (status === "Resolved") return "Resolved";

  const diff = new Date(deadline).getTime() - Date.now();

  if (diff <= 0) return "Overdue";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m left`;
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

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition dark:border-slate-800 dark:bg-slate-900 ${category.accent} border-l-4`}
    >
      {/* TOP SECTION */}
      <div className="grid grid-cols-4 gap-6">

        {/* LEFT CONTENT (75%) */}
        <div className="col-span-3">

          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            <span>{complaint.complaintId}</span>

            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              {category.label}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
            {complaint.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {complaint.description}
          </p>
        </div>

        {/* RIGHT STATUS PANEL (25%) */}
        <div className="col-span-1  border-slate-200 pl-6 dark:border-slate-700">

          <div className="flex flex-col items-center rounded-xl bg-slate-50 p-4 dark:bg-slate-800">

            <p className="text-xs uppercase tracking-widest text-slate-500">
              Status
            </p>

            <span
              className={`mt-2 rounded-full px-4 py-1 text-sm font-semibold ${
                statusStyles[complaint.status] || "bg-slate-100"
              }`}
            >
              {complaint.status}
            </span>

            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-civic-orange">
              <FiClock size={14} />
              {formatSlaState(complaint.status, complaint.slaDeadline)}
            </div>

          </div>
        </div>
      </div>

      {/* METADATA */}
      <div className="mt-6 grid gap-6 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-4">

        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Priority
          </p>

          <p className="flex items-center gap-1 font-medium">
            <FiAlertCircle size={14} />
            {complaint.priority}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Severity
          </p>

          <p className="font-medium">
            {complaint.severityScore}/100
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Department
          </p>

          <p className="font-medium">
            {complaint.department}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Location
          </p>

          <p className="flex items-center gap-1 font-medium">
            <FiMapPin size={14} />
            {complaint.address}
          </p>
        </div>

      </div>

      {/* CITIZEN */}
      {showCitizen && typeof complaint.citizenId === "object" && complaint.citizenId && (
        <div className="mt-4 border-t pt-3 text-sm text-slate-500 dark:border-slate-800">
          Reported by{" "}
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {complaint.citizenId.name}
          </span>{" "}
          • Ward {complaint.citizenId.ward}
        </div>
      )}

      {/* TIMELINE */}
      {showTimeline && (
        <div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">

          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            Submitted
          </span>

          <span className="text-slate-400">→</span>

          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            AI Analysis
          </span>

          <span className="text-slate-400">→</span>

          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            {complaint.status}
          </span>

        </div>
      )}

    </article>
  );
};

export default ComplaintCard;