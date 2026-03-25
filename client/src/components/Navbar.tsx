import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FiAlertCircle,
  FiBarChart2,
  FiBell,
  FiChevronDown,
  FiClipboard,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiPlusCircle,
  FiSettings,
  FiShield,
  FiSun,
  FiUser,
  FiX,
} from "react-icons/fi";

import NotificationDropdown from "./notifications/NotificationDropdown";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-civic-blue text-white shadow-soft"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
  }`;

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { unreadCount, refreshNotifications } = useNotifications();
  const [active, setActive] = useState("register");
  const [isDark, setIsDark] = useState<boolean>(
    () => localStorage.getItem("civic-connect-theme") === "dark",
  );
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("civic-connect-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (!isAuthenticated) {
      setOpenNotifications(false);
      setOpenProfile(false);
    }
  }, [isAuthenticated]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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

          {isAuthenticated && user?.role === "citizen" ? (
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
          ) : null}

          {isAuthenticated && user?.role === "admin" ? (
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
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenu((current) => !current)}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenu ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>

          <button
            type="button"
            onClick={() => setIsDark((current) => !current)}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-lg text-slate-700 transition hover:border-civic-teal hover:text-civic-teal dark:border-slate-700 dark:text-slate-200"
            aria-label="Toggle dark mode"
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </button>

          {isAuthenticated ? (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !openNotifications;
                    setOpenNotifications(nextState);
                    setOpenProfile(false);
                    if (nextState) {
                      void refreshNotifications();
                    }
                  }}
                  className="relative grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-lg text-slate-700 transition hover:border-civic-teal hover:text-civic-teal dark:border-slate-700 dark:text-slate-200"
                  aria-label="View notifications"
                >
                  <FiBell />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>

                {openNotifications ? (
                  <NotificationDropdown onClose={() => setOpenNotifications(false)} />
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOpenProfile((current) => !current);
                    setOpenNotifications(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-civic-teal dark:border-slate-700 dark:text-slate-200"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-civic-blue text-white">
                    <FiUser size={16} />
                  </div>
                  <FiChevronDown size={16} />
                </button>

                {openProfile ? (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-500">{user?.role}</p>
                    </div>

                    <div className="p-2">
                      <Link
                        to="/notifications"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <FiBell size={16} />
                        Notifications
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <FiSettings size={16} />
                        Settings
                      </Link>

                      <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <FiLogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="hidden items-center lg:flex">
              <div className="relative flex rounded-full bg-slate-100 p-1 dark:bg-slate-800">
                <span
                  className={`absolute bottom-1 top-1 w-1/2 rounded-full bg-civic-blue shadow-md transition-all duration-300 ease-in-out ${
                    active === "login" ? "left-1" : "left-1/2"
                  }`}
                />

                <Link
                  to="/login"
                  onMouseEnter={() => setActive("login")}
                  className={`relative z-10 w-1/2 px-4 py-2 text-center text-sm font-semibold transition-colors duration-300 ${
                    active === "login" ? "text-white" : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onMouseEnter={() => setActive("register")}
                  className={`relative z-10 w-1/2 px-4 py-2 text-center text-sm font-semibold transition-colors duration-300 ${
                    active === "register" ? "text-white" : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {mobileMenu ? (
        <div className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <nav className="flex flex-col gap-3 px-6 py-6">
            <NavLink
              to="/"
              end
              className={navLinkClass}
              onClick={() => setMobileMenu(false)}
            >
              <span className="flex items-center gap-2">
                <FiHome size={16} />
                Home
              </span>
            </NavLink>

            <NavLink
              to="/complaints"
              className={navLinkClass}
              onClick={() => setMobileMenu(false)}
            >
              <span className="flex items-center gap-2">
                <FiAlertCircle size={16} />
                Complaints
              </span>
            </NavLink>

            {isAuthenticated ? (
              <NavLink
                to="/notifications"
                className={navLinkClass}
                onClick={() => setMobileMenu(false)}
              >
                <span className="flex items-center gap-2">
                  <FiBell size={16} />
                  Notifications
                </span>
              </NavLink>
            ) : null}

            {isAuthenticated && user?.role === "citizen" ? (
              <>
                <NavLink
                  to="/submit"
                  className={navLinkClass}
                  onClick={() => setMobileMenu(false)}
                >
                  <span className="flex items-center gap-2">
                    <FiPlusCircle size={16} />
                    Report Issue
                  </span>
                </NavLink>

                <NavLink
                  to="/dashboard"
                  className={navLinkClass}
                  onClick={() => setMobileMenu(false)}
                >
                  <span className="flex items-center gap-2">
                    <FiClipboard size={16} />
                    My Complaints
                  </span>
                </NavLink>
              </>
            ) : null}

            {isAuthenticated && user?.role === "admin" ? (
              <>
                <NavLink
                  to="/admin"
                  className={navLinkClass}
                  onClick={() => setMobileMenu(false)}
                >
                  <span className="flex items-center gap-2">
                    <FiShield size={16} />
                    Admin Dashboard
                  </span>
                </NavLink>

                <NavLink
                  to="/admin/analytics"
                  className={navLinkClass}
                  onClick={() => setMobileMenu(false)}
                >
                  <span className="flex items-center gap-2">
                    <FiBarChart2 size={16} />
                    Analytics
                  </span>
                </NavLink>
              </>
            ) : null}

            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenu(false)}
                  className="rounded-full border border-slate-300 px-5 py-2 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenu(false)}
                  className="rounded-full bg-civic-blue px-5 py-2 text-center text-sm font-semibold text-white"
                >
                  Register
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
