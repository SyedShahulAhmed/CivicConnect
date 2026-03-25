import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MoonStar,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserCircle2,
} from "lucide-react";

import Loader from "../components/Loader";
import InputField from "../components/settings/InputField";
import SectionCard from "../components/settings/SectionCard";
import ToggleSwitch from "../components/settings/ToggleSwitch";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { extractApiError } from "../services/api";
import {
  getUserProfile,
  updateUserPassword,
  updateUserProfile,
} from "../services/settingsService";

interface SettingsFormState {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  darkMode: boolean;
}

interface TouchedState {
  name: boolean;
  email: boolean;
  currentPassword: boolean;
  newPassword: boolean;
}

const darkModeStorageKey = "civic-connect-dark-mode";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createInitialTouchedState = (): TouchedState => ({
  name: false,
  email: false,
  currentPassword: false,
  newPassword: false,
});

export const Settings = () => {
  const navigate = useNavigate();
  const { user, updateCurrentUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState<SettingsFormState>({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    darkMode: false,
  });
  const [touched, setTouched] = useState<TouchedState>(createInitialTouchedState());
  const [profileBaseline, setProfileBaseline] = useState<{ name: string; email: string } | null>(null);
  const [accountMeta, setAccountMeta] = useState<{ role: string; ward: string; address: string } | null>(
    user
      ? {
          role: user.role,
          ward: user.ward,
          address: user.address,
        }
      : null,
  );
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
  });

  useEffect(() => {
    const storedTheme = localStorage.getItem(darkModeStorageKey);
    const initialDarkMode = storedTheme ? storedTheme === "true" : document.documentElement.classList.contains("dark");

    setForm((current) => ({ ...current, darkMode: initialDarkMode }));
    document.documentElement.classList.toggle("dark", initialDarkMode);
    setIsThemeReady(true);
  }, []);

  useEffect(() => {
    if (!isThemeReady) {
      return;
    }

    localStorage.setItem(darkModeStorageKey, String(form.darkMode));
    document.documentElement.classList.toggle("dark", form.darkMode);
  }, [form.darkMode, isThemeReady]);

  useEffect(() => {
    const loadProfile = async () => {
      setIsProfileLoading(true);

      try {
        const profile = await getUserProfile();

        setForm((current) => ({
          ...current,
          name: profile.name,
          email: profile.email,
        }));
        setProfileBaseline({ name: profile.name, email: profile.email });
        setAccountMeta({
          role: profile.role,
          ward: profile.ward,
          address: profile.address,
        });
        updateCurrentUser(profile);
      } catch (error) {
        const message = extractApiError(error);
        showToast({
          tone: "error",
          title: "Could not load settings",
          message,
        });
      } finally {
        setIsProfileLoading(false);
      }
    };

    void loadProfile();
  }, [showToast, updateCurrentUser]);

  const profileErrors = useMemo(() => {
    const errors = {
      name: "",
      email: "",
    };

    if (!form.name.trim()) {
      errors.name = "Name is required.";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!emailPattern.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    return errors;
  }, [form.email, form.name]);

  const passwordErrors = useMemo(() => {
    const errors = {
      currentPassword: "",
      newPassword: "",
    };

    if (touched.currentPassword || form.newPassword) {
      if (!form.currentPassword.trim()) {
        errors.currentPassword = "Enter your current password to confirm this change.";
      }
    }

    if (touched.newPassword || form.currentPassword) {
      if (!form.newPassword.trim()) {
        errors.newPassword = "Enter a new password.";
      } else if (form.newPassword.trim().length < 6) {
        errors.newPassword = "New password must be at least 6 characters.";
      }
    }

    return errors;
  }, [form.currentPassword, form.newPassword, touched.currentPassword, touched.newPassword]);

  const hasProfileErrors = Boolean(profileErrors.name || profileErrors.email);
  const hasPasswordErrors = Boolean(passwordErrors.currentPassword || passwordErrors.newPassword);
  const hasProfileChanges = Boolean(
    profileBaseline &&
      (form.name.trim() !== profileBaseline.name || form.email.trim().toLowerCase() !== profileBaseline.email.toLowerCase()),
  );

  const updateField = <Key extends keyof SettingsFormState>(field: Key, value: SettingsFormState[Key]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const markTouched = (field: keyof TouchedState) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleProfileSave = async () => {
    setTouched((current) => ({ ...current, name: true, email: true }));

    if (hasProfileErrors) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedProfile = await updateUserProfile({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      });

      setProfileBaseline({ name: updatedProfile.name, email: updatedProfile.email });
      setAccountMeta({
        role: updatedProfile.role,
        ward: updatedProfile.ward,
        address: updatedProfile.address,
      });
      setForm((current) => ({
        ...current,
        name: updatedProfile.name,
        email: updatedProfile.email,
      }));
      updateCurrentUser(updatedProfile);
      showToast({
        tone: "success",
        title: "Profile updated successfully",
        message: "Your account information is now up to date.",
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not update profile",
        message: extractApiError(error),
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    setTouched((current) => ({
      ...current,
      currentPassword: true,
      newPassword: true,
    }));

    if (hasPasswordErrors) {
      return;
    }

    setIsSavingPassword(true);

    try {
      await updateUserPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setForm((current) => ({
        ...current,
        currentPassword: "",
        newPassword: "",
      }));
      setTouched((current) => ({
        ...current,
        currentPassword: false,
        newPassword: false,
      }));
      showToast({
        tone: "success",
        title: "Password updated successfully",
        message: "Use your new password the next time you sign in.",
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not update password",
        message: extractApiError(error),
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const primaryButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full bg-civic-teal px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-civic-teal/90 focus:outline-none focus:ring-2 focus:ring-civic-teal/30 disabled:cursor-not-allowed disabled:opacity-60";

  if (isProfileLoading) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Loader label="Loading account settings..." className="min-h-[40vh]" />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-col gap-6 rounded-[2.5rem] border border-slate-200 bg-[var(--panel)] p-6 shadow-soft backdrop-blur dark:border-slate-800 lg:p-8">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate(user?.role === "admin" ? "/admin" : "/dashboard")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-civic-teal/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-950"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </button>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Account Settings</p>
              <h1 className="mt-2 text-4xl font-bold text-slate-900 dark:text-white">Manage your profile, security, and preferences</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                Keep your account details accurate, secure your access, and personalize how Civic Connect feels on this device.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:min-w-[18rem]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Account overview</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Signed in as {accountMeta?.role || user?.role || "user"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {accountMeta?.ward ? <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">{accountMeta.ward}</span> : null}
              {accountMeta?.role ? <span className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">{accountMeta.role}</span> : null}
            </div>
            {accountMeta?.address ? <p className="text-sm text-slate-500 dark:text-slate-400">{accountMeta.address}</p> : null}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <SectionCard
              title="Profile Information"
              description="Update your public-facing account details used across complaint submissions and dashboards."
              icon={UserCircle2}
              footer="Your role, ward, and address are read-only here because they affect complaint routing and operational visibility."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  id="settings-name"
                  label="Full name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  onBlur={() => markTouched("name")}
                  placeholder="Enter your full name"
                  helperText="This name appears on your account and complaint history."
                  error={profileErrors.name}
                  touched={touched.name}
                  icon={UserCircle2}
                  disabled={isSavingProfile}
                  autoComplete="name"
                />
                <InputField
                  id="settings-email"
                  label="Email address"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  onBlur={() => markTouched("email")}
                  placeholder="Enter your email address"
                  helperText="We use this email for status updates and account recovery."
                  error={profileErrors.email}
                  touched={touched.email}
                  icon={Mail}
                  disabled={isSavingProfile}
                  autoComplete="email"
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <CheckCircle2 size={16} className="mt-0.5 text-emerald-600 dark:text-emerald-300" />
                  <span>Profile changes are reflected immediately in your current session.</span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleProfileSave()}
                  disabled={isSavingProfile || !hasProfileChanges}
                  className={primaryButtonClassName}
                >
                  {isSavingProfile ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSavingProfile ? "Saving profile..." : "Save profile"}
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title="Security"
              description="Change your password to keep your Civic Connect account secure."
              icon={ShieldCheck}
              footer="Use at least 6 characters. We recommend a unique password you do not reuse elsewhere."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  id="settings-current-password"
                  label="Current password"
                  type={showPasswords.current ? "text" : "password"}
                  value={form.currentPassword}
                  onChange={(event) => updateField("currentPassword", event.target.value)}
                  onBlur={() => markTouched("currentPassword")}
                  placeholder="Enter your current password"
                  helperText="Required before we let you change your password."
                  error={passwordErrors.currentPassword}
                  touched={touched.currentPassword}
                  icon={LockKeyhole}
                  disabled={isSavingPassword}
                  autoComplete="current-password"
                  action={
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-civic-teal/20 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label={showPasswords.current ? "Hide current password" : "Show current password"}
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
                <InputField
                  id="settings-new-password"
                  label="New password"
                  type={showPasswords.next ? "text" : "password"}
                  value={form.newPassword}
                  onChange={(event) => updateField("newPassword", event.target.value)}
                  onBlur={() => markTouched("newPassword")}
                  placeholder="Choose a new password"
                  helperText="Minimum 6 characters. Longer is better."
                  error={passwordErrors.newPassword}
                  touched={touched.newPassword}
                  icon={LockKeyhole}
                  disabled={isSavingPassword}
                  autoComplete="new-password"
                  action={
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("next")}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-civic-teal/20 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label={showPasswords.next ? "Hide new password" : "Show new password"}
                    >
                      {showPasswords.next ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <AlertCircle size={16} className="mt-0.5 text-amber-500" />
                  <span>Password updates are verified against your current credentials.</span>
                </div>
                <button
                  type="button"
                  onClick={() => void handlePasswordSave()}
                  disabled={isSavingPassword}
                  className={primaryButtonClassName}
                >
                  {isSavingPassword ? <LoaderCircle size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {isSavingPassword ? "Updating password..." : "Change password"}
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title="Preferences"
              description="Customize how Civic Connect looks and feels on this device."
              icon={SlidersHorizontal}
            >
              <ToggleSwitch
                id="settings-dark-mode"
                checked={form.darkMode}
                onChange={(checked) => updateField("darkMode", checked)}
                label="Dark mode"
                description="Save your visual theme locally and apply it immediately across the app."
              />
            </SectionCard>
          </div>

          <aside className="space-y-6">
            <SectionCard
              title="Quick Summary"
              description="A compact view of the settings that matter most right now."
              icon={MoonStar}
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Theme</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {form.darkMode ? "Dark mode enabled" : "Light mode enabled"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Profile status</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {hasProfileChanges ? "Unsaved profile edits" : "Profile is synced"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Security</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {form.newPassword ? "Password update in progress" : "No pending password changes"}
                  </p>
                </div>
              </div>
            </SectionCard>
          </aside>
        </div>
      </div>
    </section>
  );
};
