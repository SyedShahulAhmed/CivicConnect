import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import MapView from "../components/MapView";
import StatsCard from "../components/StatsCard";
import api, {
  extractApiError,
  type AnalyticsPoint,
  type Complaint,
  type Department,
  type SeverityPoint,
} from "../services/api";

interface ManageFormState {
  department: string;
  status: Complaint["status"];
  remark: string;
}

const emptyManageState: ManageFormState = {
  department: "",
  status: "Pending",
  remark: "",
};

const statusTone: Record<Complaint["status"], string> = {
  Pending: "bg-amber-100 text-amber-700",
  "In Progress": "bg-sky-100 text-sky-700",
  Resolved: "bg-emerald-100 text-emerald-700",
};

const priorityTone: Record<Complaint["priority"], string> = {
  Low: "text-emerald-600",
  Medium: "text-amber-600",
  High: "text-rose-600",
};

const piePalette = ["#1E3A8A", "#0EA5A4", "#F59E0B", "#EF4444", "#8B5CF6", "#10B981"];

const formatDeadline = (deadline: string) => {
  const msRemaining = new Date(deadline).getTime() - Date.now();

  if (msRemaining <= 0) {
    return "SLA breached";
  }

  const hours = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m remaining`;
};

const buildRecentDailyTrend = (complaints: Complaint[]) => {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: 0,
    };
  });

  const lookup = new Map(days.map((day) => [day.key, day]));

  complaints.forEach((complaint) => {
    const complaintDay = new Date(complaint.createdAt).toISOString().slice(0, 10);
    const entry = lookup.get(complaintDay);

    if (entry) {
      entry.count += 1;
    }
  });

  return days;
};

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [slaViolations, setSlaViolations] = useState<Complaint[]>([]);
  const [categoryStats, setCategoryStats] = useState<AnalyticsPoint[]>([]);
  const [wardStats, setWardStats] = useState<AnalyticsPoint[]>([]);
  const [monthlyTrendStats, setMonthlyTrendStats] = useState<AnalyticsPoint[]>([]);
  const [severityStats, setSeverityStats] = useState<SeverityPoint[]>([]);
  const [filters, setFilters] = useState({ category: "", status: "", priority: "" });
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>("");
  const [manageForm, setManageForm] = useState<ManageFormState>(emptyManageState);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      const queryString = params.toString();

      const [complaintResponse, departmentResponse, violationResponse, categoryResponse, wardResponse, trendResponse, severityResponse] =
        await Promise.all([
          api.get<{ data: Complaint[] }>(`/admin/complaints${queryString ? `?${queryString}` : ""}`),
          api.get<{ data: Department[] }>("/admin/departments"),
          api.get<{ data: Complaint[] }>("/admin/sla-violations"),
          api.get<{ data: AnalyticsPoint[] }>("/analytics/category"),
          api.get<{ data: AnalyticsPoint[] }>("/analytics/wards"),
          api.get<{ data: AnalyticsPoint[] }>("/analytics/trends"),
          api.get<{ data: SeverityPoint[] }>("/analytics/severity"),
        ]);

      setComplaints(complaintResponse.data.data);
      setDepartments(departmentResponse.data.data);
      setSlaViolations(violationResponse.data.data);
      setCategoryStats(categoryResponse.data.data);
      setWardStats(wardResponse.data.data);
      setMonthlyTrendStats(trendResponse.data.data);
      setSeverityStats(severityResponse.data.data);
      setFeedback(null);
    } catch (error) {
      setFeedback({ type: "error", message: extractApiError(error) });
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

    const stillExists = complaints.some((complaint) => complaint._id === selectedComplaintId);
    if (!selectedComplaintId || !stillExists) {
      setSelectedComplaintId(complaints[0]._id);
    }
  }, [complaints, selectedComplaintId]);

  const selectedComplaint = useMemo(
    () => complaints.find((complaint) => complaint._id === selectedComplaintId) ?? null,
    [complaints, selectedComplaintId],
  );

  useEffect(() => {
    if (!selectedComplaint) {
      setManageForm(emptyManageState);
      return;
    }

    setManageForm({
      department: selectedComplaint.department,
      status: selectedComplaint.status,
      remark: "",
    });
  }, [selectedComplaint]);

  const handleManageComplaint = async () => {
    if (!selectedComplaint) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await api.patch(`/admin/complaints/${selectedComplaint.complaintId}/manage`, {
        department: manageForm.department,
        status: manageForm.status,
        remark: manageForm.remark,
      });

      setFeedback({ type: "success", message: `${selectedComplaint.complaintId} updated successfully.` });
      await loadDashboard();
    } catch (error) {
      setFeedback({ type: "error", message: extractApiError(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCitizen = selectedComplaint && typeof selectedComplaint.citizenId === "object" ? selectedComplaint.citizenId : null;
  const activeComplaints = complaints.filter((complaint) => complaint.status !== "Resolved");

  const statusDistribution = useMemo(
    () => [
      { label: "Pending", count: complaints.filter((complaint) => complaint.status === "Pending").length },
      { label: "In Progress", count: complaints.filter((complaint) => complaint.status === "In Progress").length },
      { label: "Resolved", count: complaints.filter((complaint) => complaint.status === "Resolved").length },
    ],
    [complaints],
  );

  const priorityDistribution = useMemo(
    () => [
      { label: "High", count: complaints.filter((complaint) => complaint.priority === "High").length },
      { label: "Medium", count: complaints.filter((complaint) => complaint.priority === "Medium").length },
      { label: "Low", count: complaints.filter((complaint) => complaint.priority === "Low").length },
    ],
    [complaints],
  );

  const departmentWorkload = useMemo(() => {
    const counts = complaints.reduce<Record<string, number>>((accumulator, complaint) => {
      const key = complaint.department || "Unassigned";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }, [complaints]);

  const severityBandData = useMemo(
    () => [
      { label: "Critical", count: complaints.filter((complaint) => complaint.severityScore >= 80).length },
      { label: "High", count: complaints.filter((complaint) => complaint.severityScore >= 60 && complaint.severityScore < 80).length },
      { label: "Moderate", count: complaints.filter((complaint) => complaint.severityScore >= 40 && complaint.severityScore < 60).length },
      { label: "Low", count: complaints.filter((complaint) => complaint.severityScore < 40).length },
    ],
    [complaints],
  );

  const slaRiskData = useMemo(() => {
    const now = Date.now();

    return activeComplaints.reduce(
      (accumulator, complaint) => {
        const diffHours = (new Date(complaint.slaDeadline).getTime() - now) / (1000 * 60 * 60);

        if (diffHours <= 0) {
          accumulator[0].count += 1;
        } else if (diffHours <= 24) {
          accumulator[1].count += 1;
        } else if (diffHours <= 48) {
          accumulator[2].count += 1;
        } else {
          accumulator[3].count += 1;
        }

        return accumulator;
      },
      [
        { label: "Overdue", count: 0 },
        { label: "Due <24h", count: 0 },
        { label: "Due 24-48h", count: 0 },
        { label: "On Track", count: 0 },
      ],
    );
  }, [activeComplaints]);

  const dailyIntakeData = useMemo(() => buildRecentDailyTrend(complaints), [complaints]);

  const chartCardClassName = "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900";

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Admin command center</p>
          <h1 className="mt-2 font-serif text-4xl font-bold">Manage complaints, SLA risk, and field coordination</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Review incoming issues, add internal remarks, update statuses, and monitor citywide service patterns from one operations console.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <StatsCard label="Total" value={complaints.length} tone="blue" description="Complaints matching the active filters." />
        <StatsCard label="Open" value={activeComplaints.length} tone="teal" description="Pending and in-progress complaints needing active management." />
        <StatsCard label="SLA Violations" value={slaViolations.length} tone="orange" description="Complaints that have moved past their deadline." />
        <StatsCard label="Departments" value={departments.length} tone="orange" description="Municipal teams available for assignment and follow-up." />
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
          </select>
          <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
            <option value="">All priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      {feedback ? (
        <div
          className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className={chartCardClassName}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Complaint queue</p>
                <p className="mt-2 text-sm text-slate-500">Pick a complaint to inspect details, assign a department, change status, and add remarks.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {complaints.length} items
              </span>
            </div>

            <div className="mt-5 space-y-3">
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
                      className={`w-full rounded-[1.5rem] border px-5 py-4 text-left transition ${
                        isSelected
                          ? "border-civic-blue bg-slate-50 shadow-soft dark:border-civic-teal dark:bg-slate-800"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{complaint.complaintId}</p>
                          <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{complaint.title}</p>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{complaint.address}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[complaint.status]}`}>
                          {complaint.status}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <span className={priorityTone[complaint.priority]}>{complaint.priority} priority</span>
                        <span>Severity {complaint.severityScore}</span>
                        <span>{complaint.department}</span>
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
          <div className={chartCardClassName}>
            {selectedComplaint ? (
              <>
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Selected complaint</p>
                      <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedComplaint.title}</h2>
                      <p className="mt-2 text-sm text-slate-500">{selectedComplaint.complaintId} - {selectedComplaint.category} - Created {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone[selectedComplaint.status]}`}>
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{selectedComplaint.description}</p>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Priority and severity</p>
                      <p className={`mt-2 text-sm font-semibold ${priorityTone[selectedComplaint.priority]}`}>{selectedComplaint.priority} priority</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Severity score {selectedComplaint.severityScore}/100</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Department and SLA</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedComplaint.department}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedComplaint.status === "Resolved" ? "Resolved" : formatDeadline(selectedComplaint.slaDeadline)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800 md:col-span-2 xl:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Citizen and address</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedCitizen?.name || "Citizen details unavailable"}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedCitizen?.ward || "Ward unavailable"}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedComplaint.address}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Manage complaint</p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="admin-department" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Department
                        </label>
                        <select
                          id="admin-department"
                          value={manageForm.department}
                          onChange={(event) => setManageForm((current) => ({ ...current, department: event.target.value }))}
                          className="mt-2"
                        >
                          {departments.map((department) => (
                            <option key={department._id} value={department.name}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="admin-status" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Status
                        </label>
                        <select
                          id="admin-status"
                          value={manageForm.status}
                          onChange={(event) =>
                            setManageForm((current) => ({ ...current, status: event.target.value as Complaint["status"] }))
                          }
                          className="mt-2"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="admin-remark" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Internal remark
                        </label>
                        <textarea
                          id="admin-remark"
                          rows={5}
                          value={manageForm.remark}
                          onChange={(event) => setManageForm((current) => ({ ...current, remark: event.target.value }))}
                          placeholder="Add a field update, escalation note, department instruction, or resolution summary"
                          className="mt-2"
                        />
                        <p className="mt-2 text-xs text-slate-500">Remarks help the team track handoffs, investigation notes, and final action taken.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleManageComplaint()}
                        disabled={isSaving}
                        className="rounded-full bg-civic-blue px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Remark history</p>
                    <div className="mt-4 space-y-3">
                      {selectedComplaint.remarks.length ? (
                        selectedComplaint.remarks
                          .slice()
                          .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
                          .map((remark) => (
                            <div key={`${remark.authorName}-${remark.createdAt}-${remark.message}`} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{remark.authorName}</p>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{new Date(remark.createdAt).toLocaleString()}</p>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{remark.message}</p>
                            </div>
                          ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
                          No remarks yet. Add notes here to capture admin actions and handoff context.
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

          <div className={chartCardClassName}>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">SLA violation list</p>
            <div className="mt-4 space-y-3">
              {slaViolations.length ? (
                slaViolations.map((complaint) => (
                  <div key={complaint._id} className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                    <p className="font-semibold">{complaint.complaintId} - {complaint.title}</p>
                    <p>{complaint.department} - Deadline {new Date(complaint.slaDeadline).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No active SLA violations.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Analytics center</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Operational insights across volume, urgency, and workload</h2>
        </div>

     

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className={chartCardClassName}>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Severity ranking</p>
            <div className="mt-4 space-y-3">
              {severityStats.map((item) => (
                <div key={item.complaintId} className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800">
                  <p className="font-semibold">{item.complaintId} - {item.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{item.category} - {item.priority} - {item.status}</p>
                  <p className="mt-1 text-sm font-bold text-civic-orange">Severity {item.severityScore}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={chartCardClassName}>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Insight summary</p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Open operational pressure</p>
                <p className="mt-2">{activeComplaints.length} complaints are still active, with {slaRiskData[0].count} already overdue and {slaRiskData[1].count} due within the next 24 hours.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Department load concentration</p>
                <p className="mt-2">{departmentWorkload[0]?.label || "No department data"} is currently handling the highest visible workload with {departmentWorkload[0]?.count || 0} complaints.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Urgency profile</p>
                <p className="mt-2">{severityBandData[0].count} complaints are in the critical severity band and {priorityDistribution[0].count} are marked high priority.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;



