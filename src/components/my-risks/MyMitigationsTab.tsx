'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { risksService, Risk } from '@/lib/api/services/risks';
import { actionItemsService } from '@/lib/api/services/actionitems';
import MitigationTracker from '@/components/risk-review/MitigationTracker';
import Dropdown from '@/components/common/Dropdown';

const getEntityId = (v: unknown): string => {
  if (!v) return '';
  return typeof v === 'object' ? String((v as { _id?: string })._id || '') : String(v);
};

const ORG_FILTER_OPTIONS = [
  { value: 'all', label: 'All Organizations' },
  { value: 'mine', label: 'My Organization' },
];

export default function MyMitigationsTab({
  targetRiskId,
  targetMeasure,
}: {
  targetRiskId?: string | null;
  targetMeasure?: number | null;
} = {}) {
  const { user } = useAuth();
  const isFacilitator = user?.role === 'Facilitator';
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [orgFilter, setOrgFilter] = useState<'all' | 'mine'>('all');
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);
  const [assignedRiskIds, setAssignedRiskIds] = useState<Set<string> | null>(null);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const highlightedCardRef = useRef<HTMLDivElement | null>(null);

  const touchesOwnOrg = useCallback((risk: Risk) => {
    const orgId = user?.organizationId;
    const result = orgId
      ? (risk.orgRoles || []).some(r => String(r.organization?._id || (r.organization as unknown as string)) === String(orgId))
      : false;
    // TEMP DEBUG — remove after diagnosing the "My Organization" filter bug
    console.debug('[touchesOwnOrg]', {
      riskId: risk._id,
      riskTitle: risk.title,
      myOrgId: orgId,
      riskOrgRoleIds: (risk.orgRoles || []).map(r => r.organization?._id || r.organization),
      result,
    });
    return result;
  }, [user?.organizationId]);

  const fetchApprovedRisks = useCallback(async () => {
    setLoading(true);
    try {
      if (isFacilitator) {
        // Facilitators oversee every organization in their consortia, so
        // they see every approved risk with mitigation measures — but risks
        // touching their own organization (they also belong to one, same as
        // an Organization User) are sorted first since that's the org
        // they're most likely acting on.
        const res = await risksService.getRisksByStatus('Approved');
        const all: Risk[] = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? (res.data as unknown as Risk[])
          : [];
        const withMeasures = all.filter(risk => !!risk.mitigationMeasures?.trim());

        const orgId = user?.organizationId;
        const sorted = orgId
          ? [...withMeasures].sort((a, b) => Number(touchesOwnOrg(b)) - Number(touchesOwnOrg(a)))
          : withMeasures;

        setRisks(sorted);
        return;
      }

      const orgId = user?.organizationId;
      if (!orgId) { setLoading(false); return; }

      // Fetch all risks assigned to this org via orgRoles
      const res = await risksService.getRisksByOrgRole(orgId);
      const all: Risk[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? (res.data as unknown as Risk[])
        : [];

      // Keep only approved risks that have at least one measure assigned to this org
      const mine = all.filter(risk => {
        if (risk.status !== 'Approved') return false;
        return (risk.orgRoles || []).some(r => {
          const rId = r.organization?._id || (r.organization as unknown as string);
          if (String(rId) !== String(orgId)) return false;
          const measures = (r as unknown as { measures?: string[] }).measures?.filter(m => m?.trim()) || [];
          return measures.length > 0 || r.role?.trim();
        });
      });

      setRisks(mine);
    } catch (err) {
      console.error('[MyMitigationsTab] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId, isFacilitator, touchesOwnOrg]);

  useEffect(() => { fetchApprovedRisks(); }, [fetchApprovedRisks]);

  // Risks that have an Action Item assigned directly to this user (as opposed
  // to just touching their organization broadly). Fetched lazily the first
  // time the "My Mitigation" checkbox is turned on, then cached.
  const fetchAssignedRiskIds = useCallback(async () => {
    if (!user?.id) return;
    setLoadingAssigned(true);
    try {
      const res = await actionItemsService.getActionItems();
      const items = Array.isArray(res.data?.data) ? res.data.data : [];
      const ids = new Set<string>();
      items.forEach(item => {
        const isAssignedToMe =
          (item.assignToModel === 'User' && getEntityId(item.assignTo) === user.id) ||
          getEntityId(item.assignToUser) === user.id;
        if (!isAssignedToMe) return;
        if (item.relatedRisk) ids.add(getEntityId(item.relatedRisk));
        (item.relatedRisks || []).forEach(r => ids.add(getEntityId(r)));
      });
      setAssignedRiskIds(ids);
    } catch (err) {
      console.error('[MyMitigationsTab] fetch assigned action items failed:', err);
    } finally {
      setLoadingAssigned(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (assignedToMeOnly && assignedRiskIds === null) fetchAssignedRiskIds();
  }, [assignedToMeOnly, assignedRiskIds, fetchAssignedRiskIds]);

  // TEMP DEBUG — remove after diagnosing the "My Organization" filter bug
  useEffect(() => {
    console.debug('[MyMitigationsTab] user', { id: user?.id, role: user?.role, organizationId: user?.organizationId });
  }, [user]);

  // Facilitators can narrow the (consortium-wide) list down to just the
  // organization they belong to; other roles already only ever see their
  // own org's risks, so the filter has nothing to do for them.
  const displayedRisks = useMemo(() => {
    let result = risks;
    if (isFacilitator && orgFilter === 'mine') result = result.filter(touchesOwnOrg);
    if (assignedToMeOnly) result = result.filter(r => (assignedRiskIds ?? new Set()).has(r._id));
    return result;
  }, [risks, isFacilitator, orgFilter, touchesOwnOrg, assignedToMeOnly, assignedRiskIds]);

  // Auto-expand and scroll to the risk referenced by a notification deep link
  useEffect(() => {
    if (!targetRiskId || risks.length === 0) return;
    const match = risks.some(r => r._id === targetRiskId);
    if (!match) return;
    setExpandedRisk(targetRiskId);
  }, [targetRiskId, risks]);

  useEffect(() => {
    if (!targetRiskId || expandedRisk !== targetRiskId) return;
    const timer = setTimeout(() => {
      highlightedCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    return () => clearTimeout(timer);
  }, [targetRiskId, expandedRisk]);

  // Derive consortiumId for a risk
  const getConsortiumId = (risk: Risk): string => {
    const c = (risk.consortium || [])[0];
    if (!c) return '';
    return typeof c === 'object' ? (c as unknown as { _id?: string })._id || '' : String(c);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-8 h-8 border-2 border-[#2a9d8f] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading mitigations…</span>
        </div>
      </div>
    );
  }

  const orgFilterDropdown = isFacilitator && risks.length > 0 && (
    <Dropdown
      options={ORG_FILTER_OPTIONS}
      value={orgFilter}
      onChange={value => setOrgFilter(value as 'all' | 'mine')}
      size="sm"
      className="w-full sm:w-auto sm:min-w-[180px] bg-white"
    />
  );

  const assignedToMeCheckbox = risks.length > 0 && (
    <label className="flex items-center gap-2 text-sm text-gray-600 select-none cursor-pointer whitespace-nowrap">
      <input
        type="checkbox"
        checked={assignedToMeOnly}
        onChange={e => setAssignedToMeOnly(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-[#2a9d8f] focus:ring-[#2a9d8f] cursor-pointer"
      />
      My Mitigation
      {loadingAssigned && (
        <span className="w-3 h-3 border-2 border-[#2a9d8f] border-t-transparent rounded-full animate-spin" />
      )}
    </label>
  );

  if (risks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">No mitigation measures assigned yet</p>
        <p className="text-gray-400 text-sm mt-1">
          {isFacilitator
            ? 'Approved risks with mitigation measures will appear here.'
            : 'Approved risks with measures assigned to your organization will appear here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500">
          {displayedRisks.length} approved risk{displayedRisks.length !== 1 ? 's' : ''} with mitigation measures
          {assignedToMeOnly
            ? ' assigned directly to you.'
            : isFacilitator
            ? orgFilter === 'mine' ? ' assigned to your organization.' : '.'
            : ' assigned to your organization.'}
        </p>
        <div className="flex items-center gap-3">
          {assignedToMeCheckbox}
          {orgFilterDropdown}
        </div>
      </div>

      {displayedRisks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-600 font-medium">
            {assignedToMeOnly ? 'No mitigation measures assigned directly to you' : 'No mitigation measures for your organization'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {assignedToMeOnly
              ? 'Uncheck "My Mitigation" to see measures assigned to your organization.'
              : 'Switch to "All Organizations" to see the full list.'}
          </p>
        </div>
      )}

      {displayedRisks.map(risk => {
        const isExpanded = expandedRisk === risk._id;
        const isTarget = targetRiskId === risk._id;
        const consortiumId = getConsortiumId(risk);
        const orgRoles = (risk.orgRoles || []) as unknown as Array<{
          organization: { _id: string; name: string };
          role?: string;
          measures?: string[];
        }>;

        return (
          <div
            key={risk._id}
            ref={isTarget ? highlightedCardRef : undefined}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-shadow ${
              isTarget ? 'border-[#2a9d8f] ring-2 ring-[#2a9d8f]/40' : 'border-gray-200'
            }`}
          >
            {/* Risk header — click to expand */}
            <button
              type="button"
              className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedRisk(isExpanded ? null : risk._id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-base font-semibold text-gray-900 leading-snug">{risk.title}</span>
                  {risk.triggerStatus === 'Triggered' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                      TRIGGERED
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="capitalize">{risk.category?.replace('_', ' / ')}</span>
                  {risk.consortium?.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{(risk.consortium as unknown as Array<{name?: string}>).map(c => c.name).filter(Boolean).join(', ')}</span>
                    </>
                  )}
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded: mitigation tracker */}
            {isExpanded && (
              <div className="px-5 pb-5 border-t border-gray-100">
                {risk.mitigationMeasures?.trim() && (
                  <div className="mt-4 bg-green-50/60 border border-green-100 rounded-xl p-4 mb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Mitigation Measure</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{risk.mitigationMeasures}</p>
                  </div>
                )}
                <MitigationTracker
                  riskId={risk._id}
                  riskTitle={risk.title}
                  mitigationMeasures={risk.mitigationMeasures}
                  orgRoles={orgRoles}
                  organizationId={isFacilitator ? undefined : user?.organizationId}
                  consortiumId={consortiumId}
                  canUpdate={true}
                  isFacilitator={isFacilitator}
                  highlightMeasureIndex={isTarget ? targetMeasure ?? null : null}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
