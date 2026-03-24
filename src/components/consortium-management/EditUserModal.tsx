import React from 'react';
import Button from '../common/Button';
import InputField from '../common/InputField';
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
  consortiumOptions 
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
    const filterOrganizations = () => {
      if (consortia.length === 0) {
        setFilteredOrganizationOptions(organizationOptions);
        return;
      }

      try {
        // Get organizations from selected consortiums
        const selectedConsortia = allConsortia.filter(consortium => 
          consortia.includes(consortium._id || consortium.id || '')
        );

        // Extract organizations from the selected consortiums
        const organizationsFromConsortia: { value: string; label: string }[] = [];
        selectedConsortia.forEach((consortium: Consortium) => {
          if (consortium.organizations && Array.isArray(consortium.organizations)) {
            consortium.organizations.forEach((org: string | { _id: string; name: string }) => {
              if (org && typeof org === 'object' && '_id' in org) {
                // Check if organization is already in the list to avoid duplicates
                const exists = organizationsFromConsortia.find(existing => existing.value === org._id);
                if (!exists) {
                  organizationsFromConsortia.push({
                    value: org._id,
                    label: org.name,
                  });
                }
              }
            });
          }
        });

        // Always include the currently selected organization if it exists
        if (organization) {
          const currentOrgOption = organizationOptions.find(opt => opt.value === organization);
          if (currentOrgOption) {
            const exists = organizationsFromConsortia.find(existing => existing.value === organization);
            if (!exists) {
              organizationsFromConsortia.push(currentOrgOption);
            }
          }
        }

        setFilteredOrganizationOptions(organizationsFromConsortia);
      } catch (error) {
        console.error('Error filtering organizations:', error);
        setFilteredOrganizationOptions(organizationOptions);
      }
    };

    filterOrganizations();
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
      await onSubmit({ 
        name, 
        email, 
        role, 
        organizations: organization ? [organization] : [], 
        consortia 
      });
      // Don't reset form on successful submission as it's an edit
    } catch {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

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
        <h2 className="text-xl font-bold text-gray-900 mb-1">Edit User</h2>
        <p className="text-gray-600 mb-6 text-sm">Update user information and permissions</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-1">Full Name</label>
            <InputField
              placeholder="Enter full name"
              value={name}
              onChange={setName}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-1">Email Address</label>
            <InputField
              placeholder="Enter email address"
              value={email}
              onChange={setEmail}
              required
              type="email"
              disabled={isSubmitting}
            />
          </div>
          <div className="mb-4">
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
          <div className="mb-4">
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
              disabled={isSubmitting}
            >
              <option value="" className="text-black">Select consortia</option>
              {consortiumOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
              ))}
            </select>
            {consortia.length > 0 && (
              <div className="mt-2 space-y-1">
                {consortia.map((consortiumId, index) => {
                  const consortium = consortiumOptions.find(opt => opt.value === consortiumId);
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
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-1">Organization</label>
            <select
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              required
              disabled={isSubmitting}
            >
              <option value="">Select organization</option>
              {filteredOrganizationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
            <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting} className="border-gray-300 text-gray-900 w-full sm:w-auto text-sm md:text-base">Cancel</Button>
            <Button variant="primary" size="md" type="submit" disabled={isSubmitting} loading={isSubmitting} className="font-semibold w-full sm:w-auto text-sm md:text-base">Update User</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal; 