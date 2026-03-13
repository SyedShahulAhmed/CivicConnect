import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FiHome,
  FiAlertCircle,
  FiPlusCircle,
  FiClipboard,
  FiBarChart2,
  FiShield,
  FiMoon,
  FiSun,
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiMenu,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../hooks/useAuth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-civic-blue text-white shadow-soft"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
  }`;

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();

  const [isDark, setIsDark] = useState<boolean>(
    () => localStorage.getItem("civic-connect-theme") === "dark",
  );

  const [openProfile, setOpenProfile] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("civic-connect-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-civic-blue text-lg font-black text-white">
            CC
          </span>

          <div>
            <p className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">
              Civic Connect
            </p>

            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Civic Issue Reporting Platform
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 lg:flex">
          <NavLink to="/" end className={navLinkClass}>
            <span className="flex items-center gap-2">
              <FiHome size={16} />
              Home
            </span>
          </NavLink>

          <NavLink to="/complaints" className={navLinkClass}>
            <span className="flex items-center gap-2">
              <FiAlertCircle size={16} />
              Complaints
            </span>
          </NavLink>

          {isAuthenticated && user?.role === "citizen" && (
            <>
              <NavLink to="/submit" className={navLinkClass}>
                <span className="flex items-center gap-2">
                  <FiPlusCircle size={16} />
                  Report Issue
                </span>
              </NavLink>

              <NavLink to="/dashboard" className={navLinkClass}>
                <span className="flex items-center gap-2">
                  <FiClipboard size={16} />
                  My Complaints
                </span>
              </NavLink>
            </>
          )}

          {isAuthenticated && user?.role === "admin" && (
            <>
              <NavLink to="/admin" end className={navLinkClass}>
                <span className="flex items-center gap-2">
                  <FiShield size={16} />
                  Admin Dashboard
                </span>
              </NavLink>

              <NavLink to="/admin/analytics" className={navLinkClass}>
                <span className="flex items-center gap-2">
                  <FiBarChart2 size={16} />
                  Analytics
                </span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="lg:hidden grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            {mobileMenu ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsDark((current) => !current)}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-lg text-slate-700 transition hover:border-civic-teal hover:text-civic-teal dark:border-slate-700 dark:text-slate-200"
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </button>

          {/* Auth Section */}
          {isAuthenticated ? (
            <div className="relative">

              {/* Profile Button */}
              <button
                onClick={() => setOpenProfile(!openProfile)}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-civic-teal dark:border-slate-700 dark:text-slate-200"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-civic-blue text-white">
                  <FiUser size={16} />
                </div>

                <FiChevronDown size={16} />
              </button>

              {/* Profile Dropdown */}
              {openProfile && (
                <div className="absolute right-0 mt-3 w-48 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">

                  <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {user?.name}
                    </p>

                    <p className="text-xs text-slate-500">{user?.role}</p>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <FiSettings size={16} />
                      Settings
                    </Link>

                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <FiLogOut size={16} />
                      Logout
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            <Link
              to="/register"
              className="hidden rounded-full bg-civic-blue px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-90 lg:block"
            >
              Get Started
            </Link>
          )}

        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenu && (
        <div className="lg:hidden border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <nav className="flex flex-col gap-3 px-6 py-6">

            <NavLink to="/" end className={navLinkClass} onClick={() => setMobileMenu(false)}>
              <span className="flex items-center gap-2">
                <FiHome size={16} />
                Home
              </span>
            </NavLink>

            <NavLink to="/complaints" className={navLinkClass} onClick={() => setMobileMenu(false)}>
              <span className="flex items-center gap-2">
                <FiAlertCircle size={16} />
                Complaints
              </span>
            </NavLink>

            {isAuthenticated && user?.role === "citizen" && (
              <>
                <NavLink to="/submit" className={navLinkClass} onClick={() => setMobileMenu(false)}>
                  <span className="flex items-center gap-2">
                    <FiPlusCircle size={16} />
                    Report Issue
                  </span>
                </NavLink>

                <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMobileMenu(false)}>
                  <span className="flex items-center gap-2">
                    <FiClipboard size={16} />
                    My Complaints
                  </span>
                </NavLink>
              </>
            )}

            {isAuthenticated && user?.role === "admin" && (
              <>
                <NavLink to="/admin" className={navLinkClass} onClick={() => setMobileMenu(false)}>
                  <span className="flex items-center gap-2">
                    <FiShield size={16} />
                    Admin Dashboard
                  </span>
                </NavLink>

                <NavLink to="/admin/analytics" className={navLinkClass} onClick={() => setMobileMenu(false)}>
                  <span className="flex items-center gap-2">
                    <FiBarChart2 size={16} />
                    Analytics
                  </span>
                </NavLink>
              </>
            )}

            {!isAuthenticated && (
              <Link
                to="/register"
                onClick={() => setMobileMenu(false)}
                className="mt-2 rounded-full bg-civic-blue px-5 py-2 text-center text-sm font-semibold text-white"
              >
                Get Started
              </Link>
            )}

          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;