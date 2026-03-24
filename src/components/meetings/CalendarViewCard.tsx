import React, { useState, useMemo } from 'react';
import Modal from '@/components/common/Modal';
import type { Meeting } from '@/lib/api/services/meetings';
import { formatTimeWithTimezone } from '@/lib/utils/timezone';

interface CalendarViewCardProps {
  meetings: Meeting[];
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  meetings: Meeting[];
}

const CalendarViewCard: React.FC<CalendarViewCardProps> = ({ meetings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current month's start and end dates
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const startDate = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const start = new Date(firstDayOfMonth);
    start.setDate(start.getDate() - firstDayOfMonth.getDay());
    return start;
  }, [currentYear, currentMonth]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const dayDate = new Date(currentDate);
      const dayMeetings = meetings.filter(meeting => {
        const meetingDate = new Date(meeting.date);
        return meetingDate.toDateString() === dayDate.toDateString();
      });

      days.push({
        date: dayDate,
        dayNumber: dayDate.getDate(),
        isCurrentMonth: dayDate.getMonth() === currentMonth,
        isToday: dayDate.toDateString() === new Date().toDateString(),
        meetings: dayMeetings
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [meetings, currentMonth, startDate]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Format time for display with timezone
  const formatTime = (time: string, date: string, timezone?: string) => {
    return formatTimeWithTimezone(time, date, timezone);
  };

  // Get meeting color based on timing and status
  const getMeetingColor = (meeting: Meeting) => {
    const now = new Date();
    const meetingDate = new Date(meeting.date);
    const meetingDateTime = new Date(`${meeting.date}T${meeting.startTime}`);
    const meetingEndTime = new Date(`${meeting.date}T${meeting.endTime}`);
    
    // If meeting is cancelled, always show red
    if (meeting.status === 'Cancelled') {
      return 'bg-red-500';
    }
    
    // If meeting is completed, show gray
    if (meeting.status === 'Completed') {
      return 'bg-gray-500';
    }
    
    // For scheduled meetings, color based on timing
    if (meeting.status === 'Scheduled') {
      // If meeting is in the past (ended)
      if (meetingEndTime < now) {
        return 'bg-orange-500'; // Past meetings
      }
      
      // If meeting is currently happening
      if (meetingDateTime <= now && meetingEndTime > now) {
        return 'bg-green-500'; // Currently happening
      }
      
      // If meeting is today but not started yet
      if (meetingDate.toDateString() === now.toDateString() && meetingDateTime > now) {
        return 'bg-blue-500'; // Today's upcoming meetings
      }
      
      // If meeting is in the future (not today)
      if (meetingDateTime > now) {
        return 'bg-purple-500'; // Future meetings
      }
    }
    
    return 'bg-gray-500'; // Default
  };

  // Get meeting type icon
  const getMeetingTypeIcon = (meetingType: string) => {
    return meetingType === 'Virtual' ? (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
      </svg>
    ) : (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    );
  };

  // Handle meeting click
  const handleMeetingClick = (meeting: Meeting, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
  <div className="bg-white border border-[#e5eaf1] rounded-xl p-6 sm:p-8 mt-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-[#0b1320]">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {dayNames.map(day => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`min-h-[120px] p-2 border border-gray-100 rounded-lg transition-colors cursor-pointer ${
              day.isToday ? 'bg-blue-50 border-blue-200' : ''
            } ${
              selectedDate?.toDateString() === day.date.toDateString() ? 'bg-blue-100 border-blue-300' : ''
            } ${
              !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleDateClick(day.date)}
          >
            {/* Day Number */}
            <div className={`text-sm font-medium mb-1 text-black ${
              day.isToday ? 'font-bold' : ''
            }`}>
              {day.dayNumber}
            </div>

            {/* Meetings */}
            <div className="space-y-1">
              {day.meetings.slice(0, 3).map((meeting) => (
                <div
                  key={meeting._id}
                  className={`text-xs p-1 rounded truncate flex items-center space-x-1 ${
                    getMeetingColor(meeting)
                  } text-white cursor-pointer hover:opacity-80 transition-opacity`}
                  title={`${meeting.title} - ${formatTime(meeting.startTime, meeting.date, meeting.timezone)}`}
                  onClick={(e) => handleMeetingClick(meeting, e)}
                >
                  {getMeetingTypeIcon(meeting.meetingType)}
                  <span className="truncate text-black">{meeting.title}</span>
                </div>
              ))}
              {day.meetings.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{day.meetings.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-black">Future</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-black">Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-black">Now</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-black">Past</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-black">Cancelled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span className="text-black">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span className="text-black">Virtual</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-black">Physical</span>
          </div>
        </div>
      </div>

      {/* Meeting Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Meeting Details">
        {selectedMeeting && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-[#0b1320] mb-2">{selectedMeeting.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedMeeting.date && new Date(selectedMeeting.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    {formatTime(selectedMeeting.startTime, selectedMeeting.date, selectedMeeting.timezone)} - {formatTime(selectedMeeting.endTime, selectedMeeting.date, selectedMeeting.timezone)}
                  </p>
                  <p className="text-sm text-gray-700 mb-3">{selectedMeeting.agenda}</p>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedMeeting.meetingType === 'Virtual' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {getMeetingTypeIcon(selectedMeeting.meetingType)}
                      <span className="ml-1">{selectedMeeting.meetingType}</span>
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedMeeting.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                      selectedMeeting.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedMeeting.status}
                    </span>
                  </div>

                  {selectedMeeting.consortium && selectedMeeting.consortium.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Consortium: </span>
                      <span className="text-sm text-gray-600">{selectedMeeting.consortium[0].name}</span>
                    </div>
                  )}

                  {selectedMeeting.organization && selectedMeeting.organization.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Organization: </span>
                      <span className="text-sm text-gray-600">
                        {selectedMeeting.organization.map(org => org.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {selectedMeeting.attendees && selectedMeeting.attendees.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Attendees ({selectedMeeting.attendees.length}):</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedMeeting.attendees.map((attendee) => (
                          <span key={attendee._id} className="inline-block bg-gray-100 text-gray-700 rounded-full px-2 py-1 text-xs">
                            {attendee.name} ({attendee.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedMeeting.meetingType === 'Virtual' && selectedMeeting.meetingLink && (
                  selectedMeeting.status === 'Completed' ? (
                    <span className="ml-4 px-4 py-2 bg-gray-400 text-white text-sm rounded-lg cursor-not-allowed opacity-50">
                      Meeting Completed
                    </span>
                  ) : (
                    <a
                      href={selectedMeeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Join Meeting
                    </a>
                  )
                )}
              </div>
            </div>
    </div>
        )}
      </Modal>
  </div>
);
};

export default CalendarViewCard; 