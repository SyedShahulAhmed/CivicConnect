import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

import ComplaintCard from "../components/ComplaintCard";
import Loader from "../components/Loader";
import api, { extractApiError, type Complaint } from "../services/api";

const ComplaintDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Complaint not found.");
      setIsLoading(false);
      return;
    }

    const loadComplaint = async () => {
      setIsLoading(true);

      try {
        const response = await api.get<{ data: Complaint }>(`/complaints/${id}`);
        setComplaint(response.data.data);
        setError("");
      } catch (loadError) {
        setError(extractApiError(loadError));
        setComplaint(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadComplaint();
  }, [id]);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Loader label="Loading complaint details..." className="min-h-[40vh]" />
      </section>
    );
  }

  if (error || !complaint) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          {error || "Complaint not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-8">
        <Link
          to="/notifications"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <FiArrowLeft size={16} />
          Back to notifications
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Complaint Detail</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900 dark:text-white">{complaint.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
          Review the linked complaint context, status, severity, and recent operational notes.
        </p>
      </div>

      <ComplaintCard complaint={complaint} showCitizen showTimeline />

      <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-civic-teal">Remark History</p>
        <div className="mt-5 space-y-3">
          {complaint.remarks.length ? (
            complaint.remarks
              .slice()
              .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
              .map((remark) => (
                <div
                  key={`${remark.authorName}-${remark.createdAt}-${remark.message}`}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{remark.authorName}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {new Date(remark.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{remark.message}</p>
                </div>
              ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No remarks have been added to this complaint yet.
            </div>
          )}
        </div>
      </section>
    </section>
  );
};

export default ComplaintDetails;
