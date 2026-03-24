import React from 'react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Dropdown from '../common/Dropdown';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; password: string; role: string; organizations: string[]; consortia: string[] }) => void;
  roleOptions: { value: string; label: string }[];
  organizationOptions: { value: string; label: string }[];
  consortiumOptions: { value: string; label: string }[];
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSubmit, roleOptions, organizationOptions, consortiumOptions }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState('');
  const [organization, setOrganization] = React.useState('');
  const [consortia, setConsortia] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Log organization options for debugging
  React.useEffect(() => {
    if (isOpen) {
      console.log('AddUserModal - Organization options received:', organizationOptions);
      console.log('AddUserModal - Consortium options received:', consortiumOptions);
    }
  }, [isOpen, organizationOptions, consortiumOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name, email, password, role, organizations: organization ? [organization] : [], consortia });
      // Reset form on successful submission
      setName('');
      setEmail('');
      setPassword('');
      setRole('');
      setOrganization('');
      setConsortia([]);
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
        <h2 className="text-xl font-bold text-gray-900 mb-1">Add New User</h2>
        <p className="text-gray-600 mb-6 text-sm">Create a new user account and add them to an organization and consortium(s)</p>
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
            <label className="block text-sm font-semibold text-gray-900 mb-1">Password</label>
            <InputField
              placeholder="Enter password"
              value={password}
              onChange={setPassword}
              required
              type="password"
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
            <Dropdown
              label="Organization"
              placeholder="Select organization"
              options={organizationOptions}
              value={organization}
              onChange={setOrganization}
              required
              disabled={isSubmitting}
              fullWidth
            />
          </div>
          <div className="mb-8">
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
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
            <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting} className="border-gray-300 text-gray-900 w-full sm:w-auto text-sm md:text-base">Cancel</Button>
            <Button variant="primary" size="md" type="submit" disabled={isSubmitting} loading={isSubmitting} className="font-semibold w-full sm:w-auto text-sm md:text-base">Add User</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal; 