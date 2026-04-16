'use client';

import React from 'react';
import { TrackingStats } from '@/lib/api/services/mitigationTracking';

interface MitigationProgressCardProps {
  stats: TrackingStats | null;
  loading?: boolean;
}

const StatPill = ({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) => (
  <div className={`flex flex-col items-center justify-center rounded-xl p-4 ${color} min-w-0`}>
    <span className="text-2xl font-bold tabular-nums">{count}</span>
    <span className="text-xs font-medium mt-0.5 text-center leading-tight">{label}</span>
  </div>
);

const SkeletonBar = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-5 bg-gray-200 rounded w-1/3" />
    <div className="h-3 bg-gray-200 rounded w-full" />
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 bg-gray-200 rounded-xl" />
      ))}
    </div>
  </div>
);

export default function MitigationProgressCard({ stats, loading }: MitigationProgressCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <SkeletonBar />
      </div>
    );
  }

  const s = stats?.summary ?? { total: 0, applied: 0, inProgress: 0, notStarted: 0, progressPercent: 0 };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Mitigation Implementation Progress</h3>
          <p className="text-xs text-gray-500 mt-0.5">Real-time tracking across all organisations</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-[#2a9d8f]/10 text-[#1a6b61] text-xs font-semibold px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2a9d8f] inline-block" />
          Live
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-600">Overall completion</span>
          <span className="text-sm font-bold text-[#2a9d8f]">{s.progressPercent}%</span>
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${s.progressPercent}%`,
              background: 'linear-gradient(90deg, #2a9d8f 0%, #38c9b6 100%)',
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {s.applied} of {s.total} measures applied
        </p>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill
          label="Applied"
          count={s.applied}
          color="bg-emerald-50 text-emerald-700"
        />
        <StatPill
          label="In Progress"
          count={s.inProgress}
          color="bg-amber-50 text-amber-700"
        />
        <StatPill
          label="Not Started"
          count={s.notStarted}
          color="bg-gray-50 text-gray-600"
        />
      </div>

      {/* Per-type breakdown (if data available) */}
      {stats && stats.byMeasureType.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Measure Type</p>
          {(['Mitigation', 'Preventive', 'Reactive'] as const).map(type => {
            const typeEntries = stats.byMeasureType.filter(e => e._id.measureType === type);
            const applied = typeEntries.find(e => e._id.status === 'Applied')?.count ?? 0;
            const inProgress = typeEntries.find(e => e._id.status === 'In Progress')?.count ?? 0;
            const notStarted = typeEntries.find(e => e._id.status === 'Not Started')?.count ?? 0;
            const typeTotal = applied + inProgress + notStarted;
            const pct = typeTotal > 0 ? Math.round((applied / typeTotal) * 100) : 0;
            if (typeTotal === 0) return null;
            return (
              <div key={type} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-20 flex-shrink-0">{type}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2a9d8f] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500 w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
