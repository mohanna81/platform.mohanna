import React, { useState, useEffect, useCallback } from 'react';
import Button from '../common/Button';
import { Organization, organizationsService } from '@/lib/api/services/organizations';
import { showToast } from '@/lib/utils/toast';
import Loader from '../common/Loader';
import { fetchOrganizationsByRole } from '@/lib/api/services/organizations';
import { useAuth } from '@/lib/auth/AuthContext';
import ConfirmationModal from '../common/ConfirmationModal';

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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map((organization) => (
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
            <div className="flex gap-2">
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
    </>
  );
};

export default OrganizationList; 