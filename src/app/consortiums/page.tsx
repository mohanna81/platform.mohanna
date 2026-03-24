"use client";
import React from "react";
import Button from "@/components/common/Button";
import Layout from '@/components/common/Layout';
import ActiveConsortiumsTable from '@/components/consortium-management/ActiveConsortiumsTable';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ConsortiumsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Only show "Manage Consortiums" button for Super_user and Admin
  // Facilitator now has same view as Organization User
  const canManageConsortiums = user && (user.role === 'Super_user' || user.role === 'Admin');

  return (
    <Layout>
      <div className="px-4 py-8 sm:px-8 md:px-12 md:py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0b1320]">Consortiums</h1>
          {canManageConsortiums && (
            <Button
              variant="primary"
              size="md"
              className="bg-[#FBBF77]/60 text-[#0b1320] font-medium px-6 py-2 rounded-lg shadow-none hover:bg-[#FBBF77] focus:ring-0 w-full md:w-auto"
              onClick={() => router.push('/consortium-management')}
            >
              Manage Consortiums
            </Button>
          )}
        </div>
        <ActiveConsortiumsTable />
      </div>
    </Layout>
  );
} 