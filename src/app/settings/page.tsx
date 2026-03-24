"use client";
import React, { useEffect, useState } from "react";
import Layout from "@/components/common/Layout";
import Card from "@/components/common/Card";
import InputField from "@/components/common/InputField";
import Dropdown from "@/components/common/Dropdown";
import Button from "@/components/common/Button";
import { useAuth } from "@/lib/auth/AuthContext";
import { organizationsService } from "@/lib/api/services/organizations";
import { fetchConsortiaByRole } from "@/lib/api/services/consortia";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [consortia, setConsortia] = useState<{ value: string; label: string }[]>([]);
  const [activeConsortium, setActiveConsortium] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    // Fetch organization name if user has organizationId
    async function fetchOrg() {
      if (user?.organizationId) {
        try {
          const res = await organizationsService.getOrganizationById(user.organizationId);
          if (res.success && res.data?.data?.name) {
            setOrgName(res.data.data.name);
          } else {
            setOrgName(user.organizationId);
          }
        } catch {
          setOrgName(user.organizationId);
        }
      }
    }
    fetchOrg();
  }, [user]);

  useEffect(() => {
    // Get role from localStorage, fallback to user?.role
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("authUserRole");
      if (storedRole && storedRole !== "undefined" && storedRole !== "null") {
        setRole(storedRole);
      } else if (user?.role) {
        setRole(user.role);
      } else {
        setRole("");
      }
    }
  }, [user]);

  useEffect(() => {
    // Fetch all consortia for dropdown
    async function fetchConsortia() {
      if (!user) return;
      const consortia = await fetchConsortiaByRole(user);
      if (consortia && consortia.length > 0) {
        setConsortia([
          { value: '', label: 'All Consortiums' },
          ...consortia.map((c: { _id?: string; id?: string; name: string }) => ({
            value: c._id || c.id || '',
            label: c.name,
          })),
        ]);
      } else {
        setConsortia([{ value: '', label: 'All Consortiums' }]);
      }
    }
    fetchConsortia();
  }, [user]);

  // Optionally, persist active consortium selection in localStorage or context

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-xl bg-white text-[#0b1320] border border-gray-200 shadow-md" padding="lg" shadow="md">
          <h1 className="text-3xl font-bold mb-1">Settings</h1>
          <p className="text-base text-gray-500 mb-8">Manage your account settings.</p>
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <InputField
                value={user?.email || ""}
                disabled
                fullWidth
                size="md"
                className="bg-gray-100 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Organization</label>
              <InputField
                value={orgName || user?.organizationId || ""}
                disabled
                fullWidth
                size="md"
                className="bg-gray-100 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Role</label>
              <InputField
                value={role}
                disabled
                fullWidth
                size="md"
                className="bg-gray-100 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Active Consortium</label>
              <Dropdown
                options={consortia}
                value={activeConsortium}
                onChange={setActiveConsortium}
                fullWidth
                size="md"
                className="bg-gray-100 text-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                This setting determines which consortium&apos;s data you&apos;re viewing across the platform.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="danger"
                size="md"
                fullWidth
                onClick={logout}
                type="button"
                className="!bg-red-500 hover:!bg-red-600 text-white font-semibold"
              >
                Sign Out
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}