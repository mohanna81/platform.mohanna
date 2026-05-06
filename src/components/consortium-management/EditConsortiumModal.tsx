import React, { useEffect, useState } from 'react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import TextArea from '../common/TextArea';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import { consortiaService } from '@/lib/api';
import { showToast } from '@/lib/utils/toast';

interface EditConsortiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  consortiumId: string;
  onUpdated: () => void;
}

const EditConsortiumModal: React.FC<EditConsortiumModalProps> = ({ isOpen, onClose, consortiumId, onUpdated }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Closed'>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setStatus('Active');
    setIsSubmitting(false);
    setIsClosing(false);
    setShowCloseConfirm(false);
    setErrors({});
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && consortiumId) {
      setLoading(true);
      consortiaService.getConsortiumById(consortiumId).then((response) => {
        if (response.success && response.data) {
          const c = response.data.data;
          setName(c.name || '');
          setStartDate(c.start_date ? c.start_date.substring(0, 10) : '');
          setEndDate(c.end_date ? c.end_date.substring(0, 10) : '');
          setDescription(c.description || '');
          setStatus((c.status === 'Closed' ? 'Closed' : 'Active') as 'Active' | 'Closed');
        }
      }).finally(() => setLoading(false));
    }
  }, [isOpen, consortiumId]);

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (errors.startDate) setErrors(prev => ({ ...prev, startDate: '' }));
    if (endDate && value && new Date(endDate) <= new Date(value)) {
      setErrors(prev => ({ ...prev, endDate: 'End date must be after start date' }));
    } else if (errors.endDate && endDate && value && new Date(endDate) > new Date(value)) {
      setErrors(prev => ({ ...prev, endDate: '' }));
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (errors.endDate) setErrors(prev => ({ ...prev, endDate: '' }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Consortium name is required';
    else if (name.trim().length < 3) newErrors.name = 'Consortium name must be at least 3 characters long';
    else if (name.trim().length > 100) newErrors.name = 'Consortium name cannot exceed 100 characters';
    else if (!/^[a-zA-Z0-9\s\-_&.()]+$/.test(name.trim())) newErrors.name = 'Consortium name can only contain letters, numbers, spaces, hyphens, underscores, ampersands, dots, and parentheses';
    if (!startDate) newErrors.startDate = 'Start date is required';
    else if (new Date(startDate) > new Date('2100-12-31')) newErrors.startDate = 'Start date cannot be more than 100 years in the future';
    if (!endDate) newErrors.endDate = 'End date is required';
    else if (startDate && new Date(endDate) <= new Date(startDate)) newErrors.endDate = 'End date must be after start date';
    else if (new Date(endDate) > new Date('2100-12-31')) newErrors.endDate = 'End date cannot be more than 100 years in the future';
    if (description.trim()) {
      if (description.trim().length < 10) newErrors.description = 'Description must be at least 10 characters long';
      else if (description.trim().length > 500) newErrors.description = 'Description cannot exceed 500 characters';
      else if (!/^[a-zA-Z0-9\s\-_&.,!?()'":;@#$%*+=<>[\]{}|\\/~`]+$/.test(description.trim())) newErrors.description = 'Description contains invalid characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleToggleStatus = async () => {
    const newStatus = status === 'Active' ? 'Closed' : 'Active';
    setIsClosing(true);
    try {
      await consortiaService.updateConsortiumStatus(consortiumId, newStatus);
      setStatus(newStatus);
      setShowCloseConfirm(false);
      showToast.success(`Consortium ${newStatus === 'Closed' ? 'closed' : 'reopened'} successfully`);
      onUpdated();
    } catch {
      showToast.error('Failed to update consortium status');
    } finally {
      setIsClosing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await consortiaService.patchConsortiumById(consortiumId, { name, start_date: startDate, end_date: endDate, description });
      setErrors({});
      onUpdated();
      onClose();
    } catch {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Consortium" size="lg">
      <p className="text-gray-600 mb-6 text-sm">Update consortium details</p>
      {loading ? (
        <div className="py-8 flex flex-col items-center">
          <Loader size="md" variant="default" />
          <p className="text-center text-gray-500 mt-4">Loading consortium data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <InputField
              label="Consortium Name"
              placeholder="Enter consortium name"
              value={name}
              onChange={v => { setName(v); if (errors.name) setErrors(prev => ({ ...prev, name: '' })); }}
              required
              fullWidth
              disabled={isSubmitting}
              error={errors.name}
              helperText={`${name.length}/100 characters`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <InputField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                required
                fullWidth
                disabled={isSubmitting}
                error={errors.startDate}
              />
            </div>
            <div>
              <InputField
                label="End Date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                required
                fullWidth
                disabled={isSubmitting}
                error={errors.endDate}
              />
            </div>
          </div>
          <div>
            <TextArea
              label="Description"
              placeholder="Enter consortium description"
              value={description}
              onChange={v => { setDescription(v); if (errors.description) setErrors(prev => ({ ...prev, description: '' })); }}
              rows={3}
              fullWidth
              disabled={isSubmitting}
              error={errors.description}
              maxLength={500}
            />
          </div>
          {/* Status section */}
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Consortium Status</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {status === 'Active'
                    ? 'Closing this consortium will mark it as inactive.'
                    : 'This consortium is currently closed.'}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {status}
              </span>
            </div>

            {showCloseConfirm ? (
              <div className={`mt-3 rounded-lg p-3 text-sm ${status === 'Active' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`font-medium mb-2 ${status === 'Active' ? 'text-red-800' : 'text-blue-800'}`}>
                  {status === 'Active'
                    ? 'Are you sure you want to close this consortium?'
                    : 'Reopen this consortium?'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={isClosing}
                    className={`px-3 py-1.5 rounded text-white text-xs font-semibold transition ${
                      status === 'Active'
                        ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                        : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                    }`}
                  >
                    {isClosing ? 'Updating...' : status === 'Active' ? 'Yes, Close' : 'Yes, Reopen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCloseConfirm(false)}
                    className="px-3 py-1.5 rounded border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCloseConfirm(true)}
                className={`mt-3 text-xs font-semibold px-3 py-1.5 rounded border transition ${
                  status === 'Active'
                    ? 'border-red-300 text-red-600 hover:bg-red-50'
                    : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                }`}
              >
                {status === 'Active' ? 'Close Consortium' : 'Reopen Consortium'}
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-2">
            <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting} className="border-gray-300 text-gray-900 w-full sm:w-auto text-sm md:text-base">Cancel</Button>
            <Button variant="primary" size="md" type="submit" loading={isSubmitting} disabled={isSubmitting} className="font-semibold w-full sm:w-auto text-sm md:text-base">
              Update Consortium
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditConsortiumModal;
