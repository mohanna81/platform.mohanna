import React from 'react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Dropdown from '../common/Dropdown';
import Modal from '../common/Modal';
import { User } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { fetchConsortiaByRole, Consortium } from '@/lib/api/services/consortia';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; role: string; organizations: string[]; consortia: string[] }) => void;
  user: User | null;
  roleOptions: { value: string; label: string }[];
  organizationOptions: { value: string; label: string }[];
  consortiumOptions: { value: string; label: string }[];
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  roleOptions,
  organizationOptions,
  consortiumOptions,
}) => {
  const { user: currentUser } = useAuth();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('');
  const [organization, setOrganization] = React.useState('');
  const [consortia, setConsortia] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [filteredOrganizationOptions, setFilteredOrganizationOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [allConsortia, setAllConsortia] = React.useState<Consortium[]>([]);

  // Fetch all consortia data for filtering
  React.useEffect(() => {
    const fetchConsortiaData = async () => {
      if (currentUser) {
        try {
          const consortiaData = await fetchConsortiaByRole(currentUser);
          setAllConsortia(consortiaData);
        } catch (error) {
          console.error('Error fetching consortia data:', error);
        }
      }
    };
    fetchConsortiaData();
  }, [currentUser]);

  // Filter organizations based on selected consortiums
  React.useEffect(() => {
    if (consortia.length === 0) {
      setFilteredOrganizationOptions(organizationOptions);
      return;
    }
    try {
      const selectedConsortia = allConsortia.filter(c => consortia.includes(c._id || c.id || ''));
      const organizationsFromConsortia: { value: string; label: string }[] = [];
      selectedConsortia.forEach((c: Consortium) => {
        if (c.organizations && Array.isArray(c.organizations)) {
          c.organizations.forEach((org: string | { _id: string; name: string }) => {
            if (org && typeof org === 'object' && '_id' in org) {
              if (!organizationsFromConsortia.find(existing => existing.value === org._id)) {
                organizationsFromConsortia.push({ value: org._id, label: org.name });
              }
            }
          });
        }
      });
      if (organization) {
        const currentOrgOption = organizationOptions.find(opt => opt.value === organization);
        if (currentOrgOption && !organizationsFromConsortia.find(e => e.value === organization)) {
          organizationsFromConsortia.push(currentOrgOption);
        }
      }
      setFilteredOrganizationOptions(organizationsFromConsortia);
    } catch (error) {
      console.error('Error filtering organizations:', error);
      setFilteredOrganizationOptions(organizationOptions);
    }
  }, [consortia, organizationOptions, allConsortia, organization]);

  // Initialize form with user data when user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || '');
      setOrganization(user.organizations?.[0] || '');
      setConsortia(user.consortia || []);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      onSubmit({ name, email, role, organizations: organization ? [organization] : [], consortia });
    } catch {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen && !!user} onClose={onClose} title="Edit User" size="lg">
      <p className="text-gray-600 mb-6 text-sm">Update user information and permissions</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
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
            label="Consortia"
            placeholder="Select consortia to add"
            options={consortiumOptions.filter(opt => !consortia.includes(opt.value))}
            value=""
            onChange={v => { if (v && !consortia.includes(v)) setConsortia([...consortia, v]); }}
            fullWidth
            disabled={isSubmitting}
          />
          {consortia.length > 0 && (
            <div className="mt-2 space-y-1">
              {consortia.map((consortiumId, index) => {
                const consortium = consortiumOptions.find(opt => opt.value === consortiumId);
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
        <div>
          <Dropdown
            label="Organization"
            placeholder="Select organization"
            options={filteredOrganizationOptions}
            value={organization}
            onChange={setOrganization}
            required
            fullWidth
            disabled={isSubmitting}
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-2">
          <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting} className="border-gray-300 text-gray-900 w-full sm:w-auto text-sm md:text-base">Cancel</Button>
          <Button variant="primary" size="md" type="submit" disabled={isSubmitting} loading={isSubmitting} className="font-semibold w-full sm:w-auto text-sm md:text-base">Update User</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
