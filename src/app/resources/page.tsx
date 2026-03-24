"use client";
import React, { useState, useRef } from "react";
import ResourcesHeader from "@/components/resources/ResourcesHeader";
import ResourcesTabs from "@/components/resources/ResourcesTabs";
import ResourcesSection from "@/components/resources/ResourcesSection";
import Layout from '@/components/common/Layout';
import { useAuth } from '@/lib/auth/AuthContext';
import AddResourceModal from '@/components/resources/AddResourceModal';

type TabName = 'All Resources' | 'Documents' | 'Videos' | 'Images';

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<TabName>('All Resources');
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { user } = useAuth();
  
  // Ref to hold the refresh function from ResourcesSection
  const refreshResourcesRef = useRef<(() => void) | null>(null);

  const canAddResource = user && (user.role === 'Super_user' || user.role === 'Admin');

  const handleResourceCreated = () => {
    // Refresh the resources list when a new resource is created
    if (refreshResourcesRef.current) {
      refreshResourcesRef.current();
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-8 md:p-12">
        <ResourcesHeader
          search={search}
          onSearchChange={setSearch}
          showAddResourceButton={!!canAddResource}
          onAddResource={() => setAddModalOpen(true)}
        />
        <ResourcesTabs activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabName)} />
        <ResourcesSection 
          activeTab={activeTab} 
          search={search} 
          onRefreshRef={refreshResourcesRef}
        />
        <AddResourceModal 
          open={addModalOpen} 
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleResourceCreated}
        />
      </div>
    </Layout>
  );
} 