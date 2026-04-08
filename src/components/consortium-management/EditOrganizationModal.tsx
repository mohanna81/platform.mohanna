import React from 'react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import TextArea from '../common/TextArea';
import Modal from '../common/Modal';

interface EditOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; contact_email: string; consortiumIds: string[] }) => void;
  initialData: {
    name: string;
    contact_email: string;
    description: string;
    consortiumIds: string[];
  };
  consortiumOptions: { value: string; label: string }[];
}

const EditOrganizationModal: React.FC<EditOrganizationModalProps> = ({ isOpen, onClose, onSubmit, initialData, consortiumOptions }) => {
  const [name, setName] = React.useState(initialData.name);
  const [contactEmail, setContactEmail] = React.useState(initialData.contact_email);
  const [description, setDescription] = React.useState(initialData.description);
  const [consortiumIds, setConsortiumIds] = React.useState<string[]>(initialData.consortiumIds);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setName(initialData.name);
    setContactEmail(initialData.contact_email);
    setDescription(initialData.description);
    setConsortiumIds(initialData.consortiumIds);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name, description, contact_email: contactEmail, consortiumIds });
    } catch {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Organization" size="lg">
      <p className="text-gray-600 mb-6 text-sm">Update organization details and consortium memberships.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Organization Name</label>
          <InputField
            placeholder="Organization Name"
            value={name}
            onChange={setName}
            required
            fullWidth
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Contact Email</label>
          <InputField
            placeholder="Contact Email"
            value={contactEmail}
            onChange={setContactEmail}
            required
            type="email"
            fullWidth
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
          <TextArea
            placeholder="Description"
            value={description}
            onChange={setDescription}
            required
            rows={3}
            fullWidth
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Consortium Memberships</label>
          <select
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
            value=""
            onChange={e => {
              const v = e.target.value;
              if (v && !consortiumIds.includes(v)) setConsortiumIds([...consortiumIds, v]);
            }}
            required={consortiumIds.length === 0}
            disabled={isSubmitting}
          >
            <option value="">Select consortia</option>
            {consortiumOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-2">
          <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting} className="border-gray-300 text-gray-900 w-full sm:w-auto text-sm md:text-base">Cancel</Button>
          <Button variant="primary" size="md" type="submit" disabled={isSubmitting} loading={isSubmitting} className="font-semibold w-full sm:w-auto text-sm md:text-base">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditOrganizationModal;
