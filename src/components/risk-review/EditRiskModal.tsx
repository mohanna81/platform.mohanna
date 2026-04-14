import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '@/components/common/Modal';
import InputField from '@/components/common/InputField';
import TextArea from '@/components/common/TextArea';
import Button from '@/components/common/Button';
import Toggle from '@/components/common/Toggle';
import Dropdown from '@/components/common/Dropdown';
import Loader from '@/components/common/Loader';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { risksService, Risk as BaseRisk, OrgRole } from '@/lib/api/services/risks';
import { fetchConsortiaByRole, Consortium } from '@/lib/api/services/consortia';
import { Organization, organizationsService } from '@/lib/api/services/organizations';
import { useAuth } from '@/lib/auth/AuthContext';
import { showToast } from '@/lib/utils/toast';

export interface EditRiskFormData {
  title: string;
  category: string;
  statement: string;
  trigger: string;
  triggerActive: boolean;
  mitigation: string;
  preventive: string;
  reactive: string;
  orgRoles: { orgId: string; orgName: string; value: string }[];
  likelihood: string;
  severity: string;
  consortium: string[];
}

// Extend Risk type to include the additional fields
interface ExtendedRisk extends BaseRisk {
  preventiveMeasures?: string;
  reactiveMeasures?: string;
  triggerStatus?: string;
  likelihood?: string;
  severity?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'safety', label: 'Safety' },
  { value: 'security', label: 'Security' },
  { value: 'fiduciary', label: 'Fiduciary' },
  { value: 'legal_compliance', label: 'Legal / Compliance' },
  { value: 'operational', label: 'Operational' },
  { value: 'reputational', label: 'Reputational' },
  { value: 'information', label: 'Information' },
  { value: 'ethical', label: 'Ethical' },
];

const LIKELIHOOD_OPTIONS = [
  { value: '', label: 'Select Likelihood' },
  { value: '1', label: 'Rare: May occur only in exceptional cases' },
  { value: '2', label: 'Unlikely: Could occur at some time, but uncommon' },
  { value: '3', label: 'Possible: Might occur at some point' },
  { value: '4', label: 'Likely: Expected to occur in many cases' },
  { value: '5', label: 'Almost Certain: Will almost certainly occur' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'Select Severity (Impact)' },
  { value: '1', label: 'Insignificant: Minimal impact; negligible consequences' },
  { value: '2', label: 'Minor: Limited impact, quickly recoverable' },
  { value: '3', label: 'Moderate: Noticeable impact on operations or outcomes' },
  { value: '4', label: 'Major: Serious impact; requires intervention' },
  { value: '5', label: 'Critical: Severe impact; threatens project success' },
];

