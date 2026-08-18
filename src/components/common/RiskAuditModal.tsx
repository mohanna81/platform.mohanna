import React from 'react';

interface AuditableRisk {
  title: string;
  createdAt?: string;
  createdBy?: { name?: string; email?: string };
  lastEditedBy?: { name?: string; email?: string };
  updatedAt?: string;
}

interface RiskAuditModalProps {
  risk: AuditableRisk;
  onClose: () => void;
}

const RiskAuditModal: React.FC<RiskAuditModalProps> = ({ risk, onClose }) => {
  const { createdBy, lastEditedBy, updatedAt } = risk;
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

export default RiskAuditModal;
