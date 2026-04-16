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
  /** If false, render read-only (e.g. for Facilitator viewing) */
  canUpdate?: boolean;
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

      {/* Measure rows */}
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
    </div>
  );
};

export default MitigationTracker;
