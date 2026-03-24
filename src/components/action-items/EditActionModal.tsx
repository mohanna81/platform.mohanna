import React from 'react';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';
import InputField from '../common/InputField';
import TextArea from '../common/TextArea';
import Modal from '../common/Modal';

export type EditActionFormData = {
  title: string;
  description: string;
  consortium: string;
  assignTo: string;
  assignToUser: string; // User assignment field (required)
  date: string;
  status: string;
};

interface EditActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditActionFormData) => void;
  initialData: EditActionFormData;
  consortiumOptions: { value: string; label: string }[];
  orgOptions: { value: string; label: string }[];
  userOptions: { value: string; label: string }[]; // Add user options
  statusOptions: { value: string; label: string }[];
  onConsortiumChange?: (consortiumId: string) => void;
}

const EditActionModal: React.FC<EditActionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  consortiumOptions,
  orgOptions,
  userOptions,
  statusOptions,
  onConsortiumChange,
}) => {
  const [form, setForm] = React.useState<EditActionFormData>(initialData);

  React.useEffect(() => {
    console.log('EditActionModal - initialData:', initialData);
    console.log('EditActionModal - orgOptions:', orgOptions);
    setForm(initialData);
  }, [initialData, isOpen, orgOptions]);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setForm(initialData);
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof EditActionFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    // If consortium changes, notify parent to fetch related users
    if (field === 'consortium' && onConsortiumChange) {
      onConsortiumChange(value);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Action Item">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
        <p className="text-[#7b849b] mb-2 text-sm">Update the details of this action item</p>
        <div className="mb-2">
          <label className="block text-sm font-semibold text-[#0b1320] mb-1">Action Title</label>
          <InputField
            value={form.title}
            onChange={(v) => handleChange('title', v)}
            placeholder="Enter action title"
            required
            fullWidth
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-semibold text-[#0b1320] mb-1">Description</label>
          <TextArea
            value={form.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="Enter detailed description of the action required"
            required
            fullWidth
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
          <div>
            <label className="block text-sm font-semibold text-[#0b1320] mb-1">Consortium</label>
            <Dropdown
              options={consortiumOptions}
              value={form.consortium}
              onChange={(v) => handleChange('consortium', v)}
              required
              fullWidth
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0b1320] mb-1">Assign To Organization</label>
            <Dropdown
              options={orgOptions}
              value={form.assignTo}
              onChange={(v) => handleChange('assignTo', v)}
              required
              fullWidth
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
          <div>
            <label className="block text-sm font-semibold text-[#0b1320] mb-1">Assign To User</label>
            <Dropdown
              options={userOptions}
              value={form.assignToUser || ''}
              onChange={(v) => handleChange('assignToUser', v)}
              required
              fullWidth
              placeholder="Select a user"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0b1320] mb-1">Implementation Date</label>
            <InputField
              type="date"
              value={form.date}
              onChange={(v) => handleChange('date', v)}
              placeholder="dd/mm/yyyy"
              fullWidth
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
          <div>
            <label className="block text-sm font-semibold text-[#0b1320] mb-1">Status</label>
            <Dropdown
              options={statusOptions}
              value={form.status}
              onChange={(v) => handleChange('status', v)}
              required
              fullWidth
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
          <Button variant="outline" size="md" type="button" onClick={onClose} className="border-gray-300 text-[#0b1320] w-full sm:w-auto text-sm md:text-base">Cancel</Button>
          <Button variant="primary" size="md" type="submit" className="font-semibold w-full sm:w-auto text-sm md:text-base">Update Action</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditActionModal; 