# Rotating Message Loader Implementation

## Overview
Replaced the detailed `DataLoadingProgress` component with a cleaner `RotatingMessageLoader` component that displays rotating motivational messages during data loading instead of showing potentially confusing item counts.

## Changes Made

### 1. New Component Created
**File**: `src/components/common/RotatingMessageLoader.tsx`
- Displays a large loading spinner
- Shows a title and rotating motivational messages
- Includes progress dots indicating which message is currently displayed
- Messages rotate every 2.5 seconds with smooth fade-in animation
- Clean, professional appearance without detailed counts

**Default Messages**:
- "Preparing your risk insights…"
- "Analyzing risks across partners…"
- "Strengthening collaboration through risk sharing…"
- "Organizing risk insights…"
- "Gathering consortium data…"
- "Building your risk overview…"

### 2. Tailwind Configuration Update
**File**: `tailwind.config.js`
- Added `fadeIn` keyframe animation
- Added `animate-fadeIn` utility class for smooth message transitions

### 3. Pages Updated

#### Risk Review Page
**File**: `src/app/risk-review/page.tsx`
- Replaced `DataLoadingProgress` with `RotatingMessageLoader`
- Custom messages:
  - "Preparing your risk insights…"
  - "Analyzing risks across partners…"
  - "Strengthening collaboration through risk sharing…"
  - "Organizing risk review data…"
  - "Gathering consortium information…"
  - "Loading organization data…"

#### Shared Risks Page
**File**: `src/app/shared-risks/page.tsx`
- Replaced `DataLoadingProgress` with `RotatingMessageLoader`
- Custom messages:
  - "Preparing your risk insights…"
  - "Analyzing risks across partners…"
  - "Strengthening collaboration through risk sharing…"
  - "Organizing shared risk data…"
  - "Building consortium connections…"
  - "Gathering organization details…"

#### My Risks Page
**File**: `src/components/my-risks/MyRisksList.tsx`
- Replaced `DataLoadingProgress` with `RotatingMessageLoader`
- Custom messages:
  - "Preparing your risk insights…"
  - "Analyzing your submissions…"
  - "Organizing risk data…"
  - "Building your risk portfolio…"
  - "Gathering consortium information…"

### 4. Meeting Cards Enhancement
**Files**: 
- `src/components/meetings/MeetingCard.tsx`
- `src/components/meetings/PastMeetingCard.tsx`

Added "Additional Links" section that displays:
- Links with external link icon
- Clickable titles that open in new tabs
- Shown in both card view and modal view
- Only displays when links exist

## Benefits

1. **User Experience**: Clean, professional loading screen without confusing counts
2. **Reduced Questions**: No longer shows potentially misleading "0 items" during loading
3. **Engaging**: Rotating messages keep users informed without technical details
4. **Consistent**: Same loading experience across Risk Review, Shared Risks, and My Risks pages
5. **Flexible**: Easy to customize messages per page/context

## Future Considerations

For Phase 2, if needed, the queries can be optimized to pull only user-specific risks to improve loading performance. However, the current rotating message approach provides a good user experience during the loading process.

## Implementation Date
March 16, 2026
