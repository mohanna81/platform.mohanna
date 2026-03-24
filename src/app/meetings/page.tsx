"use client";
import React, { useState, useEffect, useCallback } from "react";
import MeetingsTabs from "@/components/meetings/MeetingsTabs";
import MeetingCard from "@/components/meetings/MeetingCard";
import PastMeetingCard from "@/components/meetings/PastMeetingCard";
import CalendarViewCard from "@/components/meetings/CalendarViewCard";
import Layout from '@/components/common/Layout';
import NewMeetingModal from "@/components/meetings/NewMeetingModal";
import Button from "@/components/common/Button";
import Loader from '@/components/common/Loader';
import { meetingsService } from "@/lib/api/services/meetings";
import { showToast } from "@/lib/utils/toast";
import { useAuth } from "@/lib/auth/AuthContext";
import type { CreateMeetingRequest, Meeting } from "@/lib/api/services/meetings";
import CompleteMeetingModal from '@/components/meetings/CompleteMeetingModal';
import { getUserTimezone } from "@/lib/utils/timezone";
import { fetchConsortiaByRole } from '@/lib/api/services/consortia';
import { fetchOrganizationsByRole, Organization } from '@/lib/api/services/organizations';
import { normalizeRole } from '@/lib/utils/roleHierarchy';

