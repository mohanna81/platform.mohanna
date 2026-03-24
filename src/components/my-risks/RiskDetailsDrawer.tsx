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
  category: string;
  status: string;
  rejectionReason?: string;
}

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

  const handleEditRisk = () => {
    setEditModalOpen(true);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-all duration-500 ${open ? 'pointer-events-auto bg-black/10 backdrop-blur-sm' : 'pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full max-w-md h-full shadow-xl transform transition-transform duration-500 ${open ? 'translate-x-0' : 'translate-x-full'} flex flex-col relative`}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{risk?.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">ID:</span> {risk?.code} &bull; <span className="font-medium">Created:</span> {risk?.createdAt?.slice(0, 10)}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 pb-32">
          <div className="mb-4">
            <div className="font-semibold text-gray-900 mb-1">Risk Statement</div>
            <div className="text-gray-800">{risk?.statement}</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-900 mb-1">Trigger Indicator</div>
            <div className="text-gray-800">{risk?.triggerIndicator}</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-900 mb-1">Mitigation Measures</div>
            <div className="text-gray-800">{risk?.mitigationMeasures}</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-900 mb-1">Category</div>
            <div className="text-gray-800">{risk?.category}</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-900 mb-1">Status Information</div>
            <div className="text-gray-800">Submitted: {risk?.createdAt?.slice(0, 10)}</div>
            <div className="text-gray-800">Current Status: {risk?.status}</div>
            {risk?.status === 'Rejected' && risk?.rejectionReason && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                <div className="font-semibold text-red-800 mb-1">Rejection Reason:</div>
                <div className="text-red-700">{risk.rejectionReason}</div>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 mb-4">
            This risk is only visible to your organization
          </div>
        </div>

        {/* Floating Footer with Action Buttons */}
        {(risk?.status === 'Draft' || (risk?.status === 'Rejected' && user?.role === 'Organization User')) && (
          <div className="fixed bottom-0 right-0 w-full max-w-md p-6 bg-white border-t border-gray-200 shadow-lg">
            {risk?.status === 'Draft' && (
              <div className="flex flex-col gap-2">
                <Button className="w-full bg-yellow-200 hover:bg-yellow-300 text-gray-900 font-bold py-2 rounded" type="button" onClick={handleSubmitForReview} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
                {user?.role === 'Organization User' && (
                  <Button className="w-full bg-[#FBBF77] hover:bg-[#f9b15c] text-[#0b1320] font-bold py-2 rounded border border-[#FBBF77] hover:border-[#f9b15c] flex items-center justify-center gap-2" type="button" onClick={handleEditRisk}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                )}
              </div>
            )}
            {risk?.status === 'Rejected' && user?.role === 'Organization User' && (
              <Button className="w-full bg-[#FBBF77] hover:bg-[#f9b15c] text-[#0b1320] font-bold py-2 rounded border border-[#FBBF77] hover:border-[#f9b15c] flex items-center justify-center gap-2" type="button" onClick={handleEditRisk}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit & Re-submit
              </Button>
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