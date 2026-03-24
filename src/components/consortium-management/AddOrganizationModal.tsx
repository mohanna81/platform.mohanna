import React from 'react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import TextArea from '../common/TextArea';

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; contact_email: string; consortiumIds: string[] }) => void;
  consortiumOptions: { value: string; label: string }[];
}

const AddOrganizationModal: React.FC<AddOrganizationModalProps> = ({ isOpen, onClose, onSubmit, consortiumOptions }) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [consortiumIds, setConsortiumIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name, description, contact_email: contactEmail, consortiumIds });
      // Reset form on successful submission
      setName('');
      setDescription('');
      setContactEmail('');
      setConsortiumIds([]);
    } catch {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-2 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-500 hover:text-gray-700 text-2xl focus:outline-none"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Add New Organization</h2>
        <p className="text-gray-600 mb-6 text-sm">Create a new organization and add it to consortiums</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-1">Organization Name</label>
            <InputField
              placeholder="Enter organization name"
              value={name}
              onChange={setName}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
            <TextArea
              placeholder="Enter organization description"
              value={description}
              onChange={setDescription}
              required
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-1">Contact Email</label>
            <InputField
              placeholder="Enter contact email"
              value={contactEmail}
              onChange={setContactEmail}
              required
              type="email"
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-1">Consortia</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              value=""
              onChange={e => {
                const selectedValue = e.target.value;
                if (selectedValue && !consortiumIds.includes(selectedValue)) {
                  setConsortiumIds([...consortiumIds, selectedValue]);
                }
              }}
              required={consortiumIds.length === 0}
              disabled={isSubmitting}
            >
              <option value="" disabled>Select consortia</option>
              {consortiumOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {consortiumIds.length > 0 && (
              <div className="mt-2 space-y-1">
                {consortiumIds.map((consortiumId, index) => {
                  const consortium = consortiumOptions.find(opt => opt.value === consortiumId);
                  return (
                    <div key={consortiumId} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm">
                      <span className="text-black font-medium">{consortium?.label || consortiumId}</span>
                      <button
                        type="button"
                        onClick={() => setConsortiumIds(consortiumIds.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                        disabled={isSubmitting}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
            <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting} className="border-gray-300 text-gray-900 w-full sm:w-auto text-sm md:text-base">Cancel</Button>
            <Button variant="primary" size="md" type="submit" disabled={isSubmitting} loading={isSubmitting} className="font-semibold w-full sm:w-auto text-sm md:text-base">Create Organization</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrganizationModal; 