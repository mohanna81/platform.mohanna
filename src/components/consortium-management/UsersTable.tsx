import React, { useState, useEffect, useCallback } from 'react';
import { userService, User } from '@/lib/api';
import { showToast } from '@/lib/utils/toast';
import Loader from '@/components/common/Loader';
import Pagination from '@/components/common/Pagination';
import PageSizeSelector from '@/components/common/PageSizeSelector';
import { useAuth } from '@/lib/auth/AuthContext';
import { canViewUser, normalizeRole } from '@/lib/utils/roleHierarchy';
import EditUserModal from './EditUserModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { fetchConsortiaByRole } from '@/lib/api/services/consortia';
import { fetchOrganizationsByRole, Organization } from '@/lib/api/services/organizations';
import { Consortium } from '@/lib/api/services/consortia';

interface UsersTableProps {
  refreshKey: number;
}

const UsersTable: React.FC<UsersTableProps> = ({ refreshKey }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<{ value: string; label: string }[]>([]);
  const [consortiumOptions, setConsortiumOptions] = useState<{ value: string; label: string }[]>([]);

  // Check if user is Admin or Super User
  const canDelete = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Super_user');
  const canEditUsers = currentUser ? ['Admin', 'Super_user'].includes(normalizeRole(currentUser.role)) : false;

  const fetchDropdownData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      // Set role options
      setRoleOptions([
        { value: 'Super_user', label: 'Super User' },
        { value: 'Admin', label: 'Admin' },
        { value: 'Facilitator', label: 'Facilitator' },
        { value: 'Organization User', label: 'Organization User' },
      ]);

      // Fetch consortiums
      const consortia: Consortium[] = await fetchConsortiaByRole(currentUser);
      setConsortiumOptions(
        consortia.map((c: Consortium) => ({
          value: c.id || c._id,
          label: c.name,
        }))
      );

      // Fetch organizations
      const organizations = await fetchOrganizationsByRole(currentUser);
      setOrganizationOptions(
        organizations.map((o: Organization) => ({
          value: o.id || o._id,
          label: o.name,
        }))
      );
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
    fetchDropdownData();
    setCurrentPage(1); // Reset to first page when refreshing
  }, [refreshKey, fetchDropdownData]);

  // Filter users based on role hierarchy and consortium access
  useEffect(() => {
    if (!currentUser || !users.length) {
      setFilteredUsers([]);
      return;
    }

    console.log('Current user role:', currentUser.role);
    console.log('All users roles:', users.map(u => ({ name: u.name, role: u.role })));

    const filtered = users.filter(user => {
      // Don't show the current user in the table
      if (user._id === currentUser.id || user.id === currentUser.id) {
        return false;
      }

      const currentUserRole = normalizeRole(currentUser.role);
      const targetUserRole = normalizeRole(user.role);
      const canView = canViewUser(currentUserRole, targetUserRole);
      console.log(`${currentUser.name} (${currentUserRole}) can view ${user.name} (${targetUserRole}): ${canView}`);
      
      if (!canView) {
        return false;
      }

      // For facilitators, additionally filter by consortium access
      if (currentUserRole === 'Facilitator') {
        // Get available consortium IDs for the facilitator
        const availableConsortiumIds = consortiumOptions.map(c => c.value);
        
        // Check if the user belongs to any of the facilitator's consortiums
        const userConsortiumIds = user.consortia || [];
        const hasSharedConsortium = userConsortiumIds.some(consortiumId => 
          availableConsortiumIds.includes(consortiumId)
        );
        
        console.log(`Facilitator ${currentUser.name} consortium check for ${user.name}:`, {
          availableConsortiumIds,
          userConsortiumIds,
          hasSharedConsortium
        });
        
        return hasSharedConsortium;
      }

      return true;
    });
    setFilteredUsers(filtered);
  }, [users, currentUser, consortiumOptions]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.getUsers();
      
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError(response.error || 'Failed to fetch users');
        showToast.error(response.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('An unexpected error occurred while fetching users');
      showToast.error('An unexpected error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    if (!canEditUsers) return;
    setEditingUser(user);
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (data: { name: string; email: string; role: string; organizations: string[]; consortia: string[] }) => {
    if (!editingUser) return;

    try {
      const response = await userService.updateUser(editingUser._id, {
        name: data.name,
        email: data.email,
        role: data.role,
        organizations: data.organizations,
        consortia: data.consortia,
      });

      if (response.success) {
        showToast.success('User updated successfully');
        setEditModalOpen(false);
        setEditingUser(null);
        fetchUsers(); // Refresh the users list
      } else {
        showToast.error(response.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast.error('An unexpected error occurred while updating user');
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const response = await userService.deleteUser(userToDelete._id);
      
      if (response.success) {
        showToast.success('User deleted successfully');
        setDeleteModalOpen(false);
        setUserToDelete(null);
        fetchUsers(); // Refresh the users list
      } else {
        showToast.error(response.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast.error('An unexpected error occurred while deleting user');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const normalizedRole = normalizeRole(role);
    switch (normalizedRole) {
      case 'Super_user':
        return 'Super User';
      case 'Admin':
        return 'Admin';
      case 'Facilitator':
        return 'Facilitator';
      case 'Organization User':
        return 'Organization User';
      default:
        return role;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch (status.toLowerCase()) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loader size="lg" variant="default" />
        <p className="text-center text-gray-500 mt-4">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    const getMessage = () => {
      if (users.length === 0) {
        return 'No users found';
      }
      if (currentUser && normalizeRole(currentUser.role) === 'Facilitator') {
        return 'No users found in your consortiums';
      }
      return 'No users available for your role level';
    };

    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">
          {getMessage()}
        </p>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Summary section */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getRoleDisplayName(user.role)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(user.status)}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center gap-3 justify-end">
                      {canEditUsers && (
                        <button
                          className="flex items-center gap-1 text-gray-700 hover:text-black text-sm font-medium cursor-pointer"
                          onClick={() => handleEditUser(user)}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 20h9"/>
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5Z"/>
                          </svg>
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6"/>
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <PageSizeSelector
                currentSize={itemsPerPage}
                onSizeChange={handlePageSizeChange}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredUsers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleUpdateUser}
        user={editingUser}
        roleOptions={roleOptions}
        organizationOptions={organizationOptions}
        consortiumOptions={consortiumOptions}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
      />
    </>
  );
};

export default UsersTable; 