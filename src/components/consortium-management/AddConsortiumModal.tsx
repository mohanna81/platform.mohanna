import React from 'react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import TextArea from '../common/TextArea';
import Modal from '../common/Modal';

interface AddConsortiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; startDate: string; endDate: string; description: string }) => Promise<void>;
}

const AddConsortiumModal: React.FC<AddConsortiumModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  const resetForm = () => {
    setName('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setIsSubmitting(false);
    setErrors({});
  };

  React.useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ name, startDate, endDate, description });
      resetForm();
    } catch {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Consortium" size="lg">
      <p className="text-gray-600 mb-6 text-sm">Add a new consortium to collaborate and share risks</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Consortium Name</label>
          <InputField
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
            <label className="block text-sm font-semibold text-gray-900 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => handleStartDateChange(e.target.value)}
              className={`w-full border rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.startDate ? 'border-red-300' : 'border-gray-200'
              }`}
              required
              disabled={isSubmitting}
            />
            {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => handleEndDateChange(e.target.value)}
              className={`w-full border rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.endDate ? 'border-red-300' : 'border-gray-200'
              }`}
              required
              disabled={isSubmitting}
            />
            {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
          <TextArea
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
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-2">
          <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting} className="border-gray-300 text-gray-900 w-full sm:w-auto text-sm md:text-base">Cancel</Button>
          <Button variant="primary" size="md" type="submit" disabled={isSubmitting} loading={isSubmitting} className="font-semibold w-full sm:w-auto text-sm md:text-base">
            Create Consortium
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddConsortiumModal;
