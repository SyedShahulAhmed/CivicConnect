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

import StatsCard from "../components/StatsCard";
import api, {
  extractApiError,
  type AnalyticsPoint,
  type Complaint,
  type SeverityPoint,
} from "../services/api";

const piePalette = ["#1E3A8A", "#0EA5A4", "#F59E0B", "#EF4444", "#8B5CF6", "#10B981"];

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

const AdminAnalytics = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [slaViolations, setSlaViolations] = useState<Complaint[]>([]);
  const [categoryStats, setCategoryStats] = useState<AnalyticsPoint[]>([]);
  const [wardStats, setWardStats] = useState<AnalyticsPoint[]>([]);
  const [monthlyTrendStats, setMonthlyTrendStats] = useState<AnalyticsPoint[]>([]);
  const [severityStats, setSeverityStats] = useState<SeverityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);

      try {
        const [complaintResponse, violationResponse, categoryResponse, wardResponse, trendResponse, severityResponse] =
          await Promise.all([
            api.get<{ data: Complaint[] }>("/admin/complaints"),
            api.get<{ data: Complaint[] }>("/admin/sla-violations"),
            api.get<{ data: AnalyticsPoint[] }>("/analytics/category"),
            api.get<{ data: AnalyticsPoint[] }>("/analytics/wards"),
            api.get<{ data: AnalyticsPoint[] }>("/analytics/trends"),
            api.get<{ data: SeverityPoint[] }>("/analytics/severity"),
          ]);

        setComplaints(complaintResponse.data.data);
        setSlaViolations(violationResponse.data.data);
        setCategoryStats(categoryResponse.data.data);
        setWardStats(wardResponse.data.data);
        setMonthlyTrendStats(trendResponse.data.data);
        setSeverityStats(severityResponse.data.data);
        setError("");
      } catch (loadError) {
        setError(extractApiError(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, []);

  const activeComplaints = useMemo(
    () => complaints.filter((complaint) => complaint.status !== "Resolved" && complaint.status !== "Rejected"),
    [complaints],
  );

  const statusDistribution = useMemo(
    () => [
      { label: "Pending", count: complaints.filter((complaint) => complaint.status === "Pending").length },
      { label: "In Progress", count: complaints.filter((complaint) => complaint.status === "In Progress").length },
      { label: "Resolved", count: complaints.filter((complaint) => complaint.status === "Resolved").length },
      { label: "Rejected", count: complaints.filter((complaint) => complaint.status === "Rejected").length },
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
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Admin analytics</p>
        <h1 className="mt-2 font-serif text-4xl font-bold">Operational insights across volume, urgency, and workload</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Review complaint patterns, department load, SLA risk, and severity trends from a dedicated analytics workspace.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <StatsCard label="Total" value={complaints.length} tone="blue" description="All complaints currently visible to the admin team." />
        <StatsCard label="Open" value={activeComplaints.length} tone="teal" description="Pending and in-progress complaints still requiring attention." />
        <StatsCard label="SLA Violations" value={slaViolations.length} tone="orange" description="Complaints that have already crossed their SLA deadline." />
        <StatsCard label="Resolved" value={complaints.filter((complaint) => complaint.status === "Resolved").length} tone="green" description="Complaints that have been successfully closed." />
      </div>

      {error ? <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? <div className="mt-6 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Loading analytics...</div> : null}

      <div className="mt-10 grid gap-8 xl:grid-cols-3">
        <div className={chartCardClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Category insights</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1E3A8A" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={chartCardClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Status distribution</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDistribution} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={entry.label} fill={piePalette[index % piePalette.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={chartCardClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Priority mix</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        <div className={chartCardClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Ward distribution</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ward" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0EA5A4" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={chartCardClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Monthly trend</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={chartCardClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Department workload</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentWorkload} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="#7C3AED" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr_1fr]">
        <div className={chartCardClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Last 7 days intake</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyIntakeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#0EA5A4" fill="#99F6E4" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={chartCardClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">SLA risk monitor</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaRiskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#EF4444" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={chartCardClassName}>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Severity bands</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityBandData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90}>
                  {severityBandData.map((entry, index) => (
                    <Cell key={entry.label} fill={piePalette[(index + 2) % piePalette.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
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
    </section>
  );
};

export default AdminAnalytics;

