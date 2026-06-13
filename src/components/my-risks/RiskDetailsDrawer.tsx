import React, { useState } from 'react';
import Button from '../common/Button';
import { risksService } from '@/lib/api/services/risks';
import NewRiskModal from './NewRiskModal';
import { useAuth } from '@/lib/auth/AuthContext';

interface Risk {
  _id: string;
  title: string;
  code: string;
  createdAt: string;
  statement: string;
  triggerIndicator: string;
  mitigationMeasures: string;
  preventiveMeasures?: string;
  reactiveMeasures?: string;
  category: string;
  status: string;
  likelihood?: string;
  severity?: string;
  rejectionReason?: string;
}

const statusStyle: Record<string, string> = {
  Rejected: 'bg-red-100 text-red-700 border border-red-200',
  Approved: 'bg-green-100 text-green-700 border border-green-200',
  Pending:  'bg-yellow-100 text-yellow-700 border border-yellow-200',
  Draft:    'bg-gray-100 text-gray-500 border border-gray-200',
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{title}</p>
    {children}
  </div>
);

const BodyText = ({ value }: { value?: string }) =>
  value ? <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{value}</p> : <p className="text-sm text-gray-400 italic">—</p>;

const RiskDetailsDrawer = ({ open, onClose, risk, onUpdated }: {
  open: boolean;
  onClose: () => void;
  risk: Risk | null;
  onUpdated?: () => void;
}) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleSubmitForReview = async () => {
    if (!risk?._id) return;
    setSubmitting(true);
    await risksService.updateRisk(risk._id, { status: 'Pending' });
    setSubmitting(false);
    onClose();
    if (onUpdated) onUpdated();
  };

  const isDraft    = risk?.status === 'Draft';
  const isRejected = risk?.status === 'Rejected';
  const isOrgUser  = user?.role === 'Organization User';
  const showFooter = isDraft || (isRejected && isOrgUser);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${open ? 'pointer-events-auto bg-black/20 backdrop-blur-sm' : 'pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full max-w-lg h-full shadow-2xl transform transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Drawer header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900 leading-snug">{risk?.title}</h2>
              {risk?.code && (
                <span className="text-[11px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md shrink-0">
                  {risk.code}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Status + meta */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusStyle[risk?.status || 'Draft'] || statusStyle.Draft}`}>
              {risk?.status}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Created {risk?.createdAt?.slice(0, 10)}
            </span>
            {risk?.category && (
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                {risk.category}
              </span>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className={`flex-1 overflow-y-auto px-6 py-5 space-y-6 ${showFooter ? 'pb-32' : 'pb-6'}`}>

          {/* Risk statement */}
          <Section title="Risk Statement">
            <BodyText value={risk?.statement} />
          </Section>

          <div className="h-px bg-gray-100" />

          {/* Trigger indicator */}
          <Section title="Trigger Indicator">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <BodyText value={risk?.triggerIndicator} />
            </div>
          </Section>

          <div className="h-px bg-gray-100" />

          {/* Mitigation measures */}
          <Section title="Mitigation Measures">
            <BodyText value={risk?.mitigationMeasures} />
          </Section>

          {/* Preventive measures */}
          {risk?.preventiveMeasures && (
            <>
              <div className="h-px bg-gray-100" />
              <Section title="Preventive Measures">
                <BodyText value={risk.preventiveMeasures} />
              </Section>
            </>
          )}

          {/* Reactive measures */}
          {risk?.reactiveMeasures && (
            <>
              <div className="h-px bg-gray-100" />
              <Section title="Reactive Measures">
                <BodyText value={risk.reactiveMeasures} />
              </Section>
            </>
          )}

          <div className="h-px bg-gray-100" />

          {/* Likelihood + severity */}
          {(risk?.likelihood || risk?.severity) && (
            <div className="grid grid-cols-2 gap-4">
              {risk.likelihood && (
                <Section title="Likelihood">
                  <span className="inline-block text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg">
                    {risk.likelihood}
                  </span>
                </Section>
              )}
              {risk.severity && (
                <Section title="Severity">
                  <span className="inline-block text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100 px-2.5 py-1 rounded-lg">
                    {risk.severity}
                  </span>
                </Section>
              )}
            </div>
          )}

          {/* Rejection reason */}
          {isRejected && risk?.rejectionReason && (
            <>
              <div className="h-px bg-gray-100" />
              <Section title="Rejection Reason">
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-sm text-red-700 leading-relaxed">{risk.rejectionReason}</p>
                </div>
              </Section>
            </>
          )}

          <p className="text-[11px] text-gray-400 text-center pt-2">
            This risk is only visible to your organization.
          </p>
        </div>

        {/* ── Footer actions ── */}
        {showFooter && (
          <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
            {isDraft ? (
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-[#FBBF77] hover:bg-[#f9b15c] text-[#0b1320] font-semibold py-2.5 rounded-xl transition"
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit for Review'}
                </Button>
                {isOrgUser && (
                  <Button
                    className="w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                    type="button"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                  </Button>
                )}
              </div>
            ) : (
              isRejected && isOrgUser && (
                <Button
                  className="w-full bg-[#FBBF77] hover:bg-[#f9b15c] text-[#0b1320] font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit & Re-submit
                </Button>
              )
            )}
          </div>
        )}
      </div>

      <NewRiskModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editMode={true}
        riskId={risk?._id || ''}
        onUpdated={onUpdated}
      />
    </div>
  );
};

export default RiskDetailsDrawer;
