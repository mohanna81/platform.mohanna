import React, { useEffect, useState, useCallback } from 'react';
import { risksService, Risk } from '@/lib/api/services/risks';
import RiskDetailsDrawer from './RiskDetailsDrawer';
import NewRiskModal from './NewRiskModal';
import EditRiskModal from '@/components/risk-review/EditRiskModal';
import { showToast } from '@/lib/utils/toast';
import RotatingMessageLoader from '@/components/common/RotatingMessageLoader';
import { useAuth } from '@/lib/auth/AuthContext';

const getConsortiumNames = (consortium: unknown) => {
  if (!Array.isArray(consortium)) return '';
  return consortium.map((c: { name?: string } | string) =>
    typeof c === 'object' && c !== null && 'name' in c ? c.name : String(c)
  ).filter(Boolean).join(', ');
};

// ── Audit info modal ──────────────────────────────────────────────────────────
const AuditModal: React.FC<{ risk: Risk; onClose: () => void }> = ({ risk, onClose }) => {
  const createdBy = (risk as unknown as { createdBy?: { name?: string; email?: string } }).createdBy;
  const lastEditedBy = (risk as unknown as { lastEditedBy?: { name?: string; email?: string } }).lastEditedBy;
  const updatedAt = (risk as unknown as { updatedAt?: string }).updatedAt;
  const wasEdited = lastEditedBy && updatedAt && risk.createdAt !== updatedAt;

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#2a9d8f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Risk Audit Trail
        </h3>

        <p className="text-sm font-semibold text-gray-800 mb-3 truncate">{risk.title}</p>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-0.5">Created</p>
              <p className="text-sm text-gray-800 font-medium">{createdBy?.name || 'Unknown'}</p>
              {createdBy?.email && <p className="text-xs text-gray-500">{createdBy.email}</p>}
              <p className="text-xs text-gray-400 mt-1">{fmt(risk.createdAt)}</p>
            </div>
          </div>

          {wasEdited ? (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Last Edited</p>
                <p className="text-sm text-gray-800 font-medium">{lastEditedBy?.name || 'Unknown'}</p>
                {lastEditedBy?.email && <p className="text-xs text-gray-500">{lastEditedBy.email}</p>}
                <p className="text-xs text-gray-400 mt-1">{fmt(updatedAt)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 italic">This risk has not been edited.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Risk card ─────────────────────────────────────────────────────────────────
const RiskCard: React.FC<{ risk: Risk; onViewDetails: () => void; onEdit?: () => void; userRole?: string }> = ({ risk, onViewDetails, onEdit, userRole }) => {
  const [auditOpen, setAuditOpen] = useState(false);

  return (
    <>
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
          {/* Eye icon — audit trail */}
          <button
            title="View audit info"
            onClick={() => setAuditOpen(true)}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-[#2a9d8f] hover:border-[#2a9d8f] transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            className="border border-gray-300 rounded px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            onClick={onViewDetails}
          >
            View Details
          </button>
          {/* Org users can edit Draft risks from their organization */}
          {onEdit && userRole === 'Organization User' && risk.status === 'Draft' && (
            <button
              className="bg-[#FBBF77] hover:bg-[#f9b15c] text-[#0b1320] rounded px-4 py-1 text-sm font-medium transition cursor-pointer border border-[#FBBF77] hover:border-[#f9b15c] flex items-center gap-2"
              onClick={onEdit}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>

      {auditOpen && <AuditModal risk={risk} onClose={() => setAuditOpen(false)} />}
    </>
  );
};

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
  const isOrgUser = user?.role === 'Organization User';

  const filterRisks = useCallback((risks: Risk[]) => {
    if (statusFilter === 'All Risks') return risks;
    if (statusFilter === 'Draft') return risks.filter(r => r.status === 'Draft');
    if (statusFilter === 'Under Review') return risks.filter(r => r.status === 'Pending');
    if (statusFilter === 'Rejected') return risks.filter(r => r.status === 'Rejected');
    if (statusFilter === 'Shared') return risks.filter(r => r.status === 'Approved');
    return risks;
  }, [statusFilter]);

  const refreshRisks = useCallback(async () => {
    setLoadingState({
      isLoading: true,
      hasError: false,
      errorMessage: '',
      retryCount: loadingState.retryCount,
    });

    try {
      const orgId = user?.organizationId;
      const res = isOrgUser && orgId
        ? await risksService.getRisksByOrgRole(orgId)
        : await risksService.getRisks();

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
      setRisks([]);
    }
  }, [loadingState.retryCount]);

  useEffect(() => {
    refreshRisks();
  }, [refreshKey]);

  const filteredRisks = filterRisks(risks);

  const handleEditRisk = (risk: Risk) => {
    // Org users can only edit Draft risks from their organization
    if (isOrgUser && risk.status !== 'Draft') return;
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

      {/* EditRiskModal — used by org users for Draft risks */}
      {editModalOpen && selectedRiskForEdit && (
        <EditRiskModal
          isOpen={editModalOpen}
          onClose={() => { setEditModalOpen(false); setSelectedRiskForEdit(null); }}
          onSubmit={() => { setEditModalOpen(false); setSelectedRiskForEdit(null); refreshRisks(); }}
          riskId={selectedRiskForEdit._id}
          onUpdated={refreshRisks}
        />
      )}
    </div>
  );
};

export default MyRisksList;
