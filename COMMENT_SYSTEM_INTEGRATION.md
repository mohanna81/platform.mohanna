# Comment and Reply System Integration

## Overview
This document describes the integration of a comprehensive comment and reply system for action items in the nonprofit consortia frontend application.

## Features Implemented

### 1. Comment System
- **Add Comments**: Users can add comments to action items
- **View Comments**: All comments are displayed with author name and timestamp
- **Edit Comments**: Users can edit their own comments
- **Delete Comments**: Users can delete their own comments
- **Real-time Updates**: Comments are fetched and updated in real-time

### 2. Reply System
- **Add Replies**: Users can reply to existing comments
- **View Replies**: Replies are displayed nested under their parent comments
- **Edit Replies**: Users can edit their own replies
- **Delete Replies**: Users can delete their own replies
- **Nested Structure**: Replies are visually nested under comments

### 3. User Permissions
- **Ownership-based Editing**: Users can only edit/delete their own comments and replies
- **Read Access**: All users can view all comments and replies
- **Authentication Required**: Users must be logged in to add/edit/delete

## API Endpoints

### Comments
- `GET /actionitem/{actionItemId}/comments` - Get all comments for an action item
- `POST /actionitem/{actionItemId}/comments` - Add a new comment
- `PATCH /actionitem/{actionItemId}/comments/{commentId}` - Edit a comment
- `DELETE /actionitem/{actionItemId}/comments/{commentId}` - Delete a comment

### Replies
- `POST /actionitem/{actionItemId}/comments/{commentId}/replies` - Add a reply to a comment
- `PATCH /actionitem/{actionItemId}/comments/{commentId}/replies/{replyId}` - Edit a reply
- `DELETE /actionitem/{actionItemId}/comments/{commentId}/replies/{replyId}` - Delete a reply

## Data Models

### Comment
```typescript
interface Comment {
  _id: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  replies?: Reply[];
}
```

### Reply
```typescript
interface Reply {
  _id: string;
  userId: string;
  userName: string;
  reply: string;
  createdAt: string;
  updatedAt: string;
}
```

## UI Components

### ActionItemCard
The main component that displays action items with integrated comment functionality:
- Displays comments in a clean, organized layout
- Shows user names and timestamps
- Provides edit/delete actions for user-owned content
- Includes reply functionality with nested display
- Real-time comment updates

### Features
- **Responsive Design**: Works on desktop and mobile devices
- **Loading States**: Shows loading indicators while fetching comments
- **Error Handling**: Displays error messages for failed operations
- **Keyboard Support**: Enter key to submit comments and replies
- **Confirmation Dialogs**: Confirms before deleting comments/replies

## Integration Points

### 1. Action Items Service (`src/lib/api/services/actionitems.ts`)
- Added comment and reply API methods
- Added TypeScript interfaces for all comment/reply operations
- Integrated with existing action items service structure

### 2. ActionItemCard Component (`src/components/action-items/ActionItemCard.tsx`)
- Completely refactored to support real comment functionality
- Integrated with authentication context for user permissions
- Added state management for comments, replies, and UI interactions
- Implemented real-time updates and error handling

### 3. Action Items Page (`src/app/action-items/page.tsx`)
- Updated to pass `actionItemId` prop to ActionItemCard
- Maintains existing functionality while adding comment support

## Usage

### Adding a Comment
1. Navigate to an action item
2. Type your comment in the "Add a comment..." input field
3. Press Enter or click the "Comment" button
4. The comment will appear immediately

### Replying to a Comment
1. Click the "Reply" button under any comment
2. Type your reply in the input field that appears
3. Press Enter or click "Send"
4. The reply will appear nested under the comment

### Editing Content
1. Click "Edit" next to your comment or reply
2. Modify the text in the textarea that appears
3. Click "Save" to update or "Cancel" to discard changes

### Deleting Content
1. Click "Delete" next to your comment or reply
2. Confirm the deletion in the dialog
3. The content will be removed immediately

## Security Features
- **User Authentication**: All operations require valid user session
- **Ownership Validation**: Users can only modify their own content
- **Input Validation**: Comments and replies are trimmed and validated
- **Error Handling**: Graceful handling of API errors and network issues

## Future Enhancements
- **Real-time Updates**: WebSocket integration for live comment updates
- **Rich Text Support**: Markdown or rich text editor for comments
- **File Attachments**: Support for attaching files to comments
- **Mention System**: @mentions for users and notifications
- **Comment Moderation**: Admin tools for moderating comments
- **Comment Search**: Search functionality within comments
- **Comment Analytics**: Track comment engagement and activity

## Technical Notes
- Uses React hooks for state management
- Integrates with existing authentication system
- Follows existing code patterns and conventions
- Includes comprehensive error handling
- Maintains responsive design principles
- Uses TypeScript for type safety 