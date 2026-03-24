import React from 'react';
import Button from '../common/Button';

interface ConsortiumManagementHeaderProps {
  onNewConsortium?: () => void;
  onNewOrganization?: () => void;
  onNewUser?: () => void;
  canAddUser?: boolean;
  canAddConsortium?: boolean;
  canAddOrganization?: boolean;
}

const ConsortiumManagementHeader: React.FC<ConsortiumManagementHeaderProps> = ({ 
  onNewConsortium, 
  onNewOrganization, 
  onNewUser, 
  canAddUser = true,
  canAddConsortium = true,
  canAddOrganization = true 
}) => (
  <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between px-4 md:px-0">
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-800">Consortium Management</h1>
      <p className="text-sm md:text-base text-gray-600">Manage your organizations, consortiums and users</p>
    </div>
    <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0 w-full md:w-auto">
      {canAddConsortium && (
        <Button variant="primary" size="md" onClick={onNewConsortium} className="w-full md:w-auto">+ New Consortium</Button>
      )}
      {canAddOrganization && (
        <Button variant="primary" size="md" onClick={onNewOrganization} className="w-full md:w-auto">+ New Organization</Button>
      )}
      {canAddUser && (
        <Button variant="primary" size="md" onClick={onNewUser} className="w-full md:w-auto">+ New User</Button>
      )}
    </div>
  </div>
);

export default ConsortiumManagementHeader; 