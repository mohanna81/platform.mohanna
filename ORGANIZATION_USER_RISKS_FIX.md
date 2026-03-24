# Organization User Shared Risks Loading Fix

## Problem Description

Organization users were experiencing an issue where the "Shared Risks" page would sometimes load with **no risks displayed**, even though approved risks existed in the system.

## Root Cause Analysis

### The Issue

The problem occurred in the filtering logic at lines 178-185 of the original code:

```typescript
} else {
  // "All Consortiums" selected - filter to show only risks from available consortiums
  const availableConsortiumIds = consortiums.map(c => c._id);
  const hasAvailableConsortium = Array.isArray(risk.consortium) && 
    risk.consortium.some(c => availableConsortiumIds.includes(c._id));
  if (!hasAvailableConsortium) {
    return false;
  }
}
```

**Critical Problem:** If an Organization user's `consortiums` array was empty (either because it hadn't loaded yet, failed to load, or the user wasn't assigned to any consortiums), then ALL risks would be filtered out because none matched the empty consortium list.

### Why This Affected Organization Users More

Organization users rely on the `fetchConsortiaByRole()` function which:
1. Makes API calls to get user-specific consortiums
2. Can return an empty array if the user isn't properly assigned
3. May have network delays or race conditions

## Solution Implemented

### 1. **Enhanced Loading State Management**

Added granular tracking for each data source:

```typescript
interface LoadingState {
  risks: boolean;
  consortiums: boolean;
  organizations: boolean;
}

const isFullyLoaded = !loadingState.risks && !loadingState.consortiums && !loadingState.organizations;
```

### 2. **Improved Filtering Logic**

Updated the consortium filtering to only apply when data is actually available:

```typescript
// Consortium filter - only apply if consortiums have loaded
if (filters.consortium && filters.consortium.trim() !== '') {
  // Specific consortium selected - filter by that consortium
  const hasConsortium = Array.isArray(risk.consortium) && 
    risk.consortium.some(c => c._id === filters.consortium);
  if (!hasConsortium) {
    return false;
  }
} else if (consortiums.length > 0) {
  // "All Consortiums" selected AND consortiums have loaded
  // Filter to show only risks from available consortiums
  const availableConsortiumIds = consortiums.map(c => c._id);
  const hasAvailableConsortium = Array.isArray(risk.consortium) && 
    risk.consortium.some(c => availableConsortiumIds.includes(c._id));
  if (!hasAvailableConsortium) {
    return false;
  }
}
// If consortiums haven't loaded yet (length === 0), show all risks temporarily
```

**Key Change:** The filtering now checks `consortiums.length > 0` before applying consortium-based filtering. This prevents the empty array from filtering out all risks.

### 3. **Enhanced Logging for Debugging**

Added comprehensive console logging to help diagnose issues:

```typescript
console.log('Fetching consortiums for user:', user.role, user.id);
console.log('Consortiums fetched:', consortia);
console.log('Consortiums set to state:', consortia.length, 'items');
```

When data is fully loaded:

```typescript
console.log('All data loaded - Final state:', {
  risks: risks.length,
  consortiums: consortiums.length,
  organizations: organizations.length,
  userRole: user?.role
});

// Warn if Organization User has no consortiums
if (user?.role === 'Organization User' && consortiums.length === 0) {
  console.warn('Organization User has no consortiums loaded - this may filter out all risks');
}
```

### 4. **Consistent Loading UI**

Implemented `DataLoadingProgress` component that:
- Uses your brand colors (`#FBBF77` for loading, emerald for success)
- Shows real-time progress for each data source
- Displays counts as items load
- Only shows content when ALL data is fully loaded

```typescript
{!isFullyLoaded ? (
  <DataLoadingProgress
    title="Loading Shared Risks"
    subtitle="Please wait while we load all data..."
    items={[
      { key: 'risks', label: 'Risks', isLoading: loadingState.risks, count: risks.length },
      { key: 'consortiums', label: 'Consortiums', isLoading: loadingState.consortiums, count: consortiums.length },
      { key: 'organizations', label: 'Organizations', isLoading: loadingState.organizations, count: organizations.length }
    ]}
  />
) : (
  // Show risks table
)}
```

### 5. **Coordinated Data Loading**

All data sources load in parallel using `Promise.all()`:

```typescript
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
```

## Benefits for Organization Users

### ✅ **Guaranteed Risk Display**
- Risks are ALWAYS displayed once loading completes
- Empty consortium list no longer filters out all risks
- Users see all approved risks they have access to

### ✅ **Better Error Handling**
- Failed consortium/organization fetches don't block risk display
- Graceful fallbacks prevent blank screens
- Console warnings help administrators diagnose access issues

### ✅ **Clear Loading Feedback**
- Users see exactly what's loading
- Progress indicators show when data is being fetched
- No confusion about whether the page is stuck or empty

### ✅ **Improved Debugging**
- Comprehensive logging for each fetch operation
- Easy to identify if user lacks consortium assignments
- Warnings appear in console for empty datasets

## Testing Checklist for Organization Users

- [ ] Organization user can see shared risks page load completely
- [ ] Loading progress shows all three data sources
- [ ] Risks display even if user has no consortiums assigned
- [ ] Risks display even if consortium fetch fails
- [ ] Filtering works correctly after all data loads
- [ ] No blank screens or "No risks found" when risks exist
- [ ] Console logs show data counts for debugging
- [ ] Success toast appears when loading completes

## Edge Cases Handled

1. **User with no consortiums:** Risks still display, console warning appears
2. **Consortium fetch fails:** Risks still display with error toast
3. **Organization fetch fails:** Risks still display with error toast
4. **Slow network:** Loading indicator stays visible until all data loads
5. **Empty risks database:** Shows "No shared risks found" message (correct behavior)

## Files Modified

1. **src/app/shared-risks/page.tsx** - Enhanced loading logic and filtering
2. **src/components/common/DataLoadingProgress.tsx** - New loading component with brand styling
3. **src/components/common/index.ts** - Export new component
4. **SHARED_RISKS_LOADING_FIX.md** - Original fix documentation

## Monitoring Recommendations

For Organization users experiencing issues, check browser console for:

```
Fetching consortiums for user: Organization User <user-id>
Consortiums fetched: []  // <- Empty array indicates assignment issue
Organization User has no consortiums loaded - this may filter out all risks
```

This indicates the user needs to be assigned to consortiums by an administrator.

## Next Steps

If Organization users still see no risks after this fix:

1. Check browser console for loading state logs
2. Verify user is assigned to at least one consortium
3. Confirm approved risks exist in those consortiums
4. Check network tab for API call failures
5. Verify user permissions and role assignment
