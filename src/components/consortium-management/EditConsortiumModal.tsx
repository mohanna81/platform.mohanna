import React, { useEffect, useState } from 'react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import TextArea from '../common/TextArea';
import { consortiaService } from '@/lib/api';
import Loader from '../common/Loader';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Reset form to initial state
  const resetForm = () => {
    setName('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setIsSubmitting(false);
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
        }
      }).finally(() => setLoading(false));
    }
  }, [isOpen, consortiumId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const today = new Date().toISOString().split('T')[0];

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
  const handleNameChange = (value: string) => {
    setName(value);
    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
  };
  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) {
      const firstErrorField = document.querySelector('.border-red-300');
      if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsSubmitting(true);
    try {
      await consortiaService.patchConsortiumById(consortiumId, {
        name,
        start_date: startDate,
        end_date: endDate,
        description,
      });
      setErrors({});
      onUpdated();
      onClose();
    } catch {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-2 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-500 hover:text-gray-700 text-2xl focus:outline-none"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Edit Consortium</h2>
        <p className="text-gray-600 mb-6 text-sm">Update consortium details</p>
        {loading ? (
          <div className="py-8">
            <Loader size="md" variant="default" />
            <p className="text-center text-gray-500 mt-4">Loading consortium data...</p>
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-1">Consortium Name</label>
            <InputField
              placeholder="Enter consortium name"
              value={name}
              onChange={handleNameChange}
              required
              disabled={isSubmitting}
              error={errors.name}
              helperText={`${name.length}/100 characters`}
            />
          </div>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => handleStartDateChange(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.startDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
                }`}
                required
                disabled={isSubmitting}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => handleEndDateChange(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.endDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
                }`}
                required
                disabled={isSubmitting}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
            <TextArea
              placeholder="Enter consortium description"
              value={description}
              onChange={handleDescriptionChange}
              rows={3}
              disabled={isSubmitting}
              error={errors.description}
              maxLength={500}
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
            <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting} className="border-gray-300 text-gray-900 w-full sm:w-auto text-sm md:text-base">Cancel</Button>
            <Button variant="primary" size="md" type="submit" loading={isSubmitting} disabled={isSubmitting} className="font-semibold w-full sm:w-auto text-sm md:text-base">
              Update Consortium
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default EditConsortiumModal; 