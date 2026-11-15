import React from 'react';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';
import InputField from '../common/InputField';
import TextArea from '../common/TextArea';
import Modal from '../common/Modal';
import { risksService, Risk } from '@/lib/api/services/risks';
import { showToast } from '@/lib/utils/toast';
import { Consortium } from '@/lib/api/services/consortia';

export type AssignActionFormData = {
  title: string;
  description: string;
  consortium: string;
  assignTo: string; // Organization (required)
  assignToUsers: string[]; // Users (one or more required)
  date: string;
  relatedRisks: string[];
};

interface AssignActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssignActionFormData) => void;
  consortiumOptions: { value: string; label: string }[];
  orgOptions: { value: string; label: string }[];
  rawConsortia?: Consortium[];
  userOptions: { value: string; label: string }[];
  // Called whenever the consortium or the assigned organization changes,
  // with both current values, so the parent can refetch the user list
  // scoped to whichever of them narrows it furthest.
  onFilterChange?: (consortiumId: string, organizationId: string) => void;
}

const AssignActionModal: React.FC<AssignActionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  consortiumOptions,
  orgOptions,
  rawConsortia = [],
  userOptions,
  onFilterChange,
}) => {
  const [form, setForm] = React.useState<AssignActionFormData>({
    title: '',
    description: '',
    consortium: '',
    assignTo: '',
    assignToUsers: [],
    date: '',
    relatedRisks: [],
  });
  const [availableRisks, setAvailableRisks] = React.useState<Risk[]>([]);

  // Filter orgs to only those in the selected consortium
  const filteredOrgOptions = React.useMemo(() => {
    if (!form.consortium || rawConsortia.length === 0) return orgOptions;
    const consortium = rawConsortia.find(c => (c._id || c.id) === form.consortium);
    if (!consortium?.organizations) return [];
    const orgIds = new Set(
      consortium.organizations.map(o =>
        typeof o === 'string' ? o : (o._id || o.id || '')
      )
    );
    return orgOptions.filter(o => orgIds.has(o.value));
  }, [form.consortium, rawConsortia, orgOptions]);

  // Fetch approved risks when consortium or the assigned organization changes
  React.useEffect(() => {
    if (!form.consortium) { setAvailableRisks([]); return; }
    risksService.getRisks().then(res => {
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const approved = res.data.data.filter((r: Risk) => {
          const isApproved = r.status === 'Approved';
          const inConsortium = Array.isArray(r.consortium)
            ? r.consortium.some((c: unknown) => {
                if (typeof c === 'string') return c === form.consortium;
                if (c && typeof c === 'object') return (c as { _id?: string; id?: string })._id === form.consortium || (c as { _id?: string; id?: string }).id === form.consortium;
                return false;
              })
            : false;
          // Once an organization is selected, narrow risks down further to
          // the ones that organization is actually related to.
          const inOrg = !form.assignTo || (Array.isArray(r.organization) && r.organization.some((o: unknown) => {
            const id = typeof o === 'string' ? o : (o as { _id?: string; id?: string })?._id || (o as { _id?: string; id?: string })?.id;
            return id === form.assignTo;
          }));
          return isApproved && inConsortium && inOrg;
        });
        setAvailableRisks(approved);

        // Drop any previously selected risks that no longer qualify, tied
        // to the fetch resolving so it never fires against the transient
        // empty list while the fetch is still in flight.
        const validIds = new Set(approved.map((r: Risk) => r._id));
        setForm(prev => {
          const pruned = prev.relatedRisks.filter(id => validIds.has(id));
          if (pruned.length === prev.relatedRisks.length) return prev;
          return { ...prev, relatedRisks: pruned };
        });
      }
    }).catch(() => setAvailableRisks([]));
  }, [form.consortium, form.assignTo]);

  // Reset form to initial state
  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      consortium: '',
      assignTo: '',
      assignToUsers: [],
      date: '',
      relatedRisks: [],
    });
    setAvailableRisks([]);
  };

  // Log organization options for debugging
  React.useEffect(() => {
    if (isOpen) {
    } else if (!isOpen) {
      // Reset form when modal closes
      resetForm();
    }
  }, [isOpen, orgOptions, consortiumOptions]);

  const handleChange = (field: keyof AssignActionFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    // If consortium changes, clear org, users, risks and notify parent
    if (field === 'consortium') {
      setForm(prev => ({ ...prev, assignTo: '', assignToUsers: [], relatedRisks: [] }));
      onFilterChange?.(value, '');
    }

    // If the assigned organization changes, the previously selected
    // assignees may no longer belong to it -- clear them and notify the
    // parent to refetch the user list scoped to the new organization.
    if (field === 'assignTo') {
      setForm(prev => ({ ...prev, assignToUsers: [] }));
      onFilterChange?.(form.consortium, value);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign New Action Item" size="xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
        <p className="text-[#7b849b] mb-2 text-sm">Create a new action item to be assigned to a consortium member</p>
        <div className="mb-2">
          <label className="block text-sm font-semibold text-[#0b1320] mb-1">Action Title</label>
          <InputField
            value={form.title}
            onChange={(v) => handleChange('title', v)}
            placeholder="Enter action title"
            required
            fullWidth
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-semibold text-[#0b1320] mb-1">Description</label>
          <TextArea
            value={form.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="Enter detailed description of the action required"
            required
            fullWidth
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
          <div>
            <label className="block text-sm font-semibold text-[#0b1320] mb-1">Consortium</label>
            <Dropdown
              options={consortiumOptions}
              value={form.consortium}
              onChange={(v) => handleChange('consortium', v)}
              required
              fullWidth
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0b1320] mb-1">Assign To Organization</label>
            <Dropdown
              options={filteredOrgOptions}
              placeholder={!form.consortium ? 'Select a consortium first' : filteredOrgOptions.length === 0 ? 'No organizations in this consortium' : 'Select organization'}
              value={form.assignTo}
              onChange={(v) => handleChange('assignTo', v)}
              required
              fullWidth
              disabled={!form.consortium || filteredOrgOptions.length === 0}
            />
          </div>
        </div>
        {/* Related Risks */}
        <div className="mb-2">
          <label className="block text-sm font-semibold text-[#0b1320] mb-1">
            Related Risks <span className="text-gray-400 font-normal text-xs">(Optional — up to 3)</span>
          </label>
          <Dropdown
            placeholder={!form.consortium ? 'Select a consortium first' : availableRisks.length === 0 ? 'No approved risks in this consortium' : form.relatedRisks.length >= 3 ? 'Maximum 3 risks selected' : 'Select a risk to add'}
            options={availableRisks
              .filter(r => !form.relatedRisks.includes(r._id))
              .map(r => ({ value: r._id, label: r.title }))}
            value=""
            onChange={v => {
              if (!v) return;
              if (form.relatedRisks.length >= 3) { showToast.error('Maximum 3 risks allowed'); return; }
              setForm(prev => ({ ...prev, relatedRisks: [...prev.relatedRisks, v] }));
            }}
            fullWidth
            disabled={!form.consortium || availableRisks.length === 0 || form.relatedRisks.length >= 3}
          />
          {form.relatedRisks.length > 0 && (
            <div className="mt-2 space-y-1">
              {form.relatedRisks.map((riskId, idx) => {
                const risk = availableRisks.find(r => r._id === riskId);
                return (
                  <div key={riskId} className="flex items-center justify-between bg-[#2a9d8f]/5 border border-[#2a9d8f]/20 px-3 py-1.5 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-4 h-4 bg-[#2a9d8f] text-white rounded-full text-[10px] font-bold flex-shrink-0">{idx + 1}</span>
                      <span className="text-gray-800 font-medium">{risk?.title || riskId}</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm(prev => ({ ...prev, relatedRisks: prev.relatedRisks.filter(id => id !== riskId) }))} className="text-red-500 hover:text-red-700 !p-0 ml-2">×</Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assign To Users — multi-select */}
        <div className="mb-2">
          <label className="block text-sm font-semibold text-[#0b1320] mb-1">
            Assign To User(s) <span className="text-red-500">*</span>
          </label>
          <Dropdown
            placeholder={userOptions.length === 0 ? 'No users available' : 'Select a user to add'}
            options={userOptions.filter(u => !form.assignToUsers.includes(u.value))}
            value=""
            onChange={v => {
              if (!v) return;
              setForm(prev => ({ ...prev, assignToUsers: [...prev.assignToUsers, v] }));
            }}
            fullWidth
            disabled={userOptions.length === 0}
          />
          {form.assignToUsers.length > 0 && (
            <div className="mt-2 space-y-1">
              {form.assignToUsers.map((userId, idx) => {
                const u = userOptions.find(o => o.value === userId);
                return (
                  <div key={userId} className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] font-bold flex-shrink-0">{idx + 1}</span>
                      <span className="text-gray-800 font-medium">{u?.label || userId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, assignToUsers: prev.assignToUsers.filter(id => id !== userId) }))}
                      className="text-red-500 hover:text-red-700 font-bold ml-2 text-base leading-none"
                    >×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-2">
          <label className="block text-sm font-semibold text-[#0b1320] mb-1">Implementation Date</label>
          <InputField
            type="date"
            value={form.date}
            onChange={(v) => handleChange('date', v)}
            placeholder="dd/mm/yyyy"
            fullWidth
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
          <Button variant="outline" size="md" type="button" onClick={onClose} className="border-gray-300 text-[#0b1320] w-full sm:w-auto text-sm md:text-base">Cancel</Button>
          <Button variant="primary" size="md" type="submit" className="font-semibold w-full sm:w-auto text-sm md:text-base">Assign Action</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignActionModal; 