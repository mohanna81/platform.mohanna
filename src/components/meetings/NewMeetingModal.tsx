import React, { useState, useEffect, useMemo } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import InputField from "@/components/common/InputField";
import Dropdown from "@/components/common/Dropdown";
import TextArea from "@/components/common/TextArea";
import Checkbox from "@/components/common/Checkbox";
import { userService } from "@/lib/api/services/auth";
import { showToast } from "@/lib/utils/toast";
import { useAuth } from "@/lib/auth/AuthContext";
import type { User } from "@/lib/api/services/auth";
import { getUserTimezone, getTimezoneDisplayName } from "@/lib/utils/timezone";
import TimePicker from "@/components/common/TimePicker";
import { Consortium } from '@/lib/api/services/consortia';
import { risksService, Risk } from '@/lib/api/services/risks';

export interface MeetingFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingType: 'Virtual' | 'Physical';
  location: string;
  meetingLink: string;
  agenda: string;
  consortium: string;
  organization: string[]; // Changed to array for multi-select
  attendees: string[];
  links?: Array<{ title: string; url: string }>; // Optional array of links
  risks?: string[]; // Related risks (up to 3)
}

interface NewMeetingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MeetingFormData) => void;
  consortiums: Array<{ id: string; name: string }>;
  rawConsortia?: Consortium[];
  organizations: Array<{ id: string; name: string }>;
  isSubmitting?: boolean;
  initialValues?: Partial<MeetingFormData>;
  editMode?: boolean;
}

