import React, { useState } from 'react';
import type { Meeting, MeetingAttendee } from '@/lib/api/services/meetings';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { formatDateTimeRangeWithTimezone } from '@/lib/utils/timezone';

interface PastMeetingCardProps {
  meeting: Meeting;
  onEdit?: () => void;
}

const isMeetingAttendee = (assignedTo: unknown): assignedTo is MeetingAttendee => {
  return !!assignedTo && typeof assignedTo === 'object' && 'name' in assignedTo;
};

const PastMeetingCard: React.FC<PastMeetingCardProps> = ({ meeting, onEdit }) => {
  const [modalOpen, setModalOpen] = useState(false);
  // Format date and time with timezone
  const formatDateTime = (date: string, startTime: string, endTime: string, timezone?: string) => {
    return formatDateTimeRangeWithTimezone(date, startTime, endTime, timezone);
  };

  return (
    <div
      className={`bg-white border border-[#e5eaf1] rounded-xl p-4 sm:p-6 md:p-8 mt-4 relative shadow-sm overflow-x-auto${onEdit ? ' cursor-pointer hover:shadow-md transition' : ''}`}
      onClick={onEdit ? (e) => {
        // Prevent edit if clicking the View Minutes button
        if ((e.target as HTMLElement).closest('button')) return;
        onEdit();
      } : undefined}
      tabIndex={onEdit ? 0 : undefined}
      role={onEdit ? 'button' : undefined}
      aria-label={onEdit ? 'Edit meeting' : undefined}
    >
      {/* Completed badge top right */}
      <span className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-1 rounded-full shadow-none">Completed</span>
      <div className="flex flex-col gap-2">
        <div className="text-2xl font-bold text-[#0b1320] mb-1">{meeting.title}</div>
        <div className="flex items-center gap-2 text-[#7b849b] text-sm mb-2">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>{formatDateTime(meeting.date, meeting.startTime, meeting.endTime, meeting.timezone)}</span>
        </div>
        {/* Location or Meeting Link */}
        <div className="mb-2 text-sm">
          {meeting.meetingType === 'Virtual' && meeting.meetingLink ? (
            <>
              <span className="font-semibold text-[#0b1320]">Meeting Link:</span>
              <span className="ml-2 text-gray-500 break-all cursor-not-allowed">
                {meeting.meetingLink}
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold text-[#0b1320]">Location:</span>
              <span className="ml-2 text-[#222b3a]">{meeting.location}</span>
            </>
          )}
        </div>
        {/* Inline minutes display restored */}
        {meeting.minutes && (
          <div className="mb-2 text-sm">
            <span className="font-semibold text-[#0b1320]">Minutes:</span>
            <div className="ml-2 text-[#222b3a] whitespace-pre-line">{meeting.minutes}</div>
          </div>
        )}
        {/* Action Items (show summary, details in modal) */}
        {meeting.actionItems && meeting.actionItems.length > 0 && (
          <div className="mb-2 text-sm">
            <span className="font-semibold text-[#0b1320]">Action Items:</span>
            <ul className="list-disc ml-8 mt-1">
              {meeting.actionItems.map((ai, idx) => (
                <li key={idx} className="text-[#222b3a]">
                  {ai.description}
                  {isMeetingAttendee(ai.assignedTo) ? ` - ${ai.assignedTo.name}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        {meeting.links && meeting.links.length > 0 && (
          <div className="mb-2 text-sm">
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
                    {link.title || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm mt-2 mb-1">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4V7a4 4 0 10-8 0v3m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="font-semibold text-[#0b1320]">Attendees ({meeting.attendees.length}):</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {meeting.attendees.map((attendee: MeetingAttendee) => (
            <span key={attendee._id} className="inline-block bg-[#f5f7fa] text-[#0b1320] rounded-full px-3 sm:px-4 py-1 text-sm font-medium border border-[#e5eaf1]">
              {attendee.name}
            </span>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="primary" size="md" onClick={() => setModalOpen(true)}>
            View Minutes
          </Button>
        </div>
      </div>
      {/* Minutes Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Meeting Minutes" size="lg">
        <div className="space-y-4">
          <div>
            <div className="text-xl font-bold text-[#0b1320] mb-1">{meeting.title}</div>
            <div className="text-[#7b849b] text-sm mb-2">{formatDateTime(meeting.date, meeting.startTime, meeting.endTime, meeting.timezone)}</div>
            <div className="mb-2 text-sm">
              {meeting.meetingType === 'Virtual' && meeting.meetingLink ? (
                <>
                  <span className="font-semibold text-[#0b1320]">Meeting Link:</span>
                  <span className="ml-2 text-gray-500 break-all cursor-not-allowed">
                    {meeting.meetingLink}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-[#0b1320]">Location:</span>
                  <span className="ml-2 text-[#222b3a]">{meeting.location}</span>
                </>
              )}
            </div>
            <div className="mb-2 text-sm">
              <span className="font-semibold text-[#0b1320]">Agenda:</span>
              {(() => {
                const points = (meeting.agenda || '')
                  .split(/\s*[•]\s*|\n/)
                  .map((s: string) => s.trim())
                  .filter(Boolean);
                if (points.length > 0) {
                  return (
                    <ul className="ml-4 mt-1 list-disc text-[#222b3a] space-y-1">
                      {points.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  );
                }
                return <span className="ml-2 text-[#222b3a]">{meeting.agenda || '—'}</span>;
              })()}
            </div>
            {/* Links Section in Past Meeting Card */}
            {meeting.links && meeting.links.length > 0 && (
              <div className="mb-2 text-sm">
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
            <div className="mb-2 text-sm">
              <span className="font-semibold text-[#0b1320]">Attendees:</span>
              <span className="ml-2 text-[#222b3a]">
                {meeting.attendees.map((attendee: MeetingAttendee) => attendee.name).join(', ')}
              </span>
            </div>
          </div>
          {meeting.minutes && (
            <div className="mb-2 text-sm">
              <span className="font-semibold text-[#0b1320]">Minutes:</span>
              <div className="ml-2 text-[#222b3a] whitespace-pre-line">{meeting.minutes}</div>
            </div>
          )}
          {/* Links in Past Meeting Modal */}
          {meeting.links && meeting.links.length > 0 && (
            <div className="mb-2 text-sm">
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
          {meeting.actionItems && meeting.actionItems.length > 0 && (
            <div className="mb-2 text-sm">
              <span className="font-semibold text-[#0b1320]">Action Items:</span>
              <ul className="list-disc ml-8 mt-1">
                {meeting.actionItems.map((ai, idx) => (
                  <li key={idx} className="text-[#222b3a]">
                    {ai.description}
                    {isMeetingAttendee(ai.assignedTo) ? ` - ${ai.assignedTo.name}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PastMeetingCard; 