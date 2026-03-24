"use client";

import MyRisksHeader from '@/components/my-risks/MyRisksHeader';
import MyRisksTabs from '@/components/my-risks/MyRisksTabs';
import MyRisksList from '@/components/my-risks/MyRisksList';
import NewRiskModal from '@/components/my-risks/NewRiskModal';
import React, { useState } from 'react';
import Layout from '@/components/common/Layout';
import { ProtectedRoute } from '@/components/common';

export default function MyRisksPage() {
  const [showNewRiskModal, setShowNewRiskModal] = useState(false);
  const [activeTab, setActiveTab] = useState('All Risks');
  const [refreshKey, setRefreshKey] = useState(0);
  const handleOpenNewRisk = () => setShowNewRiskModal(true);
  const handleCloseNewRisk = (shouldRefresh = false) => {
    setShowNewRiskModal(false);
    if (shouldRefresh) setRefreshKey(prev => prev + 1);
  };
  return (
    <ProtectedRoute requiredRole={undefined}>
      <Layout>
        <div className="min-h-screen px-2 sm:px-3 md:px-4 max-w-screen-xl mx-auto py-6">
          <MyRisksHeader onNewRisk={handleOpenNewRisk} />
          <MyRisksTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <MyRisksList statusFilter={activeTab} refreshKey={refreshKey} />
          <NewRiskModal isOpen={showNewRiskModal} onClose={handleCloseNewRisk} />
        </div>
      </Layout>
    </ProtectedRoute>
  );
} 