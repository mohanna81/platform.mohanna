# Risk Review - Floating Action Buttons Implementation

## Overview
Implemented floating/sticky action buttons for the Risk Review page to improve UX when viewing long risk details. The buttons float at the bottom of the screen while scrolling through details and return to their normal position when reaching the end of the content.

## Changes Made

### File: `src/components/risk-review/RiskCard.tsx`

#### 1. **Added View Details Functionality**
- Added a "View Details" toggle button that expands/collapses additional risk information
- Displays:
  - **Mitigation Measures** (green card with shield icon)
  - **Preventive Measures** (blue card with lock icon)
  - **Reactive Measures** (purple card with lightning icon)

#### 2. **Sticky/Floating Action Buttons**
- **"Edit"** and **"Submit for Review"** buttons now float at the bottom-right of the screen when:
  - User has clicked "View Details" to expand the risk
  - User scrolls down through long content
  - The original button position is out of view

#### 3. **Smart Positioning Logic**
The buttons use a `useEffect` hook with scroll listener that:
- Activates sticky mode when content is scrolled past the viewport
- Deactivates when user reaches the bottom (original button location)
- Uses refs to track:
  - `detailsContainerRef` - the expanded details section
  - `buttonsRef` - the floating buttons
  - `actionButtonsContainerRef` - the original button position

#### 4. **Visual Design**
- **Floating buttons**: 
  - Fixed position at `bottom-6 right-6`
  - Enhanced with `shadow-lg` for visibility
  - Smooth animation with `animate-in slide-in-from-bottom-4`
  - White background on outline button for contrast
  - `z-50` to stay above other content

- **Original buttons**: 
  - Remain at the bottom of the expanded details
  - Serve as the anchor point for sticky behavior

## User Experience Flow

1. **Collapsed State**: Risk card shows summary with "View Details" button
2. **Expanded State**: Click "View Details" to see all measures (Mitigation, Preventive, Reactive)
3. **Scrolling with Long Content**:
   - As user scrolls down, action buttons become sticky and float
   - Buttons remain accessible without scrolling back up
4. **Reaching Bottom**: 
   - When user scrolls to the original button position
   - Floating buttons disappear
   - Original buttons at bottom of card are visible and clickable

## Technical Implementation

### State Management
```typescript
const [showDetails, setShowDetails] = useState(false);
const [isSticky, setIsSticky] = useState(false);
const detailsContainerRef = useRef<HTMLDivElement>(null);
const buttonsRef = useRef<HTMLDivElement>(null);
const actionButtonsContainerRef = useRef<HTMLDivElement>(null);
```

### Scroll Detection Logic
- Monitors scroll position relative to:
  - Container top position (`containerRect.top < 80`)
  - Action buttons visibility (`actionButtonsRect.bottom > window.innerHeight`)
  - Bottom reached (`actionButtonsRect.bottom <= window.innerHeight + 10`)

### Button Actions
- **Edit**: Opens the EditRiskModal
- **Submit for Review**: Opens the ChangeRiskStatusModal (previously "Change Status")

## Benefits

1. **Improved Accessibility**: Users don't need to scroll back to the top to take action
2. **Better UX for Long Content**: Essential actions always visible when needed
3. **Smart Behavior**: Buttons only appear when useful, not cluttering the interface
4. **Responsive Design**: Works across different screen sizes
5. **Visual Feedback**: Smooth animations and clear visual hierarchy

## Notes

- The floating buttons only appear when "View Details" is expanded
- The sticky behavior is disabled when details are collapsed
- Scroll event listener is cleaned up when component unmounts or details are hidden
- Uses Tailwind CSS utility classes for styling and animations
