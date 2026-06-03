import React, { useState, useEffect, useCallback } from 'react';
import Button from '../common/Button';
import { Organization, organizationsService } from '@/lib/api/services/organizations';
import { showToast } from '@/lib/utils/toast';
import Loader from '../common/Loader';
import { fetchOrganizationsByRole } from '@/lib/api/services/organizations';
import { useAuth } from '@/lib/auth/AuthContext';
import ConfirmationModal from '../common/ConfirmationModal';
import { userService, User } from '@/lib/api';
import Modal from '../common/Modal';

interface OrganizationListProps {
  onEdit?: (organization: Organization) => void;
  refreshKey?: number;
}

const OrganizationList: React.FC<OrganizationListProps> = ({ onEdit, refreshKey = 0 }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewUsersOrg, setViewUsersOrg] = useState<Organization | null>(null);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  // Check if user is Admin or Super User
  const canDelete = user && (user.role === 'Admin' || user.role === 'Super_user');
  const canEditOrganizations = user && (user.role === 'Admin' || user.role === 'Super_user');

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setOrganizations([]);
        return;
      }
      
      const organizations = await fetchOrganizationsByRole(user);
      setOrganizations(organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('An unexpected error occurred');
      showToast.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations, refreshKey]);

  const handleViewUsers = async (organization: Organization) => {
    setViewUsersOrg(organization);
    setLoadingUsers(true);
    setOrgUsers([]);
    try {
      const response = await userService.getUsers();
      if (response.success && response.data) {
        const orgId = organization._id || organization.id;
        const filtered = response.data.filter((u: User) =>
          u.organizations && u.organizations.includes(orgId)
        );
        setOrgUsers(filtered);
      }
    } catch {
      showToast.error('Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEdit = (organization: Organization) => {
    if (!canEditOrganizations) return;
    if (onEdit) {
      onEdit(organization);
    }
  };

  const handleDeleteClick = (organization: Organization) => {
    setOrganizationToDelete(organization);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!organizationToDelete) return;

    setIsDeleting(true);
    try {
      const response = await organizationsService.deleteOrganization(organizationToDelete._id || organizationToDelete.id);
      
      if (response.success) {
        showToast.success('Organization deleted successfully');
        setDeleteModalOpen(false);
        setOrganizationToDelete(null);
        fetchOrganizations(); // Refresh the list
      } else {
        showToast.error(response.error || 'Failed to delete organization');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      showToast.error('An unexpected error occurred while deleting organization');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loader size="lg" variant="default" />
        <p className="text-center text-gray-500 mt-4">Loading organizations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading organizations</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={fetchOrganizations}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new organization.</p>
        </div>
      </div>
    );
  }

  const filteredOrgs = search.trim()
    ? organizations.filter(o =>
        o.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.email?.toLowerCase().includes(search.toLowerCase())
      )
    : organizations;

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search organizations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/40"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrgs.map((organization) => (
          <div key={organization._id || organization.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-800">{organization.name}</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                organization.status.toLowerCase() === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {organization.status.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            {organization.description && (
              <p className="text-sm mb-2 text-gray-600">{organization.description}</p>
            )}
            <p className="text-xs text-gray-700 mb-1">Contact: {organization.email}</p>
            {organization.users !== undefined && (
              <p className="text-xs text-gray-700 mb-3">Users: {organization.users}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleViewUsers(organization); }}
              >
                View Users
              </Button>
              {canEditOrganizations && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(organization)}
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteClick(organization)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setOrganizationToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Organization"
        message={`Are you sure you want to delete "${organizationToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
      />

      {/* View Users Modal */}
      <Modal
        isOpen={!!viewUsersOrg}
        onClose={() => setViewUsersOrg(null)}
        title={viewUsersOrg ? `${viewUsersOrg.name} — Members` : ''}
        size="2xl"
      >
        {loadingUsers ? (
          <div className="py-8 text-center">
            <Loader size="md" variant="default" />
            <p className="text-gray-500 mt-3 text-sm">Loading users...</p>
          </div>
        ) : orgUsers.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            No users found for this organization.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orgUsers.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-blue-600">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-gray-600">{u.email}</td>
                  <td className="py-3 pr-4 text-sm text-gray-600">{u.role}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.status.toLowerCase() === 'active'
                        ? 'bg-green-100 text-green-800'
                        : u.status.toLowerCase() === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </>
  );
};

export default OrganizationList; 