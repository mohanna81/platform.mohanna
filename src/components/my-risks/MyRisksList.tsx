import React, { useEffect, useState, useCallback } from 'react';
import { risksService, Risk } from '@/lib/api/services/risks';
import RiskDetailsDrawer from './RiskDetailsDrawer';
import NewRiskModal from './NewRiskModal';
import { showToast } from '@/lib/utils/toast';
import Loader from '@/components/common/Loader';
import RotatingMessageLoader from '@/components/common/RotatingMessageLoader';
import { useAuth } from '@/lib/auth/AuthContext';

const getConsortiumNames = (consortium: unknown) => {
  if (!Array.isArray(consortium)) return '';
  return consortium.map((c: { name?: string } | string) => 
    typeof c === 'object' && c !== null && 'name' in c ? c.name : String(c)
  ).filter(Boolean).join(', ');
};

const RiskCard: React.FC<{ risk: Risk; onViewDetails: () => void; onEdit?: () => void; userRole?: string }> = ({ risk, onViewDetails, onEdit, userRole }) => (
  <div className={`bg-white border rounded-xl p-6 mb-4 shadow-sm flex flex-col gap-2 ${
    risk.status === 'Rejected' ? 'border-red-300 bg-red-50' : 'border-gray-200'
  }`}>
    <div className="flex flex-wrap items-center gap-2 mb-1">
      <span className="text-xl font-bold text-gray-900">{risk.title}</span>
      {risk.code && <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded">{risk.code}</span>}
      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
        risk.status === 'Rejected' 
          ? 'bg-red-100 text-red-700' 
          : risk.status === 'Approved'
          ? 'bg-green-100 text-green-700'
          : risk.status === 'Pending'
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-700'
      }`}>{risk.status}</span>
      {risk.consortium && Array.isArray(risk.consortium) && risk.consortium.length > 0 && (
        <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded">{getConsortiumNames(risk.consortium)}</span>
      )}
    </div>
    <div className="text-sm text-gray-500 mb-2">
      Created: {risk.createdAt?.slice(0, 10)}
      {risk.category && <> &bull; Category: {risk.category}</>}
    </div>
    <div className="text-gray-800 mb-2">{risk.statement}</div>
    <div className="text-gray-900 font-semibold mb-2">
      Trigger: <span className="font-normal text-gray-800">{risk.triggerIndicator}</span>
    </div>
    <div className="flex justify-end gap-2">
      <button className="border border-gray-300 rounded px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer" onClick={onViewDetails}>View Details</button>
      {(risk.status === 'Draft' || risk.status === 'Rejected') && onEdit && userRole === 'Organization User' && (
        <button className="bg-[#FBBF77] hover:bg-[#f9b15c] text-[#0b1320] rounded px-4 py-1 text-sm font-medium transition cursor-pointer border border-[#FBBF77] hover:border-[#f9b15c] flex items-center gap-2" onClick={onEdit}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {risk.status === 'Draft' ? 'Edit' : 'Edit & Re-submit'}
        </button>
      )}
    </div>
  </div>
);

const MyRisksList = ({ statusFilter, refreshKey }: { statusFilter: string; refreshKey?: number }) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    hasError: false,
    errorMessage: '',
    retryCount: 0,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRiskForEdit, setSelectedRiskForEdit] = useState<Risk | null>(null);
  const { user } = useAuth();

  const filterRisks = useCallback((risks: Risk[]) => {
    let filteredRisks = risks;

    // Filter by user role - Organization Users only see their own risks
    if (user?.role === 'Organization User') {
      filteredRisks = risks.filter(risk => 
        risk.createdBy?._id === user.id
      );
    }

    // Apply status filter
    if (statusFilter === 'All Risks') return filteredRisks;
    if (statusFilter === 'Draft') return filteredRisks.filter(r => r.status === 'Draft');
    if (statusFilter === 'Under Review') return filteredRisks.filter(r => r.status === 'Pending');
    if (statusFilter === 'Rejected') return filteredRisks.filter(r => r.status === 'Rejected');
    if (statusFilter === 'Shared') return filteredRisks.filter(r => r.status === 'Approved');
    return filteredRisks;
  }, [user, statusFilter]);

  const refreshRisks = useCallback(async () => {
    setLoadingState({
      isLoading: true,
      hasError: false,
      errorMessage: '',
      retryCount: loadingState.retryCount,
    });

    try {
      const res = await risksService.getRisks();
      
      if (res.success && res.data) {
        const risksData = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        setRisks(risksData);
        setLoadingState({
          isLoading: false,
          hasError: false,
          errorMessage: '',
          retryCount: 0,
        });
      } else {
        throw new Error(res.error || 'Failed to fetch risks');
      }
    } catch (error) {
      console.error('Error fetching risks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load risks';
      setLoadingState({
        isLoading: false,
        hasError: true,
        errorMessage,
        retryCount: loadingState.retryCount + 1,
      });
      showToast.error(errorMessage);
      // Set empty array on error to show "no risks" instead of leaving stale data
      setRisks([]);
    }
  }, [loadingState.retryCount]);

  useEffect(() => {
    refreshRisks();
  }, [refreshKey]);

  const filteredRisks = filterRisks(risks);

  const handleEditRisk = (risk: Risk) => {
    setSelectedRiskForEdit(risk);
    setEditModalOpen(true);
  };

  const handleRetry = () => {
    refreshRisks();
  };

  if (loadingState.isLoading) {
    return (
      <div className="py-8">
        <RotatingMessageLoader
          title="Loading Your Risks"
          messages={[
            'Preparing your risk insights…',
            'Analyzing your submissions…',
            'Organizing risk data…',
            'Building your risk portfolio…',
            'Gathering consortium information…'
          ]}
        />
      </div>
    );
  }

  if (loadingState.hasError) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Risks</h3>
          <p className="text-gray-600 mb-4">{loadingState.errorMessage}</p>
          <button
            onClick={handleRetry}
            className="bg-[#FBBF77] hover:bg-[#f9b15c] text-[#0b1320] rounded px-6 py-2 text-sm font-medium transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {filteredRisks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl min-h-[100px] flex items-center justify-center text-gray-500 text-lg">
          {risks.length === 0 ? 'No risks created yet.' : 'No risks found in this category.'}
        </div>
      ) : (
        filteredRisks.map((risk) => (
          <RiskCard
            key={risk._id}
            risk={risk}
            onViewDetails={() => {
              setSelectedRisk(risk);
              setDrawerOpen(true);
            }}
            onEdit={() => handleEditRisk(risk)}
            userRole={user?.role}
          />
        ))
      )}
      <RiskDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        risk={selectedRisk}
        onUpdated={refreshRisks}
      />
      <NewRiskModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRiskForEdit(null);
        }}
        editMode={true}
        riskId={selectedRiskForEdit?._id || ''}
        onUpdated={refreshRisks}
      />
    </div>
  );
};

export default MyRisksList; 