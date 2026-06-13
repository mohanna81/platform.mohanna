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
          {/* Created */}
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

          {/* Last edited */}
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusStyle: Record<string, { badge: string; card: string }> = {
  Rejected: { badge: 'bg-red-100 text-red-700 border border-red-200',    card: 'border-red-200 bg-red-50/30' },
  Approved: { badge: 'bg-green-100 text-green-700 border border-green-200', card: 'border-gray-200' },
  Pending:  { badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200', card: 'border-yellow-100' },
  Draft:    { badge: 'bg-gray-100 text-gray-500 border border-gray-200',  card: 'border-gray-200' },
};

const DetailRow = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{value}</p>
    </div>
  ) : null;

// ── Risk card ─────────────────────────────────────────────────────────────────
const RiskCard: React.FC<{ risk: Risk; onViewDetails: () => void; onEdit?: () => void; userRole?: string }> = ({ risk, onViewDetails, onEdit, userRole }) => {
  const [auditOpen, setAuditOpen] = useState(false);
  const styles = statusStyle[risk.status] || statusStyle.Draft;
  const canEdit = onEdit && (userRole === 'Organization User' || userRole === 'Facilitator');

  return (
    <>
      <div className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow mb-4 overflow-hidden ${styles.card}`}>

        {/* ── Card header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Title + code */}
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-gray-900 leading-snug">{risk.title}</h3>
              {risk.code && (
                <span className="shrink-0 text-[11px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                  {risk.code}
                </span>
              )}
            </div>
            {/* Status + consortium badges */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${styles.badge}`}>
                {risk.status}
              </span>
              {risk.consortium && Array.isArray(risk.consortium) && risk.consortium.length > 0 && (
                <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-0.5 rounded-full">
                  {getConsortiumNames(risk.consortium)}
                </span>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {risk.createdAt?.slice(0, 10)}
            </span>
            {risk.category && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                {risk.category}
              </span>
            )}
          </div>
        </div>

        {/* ── Card body ── */}
        <div className="px-6 py-4 space-y-4">
          <DetailRow label="Risk Statement" value={risk.statement} />
          <DetailRow label="Trigger Indicator" value={risk.triggerIndicator} />
          {(risk as unknown as { mitigationMeasures?: string }).mitigationMeasures && (
            <DetailRow label="Mitigation Measures" value={(risk as unknown as { mitigationMeasures?: string }).mitigationMeasures} />
          )}

          {/* Rejection reason banner */}
          {risk.status === 'Rejected' && risk.rejectionReason && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-red-500 mb-0.5">Rejection Reason</p>
                <p className="text-sm text-red-700 leading-relaxed">{risk.rejectionReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Card footer ── */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            title="View audit trail"
            onClick={() => setAuditOpen(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#2a9d8f] hover:bg-teal-50 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
          <button
            className="border border-gray-200 bg-white rounded-lg px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            onClick={onViewDetails}
          >
            View Details
          </button>
          {canEdit && (
            <button
              className="bg-[#FBBF77] hover:bg-[#f9b15c] text-[#0b1320] rounded-lg px-4 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              onClick={onEdit}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              {risk.status === 'Rejected' ? 'Edit & Re-submit' : 'Edit'}
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
  const [newRiskEditOpen, setNewRiskEditOpen] = useState(false); // for Draft/Rejected via NewRiskModal
  const { user } = useAuth();
  const isOrgUser = user?.role === 'Organization User';

  const filterRisks = useCallback((risks: Risk[]) => {
    // Apply status filter
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
      const isOrgUser = user?.role === 'Organization User';
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
    if (isOrgUser) {
      setEditModalOpen(true);
    } else {
      // Facilitators use NewRiskModal
      setNewRiskEditOpen(true);
    }
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

      {/* EditRiskModal — used by org users for all statuses */}
      {editModalOpen && selectedRiskForEdit && (
        <EditRiskModal
          isOpen={editModalOpen}
          onClose={() => { setEditModalOpen(false); setSelectedRiskForEdit(null); }}
          onSubmit={() => { setEditModalOpen(false); setSelectedRiskForEdit(null); refreshRisks(); }}
          riskId={selectedRiskForEdit._id}
          onUpdated={refreshRisks}
        />
      )}

      {/* NewRiskModal — used by facilitators for Draft/Rejected */}
      <NewRiskModal
        isOpen={newRiskEditOpen}
        onClose={() => { setNewRiskEditOpen(false); setSelectedRiskForEdit(null); }}
        editMode={true}
        riskId={selectedRiskForEdit?._id || ''}
        onUpdated={refreshRisks}
      />
    </div>
  );
};

export default MyRisksList; 