const NewMeetingModal: React.FC<NewMeetingModalProps> = ({ open, onClose, onSubmit, consortiums, rawConsortia = [], organizations, isSubmitting = false, initialValues, editMode = false }) => {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState<MeetingFormData>({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    meetingType: "Virtual",
    location: "",
    meetingLink: "",
    agenda: "",
    consortium: "",
    organization: [], // Initialize as empty array
    attendees: currentUser?.id ? [currentUser.id] : [], // Automatically include current user
    links: [], // Initialize as empty array
  });
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store all users for filtering
  const [availableRisks, setAvailableRisks] = useState<Risk[]>([]);

  // Fetch approved risks when consortium changes
  useEffect(() => {
    if (!form.consortium) { setAvailableRisks([]); return; }
    risksService.getRisks().then(res => {
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const approved = res.data.data.filter((r: Risk) => {
          const isApproved = r.status === 'Approved';
          const inConsortium = Array.isArray(r.consortium)
            ? r.consortium.some((c: unknown) => {
                if (typeof c === 'string') return c === form.consortium;
                if (c && typeof c === 'object' && ('_id' in c || 'id' in c)) {
                  return (c as { _id?: string; id?: string })._id === form.consortium || (c as { _id?: string; id?: string }).id === form.consortium;
                }
                return false;
              })
            : false;
          return isApproved && inConsortium;
        });
        setAvailableRisks(approved);
      }
    }).catch(() => setAvailableRisks([]));
  }, [form.consortium]);

  // Filter organizations to only those belonging to the selected consortium
  const filteredOrganizations = useMemo(() => {
    if (!form.consortium || rawConsortia.length === 0) return organizations;
    const consortium = rawConsortia.find(c => (c._id || c.id) === form.consortium);
    if (!consortium?.organizations) return [];
    const orgIds = new Set(
      consortium.organizations.map(o =>
        typeof o === 'string' ? o : (o._id || o.id || '')
      )
    );
    return organizations.filter(o => orgIds.has(o.id));
  }, [form.consortium, rawConsortia, organizations]);

  useEffect(() => {
    userService.getUsers().then((res) => {
      if (res?.data) {
        setAllUsers(res.data);
        setUsers(res.data);
      }
    });
  }, []);

  // Reset form and ensure current user is in attendees when modal opens
  useEffect(() => {
    if (open) {
      if (initialValues) {
        setForm({
          title: initialValues.title || "",
          date: initialValues.date || "",
          startTime: initialValues.startTime || "",
          endTime: initialValues.endTime || "",
          meetingType: initialValues.meetingType || "Virtual",
          location: initialValues.location || "",
          meetingLink: initialValues.meetingLink || "",
          agenda: initialValues.agenda || "",
          consortium: initialValues.consortium || "",
          organization: initialValues.organization || [], // Initialize as empty array
          attendees: initialValues.attendees && initialValues.attendees.length > 0
            ? Array.from(new Set([...initialValues.attendees, currentUser?.id])).filter(Boolean) as string[]
            : (currentUser?.id ? [currentUser.id] : []),
          links: initialValues.links || [],
          risks: initialValues.risks || [],
        });
      } else {
        setForm({
          title: "",
          date: "",
          startTime: "",
          endTime: "",
          meetingType: "Virtual",
          location: "",
          meetingLink: "",
          agenda: "",
          consortium: "",
          organization: [],
          attendees: currentUser?.id ? [currentUser.id] : [],
          links: [],
          risks: [],
        });
      }
    } else if (!open && !editMode) {
      setForm({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        meetingType: "Virtual",
        location: "",
        meetingLink: "",
        agenda: "",
        consortium: "",
        organization: [],
        attendees: currentUser?.id ? [currentUser.id] : [],
        links: [],
        risks: [],
      });
    }
  }, [open, currentUser?.id, initialValues, editMode]);

  // Separate useEffect to handle user filtering when consortium changes or users are loaded
  useEffect(() => {
    if (allUsers.length > 0) {
      if (form.consortium) {
        const filteredUsers = allUsers.filter(user => 
          user.consortia.includes(form.consortium)
        );
        setUsers(filteredUsers);
      } else {
        // When no consortium is selected, show users from all available consortiums in dropdown
        const availableConsortiumIds = consortiums.map(c => c.id);
        const filteredUsers = allUsers.filter(user => 
          user.consortia.some(consortiumId => availableConsortiumIds.includes(consortiumId))
        );
        setUsers(filteredUsers);
      }
    }
  }, [form.consortium, allUsers, consortiums]);

  const handleChange = (name: string, value: string) => {
    setForm((prev) => {
      const updatedForm = { ...prev, [name]: value };
      
      // When meeting type changes, update location field accordingly
      if (name === "meetingType") {
        if (value === "Virtual") {
          updatedForm.location = updatedForm.meetingLink;
        } else {
          updatedForm.location = updatedForm.location || "";
        }
      }
      
      // When meeting link changes for virtual meetings, update location
      if (name === "meetingLink" && updatedForm.meetingType === "Virtual") {
        updatedForm.location = value;
      }
      
      // Real-time validation for date field
      if (name === "date") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value);
        if (selectedDate < today) {
          showToast.error('Meeting date cannot be in the past');
        }
      }
      
      // Real-time validation for time fields
      if (name === "startTime" && updatedForm.endTime) {
        if (value >= updatedForm.endTime) {
          showToast.error('Start time must be before end time');
        }
      }
      
      if (name === "endTime" && updatedForm.startTime) {
        if (updatedForm.startTime >= value) {
          showToast.error('End time must be after start time');
        }
      }
      
      // Clear organizations and risks when consortium changes
      if (name === "consortium") {
        updatedForm.organization = [];
        updatedForm.risks = [];
      }

      // Filter users when consortium changes
      if (name === "consortium") {
        if (value) {
          const filteredUsers = allUsers.filter(user => 
            user.consortia.includes(value)
          );
          setUsers(filteredUsers);
        } else {
          // If no consortium selected, show users from all available consortiums in dropdown
          const availableConsortiumIds = consortiums.map(c => c.id);
          const filteredUsers = allUsers.filter(user => 
            user.consortia.some(consortiumId => availableConsortiumIds.includes(consortiumId))
          );
          setUsers(filteredUsers);
        }
      }
      
      return updatedForm;
    });
  };

  const handleAttendeeChange = (userId: string, checked: boolean) => {
    // Prevent removing the current user from attendees
    if (userId === currentUser?.id && !checked) {
      showToast.error('You cannot remove yourself from the meeting');
      return;
    }
    
    setForm((prev) => ({
      ...prev,
      attendees: checked
        ? [...prev.attendees, userId]
        : prev.attendees.filter((id) => id !== userId),
    }));
  };

  const handleAddLink = () => {
    setForm((prev) => ({
      ...prev,
      links: [...(prev.links || []), { title: '', url: '' }],
    }));
  };

  const handleRemoveLink = (index: number) => {
    setForm((prev) => ({
      ...prev,
      links: (prev.links || []).filter((_, i) => i !== index),
    }));
  };

  const handleLinkChange = (index: number, field: 'title' | 'url', value: string) => {
    setForm((prev) => ({
      ...prev,
      links: (prev.links || []).map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const validateDateTime = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(form.date);
    
    // Check if date is in the past
    if (selectedDate < today) {
      return 'Meeting date cannot be in the past';
    }
    
    // Check if start time and end time are selected
    if (!form.startTime || !form.endTime) {
      return 'Please select both start time and end time';
    }
    
    // Check if start time is before end time
    if (form.startTime >= form.endTime) {
      return 'End time must be after start time';
    }
    
    // If the selected date is today, check if start time is in the past
    if (selectedDate.toDateString() === today.toDateString()) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (form.startTime <= currentTime) {
        return 'Start time cannot be in the past for today\'s meetings';
      }
    }
    
    // Check if meeting is at least 15 minutes long
    const [startHour, startMinute] = form.startTime.split(':').map(Number);
    const [endHour, endMinute] = form.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const duration = endMinutes - startMinutes;
    
    if (duration < 15) {
      return 'Meeting must be at least 15 minutes long';
    }
    
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date and time
    const validationError = validateDateTime();
    if (validationError) {
      showToast.error(validationError);
      return;
    }
    
    // Validate that at least one attendee is selected (besides current user)
    if (form.attendees.length === 0) {
      showToast.error('Please select at least one attendee');
      return;
    }
    
    // Check if only current user is selected (need at least 2 attendees including current user)
    if (form.attendees.length === 1 && form.attendees[0] === currentUser?.id) {
      showToast.error('Please select at least one other attendee besides yourself');
      return;
    }
    
    // Ensure current user is always in attendees list
    // Filter out empty links
    const filteredLinks = form.links?.filter(link => link.title.trim() && link.url.trim()) || [];
    
    const finalFormData = {
      ...form,
      attendees: currentUser?.id && !form.attendees.includes(currentUser.id) 
        ? [...form.attendees, currentUser.id] 
        : form.attendees,
      ...(filteredLinks.length > 0 && { links: filteredLinks })
    };
    
    onSubmit(finalFormData);
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={editMode ? "Edit Meeting" : "Schedule New Meeting"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-black max-h-[65vh] overflow-y-auto pr-2">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 min-w-0">
            <InputField
              label="Meeting Title"
              name="title"
              value={form.title}
              onChange={(value) => handleChange("title", value)}
              placeholder="Enter meeting title"
              required
            />
          </div>
          <div className="flex-1 min-w-0">
            <InputField
              label="Date"
              name="date"
              type="date"
              value={form.date}
              onChange={(value) => handleChange("date", value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 min-w-0">
            <TimePicker
              label="Start Time"
              value={form.startTime}
              onChange={(value) => handleChange("startTime", value)}
              required
              fullWidth
            />
          </div>
          <div className="flex-1 min-w-0">
            <TimePicker
              label="End Time"
              value={form.endTime}
              onChange={(value) => handleChange("endTime", value)}
              required
              fullWidth
            />
          </div>
        </div>
        <div className="text-sm text-gray-600 -mt-2 mb-2">
          Times are in your local timezone: {getTimezoneDisplayName(getUserTimezone())}
        </div>
        <Dropdown
          label="Meeting Type"
          name="meetingType"
          options={[
            { value: "Virtual", label: "Virtual" },
            { value: "Physical", label: "Physical" },
          ]}
          value={form.meetingType}
          onChange={(value) => handleChange("meetingType", value)}
          required
        />
        {form.meetingType === "Virtual" ? (
          <InputField
            label="Meeting Link"
            name="meetingLink"
            value={form.meetingLink}
            onChange={(value) => handleChange("meetingLink", value)}
            placeholder="Enter meeting link (Zoom, Teams, etc.)"
            required
          />
        ) : (
        <InputField
          label="Location"
          name="location"
          value={form.location}
          onChange={(value) => handleChange("location", value)}
            placeholder="Enter physical meeting location"
          required
        />
        )}

        <TextArea
          label="Agenda"
          name="agenda"
          value={form.agenda}
          onChange={(value) => handleChange("agenda", value)}
          placeholder="Meeting agenda and topics to discuss"
          rows={3}
          required
        />
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 min-w-0">
            <Dropdown
              label="Consortium"
              name="consortium"
              options={consortiums.map((c) => ({ value: c.id, label: c.name }))}
              value={form.consortium}
              onChange={(value) => handleChange("consortium", value)}
              required
            />
          </div>
          <div className="flex-1 min-w-0">
            <Dropdown
              label="Organizations (Optional)"
              placeholder={!form.consortium ? 'Select a consortium first' : filteredOrganizations.length === 0 ? 'No organizations in this consortium' : 'Select organizations'}
              options={filteredOrganizations.filter(o => !form.organization.includes(o.id)).map(o => ({ value: o.id, label: o.name }))}
              value=""
              onChange={(v) => { if (v && !form.organization.includes(v)) setForm(prev => ({ ...prev, organization: [...prev.organization, v] })); }}
              fullWidth
              disabled={!form.consortium || filteredOrganizations.length === 0}
            />
            {form.organization.length > 0 && (
              <div className="mt-2 space-y-1">
                {form.organization.map((orgId) => {
                  const org = filteredOrganizations.find(o => o.id === orgId);
                  return (
                    <div key={orgId} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm">
                      <span className="text-black font-medium">{org?.name || orgId}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setForm(prev => ({ ...prev, organization: prev.organization.filter(id => id !== orgId) }))} className="text-red-500 hover:text-red-700 !p-0 text-xs font-bold">×</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* Related Risks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Related Risks <span className="text-gray-400 font-normal">(Optional — up to 3)</span>
          </label>
          <Dropdown
            placeholder={!form.consortium ? 'Select a consortium first' : availableRisks.length === 0 ? 'No approved risks in this consortium' : (form.risks || []).length >= 3 ? 'Maximum 3 risks selected' : 'Select a risk to add'}
            options={availableRisks
              .filter(r => !(form.risks || []).includes(r._id))
              .map(r => ({ value: r._id, label: r.title }))}
            value=""
            onChange={v => {
              if (!v) return;
              const current = form.risks || [];
              if (current.length >= 3) { showToast.error('Maximum 3 risks allowed'); return; }
              setForm(prev => ({ ...prev, risks: [...(prev.risks || []), v] }));
            }}
            fullWidth
            disabled={!form.consortium || availableRisks.length === 0 || (form.risks || []).length >= 3}
          />
          {(form.risks || []).length > 0 && (
            <div className="mt-2 space-y-1">
              {(form.risks || []).map((riskId, idx) => {
                const risk = availableRisks.find(r => r._id === riskId);
                return (
                  <div key={riskId} className="flex items-center justify-between bg-[#2a9d8f]/5 border border-[#2a9d8f]/20 px-3 py-1.5 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-4 h-4 bg-[#2a9d8f] text-white rounded-full text-[10px] font-bold flex-shrink-0">{idx + 1}</span>
                      <span className="text-gray-800 font-medium">{risk?.title || riskId}</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm(prev => ({ ...prev, risks: (prev.risks || []).filter(id => id !== riskId) }))} className="text-red-500 hover:text-red-700 !p-0 ml-2">×</Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="font-semibold mb-2">
            Select Attendees <span className="text-red-500">*</span>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            You are automatically included as an attendee and cannot be removed. Please select at least one other attendee.
            {!form.consortium && (
              <span className="block mt-1 text-blue-600">
                Showing users from all available consortiums
              </span>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
            {users.length === 0 && (
              <div className="text-gray-500">
                {form.consortium ? 'No users found for the selected consortium.' : 'No users found.'}
              </div>
            )}
            {users.map((user) => {
              const isCurrentUser = user.id === currentUser?.id;
              return (
                <div key={user.id} className={`flex items-center gap-2 mb-2 ${isCurrentUser ? 'opacity-75' : ''}`}>
                <Checkbox
                  name={`attendee-${user.id}`}
                  checked={form.attendees.includes(user.id)}
                  onChange={(checked) => handleAttendeeChange(user.id, checked)}
                    disabled={isCurrentUser}
                    label=""
                  />
                  <div className="flex flex-col">
                    <span className={`text-black font-medium ${isCurrentUser ? 'font-semibold' : ''}`}>
                      {user.name} {isCurrentUser && '(You)'}
                    </span>
                    <span className="text-gray-500 text-sm">{user.role || 'User'}</span>
                  </div>
              </div>
              );
            })}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold">Additional Links (Optional)</label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddLink} disabled={isSubmitting}>
              + Add Link
            </Button>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Add related documents, resources, or reference links for this meeting
          </div>
          {(form.links || []).length > 0 && (
            <div className="space-y-2">
              {form.links!.map((link, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <InputField
                      label="Link Title"
                      name={`link-title-${idx}`}
                      value={link.title}
                      onChange={(value) => handleLinkChange(idx, 'title', value)}
                      placeholder="e.g., Meeting Agenda Document"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <InputField
                      label="URL"
                      name={`link-url-${idx}`}
                      type="url"
                      value={link.url}
                      onChange={(value) => handleLinkChange(idx, 'url', value)}
                      placeholder="https://example.com/document"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex items-end">
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
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (editMode ? 'Updating...' : 'Scheduling...') : (editMode ? 'Update' : 'Schedule')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewMeetingModal; 