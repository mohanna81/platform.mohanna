"use client";

import MyRisksHeader from '@/components/my-risks/MyRisksHeader';
import MyRisksTabs, { MITIGATION_TAB } from '@/components/my-risks/MyRisksTabs';
import MyRisksList from '@/components/my-risks/MyRisksList';
import MyMitigationsTab from '@/components/my-risks/MyMitigationsTab';
import NewRiskModal from '@/components/my-risks/NewRiskModal';
import React, { useState } from 'react';
import Layout from '@/components/common/Layout';
import { ProtectedRoute } from '@/components/common';
import { useAuth } from '@/lib/auth/AuthContext';

export default function MyRisksPage() {
  const { user } = useAuth();
  const [showNewRiskModal, setShowNewRiskModal] = useState(false);
  const [activeTab, setActiveTab] = useState('All Risks');
  const [refreshKey, setRefreshKey] = useState(0);

  const isOrgUser = user?.role === 'Organization User';

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
          <MyRisksTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showMitigationsTab={isOrgUser}
          />
          {activeTab === MITIGATION_TAB ? (
            <MyMitigationsTab />
          ) : (
            <MyRisksList statusFilter={activeTab} refreshKey={refreshKey} />
          )}
          <NewRiskModal isOpen={showNewRiskModal} onClose={handleCloseNewRisk} />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
