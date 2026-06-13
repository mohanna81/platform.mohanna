"use client";
import React, { useEffect, useState, useCallback } from "react";
import Layout from "@/components/common/Layout";
import { useAuth } from "@/lib/auth/AuthContext";
import { organizationsService } from "@/lib/api/services/organizations";
import { fetchConsortiaByRole } from "@/lib/api/services/consortia";
import { userService } from "@/lib/api/services/auth";
import { showToast } from "@/lib/utils/toast";

/* ── types ── */
interface EmailPreferences {
  riskApproved: boolean;
  riskRejected: boolean;
  riskClosed: boolean;
  newMeeting: boolean;
  newActionItem: boolean;
  actionItemComplete: boolean;
}

const DEFAULT_PREFS: EmailPreferences = {
  riskApproved: true,
  riskRejected: true,
  riskClosed: true,
  newMeeting: true,
  newActionItem: true,
  actionItemComplete: true,
};

const EMAIL_PREFS: { key: keyof EmailPreferences; label: string; description: string; icon: React.ReactNode }[] = [
  {
    key: "riskApproved",
    label: "New shared risks",
    description: "When a risk is approved and added to the shared register",
    icon: (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50">
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
    ),
  },
  {
    key: "riskRejected",
    label: "Rejected risks",
    description: "When your submitted risk is rejected",
    icon: (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50">
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
    ),
  },
  {
    key: "riskClosed",
    label: "Closed risks",
    description: "When a shared risk is closed",
    icon: (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </span>
    ),
  },
  {
    key: "newMeeting",
    label: "New meetings",
    description: "When you are invited to a meeting",
    icon: (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </span>
    ),
  },
  {
    key: "newActionItem",
    label: "New action items",
    description: "When an action item is assigned to you",
    icon: (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </span>
    ),
  },
  {
    key: "actionItemComplete",
    label: "Action item completed",
    description: "When an action item you are linked to is marked complete",
    icon: (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50">
        <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    ),
  },
];

type Tab = "profile" | "security" | "notifications";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "security",
    label: "Security",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