export default function MeetingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [consortiums, setConsortiums] = useState<{ id: string; name: string }[]>([]);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  // Complete modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completingMeeting, setCompletingMeeting] = useState<Meeting | null>(null);

  // Check if user can schedule meetings (not Organization User role)
  const canScheduleMeetings = user?.role !== 'Organization User';

  // Check if user can edit a specific meeting
  const canEditMeeting = (meeting: Meeting) => {
    if (!user?.id) return false;
    
    const userRole = normalizeRole(user.role);
    
    // Organization Users can only edit meetings they created
    if (userRole === 'Organization User') {
      const isCreator = 
        (typeof meeting.createdBy === 'string' && meeting.createdBy === user.id) ||
        (typeof meeting.createdBy === 'object' && (meeting.createdBy.id === user.id || meeting.createdBy._id === user.id));
      return isCreator;
    }
    
    // Higher roles (Admin, Facilitator, Super_user) can edit any meeting
    return true;
  };

  // Check if user can delete a specific meeting
  const canDeleteMeeting = (meeting: Meeting) => {
    if (!user?.id) return false;
    
    // Only the creator can delete meetings
    const isCreator = 
      (typeof meeting.createdBy === 'string' && meeting.createdBy === user.id) ||
      (typeof meeting.createdBy === 'object' && (meeting.createdBy.id === user.id || meeting.createdBy._id === user.id));
    
    return isCreator;
  };

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      // Use attendee-specific endpoint to get only user's meetings
      // This includes both meetings they're invited to AND meetings they created
      if (!user?.id) {
        console.error('User ID not available');
        showToast.error('User information not available');
        return;
      }
      
      console.log('Fetching meetings for user:', user.id);
      const response = await meetingsService.getAttendeeMeetings(user.id);
      console.log('Meetings response:', response);
      
      if (response.success && response.data) {
        // Handle both possible response structures
        const meetingsData = Array.isArray(response.data) ? response.data : response.data.data;
        console.log('Meetings data:', meetingsData);
        console.log('Meeting statuses:', meetingsData.map(m => ({ id: m._id, title: m.title, status: m.status })));
        setMeetings(meetingsData);
      } else {
        console.error('Failed to fetch meetings:', response.error);
        showToast.error('Failed to load meetings');
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      showToast.error('An error occurred while loading meetings');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchMeetings();
    }
    async function fetchConsortiaOptions() {
      if (!user) return;
      const consortia = await fetchConsortiaByRole(user);
      setConsortiums(consortia.map((c) => ({ id: c.id || c._id, name: c.name })));
    }
    fetchConsortiaOptions();
    
    // Role-based organization fetching
    async function fetchOrganizations() {
      if (!user) return;
      
      try {
        const organizations = await fetchOrganizationsByRole(user);
        setOrganizations(organizations.map((o: Organization) => ({ id: o.id || o._id, name: o.name })));
      } catch (error) {
        console.error('Error fetching organizations:', error);
        showToast.error('Failed to load organizations');
      }
    }
    
    fetchOrganizations();
  }, [user, fetchMeetings]);

  const handleScheduleMeeting = async (meetingData: CreateMeetingRequest) => {
    // Basic validation
    if (!meetingData.title.trim()) {
      showToast.error('Meeting title is required');
      return;
    }
    if (!meetingData.date) {
      showToast.error('Meeting date is required');
      return;
    }
    if (!meetingData.startTime || !meetingData.endTime) {
      showToast.error('Start time and end time are required');
      return;
    }
    if (meetingData.meetingType === 'Virtual' && !meetingData.meetingLink?.trim()) {
      showToast.error('Meeting link is required for virtual meetings');
      return;
    }
    if (meetingData.meetingType === 'Physical' && !meetingData.location?.trim()) {
      showToast.error('Meeting location is required for physical meetings');
      return;
    }
    if (!meetingData.consortium) {
      showToast.error('Please select a consortium');
      return;
    }
    // Organization is now optional, so no validation needed
    if (!meetingData.attendees || meetingData.attendees.length === 0) {
      showToast.error('At least one attendee is required');
      return;
    }
    // Ensure current user is in attendees list
    if (!meetingData.attendees.includes(user?.id || '')) {
      showToast.error('You must be included as an attendee');
      return;
    }

    setIsSubmitting(true);
    try {
      // Add createdBy and timezone to the payload
      const payload = { ...meetingData, createdBy: user?.id, timezone: getUserTimezone() };
      const response = await meetingsService.createMeeting(payload);
      if (response.success) {
        // Meeting created successfully
        console.log('Meeting created:', response.data);
    setModalOpen(false);
        showToast.success('Meeting scheduled successfully!');
        // Refresh the meetings list
        fetchMeetings();
      } else {
        console.error('Failed to create meeting:', response.error);
        showToast.error(response.error || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      showToast.error('An unexpected error occurred while creating the meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit meeting handler
  const handleEditMeeting = (meeting: Meeting) => {
    if (!canEditMeeting(meeting)) {
      showToast.error('You do not have permission to edit this meeting');
      return;
    }
    setEditingMeeting(meeting);
    setEditModalOpen(true);
  };

  // Update meeting submit
  const handleUpdateMeeting = async (meetingData: CreateMeetingRequest) => {
    if (!editingMeeting) return;
    setIsSubmitting(true);
    try {
      const response = await meetingsService.updateMeeting(editingMeeting._id, meetingData);
      if (response.success) {
        showToast.success('Meeting updated successfully!');
        setEditModalOpen(false);
        setEditingMeeting(null);
        fetchMeetings();
      } else {
        showToast.error(response.error || 'Failed to update meeting');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete meeting handler
  const handleCompleteMeeting = (meeting: Meeting) => {
    setCompletingMeeting(meeting);
    setCompleteModalOpen(true);
    setEditModalOpen(false);
    setEditingMeeting(null);
  };

  // Define ActionItem type based on Meeting type
  type AssignedToType = string | { id?: string; _id?: string };
  type ActionItem = {
    description: string;
    assignedTo: AssignedToType;
  };

  // Complete meeting submit
  const handleCompleteMeetingSubmit = async ({ minutes, actionItems, links }: { minutes: string; actionItems: ActionItem[]; links?: Array<{ title: string; url: string }> }) => {
    if (!completingMeeting) return;
    setIsSubmitting(true);
    try {
      console.log('Completing meeting:', completingMeeting._id, 'with status: Completed');
      console.log('Current meeting status before update:', completingMeeting.status);
      
      const updateData = {
        minutes,
        actionItems: actionItems.map(ai => {
          let assignedToId = '';
          if (typeof ai.assignedTo === 'string') {
            assignedToId = ai.assignedTo;
          } else if (ai.assignedTo && typeof ai.assignedTo === 'object') {
            assignedToId = ai.assignedTo.id || ai.assignedTo._id || '';
          }
          return {
            description: ai.description,
            assignedTo: assignedToId,
          };
        }),
        links: links || [],
        status: 'Completed' as const,
      };
      
      console.log('Update data being sent:', updateData);
      
      // Send actionItems as array of objects
      const response = await meetingsService.updateMeeting(completingMeeting._id, updateData);
      
      console.log('Meeting completion response:', response);
      
      if (response.success) {
        showToast.success('Meeting completed successfully!');
        setCompleteModalOpen(false);
        setCompletingMeeting(null);
        
        // Immediately update the local state to reflect the change
        setMeetings(prevMeetings => 
          prevMeetings.map(meeting => 
            meeting._id === completingMeeting._id 
              ? { ...meeting, status: 'Completed' as const, minutes, actionItems: updateData.actionItems, links: updateData.links }
              : meeting
          )
        );
        
        // Also refresh from the server to ensure consistency
        setTimeout(async () => {
          console.log('Refreshing meetings after completion...');
          await fetchMeetings();
        }, 500);
      } else {
        console.error('Failed to complete meeting:', response.error);
        showToast.error(response.error || 'Failed to complete meeting');
      }
    } catch (error) {
      console.error('Error completing meeting:', error);
      showToast.error('An error occurred while completing the meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete meeting handler
  const handleDeleteMeeting = async (id: string) => {
    // Find the meeting to check permissions
    const meeting = meetings.find(m => m._id === id);
    if (!meeting) {
      showToast.error('Meeting not found');
      return;
    }
    
    if (!canDeleteMeeting(meeting)) {
      showToast.error('You do not have permission to delete this meeting');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await meetingsService.deleteMeeting(id);
      if (response.success) {
        showToast.success('Meeting deleted successfully!');
        fetchMeetings();
      } else {
        showToast.error(response.error || 'Failed to delete meeting');
      }
    } catch {
      showToast.error('An error occurred while deleting the meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-8 md:p-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#0b1320]">Meetings</h1>
          {canScheduleMeetings && (
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <span className="text-xl mr-2">+</span>Schedule Meeting
          </Button>
          )}
        </div>
        <MeetingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {!user ? (
          <div className="flex justify-center items-center mt-8">
            <div className="text-lg text-gray-600">Loading user information...</div>
          </div>
        ) : loading ? (
          <div className="py-12">
            <Loader size="lg" variant="default" />
            <p className="text-center text-gray-500 mt-4">Loading meetings...</p>
          </div>
        ) : (
          <>
            {activeTab === "Upcoming" && (
              <div>
                {meetings.filter(meeting => meeting.status === 'Scheduled').length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    No upcoming meetings found.
                  </div>
                  //
                ) : (
                  meetings
                    .filter(meeting => meeting.status === 'Scheduled')
                    .map(meeting => {
                      // Debug: Log date and endTime values
                      console.log('Meeting:', meeting.title, 'Date:', meeting.date, 'EndTime:', meeting.endTime);
                      // Defensive: check for 24-hour format
                      const time24hRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
                      if (!time24hRegex.test(meeting.endTime)) {
                        console.error('Invalid endTime format (should be 24-hour HH:mm):', meeting.endTime, 'for meeting', meeting.title);
                        return null; // Skip rendering this meeting
                      }
                      // Determine if meeting is overdue using local date/time
                      const now = new Date();
                      const baseDate = new Date(meeting.date);
                      const [endHour, endMinute] = meeting.endTime.split(':').map(Number);
                      const meetingEnd = new Date(baseDate);
                      meetingEnd.setHours(endHour, endMinute, 0, 0);
                      const isOverdue = meetingEnd.getTime() < now.getTime();
                      return (
                        <MeetingCard
                          key={meeting._id}
                          meeting={meeting}
                          onEdit={e => {
                            e.stopPropagation();
                            if (isOverdue) {
                              handleCompleteMeeting(meeting);
                            } else {
                              handleEditMeeting(meeting);
                            }
                          }}
                          onDelete={handleDeleteMeeting}
                          currentUserId={user?.id}
                        />
                      );
                    })
                )}
              </div>
            )}
            {activeTab === "Past Meetings" && (
              <div>
                {(() => {
                  const pastMeetings = meetings.filter(meeting => meeting.status === 'Completed' || meeting.status === 'Cancelled');
                  console.log('Past meetings filter - All meetings:', meetings.map(m => ({ id: m._id, title: m.title, status: m.status })));
                  console.log('Past meetings filter - Filtered past meetings:', pastMeetings.map(m => ({ id: m._id, title: m.title, status: m.status })));
                  
                  return pastMeetings.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      No past meetings found.
                    </div>
                  ) : (
                    pastMeetings.map(meeting => (
                      <PastMeetingCard
                        key={meeting._id}
                        meeting={meeting}
                        onEdit={canEditMeeting(meeting) ? () => handleCompleteMeeting(meeting) : undefined}
                      />
                    ))
                  );
                })()}
              </div>
            )}
            {activeTab === "Calendar View" && <CalendarViewCard meetings={meetings} />}
          </>
        )}
        <NewMeetingModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleScheduleMeeting}
          consortiums={consortiums}
          organizations={organizations}
          isSubmitting={isSubmitting}
        />
        {/* Edit Meeting Modal */}
        {editingMeeting && (
          <NewMeetingModal
            open={editModalOpen}
            onClose={() => { setEditModalOpen(false); setEditingMeeting(null); }}
            onSubmit={handleUpdateMeeting}
            consortiums={consortiums}
            organizations={organizations}
            isSubmitting={isSubmitting}
            initialValues={{
              title: editingMeeting.title,
              date: editingMeeting.date ? new Date(editingMeeting.date).toISOString().split('T')[0] : '',
              startTime: editingMeeting.startTime,
              endTime: editingMeeting.endTime,
              meetingType: editingMeeting.meetingType,
              location: editingMeeting.location,
              meetingLink: editingMeeting.meetingLink || '',
              agenda: editingMeeting.agenda,
              consortium: editingMeeting.consortium[0]?._id || '',
              organization: editingMeeting.organization.map(org => String(org._id)),
              attendees: editingMeeting.attendees.map(a => String(a.id || a._id)),
              links: editingMeeting.links || [],
            }}
            editMode={true}
          />
        )}
        {/* Complete Meeting Modal */}
        {completingMeeting && (
          <CompleteMeetingModal
            open={completeModalOpen}
            onClose={() => { setCompleteModalOpen(false); setCompletingMeeting(null); }}
            onSubmit={handleCompleteMeetingSubmit}
            attendees={completingMeeting.attendees.map(a => ({ id: String(a.id || a._id), name: a.name }))}
            isSubmitting={isSubmitting}
            initialMinutes={completingMeeting.minutes || ''}
            initialActionItems={completingMeeting.actionItems.map((ai: ActionItem) => {
              if (typeof ai.assignedTo === 'string') {
                return { description: ai.description, assignedTo: ai.assignedTo };
              } else if (ai.assignedTo && typeof ai.assignedTo === 'object') {
                return { description: ai.description, assignedTo: ai.assignedTo.id || ai.assignedTo._id || '' };
              } else {
                return { description: ai.description, assignedTo: '' };
              }
            })}
            initialLinks={completingMeeting.links || []}
          />
        )}
      </div>
    </Layout>
  );
} 