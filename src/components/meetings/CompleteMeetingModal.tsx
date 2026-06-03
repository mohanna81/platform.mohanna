import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
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
    setLinks(prevLinks => [...prevLinks, { title: '', url: '' }]);
  };

  const handleRemoveLink = (idx: number) => {
    setLinks(prevLinks => prevLinks.filter((_, i) => i !== idx));
  };

  const handleLinkChange = (idx: number, field: 'title' | 'url', value: string) => {
    setLinks(prevLinks => prevLinks.map((link, i) => 
      i === idx ? { ...link, [field]: value } : link
    ));
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
    
    // Filter out empty links
    const filteredLinks = links.filter(link => link.title.trim() && link.url.trim());
    
    onSubmit({ 
      minutes, 
      actionItems, 
      links: filteredLinks.length > 0 ? filteredLinks : undefined 
    });
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Complete Meeting" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 text-[#0b1320] max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <label className="block font-semibold mb-1" htmlFor="minutes">Minutes <span className="text-red-500">*</span></label>
          <textarea
            id="minutes"
            className="w-full border border-[#e5eaf1] rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-[#FBBF77] resize-vertical min-h-[80px]"
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            required
            disabled={isSubmitting}
          />
          {errors?.minutes && <div className="text-red-500 text-sm mt-1">{errors.minutes}</div>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold">Action Items <span className="text-red-500">*</span></label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddActionItem} disabled={isSubmitting}>
              + Add Item
            </Button>
          </div>
          {actionItems.map((item, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2 items-start md:items-center">
              <input
                type="text"
                className="flex-1 border border-[#e5eaf1] rounded-lg p-2 text-base focus:outline-none focus:ring-2 focus:ring-[#FBBF77]"
                placeholder="Description"
                value={item.description}
                onChange={e => handleActionItemChange(idx, 'description', e.target.value)}
                required
                disabled={isSubmitting}
              />
              <select
                className="border border-[#e5eaf1] rounded-lg p-2 text-base focus:outline-none focus:ring-2 focus:ring-[#FBBF77]"
                value={item.assignedTo}
                onChange={e => handleActionItemChange(idx, 'assignedTo', e.target.value)}
                required
                disabled={isSubmitting}
              >
                {attendees.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => handleRemoveActionItem(idx)}
                disabled={isSubmitting || actionItems.length === 1}
              >
                Remove
              </Button>
            </div>
          ))}
          {errors?.actionItems && <div className="text-red-500 text-sm mt-1">{errors.actionItems}</div>}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold">Additional Links (Optional)</label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddLink} disabled={isSubmitting}>
              + Add Link
            </Button>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Add related documents, resources, or reference links for meeting minutes
          </div>
          {links.length > 0 ? (
            <div className="space-y-2">
              {links.map((link, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-2 items-start md:items-end p-3 border border-[#e5eaf1] rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-[#0b1320] mb-1">Link Title</label>
                    <input
                      type="text"
                      className="w-full border border-[#e5eaf1] rounded-lg p-2 text-base focus:outline-none focus:ring-2 focus:ring-[#FBBF77]"
                      placeholder="e.g., Meeting Recording"
                      value={link.title}
                      onChange={e => handleLinkChange(idx, 'title', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-[#0b1320] mb-1">URL</label>
                    <input
                      type="url"
                      className="w-full border border-[#e5eaf1] rounded-lg p-2 text-base focus:outline-none focus:ring-2 focus:ring-[#FBBF77]"
                      placeholder="https://example.com/recording"
                      value={link.url}
                      onChange={e => handleLinkChange(idx, 'url', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveLink(idx)}
                    disabled={isSubmitting}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic py-2">
              No links added yet. Click "+ Add Link" to add a link to this meeting's minutes.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? <Loader size="sm" /> : 'Complete Meeting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CompleteMeetingModal; 