# Shared Risk Register Loading Fix

## Problem Description

The shared risk register page was sometimes loading with no risks displayed. This was due to race conditions and lack of proper loading state management when fetching multiple data sources simultaneously.

## Solution Implemented

### 1. Enhanced Loading State Management

**Before:**
- Single `loading` boolean state
- Multiple async operations running independently
- No guarantee all data loaded before displaying content
- No visibility into what was still loading

**After:**
- Granular loading state tracking for each data source:
  - Risks
  - Consortiums
  - Organizations
- All data sources must complete before displaying content
- Clear loading progress indicators

### 2. Key Changes

#### A. Loading State Structure (`src/app/shared-risks/page.tsx`)

```typescript
interface LoadingState {
  risks: boolean;
  consortiums: boolean;
  organizations: boolean;
}

const [loadingState, setLoadingState] = useState<LoadingState>({
  risks: true,
  consortiums: true,
  organizations: true,
});

const isFullyLoaded = !loadingState.risks && !loadingState.consortiums && !loadingState.organizations;
```

#### B. Coordinated Data Fetching

All data sources are loaded using `Promise.all()` to ensure they complete together:

```typescript
useEffect(() => {
  const loadAllData = async () => {
    await Promise.all([
      fetchApprovedRisks(),
      fetchConsortiums(),
      fetchOrganizations(),
    ]);
    
    if (isInitialLoad.current) {
      showToast.success('Successfully loaded shared risks');
      isInitialLoad.current = false;
    }
  };

  loadAllData();
}, [fetchApprovedRisks, fetchConsortiums, fetchOrganizations]);
```

#### C. Individual Loading State Updates

Each fetch function now updates its specific loading state:

```typescript
const fetchApprovedRisks = useCallback(async () => {
  setLoadingState(prev => ({ ...prev, risks: true }));
  try {
    // ... fetch logic
  } finally {
    setLoadingState(prev => ({ ...prev, risks: false }));
  }
}, []);
```

### 3. New Component: DataLoadingProgress (Consistent UI)

Created a reusable loading component (`src/components/common/DataLoadingProgress.tsx`) that provides:

- **Consistent brand styling** - Uses your existing `Loader` component (emerald spinner)
- **Brand color progress bar** - Uses `#FBBF77` (brand-peach) for loading, emerald for completion
- **Visual progress indicator** - Animated spinner with progress bar
- **Item-by-item status** - Shows which items are loading vs loaded
- **Count display** - Shows number of items loaded for each category
- **Completion state** - Visual confirmation when all data is loaded

#### Features:

```typescript
<DataLoadingProgress
  title="Loading Shared Risks"
  subtitle="Please wait while we load all data..."
  items={[
    {
      key: 'risks',
      label: 'Risks',
      isLoading: loadingState.risks,
      count: risks.length
    },
    // ... more items
  ]}
/>
```

### 4. Error Handling Improvements

Each fetch function now:
- Catches errors independently
- Sets empty arrays as fallback
- Shows user-friendly error toasts
- Ensures loading state is cleared even on error

```typescript
try {
  // fetch logic
} catch (error) {
  console.error('Error fetching risks:', error);
  setRisks([]);
  showToast.error('Failed to load shared risks');
} finally {
  setLoadingState(prev => ({ ...prev, risks: false }));
}
```

## Benefits

### 1. **Guaranteed Data Availability**
- Content only displays after ALL data sources have loaded
- Eliminates race conditions and partial data display

### 2. **Better User Experience**
- Clear visual feedback on loading progress
- Users can see exactly what's being loaded
- Progress bar provides sense of completion

### 3. **Improved Debugging**
- Console logs show which data sources succeeded/failed
- Loading states are tracked independently
- Easier to identify which API call is causing issues

### 4. **Reusability**
- `DataLoadingProgress` component can be used on any page
- Consistent loading experience across the application

### 5. **Error Resilience**
- Failed requests don't block other data from loading
- Graceful fallbacks prevent blank screens
- User is informed of specific failures

## Usage in Other Pages

To implement similar loading in other pages:

```typescript
import DataLoadingProgress from '@/components/common/DataLoadingProgress';

// Define loading state
const [loadingState, setLoadingState] = useState({
  data1: true,
  data2: true,
});

const isFullyLoaded = !loadingState.data1 && !loadingState.data2;

// In your render:
{!isFullyLoaded ? (
  <DataLoadingProgress
    title="Loading Your Data"
    items={[
      { key: 'data1', label: 'Data 1', isLoading: loadingState.data1, count: data1.length },
      { key: 'data2', label: 'Data 2', isLoading: loadingState.data2, count: data2.length },
    ]}
  />
) : (
  // Your content here
)}
```

## Testing Checklist

- ✅ Page loads with all risks displayed consistently
- ✅ Loading progress shows correct status for each data source
- ✅ Error handling works for individual API failures
- ✅ Success toast appears only once on initial load
- ✅ Filtering and pagination work correctly after data loads
- ✅ Refresh maintains proper loading behavior
- ✅ Network errors are handled gracefully

## Files Modified

1. **src/app/shared-risks/page.tsx** - Main page with enhanced loading logic
2. **src/components/common/DataLoadingProgress.tsx** - New loading component (created)
3. **src/components/common/index.ts** - Export new component

## Dependencies

No new dependencies were added. The solution uses existing React hooks and components.

## Performance Considerations

- `Promise.all()` ensures parallel loading (not sequential)
- Loading states update efficiently using functional setState
- Component re-renders are minimized with proper memoization
- No unnecessary API calls on subsequent renders
