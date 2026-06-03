import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Dropdown from '@/components/common/Dropdown';
import Button from '@/components/common/Button';
import TextArea from '@/components/common/TextArea';
import { risksService } from '@/lib/api/services/risks';
import { showToast } from '@/lib/utils/toast';

const ChangeRiskStatusModal = ({ isOpen, onClose, onSubmit, riskId, statusOptions, onUpdated }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  riskId: string;
  statusOptions: { value: string; label: string }[];
  onUpdated?: () => void;
}) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [reason, setReason] = useState('');
  const [closingComment, setClosingComment] = useState('');
  const [mitigationSuccess, setMitigationSuccess] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedStatus('');
    setReason('');
    setClosingComment('');
    setMitigationSuccess(0);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus || !riskId) return;

    if (selectedStatus === 'Rejected' && !reason.trim()) return;
    if (selectedStatus === 'Closed' && (!closingComment.trim() || mitigationSuccess === 0)) return;

    setSubmitting(true);

    const updateData: { status: string; rejectionReason?: string; closingComment?: string; mitigationSuccess?: number } = { status: selectedStatus };
    if (selectedStatus === 'Rejected' && reason.trim()) {
      updateData.rejectionReason = reason.trim();
    }
    if (selectedStatus === 'Closed') {
      if (closingComment.trim()) updateData.closingComment = closingComment.trim();
      if (mitigationSuccess > 0) updateData.mitigationSuccess = mitigationSuccess;
    }
    
    try {
      await risksService.updateRisk(riskId, updateData);
      showToast.success(`Risk status updated to ${selectedStatus} successfully`);
      // Refresh the data after successful update
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error('API call failed:', error);
      showToast.error('Failed to update risk status');
    }
    
    setSubmitting(false);
    onClose();
    onSubmit();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Risk Status" size="md" showCloseButton>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <label className="font-semibold text-black w-24 md:w-28 flex-shrink-0 md:text-right md:pr-2">Status</label>
          <Dropdown
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            placeholder="Select a status"
            fullWidth
            className="min-w-[220px]"
            optionsMaxHeight="max-h-80"
          />
        </div>
        {selectedStatus === 'Rejected' && (
          <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
            <label className="font-semibold text-black w-24 md:w-28 flex-shrink-0 md:text-right md:pr-2 pt-2">Rejection Reason</label>
            <TextArea
              placeholder="Enter rejection reason"
              value={reason}
              onChange={setReason}
              rows={3}
              fullWidth
              required
            />
          </div>
        )}
        {selectedStatus === 'Closed' && (
          <>
            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
              <label className="font-semibold text-black w-24 md:w-28 flex-shrink-0 md:text-right md:pr-2 pt-2">Remarks</label>
              <TextArea
                placeholder="Enter closing remarks"
                value={closingComment}
                onChange={setClosingComment}
                rows={3}
                fullWidth
                required
              />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <label className="font-semibold text-black w-24 md:w-28 flex-shrink-0 md:text-right md:pr-2">Mitigation Success</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setMitigationSuccess(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    title={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <svg
                      className={`w-8 h-8 ${star <= mitigationSuccess ? 'text-amber-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
                {mitigationSuccess > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][mitigationSuccess]}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-2">
          <Button variant="outline" size="md" type="button" onClick={onClose} className="border-gray-300 text-black w-full sm:w-auto text-sm md:text-base">Cancel</Button>
          <Button variant="primary" size="md" type="submit" className="font-semibold w-full sm:w-auto text-sm md:text-base" disabled={!selectedStatus || (selectedStatus === 'Rejected' && !reason) || (selectedStatus === 'Closed' && (!closingComment || mitigationSuccess === 0)) || submitting}>
            {submitting ? 'Updating...' : 'Change Status'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangeRiskStatusModal; 