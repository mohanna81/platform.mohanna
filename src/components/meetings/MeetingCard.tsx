import React, { useState } from 'react';
import Modal from '@/components/common/Modal';
import type { Meeting, MeetingAttendee } from '@/lib/api/services/meetings';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';
import { formatDateTimeRangeWithTimezone } from '@/lib/utils/timezone';
import { useAuth } from '@/lib/auth/AuthContext';
import { normalizeRole } from '@/lib/utils/roleHierarchy';

interface MeetingCardProps {
  meeting: Meeting;
  onEdit?: (e: React.MouseEvent) => void;
  onComplete?: (e: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
  currentUserId?: string;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onEdit, onComplete, onDelete, currentUserId }) => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Format date and time with timezone
  const formatDateTime = (date: string, startTime: string, endTime: string, timezone?: string) => {
    return formatDateTimeRangeWithTimezone(date, startTime, endTime, timezone);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-[#7ddcf7] text-[#0b1320]';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Split agenda into point-wise items (by bullet • or newlines)
  const getAgendaPoints = (agenda: string | undefined): string[] => {
    if (!agenda || !agenda.trim()) return [];
    const points = agenda
      .split(/\s*[•]\s*|\n/)
      .map(s => s.trim())
      .filter(Boolean);
    return points.length > 0 ? points : [agenda];
  };

  // Simulate loading when modal opens
  React.useEffect(() => {
    if (modalOpen) {
      setModalLoading(true);
      const timer = setTimeout(() => setModalLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [modalOpen]);

  // Overdue logic
  const now = new Date();
  // Handle ISO date string and set end time in UTC
  const baseDate = new Date(meeting.date); // ISO string from API
  const [endHour, endMinute] = meeting.endTime.split(':').map(Number);
  const meetingEnd = new Date(baseDate);
  meetingEnd.setUTCHours(endHour, endMinute, 0, 0); // Set time in UTC
  const isOverdue = meeting.status === 'Scheduled' && meetingEnd.getTime() < now.getTime();
  // Debug log
  console.log(
    'MeetingCard Overdue Debug:',
    meeting.title,
    'date:', meeting.date,
    'endTime:', meeting.endTime,
    'meetingEnd:', meetingEnd.toISOString(),
    'now:', now.toISOString(),
    'isOverdue:', isOverdue
  );

  // Determine if current user is the creator (string or object)
  const isCreator = currentUserId && (
    (typeof meeting.createdBy === 'string' && meeting.createdBy === currentUserId) ||
    (typeof meeting.createdBy === 'object' && (meeting.createdBy.id === currentUserId || meeting.createdBy._id === currentUserId))
  );

  // Check if user can edit meetings based on role and ownership
  const canEditMeeting = () => {
    if (!user || !currentUserId) return false;
    
    const userRole = normalizeRole(user.role);
    
    // Organization Users can only edit meetings they created
    if (userRole === 'Organization User') {
      return isCreator;
    }
    
    // Higher roles (Admin, Facilitator, Super_user) can edit any meeting
    return true;
  };

  let deleteButton = null;
  if (onDelete && meeting.status === 'Scheduled' && currentUserId && isCreator) {
    deleteButton = (
      <Button
        variant="danger"
        size="md"
        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowDeleteModal(true); }}
      >
        Delete
      </Button>
    );
  }

  return (
    <>
      <div
        className={`bg-white border ${isOverdue ? 'border-red-500 shadow-lg' : 'border-[#e5eaf1]'} rounded-xl p-4 sm:p-6 md:p-8 mt-4 relative shadow-sm overflow-x-auto hover:shadow-md transition`}
        // Removed onClick, tabIndex, role, aria-label
      >
        {isOverdue && (
          <div className="mb-4 p-2 rounded bg-red-50 border border-red-200 text-red-700 font-semibold text-center">
            Meeting time has passed! Please complete this meeting.
          </div>
        )}
    <div className="flex items-center gap-3 flex-wrap mb-2">
          <div className="text-xl sm:text-2xl font-bold text-[#0b1320]">{meeting.title}</div>
          <span className={`${getStatusColor(meeting.status)} px-4 sm:px-5 py-1 rounded-full font-medium text-sm sm:text-base flex items-center capitalize`}>
            {meeting.status}
          </span>
    </div>
    <div className="flex items-center gap-2 text-[#7b849b] mb-4 text-sm sm:text-base flex-wrap">
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {formatDateTime(meeting.date, meeting.startTime, meeting.endTime, meeting.timezone)}
    </div>
    <div className="mb-2 text-sm sm:text-base">
      <span className="font-semibold text-[#0b1320]">Location:</span>
          {meeting.meetingType === 'Physical' ? (
            <span className="ml-2 text-[#222b3a]">{meeting.location || 'N/A'}</span>
          ) : (
            <>
      <span className="ml-2 text-[#222b3a]">Virtual</span>
              {meeting.meetingLink && (
      <div>
                  {meeting.status === 'Completed' ? (
                    <span className="text-gray-500 ml-2 cursor-not-allowed">
                      Meeting Completed
                    </span>
                  ) : (
                    <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline ml-2">
                      Join Meeting
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="mb-2 text-sm sm:text-base">
          <span className="font-semibold text-[#0b1320]">Consortium:</span>
          <span className="ml-2 text-[#222b3a]">{meeting.consortium[0]?.name || 'N/A'}</span>
      </div>
        <div className="mb-2 text-sm sm:text-base">
          <span className="font-semibold text-[#0b1320]">Organization:</span>
          <span className="ml-2 text-[#222b3a]">
            {meeting.organization.length > 0 
              ? meeting.organization.map(org => org.name).join(', ')
              : 'N/A'
            }
          </span>
        </div>
    <div className="mb-2 text-sm sm:text-base">
      <span className="font-semibold text-[#0b1320]">Agenda:</span>
      {getAgendaPoints(meeting.agenda).length > 0 ? (
        <ul className="ml-4 mt-1 list-disc text-[#222b3a] space-y-1">
          {getAgendaPoints(meeting.agenda).map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      ) : (
        <span className="ml-2 text-[#222b3a]">{meeting.agenda || '—'}</span>
      )}
    </div>
    {/* Links Section */}
    {meeting.links && meeting.links.length > 0 && (
      <div className="mb-2 text-sm sm:text-base">
        <span className="font-semibold text-[#0b1320]">Additional Links:</span>
        <ul className="ml-4 mt-1 space-y-1">
          {meeting.links.map((link, i) => (
            <li key={i}>
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#3b82f6] hover:underline flex items-center gap-1"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-2 text-sm sm:text-base">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4V7a4 4 0 10-8 0v3m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-semibold text-[#0b1320]">Attendees ({meeting.attendees.length}):</span>
      </div>
      <div className="flex flex-wrap gap-2">
            {meeting.attendees.map((attendee: MeetingAttendee) => (
              <span key={attendee._id} className="inline-block bg-[#f5f7fa] text-[#0b1320] rounded-full px-3 sm:px-4 py-1 text-sm sm:text-base font-medium border border-[#e5eaf1]">
                {attendee.name} ({attendee.role})
              </span>
        ))}
      </div>
    </div>
        <div className="flex justify-end mt-4 gap-2">
          {/* Edit Button (now inline with other actions) */}
          {meeting.status === 'Scheduled' && canEditMeeting() && (
            <button
              className="flex items-center gap-2 bg-[#3b82f6] hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-base font-bold transition-transform duration-150 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              title="Edit meeting details"
              onClick={e => {
                e.stopPropagation();
                if (isOverdue && onComplete) {
                  onComplete(e);
                } else if (onEdit) {
                  onEdit(e);
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
              </svg>
              Edit
            </button>
          )}
          {meeting.meetingType === 'Virtual' && meeting.meetingLink ? (
            meeting.status === 'Completed' ? (
              <Button
                variant="secondary"
                size="md"
                className="w-full max-w-xs sm:max-w-none sm:w-auto text-center cursor-not-allowed opacity-50"
                disabled={true}
              >
                Meeting Completed
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="w-full max-w-xs sm:max-w-none sm:w-auto text-center"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); window.open(meeting.meetingLink, '_blank', 'noopener,noreferrer'); }}
              >
                Join Meeting
              </Button>
            )
          ) : (
            <Button variant="primary" size="md" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setModalOpen(true); }}>
              View Details
            </Button>
          )}
         {deleteButton}
        </div>
      </div>
      {/* Modal for physical meeting details */}
      {modalOpen && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Meeting Details" size="lg">
          {modalLoading ? (
            <div className="py-8">
              <Loader size="md" variant="default" />
              <p className="text-center text-gray-500 mt-4">Loading meeting details...</p>
            </div>
          ) : (
            <div className="space-y-6 text-[#0b1320]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <div className="font-semibold mb-1">Title</div>
                  <div className="text-[#222b3a]">{meeting.title}</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Date & Time</div>
                  <div className="text-[#222b3a]">{formatDateTime(meeting.date, meeting.startTime, meeting.endTime, meeting.timezone)}</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Type</div>
                  <div className="text-[#222b3a]">{meeting.meetingType}</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Location</div>
                  <div className="text-[#222b3a]">{meeting.location}</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Consortium</div>
                  <div className="text-[#222b3a]">{meeting.consortium[0]?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Organization</div>
                  <div className="text-[#222b3a]">
                    {meeting.organization.length > 0 
                      ? meeting.organization.map(org => org.name).join(', ')
                      : 'N/A'
                    }
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="font-semibold mb-1">Agenda</div>
                  {getAgendaPoints(meeting.agenda).length > 0 ? (
                    <ul className="text-[#222b3a] list-disc ml-4 space-y-1">
                      {getAgendaPoints(meeting.agenda).map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-[#222b3a]">{meeting.agenda || '—'}</div>
                  )}
                </div>
                {/* Links Section in Modal */}
                {meeting.links && meeting.links.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="font-semibold mb-1">Additional Links</div>
                    <ul className="space-y-2">
                      {meeting.links.map((link, i) => (
                        <li key={i}>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#3b82f6] hover:underline flex items-center gap-2"
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {link.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold mb-2">Attendees ({meeting.attendees.length})</div>
                <div className="flex flex-wrap gap-2">
                  {meeting.attendees.map((attendee: MeetingAttendee) => (
                    <span key={attendee._id} className="inline-block bg-[#f5f7fa] text-[#0b1320] rounded-full px-4 py-1 text-sm font-medium border border-[#e5eaf1]">
                      {attendee.name} ({attendee.role})
                    </span>
                  ))}
    </div>
  </div>
            </div>
          )}
        </Modal>
      )}
     {/* Delete confirmation modal */}
     {showDeleteModal && (
       <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Meeting" size="sm">
         <div className="text-[#0b1320] mb-4">Are you sure you want to delete this meeting? This action cannot be undone.</div>
         <div className="flex justify-end gap-2">
           <Button variant="outline" className="text-black" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
           <Button variant="danger" onClick={() => { setShowDeleteModal(false); if (onDelete) onDelete(meeting._id); }}>Delete</Button>
         </div>
       </Modal>
     )}
    </>
  );
};

export default MeetingCard; 