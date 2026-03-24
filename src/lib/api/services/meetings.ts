import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

// Types for meetings
export interface CreateMeetingRequest {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingType: 'Virtual' | 'Physical';
  location: string;
  meetingLink?: string;
  agenda: string;
  consortium: string;
  organization: string[]; // Changed to array for multi-select
  attendees: string[];
  minutes?: string;
  actionItems?: ActionItem[];
  links?: Array<{ title: string; url: string }>; // Optional array of links
  status?: 'Scheduled' | 'Completed' | 'Cancelled';
  timezone?: string; // Added timezone
}

export interface MeetingAttendee {
  _id: string;
  profilePhoto: string;
  name: string;
  email: string;
  status: string;
  role: string;
  organizations: string[];
  consortia: string[];
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface ActionItem {
  description: string;
  assignedTo: string;
}

export interface Consortium {
  _id: string;
  name: string;
  start_date: string;
  end_date: string;
  description: string;
  status: string;
  organizations: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Organization {
  _id: string;
  name: string;
  description: string;
  contact_email: string;
  status: string;
  consortia: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Meeting {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  agenda: string;
  consortium: Consortium[];
  organization: Organization[];
  meetingType: 'Virtual' | 'Physical';
  meetingLink?: string;
  attendees: MeetingAttendee[];
  minutes?: string;
  actionItems: ActionItem[];
  links?: Array<{ title: string; url: string }>; // Optional array of links
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdBy?: MeetingAttendee;
  createdAt: string;
  updatedAt: string;
  __v: number;
  timezone?: string; // Added timezone
}

export interface CreateMeetingResponse {
  success: boolean;
  message: string;
  data: Meeting;
}

export interface MeetingsListResponse {
  message: string;
  success: boolean;
  data: Meeting[];
}

// Meetings service
export const meetingsService = {
  // Create a new meeting
  async createMeeting(meetingData: CreateMeetingRequest) {
    return apiClient.post<CreateMeetingResponse>(
      API_ENDPOINTS.MEETINGS.CREATE,
      meetingData
    );
  },

  // Get all meetings
  async getMeetings() {
    return apiClient.get<MeetingsListResponse>(API_ENDPOINTS.MEETINGS.LIST);
  },

  // Get meetings for a specific attendee (includes both meetings they're invited to AND meetings they created)
  // This endpoint supports two flows:
  // 1. Meetings where the user is an attendee (invited to)
  // 2. Meetings created by the user
  async getAttendeeMeetings(userId: string) {
    const endpoint = API_ENDPOINTS.MEETINGS.ATTENDEE.replace(':userId', userId);
    return apiClient.get<MeetingsListResponse>(endpoint);
  },

  // Get a specific meeting by ID
  async getMeetingById(id: string) {
    const endpoint = API_ENDPOINTS.MEETINGS.GET.replace(':id', id);
    return apiClient.get<CreateMeetingResponse>(endpoint);
  },

  // Update a meeting
  async updateMeeting(id: string, meetingData: Partial<CreateMeetingRequest>) {
    const endpoint = API_ENDPOINTS.MEETINGS.UPDATE.replace(':id', id);
    return apiClient.patch<CreateMeetingResponse>(endpoint, meetingData);
  },

  // Delete a meeting
  async deleteMeeting(id: string) {
    const endpoint = API_ENDPOINTS.MEETINGS.DELETE.replace(':id', id);
    return apiClient.delete<{ message: string; success: boolean }>(endpoint);
  },
}; 