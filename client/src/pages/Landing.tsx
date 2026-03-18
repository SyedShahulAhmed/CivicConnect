import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ComplaintCard from "../components/ComplaintCard";
import StatsCard from "../components/StatsCard";
import MapView from "../components/MapView";
import api, { type AnalyticsPoint, type Complaint } from "../services/api";
import { isClosedComplaint } from "../utils/complaints";
import { useAuth } from "../hooks/useAuth";
import { FiMapPin, FiCpu, FiGitBranch, FiCheckCircle } from "react-icons/fi";
import {
  FiGlobe,
  FiLink,
  FiUsers,
  FiShield,
  FiChevronRight,
} from "react-icons/fi";
const featureCards = [
  {
    title: "AI Complaint Classification",
    description:
      "Complaints are automatically categorized using machine learning so they are routed to the correct municipal department instantly.",
  },
  {
    title: "Priority & Severity Detection",
    description:
      "AI evaluates urgency, sentiment, and complaint patterns to assign priority levels and identify high-impact civic issues.",
  },
  {
    title: "Live Civic Map Visualization",
    description:
      "Complaints are displayed on an interactive map using GPS coordinates, helping administrators identify issue hotspots across the city.",
  },

  {
    title: "SLA Deadline Monitoring",
    description:
      "Each complaint receives a resolution deadline, allowing administrators to track service performance and prevent overdue cases.",
  },
  {
    title: "Public Transparency Portal",
    description:
      "Citizens can view complaints, track resolution progress, and monitor municipal response times through a public dashboard.",
  },
  {
    title: "Administrator Command Dashboard",
    description:
      "Municipal officials can assign departments, update complaint statuses, and monitor city-wide service operations in one centralized system.",
  },
];

