import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';

const todayStr = () => new Date().toISOString().split('T')[0];
const selectClass = 'border border-[#e5eaf1] rounded-lg p-2 text-base focus:outline-none focus:ring-2 focus:ring-[#FBBF77]';

interface AssigneeDropdownProps {
  attendees: AttendeeOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

const AssigneeDropdown: React.FC<AssigneeDropdownProps> = ({ attendees, selected, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const selectedNames = attendees.filter(a => selected.includes(a.id)).map(a => a.name);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/20 focus:border-[#2a9d8f] disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px]"
      >
        <span className="flex flex-wrap gap-1 flex-1">
          {selectedNames.length === 0 ? (
            <span className="text-gray-400">Select assignees…</span>
          ) : (
            selectedNames.map(name => (
              <span key={name} className="inline-flex items-center gap-1 bg-[#e6f4f2] text-[#2a9d8f] text-xs font-medium px-2 py-0.5 rounded-full">
                {name}
              </span>
            ))
          )}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {attendees.map(a => (
            <label
              key={a.id}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 select-none"
            >
              <input
                type="checkbox"
                checked={selected.includes(a.id)}
                onChange={() => toggle(a.id)}
                className="accent-[#2a9d8f] w-4 h-4 flex-shrink-0"
              />
              <span className="text-sm text-gray-800">{a.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

interface AttendeeOption {
  id: string;
  name: string;
}

interface ActionItem {
  title: string;
  description: string;
  assignedTo: string[];
  deadline: string;
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
  initialActionItems = [{ title: '', description: '', assignedTo: attendees[0]?.id ? [attendees[0].id] : [], deadline: todayStr() }],
  initialLinks = [],
}) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems);
  const [links, setLinks] = useState<MeetingLink[]>(initialLinks);
  const [errors, setErrors] = useState<{ minutes?: string; actionItems?: string } | null>(null);

  useEffect(() => {
    if (open) {
      setMinutes(initialMinutes || '');
      setActionItems(initialActionItems.length > 0 ? initialActionItems : [{ title: '', description: '', assignedTo: attendees[0]?.id ? [attendees[0].id] : [], deadline: todayStr() }]);
      setLinks(initialLinks || []);
      setErrors(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleActionItemChange = (idx: number, field: keyof ActionItem, value: string) => {
    setActionItems(items => items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleAddActionItem = () => {
    setActionItems(items => [...items, { title: '', description: '', assignedTo: attendees[0]?.id ? [attendees[0].id] : [], deadline: todayStr() }]);
  };

  const handleToggleAssignee = (idx: number, attendeeId: string) => {
    setActionItems(items => items.map((item, i) => {
      if (i !== idx) return item;
      const already = item.assignedTo.includes(attendeeId);
      return { ...item, assignedTo: already ? item.assignedTo.filter(id => id !== attendeeId) : [...item.assignedTo, attendeeId] };
    }));
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
      if (!item.title.trim()) return setErrors({ actionItems: 'All action items must have a title.' });
      if (!item.description.trim() || item.assignedTo.length === 0) return setErrors({ actionItems: 'All action items must have a description and at least one assignee.' });
      if (!item.deadline) return setErrors({ actionItems: 'All action items must have a deadline.' });
    }
    setErrors(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
            <div key={idx} className="flex flex-col gap-2 mb-4 p-4 border border-[#e5eaf1] rounded-lg bg-gray-50">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className={selectClass + ' w-full'}
                  placeholder="Action item title"
                  value={item.title}
                  onChange={e => handleActionItemChange(idx, 'title', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                <textarea
                  placeholder="Describe the task in detail…"
                  value={item.description}
                  onChange={e => handleActionItemChange(idx, 'description', e.target.value)}
                  rows={3}
                  required
                  disabled={isSubmitting}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/20 focus:border-[#2a9d8f] resize-vertical disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2 items-end">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-medium text-gray-700">Assignees <span className="text-red-500">*</span></label>
                  <AssigneeDropdown
                    attendees={attendees}
                    selected={item.assignedTo}
                    onChange={ids => setActionItems(items => items.map((it, i) => i === idx ? { ...it, assignedTo: ids } : it))}
                    disabled={isSubmitting}
                  />
                  {item.assignedTo.length === 0 && <p className="text-xs text-red-400 mt-0.5">Select at least one assignee</p>}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-medium text-gray-700">Deadline <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    className={selectClass + ' w-full'}
                    value={item.deadline}
                    min={todayStr()}
                    onChange={e => handleActionItemChange(idx, 'deadline', e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveActionItem(idx)} disabled={isSubmitting || actionItems.length === 1}>
                  Remove
                </Button>
              </div>
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
              No links added yet. Click &quot;+ Add Link&quot; to add a link to this meeting&apos;s minutes.
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
