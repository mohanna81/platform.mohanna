# Meeting Links Feature

## Overview
Added the ability to add links in meeting creation and meeting minutes. Users can now attach related documents, resources, or reference links to meetings.

## Changes Made

### 1. Type Definitions (`src/lib/api/services/meetings.ts`)
- Updated `CreateMeetingRequest` interface to include optional `links` field
- Updated `Meeting` interface to include optional `links` field
- Link structure: `Array<{ title: string; url: string }>`

### 2. Meeting Creation Modal (`src/components/meetings/NewMeetingModal.tsx`)
- Added `links` field to `MeetingFormData` interface
- Added `links` state management in form initialization
- Implemented link management handlers:
  - `handleAddLink()`: Adds a new empty link
  - `handleRemoveLink(index)`: Removes a link by index
  - `handleLinkChange(index, field, value)`: Updates link title or URL
- Added UI section for managing links with:
  - "Add Link" button
  - Input fields for link title and URL
  - "Remove" button for each link
  - Instructional text for users

### 3. Meeting Minutes Modal (`src/components/meetings/CompleteMeetingModal.tsx`)
- Added `MeetingLink` interface for type safety
- Updated `CompleteMeetingModalProps` to include optional `initialLinks` prop
- Added `links` state management
- Implemented link management handlers (same as NewMeetingModal)
- Added UI section for managing links in meeting minutes
- Updated submit handler to include links in the payload

### 4. Meetings Page (`src/app/meetings/page.tsx`)
- Updated `handleCompleteMeetingSubmit` to accept and process `links` parameter
- Updated local state updates to include links when completing a meeting
- Added `initialLinks` prop when rendering `CompleteMeetingModal`
- Added `links` to `initialValues` when editing a meeting

## Features

### Meeting Creation
- Users can add multiple links when creating or editing a meeting
- Each link has:
  - **Title**: Descriptive name for the link (e.g., "Meeting Agenda Document")
  - **URL**: The actual link URL (supports URL validation)
- Links are optional and can be added/removed dynamically

### Meeting Minutes
- When completing a meeting, users can add links related to:
  - Meeting recordings
  - Shared documents
  - Reference materials
  - Action item resources
- Same functionality as meeting creation (add, edit, remove)

## UI/UX
- Links section is labeled as "Additional Links (Optional)"
- Each link is displayed in a bordered card with two input fields
- "Add Link" button allows adding multiple links
- "Remove" button for each link for easy deletion
- Instructional text helps users understand the purpose
- Links are displayed in a responsive layout (stacks on mobile, side-by-side on desktop)

## Data Flow
1. Links are stored as an array of objects in the meeting document
2. When creating/editing a meeting, links are sent to the API via `meetingsService.createMeeting()` or `meetingsService.updateMeeting()`
3. When completing a meeting, links are included in the update payload
4. Links are persisted on the server and displayed when viewing meeting details

## Backward Compatibility
- The `links` field is optional in all interfaces
- Existing meetings without links will continue to work (default to empty array)
- No migration required for existing data
