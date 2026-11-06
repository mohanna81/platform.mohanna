import React, { useEffect, useState } from 'react';
import { risksService, RiskAuditLogEntry, RiskAuditAction } from '@/lib/api/services/risks';

interface AuditableRisk {
  _id: string;
  title: string;
  createdAt?: string;
  createdBy?: { name?: string; email?: string };
}

interface RiskAuditModalProps {
  risk: AuditableRisk;
  onClose: () => void;
}

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// One color/icon/label per action type, in the same light-card style the
// modal already used for Created/Last Edited.
const ACTION_STYLE: Record<RiskAuditAction, { label: string; bg: string; iconBg: string; iconColor: string; text: string; icon: React.ReactNode }> = {
  Edited: {
    label: 'Risk Edited',
    bg: 'bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    text: 'text-amber-700',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  },
  MitigationUpdated: {
    label: 'Mitigation Updated',
    bg: 'bg-teal-50 border-teal-100',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    text: 'text-teal-700',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  },
  Approved: {
    label: 'Risk Approved',
    bg: 'bg-green-50 border-green-100',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    text: 'text-green-700',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
  },
  Rejected: {
    label: 'Risk Rejected',
    bg: 'bg-red-50 border-red-100',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    text: 'text-red-700',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
  },
  Closed: {
    label: 'Risk Closed',
    bg: 'bg-gray-50 border-gray-200',
    iconBg: 'bg-gray-200',
    iconColor: 'text-gray-500',
    text: 'text-gray-600',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
  },
  Triggered: {
    label: 'Risk Triggered',
    bg: 'bg-orange-50 border-orange-200',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    text: 'text-orange-700',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  },
  Deactivated: {
    label: 'Risk Deactivated',
    bg: 'bg-gray-50 border-gray-200',
    iconBg: 'bg-gray-200',
    iconColor: 'text-gray-500',
    text: 'text-gray-600',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />,
  },
};

const AuditEntryCard: React.FC<{ entry: RiskAuditLogEntry }> = ({ entry }) => {
  const style = ACTION_STYLE[entry.action] || ACTION_STYLE.Edited;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${style.bg}`}>
      <div className={`w-8 h-8 rounded-full ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
        <svg className={`w-4 h-4 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {style.icon}
        </svg>
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${style.text}`}>{style.label}</p>
        {entry.action === 'MitigationUpdated' && (
          <p className="text-sm text-gray-800 font-medium">
            {entry.fromValue || 'Not Started'} → {entry.toValue}
          </p>
        )}
        {entry.organization?.name && (
          <p className="text-xs text-gray-500">{entry.organization.name}</p>
        )}
        <p className="text-sm text-gray-800 font-medium">{entry.actor?.name || 'Unknown'}</p>
        {entry.actor?.email && <p className="text-xs text-gray-500">{entry.actor.email}</p>}
        <p className="text-xs text-gray-400 mt-1">{fmt(entry.createdAt)}</p>
      </div>
    </div>
  );
};

const RiskAuditModal: React.FC<RiskAuditModalProps> = ({ risk, onClose }) => {
  const [entries, setEntries] = useState<RiskAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    risksService.getRiskAuditLog(risk._id)
      .then((response) => {
        if (cancelled) return;
        if (response.data?.success && Array.isArray(response.data.data)) {
          setEntries(response.data.data);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [risk._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[85vh] flex flex-col"
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

        <div className="space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#2a9d8f] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {entries.map((entry) => (
                <AuditEntryCard key={entry._id} entry={entry} />
              ))}

              {/* Created -- always the oldest entry, shown last */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-0.5">Created</p>
                  <p className="text-sm text-gray-800 font-medium">{risk.createdBy?.name || 'Unknown'}</p>
                  {risk.createdBy?.email && <p className="text-xs text-gray-500">{risk.createdBy.email}</p>}
                  <p className="text-xs text-gray-400 mt-1">{fmt(risk.createdAt)}</p>
                </div>
              </div>

              {entries.length === 0 && (
                <p className="text-sm text-gray-400 italic text-center py-2">This risk has not been edited since it was created.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAuditModal;