const processSteps = [
  "Citizens submit a complaint with description, image evidence, and automatic GPS location capture.",
  "The AI processing engine analyzes the complaint to detect category, urgency, sentiment, and possible duplicates.",
  "The complaint is routed to the responsible municipal department and assigned a resolution deadline (SLA).",
  "Administrators track progress, update status, and resolve the issue while citizens monitor updates in real time.",
];
const Landing = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categoryStats, setCategoryStats] = useState<AnalyticsPoint[]>([]);
  const [trendStats, setTrendStats] = useState<AnalyticsPoint[]>([]);
  const [wardStats, setWardStats] = useState<AnalyticsPoint[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      const [
        complaintsResponse,
        categoryResponse,
        trendResponse,
        wardResponse,
      ] = await Promise.all([
        api.get<{ data: Complaint[] }>("/complaints"),
        api.get<{ data: AnalyticsPoint[] }>("/analytics/category"),
        api.get<{ data: AnalyticsPoint[] }>("/analytics/trends"),
        api.get<{ data: AnalyticsPoint[] }>("/analytics/wards"),
      ]);

      setComplaints(complaintsResponse.data.data);
      setCategoryStats(categoryResponse.data.data);
      setTrendStats(trendResponse.data.data);
      setWardStats(wardResponse.data.data);
    };

    void loadDashboard();
  }, []);

  const resolvedCount = complaints.filter(
    (complaint) => complaint.status === "Resolved",
  ).length;
  const activeCount = complaints.filter((complaint) => !isClosedComplaint(complaint.status)).length;
  const avgResolutionHours = complaints.length
    ? Math.round(
        complaints.reduce((sum, complaint) => {
          const resolutionWindow =
            new Date(complaint.updatedAt).getTime() -
            new Date(complaint.createdAt).getTime();
          return sum + resolutionWindow / (1000 * 60 * 60);
        }, 0) / complaints.length,
      )
    : 0;
  const topComplaints = useMemo(() => {
    return [...complaints]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [complaints]);

  const { isAuthenticated } = useAuth();
  return (
    <div>
      {/* Hero-Section */}
      <section
        className="relative bg-cover bg-center text-white"
        style={{
          backgroundImage: "url('/images/hero2.png')",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.32em] text-blue-200">
              AI-Powered Civic Governance Platform
            </p>

            <h1 className="max-w-3xl font-serif text-5xl font-bold leading-tight md:text-6xl">
              Report civic issues, track resolutions, and bring
              <span className="text-civic-teal"> transparency</span> to city
              services.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Civic Connect enables citizens to report local issues, while
              municipal departments prioritize and resolve complaints using
              AI-driven analysis, SLA monitoring, and real-time civic analytics.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/submit"
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-civic-blue 
    shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                Report Complaint
              </Link>

              <Link
                to="/complaints"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white 
    transition-all duration-200 hover:bg-white/10 hover:border-white hover:scale-105"
              >
                Browse Complaints
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Overview Feed */}
      <section className="mx-auto max-w-7xl px-6 py-5">
        <div className=" border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
              City Overview
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-slate-100">
              Civic Complaint Statistics
            </h2>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label="City Feed"
              value={complaints.length}
              tone="blue"
              description="Citizen-submitted civic complaints visible to the public."
            />

            <StatsCard
              label="Resolved"
              value={resolvedCount}
              tone="green"
              description="Issues marked resolved by municipal departments."
            />

            <StatsCard
              label="Active"
              value={activeCount}
              tone="orange"
              description="Open complaints still moving through the workflow."
            />

            <StatsCard
              label="Avg Hours"
              value={avgResolutionHours}
              tone="teal"
              description="Average resolution window across tracked complaints."
            />
          </div>
        </div>
      </section>
      {/* Feature Feed */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
            About Civic Connect
          </p>
          <h2 className="mt-2 font-serif text-4xl font-bold">
            A smarter way to manage civic complaints
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Civic Connect combines citizen reporting, AI-powered complaint
            analysis, geolocation mapping, and municipal workflow management to
            create a transparent and efficient civic service platform.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature, index) => (
            <article
              key={feature.title}
              className="border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-civic-teal">
                {String(index + 1).padStart(2, "0")} Feature
              </p>

              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
      {/* Complaint Feed */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
              Complaint feed
            </p>
            <h2 className="mt-2 font-serif text-4xl font-bold">
              Latest civic issues across the city
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/complaints"
              className="rounded-full border border-civic-blue px-5 py-3 text-sm font-bold text-civic-blue
    transition-all duration-200
    hover:bg-civic-blue hover:text-white hover:shadow-md"
            >
              View all complaints
            </Link>

            {!isAuthenticated && (
              <Link
                to="/register"
                className="rounded-full bg-civic-blue px-5 py-3 text-sm font-bold text-white
      transition-all duration-200
      hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5"
              >
                Join as Citizen
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {topComplaints.map((complaint) => (
            <ComplaintCard key={complaint._id} complaint={complaint} />
          ))}
        </div>
      </section>
      {/* GeoLocation Mapping Feed */}
      <section id="city-map" className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
            City Complaint Map
          </p>

          <h2 className="mt-2 font-serif text-4xl font-bold">
            Real-time map of civic issues across the city
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Civic Connect visualizes complaints on an interactive city map using
            GPS-based location data. This helps identify issue hotspots, reduce
            duplicate reports, and allows municipal departments to respond
            faster to problems in specific areas.
          </p>
        </div>

        <MapView complaints={complaints} />
      </section>

      {/* Working Feed */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
            How it works
          </p>

          <h2 className="mt-2 font-serif text-4xl font-bold">
            From complaint submission to resolution
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Civic Connect streamlines the entire civic complaint lifecycle using
            AI-powered analysis, automated routing, and transparent tracking so
            both citizens and administrators can monitor issues until
            resolution.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
          {processSteps.map((step, index) => {
            const icons = [
              <FiMapPin size={28} />,
              <FiCpu size={28} />,
              <FiGitBranch size={28} />,
              <FiCheckCircle size={28} />,
            ];

            return (
              <div key={index} className="flex items-center">
                <article className="flex flex-col h-full min-h-[260px] w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
                  {/* ICON */}
                  <div className="mb-4 text-civic-teal">{icons[index]}</div>

                  {/* STEP LABEL */}
                  <p className="text-sm font-semibold uppercase tracking-wider text-civic-orange">
                    Step {index + 1}
                  </p>

                  {/* CONTENT */}
                  <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 flex-grow">
                    {step}
                  </p>
                </article>

                {/* ARROW */}
                {index < processSteps.length - 1 && (
                  <div className="hidden xl:flex items-center justify-center px-4 text-2xl text-slate-400">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Public Participation Feed */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-8">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-civic-blue to-civic-teal p-8 text-white shadow-soft md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100">
            Public participation
          </p>
          <h2 className="mt-3 font-serif text-4xl font-bold">
            See the city clearly. Report what matters. Track what changes.
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-cyan-50">
            Civic Connect turns civic complaints into visible, measurable
            action. Explore the public feed, report a new issue, or sign in to
            track your own cases.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/complaints"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-civic-blue
    transition-all duration-200
    hover:shadow-md hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Explore Complaints
            </Link>

            <Link
              to="/submit"
              className="rounded-full border border-white/35 px-6 py-3 text-sm font-bold text-white
    transition-all duration-200
    hover:bg-white hover:text-civic-blue hover:border-white hover:shadow-md hover:-translate-y-0.5"
            >
              Report an Issue
            </Link>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-10 py-16">
          {/* Footer Grid */}
          <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2 lg:grid-cols-4">
            {/* Civic Connect */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-civic-teal">
                <FiGlobe size={20} />
                <h3 className="font-serif text-xl font-bold">Civic Connect</h3>
              </div>

              <p className="text-sm leading-6 text-justify text-slate-600 dark:text-slate-400">
                Civic Connect is an AI-powered civic complaint management
                platform designed to improve transparency, efficiency, and
                accountability in municipal services. Citizens can report civic
                issues and track complaint resolution in real time.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <div className="flex items-center gap-2 text-civic-teal">
                <FiLink size={18} />
                <h4 className="text-sm font-semibold uppercase tracking-wider">
                  Quick Links
                </h4>
              </div>

              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2 hover:text-civic-teal transition">
                  <FiChevronRight size={14} />
                  <Link to="/">Home</Link>
                </li>

                <li className="flex items-center gap-2 hover:text-civic-teal transition">
                  <FiChevronRight size={14} />
                  <Link to="/complaints">Public Complaints</Link>
                </li>

                <li className="flex items-center gap-2 hover:text-civic-teal transition">
                  <FiChevronRight size={14} />
                  <Link to="/submit">Report Civic Issue</Link>
                </li>

                <li className="flex items-center gap-2 hover:text-civic-teal transition">
                  <FiChevronRight size={14} />
                  <Link to="/dashboard">Citizen Dashboard</Link>
                </li>
              </ul>
            </div>

            {/* Citizen Services */}
            <div>
              <div className="flex items-center gap-2 text-civic-teal">
                <FiUsers size={18} />
                <h4 className="text-sm font-semibold uppercase tracking-wider">
                  Citizen Services
                </h4>
              </div>

              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link
                    to="/dashboard"
                    className="hover:text-civic-teal transition"
                  >
                    Complaint Tracking
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link
                    to="/dashboard"
                    className="hover:text-civic-teal transition"
                  >
                    Service Requests
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link
                    to="/dashboard"
                    className="hover:text-civic-teal transition"
                  >
                    Ward Analytics
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link
                    to="/dashboard"
                    className="hover:text-civic-teal transition"
                  >
                    Public Transparency Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <div className="flex items-center gap-2 text-civic-teal">
                <FiShield size={18} />
                <h4 className="text-sm font-semibold uppercase tracking-wider">
                  Policies
                </h4>
              </div>

              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link
                    to="/policies#privacy"
                    className="hover:text-civic-teal transition"
                  >
                    Privacy Policy
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link
                    to="/policies#terms"
                    className="hover:text-civic-teal transition"
                  >
                    Terms of Service
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link
                    to="/policies#accessibility"
                    className="hover:text-civic-teal transition"
                  >
                    Accessibility Statement
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link
                    to="/policies#security"
                    className="hover:text-civic-teal transition"
                  >
                    Security Policy
                  </Link>
                </li>

                <li className="flex items-center gap-2">
                  <FiChevronRight size={14} />
                  <Link
                    to="/policies#disclaimer"
                    className="hover:text-civic-teal transition"
                  >
                    Disclaimer
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-auto mt-12 max-w-6xl border-t border-slate-200 pt-6 dark:border-slate-800">
            {/* Bottom Row */}
            <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} Civic Connect
              </p>

              <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <FiShield size={14} className="text-civic-teal" />
                Smart City Civic Governance Platform
              </p>
            </div>

            {/* Disclaimer */}
            <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
              Information on this portal is published for civic transparency and
              public awareness.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;


