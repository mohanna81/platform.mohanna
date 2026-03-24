import React from 'react';
import { authStorage, roleHelpers } from '@/lib/utils/authStorage';
import ConsortiumSelector from './ConsortiumSelector';

const DashboardHeader = () => {

  // Get user data from localStorage
  const userData = authStorage.getUserData();
  const userName = userData?.name || 'User';

  // Function to get greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  };

  const userRole = authStorage.getUserRole();
  const hasAdminPrivileges = roleHelpers.hasAdminPrivileges();
  const isFacilitator = roleHelpers.isFacilitator();
  const isOrganizationUser = roleHelpers.isOrganization();

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{getGreeting()}, {userName}</h1>
        <div className="flex items-center gap-2">
          {/* Show consortium selector for facilitators and organization users */}
          {/* {(isFacilitator || isOrganizationUser) && <ConsortiumSelector />} */}
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {userRole || 'User'}
          </span>
        </div>
      </div>
      <p className="text-gray-600 text-lg mt-2">
        Welcome to the Risk Sharing Platform for humanitarian consortiums. 
        {hasAdminPrivileges ? ' You have administrative privileges.' : 
         isFacilitator ? ' You are a facilitator for consortium risk management.' :
         ' View your organization\'s data and manage risks.'}
      </p>
    </div>
  );
};

export default DashboardHeader; 