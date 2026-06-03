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
  assignTo: string[]; // Organizations (one or more)
  assignToUsers: string[]; // One or more users (required)
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
    setForm(initialData);
  }, [initialData, isOpen, orgOptions]);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setForm(initialData);
    }
  }, [isOpen, initialData]);

  const handleChange = (field: Exclude<keyof EditActionFormData, 'assignToUsers' | 'assignTo'>, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };

      // When the date changes on an "At Risk" item, auto-reset status to "In Progress"
      if (field === 'date' && prev.status === 'At Risk' && value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newDate = new Date(value);
        if (newDate >= today) {
          updated.status = 'In Progress';
        }
      }

      return updated;
    });

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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Action Item" size="xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <div className="mb-2">
          <label className="block text-sm font-semibold text-[#0b1320] mb-1">Consortium</label>
          <Dropdown
            options={consortiumOptions}
            value={form.consortium}
            onChange={(v) => handleChange('consortium', v)}
            required
            fullWidth
          />
        </div>
        {/* Assign To Organizations — multi-select */}
        <div className="mb-2">
          <label className="block text-sm font-semibold text-[#0b1320] mb-1">Assign To Organization(s)</label>
          <Dropdown
            placeholder={orgOptions.length === 0 ? 'No organizations available' : 'Select an organization to add'}
            options={orgOptions.filter(o => !form.assignTo.includes(o.value))}
            value=""
            onChange={v => {
              if (!v) return;
              setForm(prev => ({ ...prev, assignTo: [...prev.assignTo, v] }));
            }}
            fullWidth
            disabled={orgOptions.length === 0}
          />
          {form.assignTo.length > 0 && (
            <div className="mt-2 space-y-1">
              {form.assignTo.map((orgId, idx) => {
                const org = orgOptions.find(o => o.value === orgId);
                return (
                  <div key={orgId} className="flex items-center justify-between bg-[#2a9d8f]/5 border border-[#2a9d8f]/20 px-3 py-1.5 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-4 h-4 bg-[#2a9d8f] text-white rounded-full text-[10px] font-bold flex-shrink-0">{idx + 1}</span>
                      <span className="text-gray-800 font-medium">{org?.label || orgId}</span>
                    </div>
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, assignTo: prev.assignTo.filter(id => id !== orgId) }))} className="text-red-500 hover:text-red-700 font-bold ml-2 text-base leading-none">×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Assign To Users — multi-select */}
        <div className="mb-2">
          <label className="block text-sm font-semibold text-[#0b1320] mb-1">
            Assign To User(s) <span className="text-red-500">*</span>
          </label>
          <Dropdown
            placeholder={userOptions.length === 0 ? 'No users available' : 'Select a user to add'}
            options={userOptions.filter(u => !form.assignToUsers.includes(u.value))}
            value=""
            onChange={v => {
              if (!v) return;
              setForm(prev => ({ ...prev, assignToUsers: [...prev.assignToUsers, v] }));
            }}
            fullWidth
            disabled={userOptions.length === 0}
          />
          {form.assignToUsers.length > 0 && (
            <div className="mt-2 space-y-1">
              {form.assignToUsers.map((userId, idx) => {
                const u = userOptions.find(o => o.value === userId);
                return (
                  <div key={userId} className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] font-bold flex-shrink-0">{idx + 1}</span>
                      <span className="text-gray-800 font-medium">{u?.label || userId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, assignToUsers: prev.assignToUsers.filter(id => id !== userId) }))}
                      className="text-red-500 hover:text-red-700 font-bold ml-2 text-base leading-none"
                    >×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
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