/* ── password field component ── */
function PasswordField({
  label, value, onChange, show, onToggle, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "••••••••"}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2B4EAE] focus:border-transparent transition"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── toggle component ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2B4EAE] focus:ring-offset-2 ${
        checked ? "bg-[#2B4EAE]" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ── main page ── */
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  /* profile state */
  const [orgName, setOrgName] = useState("");
  const [consortia, setConsortia] = useState<{ value: string; label: string }[]>([]);
  const [activeConsortium, setActiveConsortium] = useState("");
  const [role, setRole] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  /* security state */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  /* notification state */
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>(DEFAULT_PREFS);
  const [savingPrefs, setSavingPrefs] = useState(false);

  /* ── data fetching ── */
  useEffect(() => {
    if (!user?.organizationId) return;
    organizationsService.getOrganizationById(user.organizationId)
      .then((res) => setOrgName(res.data?.data?.name || user.organizationId || ""))
      .catch(() => setOrgName(user.organizationId || ""));
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("authUserRole");
      setRole(stored && stored !== "undefined" ? stored : user?.role || "");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchConsortiaByRole(user).then((list) => {
      if (list?.length) {
        setConsortia([
          { value: "", label: "All Consortia" },
          ...list.map((c: { _id?: string; id?: string; name: string }) => ({
            value: c._id || c.id || "",
            label: c.name,
          })),
        ]);
      } else {
        setConsortia([{ value: "", label: "All Consortia" }]);
      }
    });
  }, [user]);

  useEffect(() => {
    if ((user as any)?.emailPreferences) {
      setEmailPrefs({ ...DEFAULT_PREFS, ...(user as any).emailPreferences });
    }
  }, [user]);

  useEffect(() => {
    if (user?.name) setNameValue(user.name);
  }, [user?.name]);

  /* ── handlers ── */
  const handleSaveName = useCallback(async () => {
    if (!user?.id) return;
    if (!nameValue.trim()) { showToast.error("Name cannot be empty."); return; }
    setSavingName(true);
    try {
      await userService.updateUser(user.id, { name: nameValue.trim() } as any);
      showToast.success("Name updated successfully.");
      setEditingName(false);
    } catch {
      showToast.error("Failed to update name.");
    } finally {
      setSavingName(false);
    }
  }, [user, nameValue]);

  const handleSavePassword = useCallback(async () => {
    if (!user?.id || !user?.email) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      showToast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast.error("New passwords do not match.");
      return;
    }

    setSavingPwd(true);
    try {
      // Verify current password by attempting login
      const { authService } = await import("@/lib/api/services/auth");
      const loginRes = await authService.login({ email: user.email, password: currentPassword });
      if (!loginRes.success) {
        showToast.error("Current password is incorrect.");
        return;
      }
      await userService.updateUser(user.id, { password: newPassword } as any);
      showToast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast.error("Failed to update password.");
    } finally {
      setSavingPwd(false);
    }
  }, [user, currentPassword, newPassword, confirmPassword]);

  const handleSavePrefs = useCallback(async () => {
    if (!user?.id) return;
    setSavingPrefs(true);
    try {
      await userService.updateUser(user.id, { emailPreferences: emailPrefs } as any);
      showToast.success("Notification preferences saved.");
    } catch {
      showToast.error("Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  }, [user, emailPrefs]);

  /* ── helpers ── */
  const getRoleBadgeColor = (r: string) => {
    switch (r) {
      case "Super_user": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Admin": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Facilitator": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getInitials = (name?: string) =>
    (name || "U").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const pwdStrength = (pwd: string) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { label: "Too short", color: "bg-red-400", w: "w-1/4" };
    if (pwd.length < 8) return { label: "Weak", color: "bg-orange-400", w: "w-2/4" };
    const strong = /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
    return strong
      ? { label: "Strong", color: "bg-green-500", w: "w-full" }
      : { label: "Fair", color: "bg-amber-400", w: "w-3/4" };
  };

  const strength = pwdStrength(newPassword);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account, security, and notification preferences.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── Sidebar / Tab nav ── */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              {/* User card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2B4EAE] to-[#4f7aff] flex items-center justify-center text-white text-lg font-bold flex-shrink-0 select-none">
                    {getInitials(user?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user?.name || "—"}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || "—"}</p>
                    <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(role)}`}>
                      {role || "User"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab list — horizontal on mobile, vertical on lg */}
              <nav className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible scrollbar-hide">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition flex-1 lg:flex-none lg:w-full text-left
                        ${activeTab === tab.id
                          ? "bg-[#2B4EAE]/8 text-[#2B4EAE] border-b-2 lg:border-b-0 lg:border-l-4 border-[#2B4EAE]"
                          : "text-gray-600 hover:bg-gray-50 border-b-2 lg:border-b-0 lg:border-l-4 border-transparent"
                        }`}
                    >
                      <span className={activeTab === tab.id ? "text-[#2B4EAE]" : "text-gray-400"}>
                        {tab.icon}
                      </span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </nav>

              {/* Sign out button */}
              <button
                type="button"
                onClick={logout}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-red-200 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </aside>

            {/* ── Main content area ── */}
            <main className="flex-1 min-w-0">

              {/* ══ PROFILE TAB ══ */}
              {activeTab === "profile" && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Your account details and consortium preferences.</p>
                  </div>
                  <div className="p-6 space-y-6">

                    {/* Info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
                        {editingName ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={nameValue}
                              onChange={(e) => setNameValue(e.target.value)}
                              className="flex-1 rounded-xl border border-[#2B4EAE] bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2B4EAE] transition"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") { setEditingName(false); setNameValue(user?.name || ""); } }}
                            />
                            <button
                              type="button"
                              onClick={handleSaveName}
                              disabled={savingName}
                              className="px-3 py-3 rounded-xl bg-[#2B4EAE] text-white text-xs font-semibold hover:bg-[#1e3a8a] transition disabled:opacity-60"
                            >
                              {savingName ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditingName(false); setNameValue(user?.name || ""); }}
                              className="px-3 py-3 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 group">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm text-gray-800 font-medium truncate flex-1">{user?.name || "—"}</span>
                            <button
                              type="button"
                              onClick={() => setEditingName(true)}
                              className="opacity-0 group-hover:opacity-100 transition text-[#2B4EAE] hover:text-[#1e3a8a]"
                              title="Edit name"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Hover over your name to edit it.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email Address</label>
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-800 truncate">{user?.email || "—"}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Role</label>
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(role)}`}>
                            {role || "—"}
                          </span>
                        </div>
                      </div>

                      {orgName && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Organization</label>
                          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
                            </svg>
                            <span className="text-sm text-gray-800 truncate">{orgName}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Active consortium */}
                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Active Consortium</label>
                      <select
                        value={activeConsortium}
                        onChange={(e) => setActiveConsortium(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2B4EAE] focus:border-transparent transition appearance-none"
                      >
                        {consortia.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-2 flex items-start gap-1.5">
                        <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        This determines which consortium&apos;s data you&apos;re viewing across the platform.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ SECURITY TAB ══ */}
              {activeTab === "security" && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Use a strong password to keep your account secure.</p>
                  </div>
                  <div className="p-6 space-y-5 max-w-lg">
                    <PasswordField
                      label="Current Password"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      show={showCurrent}
                      onToggle={() => setShowCurrent((v) => !v)}
                      placeholder="Enter current password"
                    />
                    <PasswordField
                      label="New Password"
                      value={newPassword}
                      onChange={setNewPassword}
                      show={showNew}
                      onToggle={() => setShowNew((v) => !v)}
                      placeholder="At least 6 characters"
                    />

                    {/* Strength meter */}
                    {newPassword && strength && (
                      <div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.w}`} />
                        </div>
                        <p className={`text-xs mt-1 font-medium ${
                          strength.label === "Strong" ? "text-green-600" :
                          strength.label === "Fair" ? "text-amber-600" : "text-red-500"
                        }`}>{strength.label}</p>
                      </div>
                    )}

                    <PasswordField
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      show={showConfirm}
                      onToggle={() => setShowConfirm((v) => !v)}
                      placeholder="Repeat new password"
                    />

                    {/* Match indicator */}
                    {confirmPassword && (
                      <p className={`text-xs font-medium flex items-center gap-1 ${newPassword === confirmPassword ? "text-green-600" : "text-red-500"}`}>
                        {newPassword === confirmPassword ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Passwords match
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Passwords do not match
                          </>
                        )}
                      </p>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSavePassword}
                        disabled={savingPwd}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2B4EAE] hover:bg-[#1e3a8a] text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
                      >
                        {savingPwd ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {savingPwd ? "Updating…" : "Update Password"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ NOTIFICATIONS TAB ══ */}
              {activeTab === "notifications" && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Email Notifications</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Choose which events trigger an email to your inbox.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const allOn = Object.values(emailPrefs).every(Boolean);
                        const updated = Object.fromEntries(
                          Object.keys(emailPrefs).map((k) => [k, !allOn])
                        ) as unknown as EmailPreferences;
                        setEmailPrefs(updated);
                      }}
                      className="text-xs font-semibold text-[#2B4EAE] hover:underline whitespace-nowrap"
                    >
                      {Object.values(emailPrefs).every(Boolean) ? "Disable all" : "Enable all"}
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {EMAIL_PREFS.map(({ key, label, description, icon }) => (
                      <div key={key} className="flex items-center gap-4 px-6 py-4">
                        {icon}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                        </div>
                        <Toggle checked={emailPrefs[key]} onChange={() => setEmailPrefs((p) => ({ ...p, [key]: !p[key] }))} />
                      </div>
                    ))}
                  </div>

                  <div className="px-6 py-5 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleSavePrefs}
                      disabled={savingPrefs}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2B4EAE] hover:bg-[#1e3a8a] text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {savingPrefs ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {savingPrefs ? "Saving…" : "Save Preferences"}
                    </button>
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
}
