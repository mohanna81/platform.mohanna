'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { mitigationTrackingService, TrackingStatus, MitigationTracking } from '@/lib/api/services/mitigationTracking';
import { showToast } from '@/lib/utils/toast';
import { useAuth } from '@/lib/auth/AuthContext';

interface OrgRoleEntry {
  organization: { _id: string; name: string };
  role: string;
}

interface MitigationTrackerProps {
  riskId: string;
  riskTitle: string;
  mitigationMeasures?: string;
  orgRoles?: OrgRoleEntry[];
  organizationId?: string;
  consortiumId?: string;
  canUpdate?: boolean;
  isFacilitator?: boolean;
}

const STATUS_OPTIONS: { value: TrackingStatus; label: string; color: string; dot: string }[] = [
  { value: 'Not Started', label: 'Not Started', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  { value: 'In Progress', label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { value: 'Applied', label: 'Applied', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
];

const MitigationTracker: React.FC<MitigationTrackerProps> = ({
  riskId,
  mitigationMeasures,
  orgRoles = [],
  organizationId,
  consortiumId,
  canUpdate = false,
  isFacilitator = false,
}) => {
  const { user } = useAuth();
  const [trackingData, setTrackingData] = useState<MitigationTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTracking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mitigationTrackingService.getTrackingByRisk(riskId);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setTrackingData(res.data.data);
      }
    } catch (err) {
      console.error('[MitigationTracker] fetchTracking failed:', err);
    } finally {
      setLoading(false);
    }
  }, [riskId]);

  useEffect(() => { fetchTracking(); }, [fetchTracking]);

  if (!mitigationMeasures?.trim()) return null;

  const getStatusForOrg = (orgId: string): TrackingStatus => {
    const entry = trackingData
      .filter(t => t.measureIndex === 0 && t.measureType === 'Mitigation' && t.organization?._id === orgId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    return entry?.status ?? 'Not Started';
  };

  const handleStatusChange = async (status: TrackingStatus) => {
    const orgId = organizationId || user?.organizationId;
    if (!orgId) { showToast.error('Organization information is missing.'); return; }
    if (!consortiumId) { showToast.error('Consortium information is missing.'); return; }
    setSaving(true);
    let success = false;
    try {
      await mitigationTrackingService.upsertTracking({ riskId, organizationId: orgId, consortiumId, measureIndex: 0, status });
      showToast.success(`Role status updated to "${status}"`);
      success = true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast.error(msg || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
    if (success) await fetchTracking();
  };

  const handleStatusChangeForOrg = async (status: TrackingStatus, orgId: string, resolvedConsortiumId?: string) => {
    if (!orgId) { showToast.error('Organization information is missing.'); return; }
    const cId = resolvedConsortiumId || consortiumId || '';
    setSaving(true);
    let success = false;
    try {
      await mitigationTrackingService.upsertTracking({ riskId, organizationId: orgId, consortiumId: cId, measureIndex: 0, status });
      showToast.success(`Role status updated to "${status}"`);
      success = true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast.error(msg || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
    if (success) {
      const refreshed = await mitigationTrackingService.getTrackingByRisk(riskId);
      setTrackingData(refreshed.data?.data ?? []);
    }
  };

  // Resolve consortium ID from tracking record
  const getResolvedConsortiumId = (orgId: string): string | undefined => {
    const record = trackingData.find(t => t.organization?._id === orgId && t.measureIndex === 0);
    const cId = record?.consortium as unknown as { _id?: string } | string | undefined;
    return (typeof cId === 'object' ? cId?._id : cId) || consortiumId;
  };

  // Build org role list — for facilitator: all orgRoles; for org user: their own role
  const myOrgId = organizationId || user?.organizationId;
  const myOrgRole = orgRoles.find(r => r.organization?._id === myOrgId);

  // Summary: count role completion across orgs (from tracking data)
  const trackedOrgIds = isFacilitator
    ? orgRoles.map(r => r.organization._id)
    : (myOrgId ? [myOrgId] : []);

  const allStatuses = trackedOrgIds.map(id => getStatusForOrg(id));
  const applied = allStatuses.filter(s => s === 'Applied').length;
  const inProgress = allStatuses.filter(s => s === 'In Progress').length;
  const notStarted = allStatuses.filter(s => s === 'Not Started').length;
  const total = trackedOrgIds.length;

  return (
    <div className="mt-4 rounded-2xl border border-[#2a9d8f]/20 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 bg-[#2a9d8f]/5 border-b border-[#2a9d8f]/15">
        <svg className="w-4 h-4 text-[#2a9d8f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h4 className="text-sm font-semibold text-[#1a6b61]">Organization Role Tracking</h4>
        {loading
          ? <div className="ml-auto w-3.5 h-3.5 border-2 border-[#2a9d8f] border-t-transparent rounded-full animate-spin" />
          : total > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">{applied}/{total} completed</span>
              {applied > 0 && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{applied} Applied</span>}
              {inProgress > 0 && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{inProgress} In Progress</span>}
              {notStarted > 0 && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{notStarted} Not Started</span>}
            </div>
          )
        }
      </div>

      {/* Mitigation measure text */}
      <div className="px-5 py-3 border-b border-gray-100 bg-green-50/40">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Mitigation Measure</p>
        <p className="text-sm text-gray-700 leading-relaxed">{mitigationMeasures}</p>
      </div>

      {/* Org user view — show their own role + status */}
      {!isFacilitator && (
        <div className="p-4">
          {myOrgRole ? (
            <OrgRoleRow
              orgName={myOrgRole.organization.name}
              role={myOrgRole.role}
              status={getStatusForOrg(myOrgRole.organization._id)}
              canUpdate={canUpdate}
              saving={saving}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">No role assigned to your organization for this risk.</p>
          )}
        </div>
      )}

      {/* Facilitator view — all orgs with their roles */}
      {isFacilitator && (
        <div className="p-4 space-y-3">
          {orgRoles.length === 0 && !loading && (
            <p className="text-sm text-gray-500 text-center py-2">No organization roles defined for this risk yet.</p>
          )}
          {orgRoles.map((orgRole) => {
            const orgId = orgRole.organization._id;
            const status = getStatusForOrg(orgId);
            const resolvedCId = getResolvedConsortiumId(orgId);
            return (
              <OrgRoleRow
                key={orgId}
                orgName={orgRole.organization.name}
                role={orgRole.role}
                status={status}
                canUpdate={true}
                saving={saving}
                onStatusChange={(s) => handleStatusChangeForOrg(s, orgId, resolvedCId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

interface OrgRoleRowProps {
  orgName: string;
  role: string;
  status: TrackingStatus;
  canUpdate: boolean;
  saving: boolean;
  onStatusChange: (status: TrackingStatus) => void;
}

const OrgRoleRow: React.FC<OrgRoleRowProps> = ({ orgName, role, status, canUpdate, saving, onStatusChange }) => {
  const current = STATUS_OPTIONS.find(s => s.value === status) ?? STATUS_OPTIONS[0];
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
      {/* Org name + status badge */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
          </svg>
          <span className="text-xs font-semibold text-gray-700 truncate">{orgName}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${current.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
          {current.label}
        </span>
      </div>
      {/* Role text */}
      {role ? (
        <p className="text-sm text-gray-600 leading-relaxed mb-3 pl-5">{role}</p>
      ) : (
        <p className="text-xs text-gray-400 italic mb-3 pl-5">No role defined</p>
      )}
      {/* Update buttons */}
      {canUpdate && (
        <div className="flex items-center gap-2 flex-wrap pl-5">
          <span className="text-xs text-gray-400">Update role status:</span>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              disabled={saving || status === opt.value}
              onClick={() => onStatusChange(opt.value)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                ${status === opt.value
                  ? `${opt.color} cursor-default`
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MitigationTracker;