const EditRiskModal = ({ isOpen, onClose, onSubmit, riskId, onUpdated }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  riskId: string;
  onUpdated?: () => void;
}) => {
  const { user } = useAuth();
  const [form, setForm] = useState<EditRiskFormData>({
    title: '',
    category: '',
    statement: '',
    trigger: '',
    triggerActive: false,
    mitigation: '',
    preventive: '',
    reactive: '',
    orgRoles: [],
    likelihood: '',
    severity: '',
    consortium: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [consortia, setConsortia] = useState<Array<{ value: string; label: string }>>([]);
  const [consortiumOrganizations, setConsortiumOrganizations] = useState<Organization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const hasFetchedData = useRef(false);
  // Cache raw consortia so we don't re-fetch them multiple times
  const rawConsortiaCache = useRef<Consortium[]>([]);
  // Track whether the initial load has set form.consortium to skip the effect re-trigger
  const isInitialConsortiumSet = useRef(false);

  // Check if user can delete risks (Admin or Super User)
  const canDelete = user?.role === 'Admin' || user?.role === 'Super_user';
  
  // Check if user is a facilitator
  const isFacilitator = user?.role === 'Facilitator';

  // Helper function to fetch organization details by ID
  const fetchOrganizationDetails = useCallback(async (orgId: string): Promise<{ _id: string; name: string } | null> => {
    try {
      const response = await organizationsService.getOrganizationById(orgId);
      
      if (response.success && response.data?.data) {
        const org = response.data.data;
        return {
          _id: org._id || org.id,
          name: org.name
        };
      } else {
      }
    } catch (error) {
      console.error(`Error fetching organization details for ID ${orgId}:`, error);
    }
    return null;
  }, []);

  // Resolve org IDs to Organization objects in parallel
  const resolveOrgIds = useCallback(async (orgIds: string[]): Promise<Organization[]> => {
    const results = await Promise.all(
      orgIds.map(async (orgId) => {
        const orgDetails = await fetchOrganizationDetails(orgId);
        if (orgDetails) {
          return { _id: orgDetails._id, id: orgDetails._id, name: orgDetails.name, status: 'Active', email: '', createdAt: '', updatedAt: '' } as Organization;
        }
        return { _id: orgId, id: orgId, name: `Organization ${orgId.slice(-4)}`, status: 'Active', email: '', createdAt: '', updatedAt: '' } as Organization;
      })
    );
    return results;
  }, [fetchOrganizationDetails]);

  // Helper function to map orgRoles from API format to form format
  const mapOrgRolesFromAPI = useCallback(async (orgRoles: OrgRole[] | undefined, consortium: Consortium[] | undefined) => {
    const seenIds = new Set<string>();
    const objectOrgs: Array<{ _id?: string; id?: string; name?: string }> = [];
    const stringOrgIds: string[] = [];

    if (consortium && Array.isArray(consortium)) {
      for (const consortiumItem of consortium) {
        for (const org of (consortiumItem.organizations || [])) {
          if (typeof org === 'object' && org !== null) {
            const id = org._id || org.id || '';
            if (id && !seenIds.has(id)) {
              seenIds.add(id);
              objectOrgs.push(org);
            }
          } else if (typeof org === 'string' && !seenIds.has(org)) {
            seenIds.add(org);
            stringOrgIds.push(org);
          }
        }
      }
    }

    // Resolve all string IDs in parallel
    const resolvedOrgs = await resolveOrgIds(stringOrgIds);
    const consortiumOrgs = [...objectOrgs, ...resolvedOrgs];

    // Build lookup map for existing orgRoles
    const existingOrgRolesMap = new Map<string, string>();
    if (orgRoles && Array.isArray(orgRoles)) {
      orgRoles.forEach(orgRole => {
        if (orgRole.organization?._id) {
          existingOrgRolesMap.set(orgRole.organization._id, orgRole.role || '');
        }
      });
    }

    const mappedOrgRoles: Array<{ orgId: string; orgName: string; value: string }> = [];

    // First, existing orgRoles with non-empty roles
    if (orgRoles && Array.isArray(orgRoles)) {
      orgRoles.forEach(orgRole => {
        if (orgRole.organization?._id && orgRole.role?.trim()) {
          mappedOrgRoles.push({
            orgId: orgRole.organization._id,
            orgName: orgRole.organization.name || 'Unknown Organization',
            value: orgRole.role
          });
        }
      });
    }

    // Then, remaining consortium organizations
    const alreadyMapped = new Set(mappedOrgRoles.map(r => r.orgId));
    consortiumOrgs.forEach((org) => {
      const orgId = org._id || org.id || '';
      if (orgId && !alreadyMapped.has(orgId)) {
        mappedOrgRoles.push({
          orgId,
          orgName: org.name || 'Unknown Organization',
          value: existingOrgRolesMap.get(orgId) || ''
        });
      }
    });

    return mappedOrgRoles;
  }, [resolveOrgIds]);

  // Fetch consortia based on user role (cached in ref)
  const fetchConsortia = useCallback(async () => {
    try {
      const consortiaData = await fetchConsortiaByRole(user);
      rawConsortiaCache.current = consortiaData;
      const consortiaOptions = consortiaData.map(consortium => ({
        value: consortium._id || consortium.id || '',
        label: consortium.name || 'Unknown Consortium'
      }));
      setConsortia(consortiaOptions);
      return consortiaData;
    } catch (error) {
      console.error('Error fetching consortia:', error);
      showToast.error('Failed to load consortia');
      return [];
    }
  }, [user]);

  // Fetch organizations for the risk's consortiums — uses cached consortia, never re-fetches
  const fetchConsortiumOrganizations = useCallback(async (consortiumIds: string[], preloadedConsortia?: Consortium[]) => {
    if (!consortiumIds || consortiumIds.length === 0) {
      setConsortiumOrganizations([]);
      return;
    }

    setLoadingOrganizations(true);
    try {
      // Use pre-loaded data, cached data, or fetch as last resort
      const allConsortia = preloadedConsortia || rawConsortiaCache.current.length > 0
        ? (preloadedConsortia || rawConsortiaCache.current)
        : await fetchConsortiaByRole(user);

      if (!preloadedConsortia && rawConsortiaCache.current.length === 0) {
        rawConsortiaCache.current = allConsortia;
      }

      const riskConsortia = allConsortia.filter(c =>
        consortiumIds.includes(c._id || c.id || '')
      );

      if (riskConsortia.length === 0) {
        setConsortiumOrganizations([]);
        return;
      }

      const seenIds = new Set<string>();
      const objectOrgs: Organization[] = [];
      const stringOrgIds: string[] = [];

      for (const consortium of riskConsortia) {
        for (const org of (consortium.organizations || [])) {
          if (typeof org === 'object' && org !== null) {
            const id = org._id || org.id || '';
            if (id && !seenIds.has(id)) {
              seenIds.add(id);
              objectOrgs.push(org as Organization);
            }
          } else if (typeof org === 'string' && !seenIds.has(org)) {
            seenIds.add(org);
            stringOrgIds.push(org);
          }
        }
      }

      // Resolve string IDs in parallel
      const resolvedOrgs = await resolveOrgIds(stringOrgIds);
      setConsortiumOrganizations([...objectOrgs, ...resolvedOrgs]);
    } catch (error) {
      console.error('Error fetching consortium organizations:', error);
      showToast.error('Failed to load consortium organizations');
      setConsortiumOrganizations([]);
    } finally {
      setLoadingOrganizations(false);
    }
  }, [user, resolveOrgIds]);

  // Fetch risk data when modal opens
  const fetchRiskData = useCallback(async (preloadedConsortia?: Consortium[]) => {
    if (!riskId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await risksService.getRiskById(riskId);
      if (response.data?.success && response.data?.data) {
        const risk = response.data.data as ExtendedRisk;
        const riskConsortia = risk.consortium as unknown as Consortium[];

        // Run org-role mapping and consortium org fetch in parallel
        const consortiumIds = risk.consortium ? risk.consortium.map(c => c._id || '').filter(Boolean) : [];
        const [mappedOrgRoles] = await Promise.all([
          mapOrgRolesFromAPI(risk.orgRoles, riskConsortia),
          consortiumIds.length > 0
            ? fetchConsortiumOrganizations(consortiumIds, preloadedConsortia)
            : Promise.resolve(),
        ]);

        isInitialConsortiumSet.current = true;
        setForm({
          title: risk.title || '',
          category: risk.category || '',
          statement: risk.statement || '',
          trigger: risk.triggerIndicator || '',
          triggerActive: risk.triggerStatus === 'Triggered',
          mitigation: risk.mitigationMeasures || '',
          preventive: risk.preventiveMeasures || '',
          reactive: risk.reactiveMeasures || '',
          orgRoles: mappedOrgRoles,
          likelihood: risk.likelihood || '',
          severity: risk.severity || '',
          consortium: consortiumIds,
        });
      } else {
        setError('Failed to load risk data');
        showToast.error('Failed to load risk data');
      }
    } catch (error) {
      console.error('Error loading risk data:', error);
      setError('Error loading risk data');
      showToast.error('Error loading risk data');
    } finally {
      setLoading(false);
    }
  }, [riskId, fetchConsortiumOrganizations, mapOrgRolesFromAPI]);

  useEffect(() => {
    if (isOpen && riskId && user && !hasFetchedData.current) {
      hasFetchedData.current = true;
      // Fetch consortia first, then pass cached data into fetchRiskData to avoid redundant API calls
      fetchConsortia().then(loadedConsortia => fetchRiskData(loadedConsortia));
    }
  }, [isOpen, riskId, user, fetchConsortia, fetchRiskData]);

  // Reset fetch flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasFetchedData.current = false;
      isInitialConsortiumSet.current = false;
      rawConsortiaCache.current = [];
    }
  }, [isOpen]);

  // Update organizations when user manually changes consortium (not on initial load)
  useEffect(() => {
    if (isInitialConsortiumSet.current) {
      // Skip the first time (set during fetchRiskData); only run on subsequent user changes
      isInitialConsortiumSet.current = false;
      return;
    }
    if (form.consortium && form.consortium.length > 0) {
      fetchConsortiumOrganizations(form.consortium);
    } else {
      setConsortiumOrganizations([]);
    }
  }, [form.consortium, fetchConsortiumOrganizations]);



  // Remove the conflicting updateOrgRolesFromOrganizations function and its useEffect
  // The mapOrgRolesFromAPI function already handles the proper mapping

  // Update orgRoles with proper organization names when consortiumOrganizations changes
  // This only updates names, doesn't change the structure
  useEffect(() => {
    if (consortiumOrganizations.length > 0 && form.orgRoles.length > 0) {
      setForm(prev => {
        const updatedOrgRoles = prev.orgRoles.map(role => {
          const org = consortiumOrganizations.find(org => org._id === role.orgId);
          if (org && org.name !== role.orgName) {
          }
          return {
            ...role,
            orgName: org?.name || role.orgName
          };
        });
        return { ...prev, orgRoles: updatedOrgRoles };
      });
    }
  }, [consortiumOrganizations, form.orgRoles.length]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => {
      if (field === 'consortium') {
        // For consortium, we maintain the array structure but update the first element
        const newConsortium = prev.consortium.length > 0 ? [value] : [value];
        return { ...prev, [field]: newConsortium };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleToggleChange = (checked: boolean) => {
    setForm(prev => ({ ...prev, triggerActive: checked }));
  };

  const handleOrgRoleChange = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      orgRoles: prev.orgRoles.map((role, i) => 
        i === index ? { ...role, value } : role
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskId) return;
    setSubmitting(true);
    try {
      // Convert orgRoles back to the format expected by the backend
      // Only include orgRoles that contain data (non-empty role values)
      const formattedOrgRoles = form.orgRoles
        .filter(role => role.value && role.value.trim() !== '')
        .map(role => {
          const org = consortiumOrganizations.find(org => org._id === role.orgId);
          return {
            organization: {
              _id: role.orgId,
              name: org?.name || role.orgName,
              type: 'Schema.Types.ObjectId',
              ref: 'Organization'
            },
            role: role.value
          };
        });

      await risksService.updateRisk(riskId, {
        title: form.title,
        category: form.category,
        statement: form.statement,
        triggerIndicator: form.trigger,
        mitigationMeasures: form.mitigation,
        preventiveMeasures: form.preventive,
        reactiveMeasures: form.reactive,
        triggerStatus: form.triggerActive ? 'Triggered' : 'Not Triggered',
        orgRoles: formattedOrgRoles,
        likelihood: form.likelihood,
        severity: form.severity,
        consortium: form.consortium ? [form.consortium] : [],
      } as unknown as Partial<ExtendedRisk>);
      showToast.success('Risk updated successfully');
      setSubmitting(false);
      onClose();
      onSubmit();
      if (onUpdated) onUpdated();
    } catch (err) {
      setSubmitting(false);
      setError('Failed to update risk');
      console.error('Error updating risk:', err);
      showToast.error('Failed to update risk');
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!riskId) return;
    
    setDeleting(true);
    try {
      await risksService.deleteRisk(riskId);
      showToast.success('Risk deleted successfully');
      setDeleteModalOpen(false);
      onClose();
      onSubmit();
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error('Error deleting risk:', error);
      showToast.error('Failed to delete risk');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Risk" size="xl" showCloseButton>
      <p className="text-gray-700 mb-6 text-sm sm:text-base">Make changes to the risk information</p>
      
      {loading ? (
        <div className="py-8">
          <Loader size="md" variant="default" />
          <p className="text-center text-gray-500 mt-4">Loading risk data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchRiskData} variant="primary">Retry</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 text-black max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Basic Information</h3>
            
            <InputField
              label="Title"
              value={form.title}
              onChange={val => handleChange('title', val)}
              required
              disabled={!isFacilitator}
            />
            
            <Dropdown
              label="Consortium"
              options={consortia}
              value={form.consortium.length > 0 ? form.consortium[0] : ''}
              onChange={val => handleChange('consortium', val)}
              required
              fullWidth
              disabled
            />
            
            <Dropdown
              label="Category"
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={val => handleChange('category', val)}
              required
              disabled={!isFacilitator}
            />
            
            <TextArea
              label="Statement"
              value={form.statement}
              onChange={val => handleChange('statement', val)}
              required
              rows={3}
              disabled={!isFacilitator}
            />
          </div>

          {/* Risk Indicators & Mitigation Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Risk Indicators & Mitigation</h3>
            
            {/* Likelihood and Severity dropdowns */}
            <div className="flex flex-col gap-4">
              <Dropdown
                label="Likelihood"
                options={LIKELIHOOD_OPTIONS}
                value={form.likelihood}
                onChange={val => handleChange('likelihood', val)}
                required
                fullWidth
                disabled={!isFacilitator}
              />
              <Dropdown
                label="Severity (Impact)"
                options={SEVERITY_OPTIONS}
                value={form.severity}
                onChange={val => handleChange('severity', val)}
                required
                fullWidth
                disabled={!isFacilitator}
              />
              <InputField
                label="Risk Score"
                value={
                  form.likelihood && form.severity
                    ? String(Number(form.likelihood) * Number(form.severity))
                    : ''
                }
                disabled
                fullWidth
                helperText="Calculated as Likelihood × Severity (1-25)"
              />
            </div>
            
            <TextArea
              label="Trigger Indicator"
              value={form.trigger}
              onChange={val => handleChange('trigger', val)}
              rows={3}
              disabled={!isFacilitator}
            />
            
            <Toggle
              label="Risk trigger status"
              checked={form.triggerActive}
              onChange={handleToggleChange}
              showWarningIcon={true}
              className="py-2"
            />
            
            <TextArea
              label="Mitigation"
              value={form.mitigation}
              onChange={val => handleChange('mitigation', val)}
              rows={3}
            />
          </div>

          {/* Response Measures Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Response Measures</h3>
            
            <TextArea
              label="Preventive Measures"
              value={form.preventive}
              onChange={val => handleChange('preventive', val)}
              rows={3}
            />
            
            <TextArea
              label="Reactive Measures"
              value={form.reactive}
              onChange={val => handleChange('reactive', val)}
              rows={3}
            />
          </div>

          {/* Organization Roles Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Organization Roles</h3>
            <p className="text-sm text-gray-600 mb-4">
              {form.consortium 
                ? `Define the role of each organization in the selected consortium for mitigating this risk.`
                : 'Please select a consortium first to see organization roles.'
              }
            </p>
            
            {(() => {
              
              if (loadingOrganizations) {
                return (
                  <div className="py-4">
                    <Loader size="sm" variant="default" />
                    <p className="text-center text-gray-500 mt-2 text-sm">Loading organizations...</p>
                  </div>
                );
              } else if (form.consortium && form.orgRoles.length > 0) {
                return form.orgRoles.map((role, index) => (
                  <div key={role.orgId || index} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {role.orgName || `Organization ${index + 1}`}
                    </label>
                    <TextArea
                      value={role.value || ''}
                      onChange={val => handleOrgRoleChange(index, val)}
                      rows={2}
                      placeholder={`Enter ${role.orgName || `Organization ${index + 1}`}'s role in mitigating this risk`}
                      disabled={!isFacilitator}
                    />
                  </div>
                ));
              } else if (form.consortium && form.orgRoles.length === 0) {
                return (
                  <div className="text-sm text-gray-500 italic">
                    No organizations found in the selected consortium.
                  </div>
                );
              } else {
                return (
                  <div className="text-sm text-gray-500 italic">
                    No consortium selected. Please select a consortium to see organization roles.
                  </div>
                );
              }
            })()}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
            {canDelete && (
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleDeleteClick} 
                disabled={submitting || deleting}
                className="mr-auto"
              >
                Delete Risk
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      )}
     
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the risk "${form.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={deleting}
      />
    </Modal>
  );
};

export default EditRiskModal; 