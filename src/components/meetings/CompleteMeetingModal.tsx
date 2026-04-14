import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InputField from '@/components/common/InputField';
import TextArea from '@/components/common/TextArea';
import Loader from '@/components/common/Loader';

interface AttendeeOption {
  id: string;
  name: string;
}

interface ActionItem {
  description: string;
  assignedTo: string;
}

interface MeetingLink {
  title: string;
  url: string;
}

interface CompleteMeetingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { minutes: string; actionItems: ActionItem[]; links?: MeetingLink[] }) => void;
  attendees: AttendeeOption[];
  isSubmitting?: boolean;
  initialMinutes?: string;
  initialActionItems?: ActionItem[];
  initialLinks?: MeetingLink[];
}

const CompleteMeetingModal: React.FC<CompleteMeetingModalProps> = ({
  open,
  onClose,
  onSubmit,
  attendees,
  isSubmitting = false,
  initialMinutes = '',
  initialActionItems = [{ description: '', assignedTo: attendees[0]?.id || '' }],
  initialLinks = [],
}) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems);
  const [links, setLinks] = useState<MeetingLink[]>(initialLinks);
  const [errors, setErrors] = useState<{ minutes?: string; actionItems?: string } | null>(null);

  useEffect(() => {
    if (open) {
      setMinutes(initialMinutes || '');
      setActionItems(initialActionItems.length > 0 ? initialActionItems : [{ description: '', assignedTo: attendees[0]?.id || '' }]);
      setLinks(initialLinks || []);
      setErrors(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleActionItemChange = (idx: number, field: keyof ActionItem, value: string) => {
    setActionItems(items => items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleAddActionItem = () => {
    setActionItems(items => [...items, { description: '', assignedTo: attendees[0]?.id || '' }]);
  };

  const handleRemoveActionItem = (idx: number) => {
    setActionItems(items => items.filter((_, i) => i !== idx));
  };

  const handleAddLink = () => {
    setLinks(prev => [...prev, { title: '', url: '' }]);
  };

  const handleRemoveLink = (idx: number) => {
    setLinks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLinkChange = (idx: number, field: 'title' | 'url', value: string) => {
    setLinks(prev => prev.map((link, i) => i === idx ? { ...link, [field]: value } : link));
  };

  const validate = () => {
    if (!minutes.trim()) return setErrors({ minutes: 'Minutes are required.' });
    if (actionItems.length === 0) return setErrors({ actionItems: 'At least one action item is required.' });
    for (const item of actionItems) {
      if (!item.description.trim() || !item.assignedTo) return setErrors({ actionItems: 'All action items must have a description and assignee.' });
    }
    setErrors(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const filteredLinks = links.filter(link => link.title.trim() && link.url.trim());
    onSubmit({ minutes, actionItems, links: filteredLinks.length > 0 ? filteredLinks : undefined });
  };

  const selectClass = 'border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/20 focus:border-[#2a9d8f] disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <Modal isOpen={open} onClose={onClose} title="Complete Meeting" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 text-[#0b1320]">
        <TextArea
          label={<>Minutes <span className="text-red-500">*</span></>}
          id="minutes"
          value={minutes}
          onChange={setMinutes}
          rows={4}
          fullWidth
          required
          disabled={isSubmitting}
          error={errors?.minutes}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold text-sm">Action Items <span className="text-red-500">*</span></label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddActionItem} disabled={isSubmitting}>
              + Add Item
            </Button>
          </div>
          {actionItems.map((item, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2 items-start md:items-end">
              <div className="flex-1">
                <InputField
                  placeholder="Description"
                  value={item.description}
                  onChange={v => handleActionItemChange(idx, 'description', v)}
                  fullWidth
                  required
                  disabled={isSubmitting}
                />
              </div>
              <select
                className={selectClass}
                value={item.assignedTo}
                onChange={e => handleActionItemChange(idx, 'assignedTo', e.target.value)}
                required
                disabled={isSubmitting}
              >
                {attendees.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveActionItem(idx)} disabled={isSubmitting || actionItems.length === 1}>
                Remove
              </Button>
            </div>
          ))}
          {errors?.actionItems && <div className="text-red-500 text-sm mt-1">{errors.actionItems}</div>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold text-sm">Additional Links <span className="text-gray-400 font-normal">(Optional)</span></label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddLink} disabled={isSubmitting}>
              + Add Link
            </Button>
          </div>
          <p className="text-sm text-gray-500 mb-2">Add related documents, resources, or reference links for meeting minutes</p>
          {links.length > 0 ? (
            <div className="space-y-2">
              {links.map((link, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-2 items-start md:items-end p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <InputField
                      label="Link Title"
                      placeholder="e.g., Meeting Recording"
                      value={link.title}
                      onChange={v => handleLinkChange(idx, 'title', v)}
                      fullWidth
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <InputField
                      label="URL"
                      type="url"
                      placeholder="https://example.com/recording"
                      value={link.url}
                      onChange={v => handleLinkChange(idx, 'url', v)}
                      fullWidth
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveLink(idx)} disabled={isSubmitting}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic py-2">No links added yet. Click &quot;+ Add Link&quot; to add one.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="border-gray-300 text-gray-700">Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? <Loader size="sm" /> : 'Complete Meeting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CompleteMeetingModal;
