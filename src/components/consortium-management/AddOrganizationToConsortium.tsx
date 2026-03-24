import React, { useState, useEffect, useCallback } from 'react';
import Button from '../common/Button';
import { consortiaService, Organization, Consortium } from '@/lib/api';
import { showToast } from '@/lib/utils/toast';
import Loader from '../common/Loader';
import { fetchConsortiaByRole } from '@/lib/api/services/consortia';
import { useAuth } from '@/lib/auth/AuthContext';
import { fetchOrganizationsByRole } from '@/lib/api/services/organizations';

interface AddOrganizationToConsortiumProps {
  refreshKey?: number;
  onSuccess?: () => void;
}

const AddOrganizationToConsortium: React.FC<AddOrganizationToConsortiumProps> = ({ 
  refreshKey = 0, 
  onSuccess 
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [consortia, setConsortia] = useState<Consortium[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [selectedConsortium, setSelectedConsortium] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      setError(null);

      // Fetch organizations and consortia in parallel
      const [organizations, consortia] = await Promise.all([
        fetchOrganizationsByRole(user),
        fetchConsortiaByRole(user)
      ]);

      if (Array.isArray(organizations)) {
        setOrganizations(organizations);
      } else {
        console.error('Failed to fetch organizations');
        setOrganizations([]);
      }

      if (Array.isArray(consortia)) {
        setConsortia(consortia);
      } else {
        console.error('Failed to fetch consortia');
        setConsortia([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
      showToast.error('Failed to load organizations and consortia');
      // Set empty arrays to prevent undefined errors
      setOrganizations([]);
      setConsortia([]);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleAddToConsortium = async () => {
    if (!selectedOrganization || !selectedConsortium) {
      showToast.error('Please select both organization and consortium');
      return;
    }

    try {
      setLoading(true);

      // Use the new dedicated API endpoint to add organization to consortium
      const response = await consortiaService.addOrganizationToConsortium({
        organizationId: selectedOrganization,
        consortiumId: selectedConsortium
      });

      if (response.success) {
        showToast.success('Organization added to consortium successfully!');
        setSelectedOrganization('');
        setSelectedConsortium('');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showToast.error(response.error || 'Failed to add organization to consortium');
      }
    } catch (error) {
      console.error('Error adding organization to consortium:', error);
      showToast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="py-12">
        <Loader size="lg" variant="default" />
        <p className="text-center text-gray-500 mt-4">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={fetchData}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow p-6 mb-6">
      <h2 className="font-semibold mb-4 text-gray-800">Add Organization to Consortium</h2>
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-gray-700">Select Organization</label>
          <select 
            className="w-full border rounded px-3 py-2 text-gray-800 bg-white"
            value={selectedOrganization}
            onChange={(e) => setSelectedOrganization(e.target.value)}
          >
            <option value="">Select organization</option>
            {organizations.map((org) => (
              <option key={org._id || org.id} value={org._id || org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-gray-700">Select Consortium</label>
          <select 
            className="w-full border rounded px-3 py-2 text-gray-800 bg-white"
            value={selectedConsortium}
            onChange={(e) => setSelectedConsortium(e.target.value)}
          >
            <option value="">Select consortium</option>
            {consortia
              .filter(consortium => consortium.status === 'Active')
              .map((consortium) => (
                <option key={consortium._id || consortium.id} value={consortium._id || consortium.id}>
                  {consortium.name}
                </option>
              ))}
          </select>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          onClick={handleAddToConsortium}
          disabled={loading || !selectedOrganization || !selectedConsortium}
        >
          {loading ? 'Adding...' : 'Add to Consortium'}
        </Button>
      </div>
    </div>
  );
};

export default AddOrganizationToConsortium; 