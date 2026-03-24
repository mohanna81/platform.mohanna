import React, { useEffect, useState, useCallback } from 'react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Dropdown from '../common/Dropdown';
import TextArea from '../common/TextArea';
import Modal from '../common/Modal';
import { fetchConsortiaByRole } from '@/lib/api/services/consortia';
import { fetchOrganizationsByConsortia } from '@/lib/api/services/organizations';
import { risksService, CreateRiskRequest, Risk } from '@/lib/api/services/risks';
import { useAuth } from '@/lib/auth/AuthContext';

const riskCategories = [
  { value: '', label: 'Select a risk category' },
  { value: 'safety', label: 'Safety' },
  { value: 'security', label: 'Security' },
  { value: 'fiduciary', label: 'Fiduciary' },
  { value: 'legal_compliance', label: 'Legal / Compliance' },
  { value: 'operational', label: 'Operational' },
  { value: 'reputational', label: 'Reputational' },
  { value: 'information', label: 'Information' },
  { value: 'ethical', label: 'Ethical' },
];

interface NewRiskModalProps {
  isOpen: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  editMode?: boolean;
  riskId?: string;
  onUpdated?: () => void;
}

const NewRiskModal: React.FC<NewRiskModalProps> = ({ isOpen, onClose, editMode = false, riskId, onUpdated }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [consortium, setConsortium] = useState('');
  const [consortia, setConsortia] = useState<{ _id: string; name: string }[]>([]);
  const [consortiumOrganizations, setConsortiumOrganizations] = useState<{ _id: string; name: string }[]>([]);
  const [statement, setStatement] = useState('');
  const [trigger, setTrigger] = useState('');
  const [mitigation, setMitigation] = useState('');
  const [likelihood, setLikelihood] = useState('');
  const [severity, setSeverity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [originalRiskStatus, setOriginalRiskStatus] = useState<string>('');
  const [submitAction, setSubmitAction] = useState<'save' | 'submit'>('save');

  // Reset form to initial state
  const resetForm = () => {
    setTitle('');
    setCategory('');
    setConsortium('');
    setStatement('');
    setTrigger('');
    setMitigation('');
    setLikelihood('');
    setSeverity('');
    setIsSubmitting(false);
    setErrors({});
    setLoading(false);
    setOriginalRiskStatus('');
    setSubmitAction('save');
  };

  // Fetch risk data for edit mode
  const fetchRiskData = useCallback(async () => {
    if (!riskId || !editMode) return;
    
    setLoading(true);
    try {
      const response = await risksService.getRiskById(riskId);
      if (response.data?.success && response.data?.data) {
        const risk = response.data.data as Risk;
        
        setTitle(risk.title || '');
        setCategory(risk.category || '');
        setStatement(risk.statement || '');
        setTrigger(risk.triggerIndicator || '');
        setMitigation(risk.mitigationMeasures || '');
        setLikelihood(risk.likelihood || '');
        setSeverity(risk.severity || '');
        setConsortium(risk.consortium && risk.consortium.length > 0 ? risk.consortium[0]._id || '' : '');
        setOriginalRiskStatus(risk.status || '');
      }
    } catch (error) {
      console.error('Error loading risk data:', error);
    } finally {
      setLoading(false);
    }
  }, [riskId, editMode]);

  useEffect(() => {
    if (isOpen && user) {
      // Reset submit action when modal opens
      setSubmitAction('save');
      
      async function fetchConsortia() {
        console.log('NewRiskModal - Current user:', user);
        console.log('NewRiskModal - User role:', user?.role);
        console.log('NewRiskModal - User ID:', user?.id);
        
        const consortia = await fetchConsortiaByRole(user);
        console.log('NewRiskModal - Fetched consortiums:', consortia);
        setConsortia(consortia);
      }
      fetchConsortia();
    } else if (!isOpen) {
      // Reset form when modal closes
      resetForm();
    }
  }, [isOpen, user]);

  // Fetch risk data when modal opens in edit mode
  useEffect(() => {
    if (isOpen && editMode && riskId) {
      fetchRiskData();
    }
  }, [isOpen, editMode, riskId, fetchRiskData]);

  // Fetch organizations when consortium changes
  useEffect(() => {
    if (consortium && user) {
      async function fetchConsortiumOrganizations() {
        try {
          if (editMode && riskId) {
            // In edit mode, fetch organizations from the risk's consortiums
            const organizations = await fetchOrganizationsByConsortia([consortium], user);
            setConsortiumOrganizations(organizations);
          } else {
            // In create mode, fetch organizations from the selected consortium
            const organizations = await fetchOrganizationsByConsortia([consortium], user);
            setConsortiumOrganizations(organizations);
          }
        } catch (error) {
          console.error('Error fetching consortium organizations:', error);
          setConsortiumOrganizations([]);
        }
      }
      fetchConsortiumOrganizations();
    } else {
      setConsortiumOrganizations([]);
    }
  }, [consortium, user, editMode, riskId]);

  const consortiumOptions = [
    { value: '', label: 'Select a consortium' },
    ...consortia.map(c => ({ value: c._id, label: c.name })),
  ];

  const likelihoodOptions = [
    { value: '', label: 'Select Likelihood' },
    { value: '1', label: 'Rare: May occur only in exceptional cases' },
    { value: '2', label: 'Unlikely: Could occur at some time, but uncommon' },
    { value: '3', label: 'Possible: Might occur at some point' },
    { value: '4', label: 'Likely: Expected to occur in many cases' },
    { value: '5', label: 'Almost Certain: Will almost certainly occur' },
  ];

  const severityOptions = [
    { value: '', label: 'Select Severity (Impact)' },
    { value: '1', label: 'Insignificant: Minimal impact; negligible consequences' },
    { value: '2', label: 'Minor: Limited impact, quickly recoverable' },
    { value: '3', label: 'Moderate: Noticeable impact on operations or outcomes' },
    { value: '4', label: 'Major: Serious impact; requires intervention' },
    { value: '5', label: 'Critical: Severe impact; threatens project success' },
  ];

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!category) newErrors.category = 'Category is required.';
    if (!consortium) newErrors.consortium = 'Consortium is required.';
    if (!statement.trim()) newErrors.statement = 'Risk statement is required.';
    if (!likelihood) newErrors.likelihood = 'Likelihood is required.';
    if (!severity) newErrors.severity = 'Severity is required.';
    if (!trigger.trim()) newErrors.trigger = 'Trigger indicator is required.';
    if (!mitigation.trim()) newErrors.mitigation = 'Mitigation measures are required.';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent, action?: 'save' | 'submit') => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setIsSubmitting(true);
    
    try {
      if (editMode && riskId) {
        // Update existing risk
        const currentAction = action || submitAction;
        let newStatus = 'Pending'; // Default to Pending
        if (originalRiskStatus === 'Draft' && currentAction === 'save') {
          newStatus = 'Draft'; // Keep as Draft if saving
        } else if (originalRiskStatus === 'Draft' && currentAction === 'submit') {
          newStatus = 'Pending'; // Submit for review
        } else if (originalRiskStatus === 'Rejected') {
          newStatus = 'Pending'; // Re-submit after rejection
        }
        console.log('Updating risk with status:', newStatus, 'action:', currentAction, 'originalStatus:', originalRiskStatus);
        await risksService.updateRisk(riskId, {
          title,
          category,
          consortium: consortium ? [consortium] : [],
          statement,
          likelihood,
          severity,
          triggerIndicator: trigger,
          mitigationMeasures: mitigation,
          status: newStatus,
        } as unknown as Partial<Risk>);
        console.log('Risk updated successfully with status:', newStatus);
        if (onUpdated) onUpdated();
      } else {
        // Create new risk
        const payload: CreateRiskRequest = {
          title,
          category,
          consortium: consortium ? [consortium] : [],
          organization: [], // TODO: Add organization selection if needed
          statement,
          likelihood,
          severity,
          triggerIndicator: trigger,
          mitigationMeasures: mitigation,
          preventiveMeasures: '', // TODO: Add field if needed
          reactiveMeasures: '', // TODO: Add field if needed
          status: 'Draft',
          triggerStatus: 'Not Triggered',
          orgRoles: consortiumOrganizations.map(org => ({
            organization: {
              _id: org._id || '',
              name: org.name || '',
              type: 'Schema.Types.ObjectId',
              ref: 'Organization'
            },
            role: '' // Default empty role, will be filled by backend or user input
          })),
          code: '', // TODO: Add code if needed
          createdBy: user?.id || '',
        };
        await risksService.createRisk(payload);
      }
      setIsSubmitting(false);
      onClose(true);
    } catch (error) {
      console.error('Error saving risk:', error);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={editMode ? "Edit Risk" : "Register New Risk"} size="xl" showCloseButton={true}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading risk data...</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editMode ? "Edit Risk" : "Register New Risk"} size="xl" showCloseButton={true}>
      <p className="text-gray-700 mb-6 text-sm sm:text-base">
        {editMode ? "Update the details of the risk and re-submit for review." : "Enter the details of the risk your organization is facing."}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 text-black max-h-[70vh] overflow-y-auto pr-2">
        <InputField
          label="Risk Title"
          placeholder="Eg. Payment Delay Risk"
          value={title}
          onChange={setTitle}
          required
          error={errors.title}
        />
        <div className="flex gap-4">
          <div className="flex-1">
            <Dropdown
              label="Risk Category"
              options={riskCategories}
              value={category}
              onChange={setCategory}
              size="md"
              fullWidth
              required
              error={errors.category}
            />
          </div>
          <div className="flex-1">
            <Dropdown
              label="Consortium"
              options={consortiumOptions}
              value={consortium}
              onChange={setConsortium}
              size="md"
              fullWidth
              required
              error={errors.consortium}
            />
          </div>
        </div>
        {/* Risk Statement Format Box */}
        <div className="bg-yellow-100 border-l-4 border-yellow-400 rounded p-4 mb-2">
          <div className="font-semibold text-gray-800 mb-1">Risk Statement Format</div>
          <div className="text-gray-700 text-sm mb-1">Structure your risk statement following this format: <span className="font-normal">&quot;Due to [cause/source], there is a possibility of [risk event] that could [impact/consequence].&quot;</span></div>
          <div className="text-gray-600 text-xs italic">Example: &quot;Due to delays in donor fund transfers, there is a possibility of cash flow disruption that could delay implementation of critical activities.&quot;</div>
        </div>
        <TextArea
          placeholder="Due to [cause/source], there is a possibility of [risk event] that could [impact/consequence]."
          value={statement}
          onChange={setStatement}
          required
          rows={3}
          error={errors.statement}
        />
        {/* Likelihood and Severity dropdowns, now stacked vertically */}
        <div className="flex flex-col gap-4 mt-4">
          <Dropdown
            label="Likelihood"
            options={likelihoodOptions}
            value={likelihood}
            onChange={setLikelihood}
            required
            fullWidth
            error={errors.likelihood}
          />
          <Dropdown
            label="Severity (Impact)"
            options={severityOptions}
            value={severity}
            onChange={setSeverity}
            required
            fullWidth
            error={errors.severity}
          />
          <InputField
            label="Risk Score"
            value={
              likelihood && severity
                ? String(Number(likelihood) * Number(severity))
                : ''
            }
            disabled
            fullWidth
            helperText="Calculated as Likelihood × Severity (1-25)"
          />
        </div>
        <InputField
          label={<span>Trigger Indicator <span title="An early warning sign that the risk might materialize" className="inline-flex items-center justify-center align-middle cursor-pointer text-gray-400 hover:text-gray-700 border border-gray-300 rounded-full w-4 h-4 text-xs ml-1">?</span></span>}
          placeholder="Eg. Donor transfers not received 14 days before scheduled activities"
          value={trigger}
          onChange={setTrigger}
          error={errors.trigger}
        />
        <TextArea
          label={<span>Mitigation Measures <span title="Actions to reduce the likelihood or impact of this risk" className="inline-flex items-center justify-center align-middle cursor-pointer text-gray-400 hover:text-gray-700 border border-gray-300 rounded-full w-4 h-4 text-xs ml-1">?</span></span>}
          placeholder="Describe the actions that can be taken to prevent this risk or reduce its impact if it occurs."
          value={mitigation}
          onChange={setMitigation}
          rows={3}
          error={errors.mitigation}
        />
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={() => onClose()} disabled={isSubmitting}>Cancel</Button>
          {editMode && originalRiskStatus === 'Draft' ? (
            <>
              <Button 
                type="button" 
                variant="outline" 
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e, 'save')}
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button 
                type="button" 
                variant="primary" 
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e, 'submit')}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </>
          ) : (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editMode ? 'Update & Re-submit' : 'Save as Draft'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default NewRiskModal; 