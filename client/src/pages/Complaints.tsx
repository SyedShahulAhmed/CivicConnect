import { useEffect, useMemo, useState } from "react";

import ComplaintCard from "../components/ComplaintCard";
import StatsCard from "../components/StatsCard";
import api, { type Complaint } from "../services/api";

const Complaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadComplaints = async () => {
      const response = await api.get<{ data: Complaint[] }>("/complaints");
      setComplaints(response.data.data);
    };

    void loadComplaints();
  }, []);

  const filteredComplaints = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const matchesCategory = categoryFilter
        ? complaint.category === categoryFilter
        : true;

      const matchesStatus = statusFilter
        ? complaint.status === statusFilter
        : true;

      const matchesSearch = normalizedSearch
        ? `${complaint.title} ${complaint.description} ${complaint.address} ${complaint.complaintId}`
            .toLowerCase()
            .includes(normalizedSearch)
        : true;

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [categoryFilter, complaints, searchTerm, statusFilter]);

  const resolvedComplaints = useMemo(
    () =>
      filteredComplaints.filter((complaint) => complaint.status === "Resolved"),
    [filteredComplaints],
  );

  const activeComplaints = useMemo(
    () =>
      filteredComplaints.filter((complaint) => complaint.status !== "Resolved"),
    [filteredComplaints],
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      {/* Page Header */}

      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
          Public Transparency Portal
        </p>

        <h1 className="mt-2 font-serif text-4xl font-bold">
          Explore civic complaints across the city
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          The Civic Connect transparency portal provides open access to civic
          complaints submitted by residents. Track issues by category, status,
          and location while monitoring how municipal departments address and
          resolve problems across the city.
        </p>
      </div>

      {/* Stats */}

      <div className="grid gap-5 md:grid-cols-3">
        <StatsCard
          label="Total Complaints"
          value={filteredComplaints.length}
          tone="blue"
          description="Total civic complaints currently visible in the public transparency portal."
        />

        <StatsCard
          label="Active Complaints"
          value={activeComplaints.length}
          tone="orange"
          description="Complaints currently under review or being processed by municipal departments."
        />

        <StatsCard
          label="Resolved Complaints"
          value={resolvedComplaints.length}
          tone="teal"
          description="Resolved complaints that remain visible for transparency and public accountability."
        />
      </div>

      {/* Filters */}

      <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search complaints by ID, title, location, or keywords"
            className="rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 shadow-sm transition focus:border-civic-teal focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Issue Categories</option>

            <option value="sanitation">Sanitation & Waste Management</option>

            <option value="water">Water Supply Issues</option>

            <option value="electricity">Electricity & Streetlights</option>

            <option value="road">Road & Infrastructure Damage</option>

            <option value="drainage">Drainage & Sewer Problems</option>

            <option value="public_safety">Public Safety Hazards</option>

            <option value="other">Other Civic Issues</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Result Info */}

      <div className="mt-8 flex items-center justify-between gap-4 text-sm text-slate-500">
        <p>{filteredComplaints.length} public complaints found</p>
        <p>Complaints are ordered by most recent submissions</p>
      </div>

      {/* Complaint Lists */}

      <div className="mt-8 space-y-10">
        {/* Active Complaints */}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
                Active complaints
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                Complaints currently being processed by municipal departments
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {activeComplaints.length} active
            </p>
          </div>

          <div className="space-y-5">
            {activeComplaints.length ? (
              activeComplaints.map((complaint) => (
                <ComplaintCard key={complaint._id} complaint={complaint} />
              ))
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
                No active civic complaints matched the selected filters.
              </div>
            )}
          </div>
        </section>

        {/* Resolved Complaints */}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
                Resolved complaints
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                Resolved complaints published for public transparency
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {resolvedComplaints.length} resolved
            </p>
          </div>

          <div className="space-y-5">
            {resolvedComplaints.length ? (
              resolvedComplaints.map((complaint) => (
                <ComplaintCard key={complaint._id} complaint={complaint} />
              ))
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
                No resolved complaints matched the selected filters.
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
};

export default Complaints;
