import React from 'react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Dropdown from '../common/Dropdown';
import Modal from '../common/Modal';
import { Organization } from '@/lib/api/services/organizations';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; password: string; role: string; organizations: string[]; consortia: string[] }) => void;
  roleOptions: { value: string; label: string }[];
  organizationOptions: { value: string; label: string }[];
  consortiumOptions: { value: string; label: string }[];
  organizationsData: Organization[];
}

const EMPTY_FORM = { name: '', email: '', password: '', role: '', organization: '', consortia: [] as string[] };

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  roleOptions,
  organizationOptions,
  consortiumOptions,
  organizationsData,
}) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState('');
  const [organization, setOrganization] = React.useState('');
  const [consortia, setConsortia] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset all fields when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setName(EMPTY_FORM.name);
      setEmail(EMPTY_FORM.email);
      setPassword(EMPTY_FORM.password);
      setRole(EMPTY_FORM.role);
      setOrganization(EMPTY_FORM.organization);
      setConsortia(EMPTY_FORM.consortia);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Derive consortium options filtered to the selected organization
  const filteredConsortiumOptions = React.useMemo(() => {
    if (!organization) return [];
    const selectedOrg = organizationsData.find(o => (o._id || o.id) === organization);
    if (!selectedOrg || !selectedOrg.consortia || selectedOrg.consortia.length === 0) return [];
    const orgConsortiumIds = new Set(selectedOrg.consortia.map(c => c._id || c.id || '').filter(Boolean));
    return consortiumOptions.filter(opt => orgConsortiumIds.has(opt.value));
  }, [organization, organizationsData, consortiumOptions]);

  const handleOrganizationChange = (value: string) => {
    setOrganization(value);
    setConsortia([]);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('');
    setOrganization('');
    setConsortia([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      onSubmit({ name, email, password, role, organizations: organization ? [organization] : [], consortia });
      resetForm();
    } catch {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New User" size="lg">
      <p className="text-gray-600 mb-6 text-sm">Create a new user account and add them to an organization and consortium(s)</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Full Name</label>
          <InputField
            placeholder="Enter full name"
            value={name}
            onChange={setName}
            required
            fullWidth
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Email Address</label>
          <InputField
            placeholder="Enter email address"
            value={email}
            onChange={setEmail}
            required
            type="email"
            fullWidth
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Password</label>
          <InputField
            placeholder="Enter password"
            value={password}
            onChange={setPassword}
            required
            type="password"
            fullWidth
            disabled={isSubmitting}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Role</label>
            <select
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
              value={role}
              onChange={e => setRole(e.target.value)}
              required
              disabled={isSubmitting}
            >
              <option value="">Select role</option>
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Dropdown
              label="Organization"
              placeholder="Select organization"
              options={organizationOptions}
              value={organization}
              onChange={handleOrganizationChange}
              required
              disabled={isSubmitting}
              fullWidth
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Consortia</label>
          <select
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
            value=""
            onChange={e => {
              const selectedValue = e.target.value;
              if (selectedValue && !consortia.includes(selectedValue)) {
                setConsortia([...consortia, selectedValue]);
              }
            }}
            disabled={isSubmitting || !organization}
          >
            <option value="" className="text-black">
              {organization ? 'Select consortia' : 'Select an organization first'}
            </option>
            {filteredConsortiumOptions.map(opt => (
              <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
            ))}
          </select>
          {consortia.length > 0 && (
            <div className="mt-2 space-y-1">
              {consortia.map((consortiumId, index) => {
                const consortium = filteredConsortiumOptions.find(opt => opt.value === consortiumId);
                return (
                  <div key={consortiumId} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm">
                    <span className="text-black font-medium">{consortium?.label || consortiumId}</span>
                    <button
                      type="button"
                      onClick={() => setConsortia(consortia.filter((_, i) => i !== index))}
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
          <Button variant="primary" size="md" type="submit" disabled={isSubmitting} loading={isSubmitting} className="font-semibold w-full sm:w-auto text-sm md:text-base">Add User</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
