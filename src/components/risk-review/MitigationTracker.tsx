'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { mitigationTrackingService, MeasureType, TrackingStatus, MitigationTracking } from '@/lib/api/services/mitigationTracking';
import { showToast } from '@/lib/utils/toast';
import { useAuth } from '@/lib/auth/AuthContext';

interface MitigationTrackerProps {
  riskId: string;
  riskTitle: string;
  mitigationMeasures?: string;
  preventiveMeasures?: string;
  reactiveMeasures?: string;
  /** The organization ID that should be able to update status */
  organizationId?: string;
  /** The consortium the risk belongs to */
  consortiumId?: string;
  /** If false, render read-only */
  canUpdate?: boolean;
  /** When true, shows all orgs' statuses with per-org editing (Facilitator view) */
  isFacilitator?: boolean;
}

const STATUS_OPTIONS: { value: TrackingStatus; label: string; color: string; dot: string }[] = [
  { value: 'Not Started', label: 'Not Started', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  { value: 'In Progress', label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { value: 'Applied', label: 'Applied', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
];

const MEASURE_LABELS: Record<MeasureType, string> = {
  Mitigation: 'Mitigation Measures',
  Preventive: 'Preventive Measures',
  Reactive: 'Reactive Measures',
};

interface MeasureRowProps {
  type: MeasureType;
  text: string;
  currentStatus: TrackingStatus;
  onStatusChange: (type: MeasureType, status: TrackingStatus) => void;
  saving: boolean;
  canUpdate: boolean;
}

const MeasureRow: React.FC<MeasureRowProps> = ({ type, text, currentStatus, onStatusChange, saving, canUpdate }) => {
  const current = STATUS_OPTIONS.find(s => s.value === currentStatus) ?? STATUS_OPTIONS[0];

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{MEASURE_LABELS[type]}</span>
          <p className="text-sm text-gray-700 mt-1 leading-relaxed line-clamp-3">{text}</p>
        </div>
        {/* Current status badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${current.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
          {current.label}
        </span>
      </div>

      {canUpdate && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">Update status:</span>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              disabled={saving || currentStatus === opt.value}
              onClick={() => onStatusChange(type, opt.value)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                ${currentStatus === opt.value
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

const MitigationTracker: React.FC<MitigationTrackerProps> = ({
  riskId,
  riskTitle,
  mitigationMeasures,
  preventiveMeasures,
  reactiveMeasures,
  organizationId,
  consortiumId,
  canUpdate = false,
  isFacilitator = false,
}) => {
  const { user } = useAuth();
  // Organisation users have role 'Organization User' in this system
  const [trackingData, setTrackingData] = useState<MitigationTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const measures: { type: MeasureType; text: string }[] = [
    mitigationMeasures ? { type: 'Mitigation', text: mitigationMeasures } : null,
    preventiveMeasures ? { type: 'Preventive', text: preventiveMeasures } : null,
    reactiveMeasures ? { type: 'Reactive', text: reactiveMeasures } : null,
  ].filter(Boolean) as { type: MeasureType; text: string }[];

  const fetchTracking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mitigationTrackingService.getTrackingByRisk(riskId);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setTrackingData(res.data.data);
      }
    } catch {
      // Silently handle — tracking may not exist yet
    } finally {
      setLoading(false);
    }
  }, [riskId]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  const getStatus = (type: MeasureType): TrackingStatus => {
    const orgId = organizationId || user?.organizationId;
    const entry = trackingData.find(
      t => t.measureType === type && (orgId ? t.organization?._id === orgId : true)
    );
    return entry?.status ?? 'Not Started';
  };

  const handleStatusChange = async (type: MeasureType, status: TrackingStatus) => {
    const orgId = organizationId || user?.organizationId;
    const consId = consortiumId;

    if (!orgId || !consId) {
      showToast.error('Organization or consortium information is missing.');
      return;
    }

    setSaving(true);
    try {
      await mitigationTrackingService.upsertTracking({
        riskId,
        organizationId: orgId,
        consortiumId: consId,
        measureType: type,
        status,
      });
      showToast.success(`${MEASURE_LABELS[type]} marked as "${status}"`);
      await fetchTracking();
    } catch {
      showToast.error('Failed to update tracking status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChangeForOrg = async (type: MeasureType, status: TrackingStatus, orgId: string) => {
    if (!orgId || !consortiumId) {
      showToast.error('Consortium information is missing.');
      return;
    }
    setSaving(true);
    try {
      await mitigationTrackingService.upsertTracking({
        riskId,
        organizationId: orgId,
        consortiumId,
        measureType: type,
        status,
      });
      showToast.success(`${MEASURE_LABELS[type]} for org marked as "${status}"`);
      await fetchTracking();
    } catch {
      showToast.error('Failed to update tracking status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // For facilitator view: group tracking data by organization
  const orgGroups: Map<string, { name: string; records: MitigationTracking[] }> = new Map();
  if (isFacilitator) {
    for (const record of trackingData) {
      const orgId = record.organization?._id ?? '';
      const orgName = record.organization?.name ?? 'Unknown Organization';
      if (!orgId) continue;
      if (!orgGroups.has(orgId)) orgGroups.set(orgId, { name: orgName, records: [] });
      orgGroups.get(orgId)!.records.push(record);
    }
  }

  if (measures.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-[#2a9d8f]/20 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 bg-[#2a9d8f]/5 border-b border-[#2a9d8f]/15">
        <svg className="w-4 h-4 text-[#2a9d8f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h4 className="text-sm font-semibold text-[#1a6b61]">Mitigation Measures Tracking</h4>
        {loading && (
          <div className="ml-auto w-3.5 h-3.5 border-2 border-[#2a9d8f] border-t-transparent rounded-full animate-spin" />
        )}
        {!loading && (
          <div className="ml-auto flex items-center gap-2">
            {/* mini legend */}
            {['Applied', 'In Progress', 'Not Started'].map(s => {
              const count = measures.filter(m => getStatus(m.type) === s).length;
              if (count === 0) return null;
              const colors: Record<string, string> = {
                'Applied': 'bg-emerald-100 text-emerald-700',
                'In Progress': 'bg-amber-100 text-amber-700',
                'Not Started': 'bg-gray-100 text-gray-500',
              };
              return (
                <span key={s} className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[s]}`}>
                  {count} {s}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Measure rows — org user view */}
      {!isFacilitator && (
        <div className="p-4 space-y-3">
          {measures.map(({ type, text }) => (
            <MeasureRow
              key={type}
              type={type}
              text={text}
              currentStatus={getStatus(type)}
              onStatusChange={handleStatusChange}
              saving={saving}
              canUpdate={canUpdate}
            />
          ))}
        </div>
      )}

      {/* Facilitator view — per-org breakdown */}
      {isFacilitator && (
        <div className="p-4 space-y-4">
          {orgGroups.size === 0 && !loading && (
            <p className="text-sm text-gray-500 text-center py-2">No tracking records found for this risk yet.</p>
          )}
          {Array.from(orgGroups.entries()).map(([orgId, { name, records }]) => (
            <div key={orgId} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
                </svg>
                <span className="text-xs font-semibold text-gray-700">{name}</span>
              </div>
              <div className="p-3 space-y-2">
                {measures.map(({ type, text }) => {
                  const record = records.find(r => r.measureType === type);
                  const currentStatus: TrackingStatus = record?.status ?? 'Not Started';
                  const current = STATUS_OPTIONS.find(s => s.value === currentStatus) ?? STATUS_OPTIONS[0];
                  return (
                    <div key={type} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-medium text-gray-600 w-28 flex-shrink-0">{MEASURE_LABELS[type]}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${current.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
                          {current.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            disabled={saving || currentStatus === opt.value}
                            onClick={() => handleStatusChangeForOrg(type, opt.value, orgId)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all
                              ${currentStatus === opt.value
                                ? `${opt.color} cursor-default`
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MitigationTracker;
