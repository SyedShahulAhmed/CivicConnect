import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import ComplaintCard from "../components/ComplaintCard";
import RemarksPanel from "../components/RemarksPanel";
import StatsCard from "../components/StatsCard";
import api, { extractApiError, type Complaint } from "../services/api";

const CitizenDashboard = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadComplaints = async () => {
      setLoading(true);
      try {
        const response = await api.get<{ data: Complaint[] }>("/complaints?mine=true");
        setComplaints(response.data.data);
        setError("");
      } catch (loadError) {
        setError(extractApiError(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadComplaints();
  }, []);

  const pendingComplaints = useMemo(() => complaints.filter((c) => c.status === "Pending"), [complaints]);
  const inProgressComplaints = useMemo(() => complaints.filter((c) => c.status === "In Progress"), [complaints]);
  const resolvedComplaints = useMemo(() => complaints.filter((c) => c.status === "Resolved"), [complaints]);
  const rejectedComplaints = useMemo(() => complaints.filter((c) => c.status === "Rejected"), [complaints]);
  const totalRemarks = useMemo(() => complaints.reduce((t, c) => t + c.remarks.length, 0), [complaints]);

  const renderComplaintGroup = (
    title: string,
    subtitle: string,
    complaintsForSection: Complaint[],
    accentClassName: string,
  ) => (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-civic-teal">{title}</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{subtitle}</h2>
        </div>

        <span className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] ${accentClassName}`}>
          {complaintsForSection.length} total
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {complaintsForSection.length ? (
          complaintsForSection.map((complaint) => (
            <div key={complaint._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <ComplaintCard complaint={complaint} showTimeline />

              <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                <RemarksPanel remarks={complaint.remarks} title="Department remarks" emptyMessage="No department remarks have been added yet." />
              </div>

              <div className="mt-4">
                {complaint.status === "Pending" ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900 dark:bg-blue-950/30">
                    <p className="font-semibold text-blue-900 dark:text-blue-200">Complaint is still editable</p>
                    <p className="text-slate-600 dark:text-slate-300">You can update description, category, image, or location before the department begins field work.</p>
                    <Link to={`/submit?complaintId=${complaint.complaintId}`} className="mt-2 w-fit rounded-full bg-civic-blue px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
                      Update Complaint
                    </Link>
                  </div>
                ) : null}

                {complaint.status === "In Progress" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">Department is currently working on this complaint</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">Editing has been disabled while the issue is under review or field work.</p>
                  </div>
                ) : null}

                {complaint.status === "Resolved" ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">Complaint successfully resolved</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">Check the department remarks above for resolution notes or actions taken.</p>
                  </div>
                ) : null}

                {complaint.status === "Rejected" ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
                    <p className="font-semibold text-rose-900 dark:text-rose-200">Complaint was rejected after review</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">Review the latest remarks and notifications for the rejection reason and next steps.</p>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No complaints available</p>
            <p className="mt-1 text-sm text-slate-500">Complaints submitted by you will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Citizen Dashboard</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl font-bold leading-tight text-slate-900 dark:text-slate-100">Track every complaint, update, and outcome in one place</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Follow your complaint progress through pending review, active work, resolution, or rejection. New in-app notifications appear in the bell icon whenever the admin team changes a status.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-5 py-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Your reporting summary</p>
            <p className="mt-1">{complaints.length} total complaints submitted.</p>
          </div>
        </div>
      </div>

      {error ? <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {loading ? <div className="mt-6 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-200">Loading your complaints...</div> : null}

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard label="Pending" value={pendingComplaints.length} tone="orange" description="Complaints waiting for acknowledgement." />
        <StatsCard label="In Progress" value={inProgressComplaints.length} tone="blue" description="Issues currently under department work." />
        <StatsCard label="Resolved" value={resolvedComplaints.length} tone="green" description="Complaints successfully resolved." />
        <StatsCard label="Rejected" value={rejectedComplaints.length} tone="orange" description="Complaints declined after review." />
        <StatsCard label="Official Updates" value={totalRemarks} tone="teal" description="Department remarks across complaints." />
      </div>

      <div className="mt-10 space-y-10">
        {renderComplaintGroup(
          "Pending complaints",
          "Complaints that can still be improved by you",
          pendingComplaints,
          "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
        )}

        {renderComplaintGroup(
          "In progress",
          "Complaints currently handled by the department",
          inProgressComplaints,
          "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200",
        )}

        {renderComplaintGroup(
          "Resolved complaints",
          "Closed complaints and official closure notes",
          resolvedComplaints,
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
        )}

        {renderComplaintGroup(
          "Rejected complaints",
          "Complaints that were reviewed but not accepted",
          rejectedComplaints,
          "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
        )}
      </div>
    </section>
  );
};

export default CitizenDashboard;
