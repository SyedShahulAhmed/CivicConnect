import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiClock, FiImage, FiMapPin } from "react-icons/fi";

import ImageLightbox from "../components/ImageLightbox";
import MapView from "../components/MapView";
import StatsCard from "../components/StatsCard";
import { useToast } from "../hooks/useToast";
import api, { extractApiError, type Complaint, type Department } from "../services/api";
import { complaintStatusBorder, complaintStatusTone, isClosedComplaint } from "../utils/complaints";

const AdminDashboard = () => {
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [slaViolations, setSlaViolations] = useState<Complaint[]>([]);
  const [filters, setFilters] = useState({ category: "", status: "", priority: "" });
  const [selectedComplaintId, setSelectedComplaintId] = useState("");
  const [manageDepartment, setManageDepartment] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Complaint["status"] | null>(null);
  const [error, setError] = useState("");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      const queryString = params.toString();

      const [complaintResponse, departmentResponse, violationResponse] = await Promise.all([
        api.get<{ data: Complaint[] }>(`/admin/complaints${queryString ? `?${queryString}` : ""}`),
        api.get<{ data: Department[] }>("/admin/departments"),
        api.get<{ data: Complaint[] }>("/admin/sla-violations"),
      ]);

      setComplaints(complaintResponse.data.data);
      setDepartments(departmentResponse.data.data);
      setSlaViolations(violationResponse.data.data);
    } catch (loadError) {
      setError(extractApiError(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [filters.category, filters.priority, filters.status]);

  useEffect(() => {
    if (!complaints.length) {
      setSelectedComplaintId("");
      return;
    }

    const currentSelectionExists = complaints.some((complaint) => complaint._id === selectedComplaintId);
    if (!selectedComplaintId || !currentSelectionExists) {
      setSelectedComplaintId(complaints[0]._id);
    }
  }, [complaints, selectedComplaintId]);

  const selectedComplaint = useMemo(
    () => complaints.find((complaint) => complaint._id === selectedComplaintId) ?? null,
    [complaints, selectedComplaintId],
  );

  useEffect(() => {
    setManageDepartment(selectedComplaint?.department || departments[0]?.name || "");
    setRemark("");
  }, [departments, selectedComplaint]);

  const performAction = async (status: Complaint["status"]) => {
    if (!selectedComplaint) {
      return;
    }

    setActionLoading(status);
    setError("");

    try {
      await api.patch(`/admin/complaints/${selectedComplaint.complaintId}/manage`, {
        department: manageDepartment,
        status,
        remark,
      });

      await loadDashboard();
      showToast({
        tone: "success",
        title: `Complaint marked ${status}`,
        message: `${selectedComplaint.title} has been updated successfully.`,
      });
      setRemark("");
      setShowRejectConfirm(false);
    } catch (saveError) {
      const message = extractApiError(saveError);
      setError(message);
      showToast({ tone: "error", title: "Action failed", message });
    } finally {
      setActionLoading(null);
    }
  };

  const selectedCitizen = selectedComplaint && typeof selectedComplaint.citizenId === "object" ? selectedComplaint.citizenId : null;
  const openComplaints = complaints.filter((complaint) => !isClosedComplaint(complaint.status));

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Admin command center</p>
          <h1 className="mt-2 font-serif text-4xl font-bold">Manage complaints from intake to closure</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Review evidence, move complaints into progress, resolve field work, reject invalid submissions, and monitor SLA risk from one responsive dashboard.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard label="Total" value={complaints.length} tone="blue" description="Complaints matching the current filters." />
        <StatsCard label="Pending" value={complaints.filter((item) => item.status === "Pending").length} tone="orange" description="Waiting for active work." />
        <StatsCard label="In Progress" value={complaints.filter((item) => item.status === "In Progress").length} tone="blue" description="Currently assigned and active." />
        <StatsCard label="Resolved" value={complaints.filter((item) => item.status === "Resolved").length} tone="green" description="Successfully completed complaints." />
        <StatsCard label="Rejected" value={complaints.filter((item) => item.status === "Rejected").length} tone="orange" description="Complaints declined after review." />
      </div>

      <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-3">
          <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
            <option value="">All categories</option>
            <option value="garbage">Garbage</option>
            <option value="water">Water</option>
            <option value="electricity">Electricity</option>
            <option value="road">Road</option>
            <option value="drainage">Drainage</option>
          </select>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
            <option value="">All priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      {error ? <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Complaint queue</p>
                <p className="mt-2 text-sm text-slate-500">Every card shows the key details admins need: title, description, location, evidence, status, and creation time.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {complaints.length} items
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
                  Loading complaint queue...
                </div>
              ) : complaints.length ? (
                complaints.map((complaint) => {
                  const isSelected = complaint._id === selectedComplaintId;

                  return (
                    <button
                      key={complaint._id}
                      type="button"
                      onClick={() => setSelectedComplaintId(complaint._id)}
                      className={`w-full rounded-[1.75rem] border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-civic-blue bg-slate-50 shadow-soft dark:border-civic-teal dark:bg-slate-800"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                      } ${complaintStatusBorder[complaint.status]}`}
                    >
                      <div className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                        {complaint.imageUrl ? (
                          <img
                            src={complaint.imageThumbnailUrl || complaint.imageUrl}
                            alt={complaint.title}
                            loading="lazy"
                            className="h-28 w-full rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="grid h-28 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                            <FiImage size={20} />
                          </div>
                        )}

                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{complaint.complaintId}</p>
                              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{complaint.title}</p>
                              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{complaint.description.slice(0, 120)}{complaint.description.length > 120 ? "..." : ""}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${complaintStatusTone[complaint.status]}`}>
                              {complaint.status}
                            </span>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            <span className="flex items-center gap-1"><FiMapPin size={12} /> {complaint.address}</span>
                            <span>{complaint.priority} priority</span>
                            <span>{new Date(complaint.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
                  No complaints matched the current filters.
                </div>
              )}
            </div>
          </div>

          <MapView complaints={complaints} heightClassName="h-[24rem]" />
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            {selectedComplaint ? (
              <>
                <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 dark:border-slate-800">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Selected complaint</p>
                      <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedComplaint.title}</h2>
                      <p className="mt-2 text-sm text-slate-500">{selectedComplaint.complaintId} • {selectedComplaint.category} • Created {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${complaintStatusTone[selectedComplaint.status]}`}>
                      {selectedComplaint.status}
                    </span>
                  </div>

                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{selectedComplaint.description}</p>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Priority and severity</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedComplaint.priority} priority</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Severity score {selectedComplaint.severityScore}/100</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Department and SLA</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedComplaint.department}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <FiClock size={14} />
                        {isClosedComplaint(selectedComplaint.status)
                          ? selectedComplaint.status
                          : new Date(selectedComplaint.slaDeadline).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800 md:col-span-2 xl:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Citizen and location</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedCitizen?.name || "Citizen details unavailable"}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedCitizen?.ward || "Ward unavailable"}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedComplaint.address}</p>
                    </div>
                  </div>

                  {selectedComplaint.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setLightboxImage({ url: selectedComplaint.imageUrl || "", title: selectedComplaint.title })}
                      className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 text-left transition hover:border-civic-teal dark:border-slate-800 dark:bg-slate-950"
                    >
                      <img
                        src={selectedComplaint.imageThumbnailUrl || selectedComplaint.imageUrl}
                        alt={selectedComplaint.title}
                        loading="lazy"
                        className="max-h-72 w-full object-cover"
                      />
                      <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <FiImage size={14} />
                        Click to view full-size complaint image
                      </div>
                    </button>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Manage complaint</p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="admin-department" className="text-sm font-medium text-slate-700 dark:text-slate-200">Department</label>
                        <select id="admin-department" value={manageDepartment} onChange={(event) => setManageDepartment(event.target.value)} className="mt-2">
                          {departments.map((department) => (
                            <option key={department._id} value={department.name}>{department.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="admin-remark" className="text-sm font-medium text-slate-700 dark:text-slate-200">Admin note</label>
                        <textarea
                          id="admin-remark"
                          rows={5}
                          value={remark}
                          onChange={(event) => setRemark(event.target.value)}
                          placeholder="Add a field update, rejection reason, instruction, or closure note"
                          className="mt-2"
                        />
                        <p className="mt-2 text-xs text-slate-500">Notes are saved to the complaint history and included in the lifecycle context for future follow-up.</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() => void performAction("In Progress")}
                          disabled={actionLoading !== null}
                          className="rounded-full bg-sky-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading === "In Progress" ? "Saving..." : "Start Progress"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void performAction("Resolved")}
                          disabled={actionLoading !== null}
                          className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading === "Resolved" ? "Saving..." : "Resolve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRejectConfirm(true)}
                          disabled={actionLoading !== null}
                          className="rounded-full bg-rose-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading === "Rejected" ? "Saving..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Remark history</p>
                    <div className="mt-4 space-y-3">
                      {selectedComplaint.remarks.length ? (
                        selectedComplaint.remarks
                          .slice()
                          .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
                          .map((item) => (
                            <div key={`${item.authorName}-${item.createdAt}-${item.message}`} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.authorName}</p>
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>
                            </div>
                          ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
                          No remarks yet. Add notes here to document investigation, rejection reasons, or resolution details.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
                Select a complaint from the queue to manage it.
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Workflow snapshot</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Open complaints</p>
                  <p className="mt-2">{openComplaints.length} complaints are still active and require admin attention.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Rejected submissions</p>
                  <p className="mt-2">Use the reject action for invalid, duplicate, or non-serviceable issues and add a clear note before confirming.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">SLA violation list</p>
              <div className="mt-4 space-y-3">
                {slaViolations.length ? (
                  slaViolations.map((complaint) => (
                    <div key={complaint._id} className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                      <p className="font-semibold">{complaint.complaintId} • {complaint.title}</p>
                      <p className="mt-1">{complaint.department} • Deadline {new Date(complaint.slaDeadline).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No active SLA violations.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRejectConfirm && selectedComplaint ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="mt-1 grid h-11 w-11 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                <FiAlertTriangle size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Reject this complaint?</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  This will change the complaint status to rejected, save the update in the database, notify the citizen, and apply the red status styling across the dashboard.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRejectConfirm(false)}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void performAction("Rejected")}
                className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ImageLightbox
        imageUrl={lightboxImage?.url}
        title={lightboxImage?.title}
        isOpen={Boolean(lightboxImage)}
        onClose={() => setLightboxImage(null)}
      />
    </section>
  );
};

export default AdminDashboard;
