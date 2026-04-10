import React from 'react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Dropdown from '../common/Dropdown';
import Modal from '../common/Modal';
import { Consortium } from '@/lib/api/services/consortia';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; password: string; role: string; organizations: string[]; consortia: string[] }) => void;
  roleOptions: { value: string; label: string }[];
  organizationOptions: { value: string; label: string }[];
  consortiumOptions: { value: string; label: string }[];
  consortiaData: Consortium[];
}

const EMPTY_FORM = { name: '', email: '', password: '', role: '', organization: '', consortia: [] as string[] };

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  roleOptions,
  organizationOptions,
  consortiumOptions,
  consortiaData,
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
  // Filter from the consortium side: which consortia contain the selected org
  const filteredConsortiumOptions = React.useMemo(() => {
    if (!organization) return [];
    return consortiumOptions.filter(opt => {
      const consortium = consortiaData.find(c => (c._id || c.id) === opt.value);
      if (!consortium?.organizations) return false;
      return consortium.organizations.some(org => {
        if (typeof org === 'string') return org === organization;
        return (org._id || org.id) === organization;
      });
    });
  }, [organization, consortiaData, consortiumOptions]);

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
            <Dropdown
              label="Role"
              placeholder="Select role"
              options={roleOptions}
              value={role}
              onChange={setRole}
              required
              fullWidth
              disabled={isSubmitting}
            />
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
          <Dropdown
            label="Consortia"
            placeholder={organization ? 'Select consortia to add' : 'Select an organization first'}
            options={filteredConsortiumOptions.filter(opt => !consortia.includes(opt.value))}
            value=""
            onChange={v => { if (v && !consortia.includes(v)) setConsortia([...consortia, v]); }}
            fullWidth
            disabled={isSubmitting || !organization}
          />
          {consortia.length > 0 && (
            <div className="mt-2 space-y-1">
              {consortia.map((consortiumId, index) => {
                const consortium = filteredConsortiumOptions.find(opt => opt.value === consortiumId);
                return (
                  <div key={consortiumId} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm">
                    <span className="text-black font-medium">{consortium?.label || consortiumId}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConsortia(consortia.filter((_, i) => i !== index))} disabled={isSubmitting} className="text-red-500 hover:text-red-700 !p-0 text-xs font-bold">×</Button>
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
