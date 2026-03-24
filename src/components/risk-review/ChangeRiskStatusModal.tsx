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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedStatus('');
    setReason('');
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus || !riskId) return;
    
    // Validate that reason is provided when rejecting
    if (selectedStatus === 'Rejected' && !reason.trim()) {
      return;
    }
    
    setSubmitting(true);
    
    const updateData: { status: string; rejectionReason?: string } = { status: selectedStatus };
    if (selectedStatus === 'Rejected' && reason.trim()) {
      updateData.rejectionReason = reason.trim();
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
              className="border-2 border-black shadow-sm w-full"
            />
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-2">
          <Button variant="outline" size="md" type="button" onClick={onClose} className="border-gray-300 text-black w-full sm:w-auto text-sm md:text-base">Cancel</Button>
          <Button variant="primary" size="md" type="submit" className="font-semibold w-full sm:w-auto text-sm md:text-base" disabled={!selectedStatus || (selectedStatus === 'Rejected' && !reason) || submitting}>
            {submitting ? 'Updating...' : 'Change Status'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangeRiskStatusModal; 