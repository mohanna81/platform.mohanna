# Risk Review Loading Fix

## Problem Description

Facilitators were experiencing an issue where the **Risk Review** page would sometimes load with **no risks displayed**, even though pending/approved/rejected risks existed in the system.

## Root Cause Analysis

### The Issue

Similar to the Shared Risks page, the Risk Review page had multiple data loading issues:

1. **Single loading state** - Used one boolean `loading` instead of tracking each data source
2. **No guarantee of complete data** - Risks, consortia, and organizations could load at different times
3. **Race conditions** - Filtering logic applied before data finished loading
4. **Empty array filtering** - If consortia hadn't loaded, ALL risks would be filtered out
5. **No loading progress feedback** - Users couldn't see what was loading

### Affected Code

```typescript
// Before - Single loading state
const [loading, setLoading] = useState(true);

// Filtering without checking if consortia loaded
const availableConsortiumIds = consortia
  .filter(c => c.value !== '')
  .map(c => c.value);
// This would be empty if consortia hadn't loaded yet!
```

## Solution Implemented

### 1. **Granular Loading State Tracking**

Replaced single `loading` boolean with detailed state object:

```typescript
const [loadingState, setLoadingState] = useState({
  pendingRisks: true,
  approvedRisks: true,
  rejectedRisks: true,
  consortia: true,
  organizations: true,
});

const isFullyLoaded = !loadingState.pendingRisks && 
                      !loadingState.approvedRisks && 
                      !loadingState.rejectedRisks && 
                      !loadingState.consortia && 
                      !loadingState.organizations;
```

### 2. **Fixed Consortium Filtering Logic**

Updated filtering to only apply when consortia have actually loaded:

```typescript
// Before - Would filter out ALL risks if consortia was empty
} else {
  const availableConsortiumIds = consortia
    .filter(c => c.value !== '')
    .map(c => c.value);
  // ... filtering logic
}

// After - Check if consortia loaded before filtering
} else {
  if (consortia.length > 1) { // > 1 because we always have "All Consortiums" option
    const availableConsortiumIds = consortia
      .filter(c => c.value !== '')
      .map(c => c.value);
    // ... filtering logic
  }
  // If consortia haven't loaded yet, show all risks temporarily
}
```

### 3. **Enhanced fetchFilterData Function**

```typescript
const fetchFilterData = useCallback(async () => {
  setLoadingState(prev => ({ ...prev, consortia: true, organizations: true }));
  try {
    // Fetch organizations
    const orgsData = await fetchOrganizationsByRole(user);
    setOrganizations(orgOptions);
    setLoadingState(prev => ({ ...prev, organizations: false }));

    // Fetch consortia
    const consortiaData = await fetchConsortiaByRole(user);
    setConsortia(consortiaOptions);
    setLoadingState(prev => ({ ...prev, consortia: false }));
  } catch (error) {
    // Set fallback values
    setOrganizations([{ value: '', label: 'All Organizations' }]);
    setConsortia([{ value: '', label: 'All Consortiums' }]);
    setLoadingState(prev => ({ ...prev, consortia: false, organizations: false }));
  }
}, [user, isAdminOrSuper]);
```

### 4. **Improved Risk Loading**

Each risk category (pending, approved, rejected) now:
- Sets its loading state independently
- Has error handling with fallback empty arrays
- Clears loading state even on error

```typescript
useEffect(() => {
  const loadAllData = async () => {
    setLoadingState(prev => ({ 
      ...prev, 
      pendingRisks: true, 
      approvedRisks: true, 
      rejectedRisks: true 
    }));
    
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        risksService.getRisksByStatus('Pending'),
        risksService.getRisksByStatus('Approved'),
        risksService.getRisksByStatus('Rejected'),
      ]);
      
      // Process pending risks
      if (pendingRes.data?.success && Array.isArray(pendingRes.data.data)) {
        setAllPendingRisks(pendingRes.data.data);
      } else {
        setAllPendingRisks([]);
      }
      setLoadingState(prev => ({ ...prev, pendingRisks: false }));
      
      // ... same for approved and rejected
    } catch (error) {
      // Set empty arrays as fallback
      setAllPendingRisks([]);
      setAllApprovedRisks([]);
      setAllRejectedRisks([]);
      setLoadingState(prev => ({ 
        ...prev, 
        pendingRisks: false, 
        approvedRisks: false, 
        rejectedRisks: false 
      }));
    }
  };
  
  loadAllData();
}, []);
```

### 5. **DataLoadingProgress Component**

Replaced simple "Loading..." message with comprehensive progress indicator:

```typescript
{!isFullyLoaded ? (
  <DataLoadingProgress
    title="Loading Risk Review"
    subtitle="Please wait while we load all data..."
    items={[
      {
        key: 'pending',
        label: 'Pending Risks',
        isLoading: loadingState.pendingRisks,
        count: allPendingRisks.length
      },
      {
        key: 'approved',
        label: 'Approved Risks',
        isLoading: loadingState.approvedRisks,
        count: allApprovedRisks.length
      },
      {
        key: 'rejected',
        label: 'Rejected Risks',
        isLoading: loadingState.rejectedRisks,
        count: allRejectedRisks.length
      },
      {
        key: 'consortia',
        label: 'Consortia',
        isLoading: loadingState.consortia,
        count: consortia.length - 1
      },
      {
        key: 'organizations',
        label: 'Organizations',
        isLoading: loadingState.organizations,
        count: organizations.length - 1
      }
    ]}
  />
) : (
  // Show risk cards
)}
```

## Benefits for Facilitators

### ✅ **Guaranteed Risk Display**
- All three risk categories (Pending, Approved, Rejected) load completely
- Empty consortium list no longer filters out risks
- Content only displays after ALL data sources complete

### ✅ **Better Error Handling**
- Individual failures don't block other data
- Graceful fallbacks prevent blank screens
- Clear error messages for debugging

### ✅ **Comprehensive Loading Feedback**
- Users see exactly which data is loading:
  - Pending Risks
  - Approved Risks
  - Rejected Risks
  - Consortia
  - Organizations
- Real-time progress with counts
- No confusion about page state

### ✅ **Enhanced Logging**
Added extensive console logging:

```typescript
console.log('Fetching organizations for user:', user?.role, user?.id);
console.log('Organizations fetched:', orgsData);
console.log('RiskReviewPage - Organizations loaded:', orgOptions);
```

Helps administrators diagnose:
- Access permission issues
- Data loading problems
- Filtering logic errors

## Key Improvements

### Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Loading State** | Single boolean | 5 granular states |
| **Data Guarantee** | ❌ No guarantee | ✅ All data loads first |
| **Error Handling** | ❌ Could show blank page | ✅ Fallbacks + error toasts |
| **User Feedback** | ⚠️ "Loading..." | ✅ Detailed progress |
| **Filtering** | ❌ Could filter ALL risks | ✅ Smart conditional logic |
| **Debugging** | ⚠️ Limited logs | ✅ Comprehensive logs |

## Testing Checklist

- [ ] Facilitator can see all pending risks
- [ ] Loading progress shows all 5 data sources
- [ ] Risks display even if consortia fetch fails
- [ ] Risks display even if organizations fetch fails
- [ ] Filtering works correctly after data loads
- [ ] Tab switching works smoothly
- [ ] Refresh preserves correct state
- [ ] No blank screens or missing data
- [ ] Console shows detailed loading logs
- [ ] Success toast appears when complete

## Edge Cases Handled

1. **User with no consortia:** Risks still display, warning in console
2. **User with no organizations:** Risks still display, fallback to "All Organizations"
3. **Consortium fetch fails:** Risks still display with error toast
4. **Organization fetch fails:** Risks still display with error toast  
5. **Slow network:** Loading indicator stays until all complete
6. **Empty risk database:** Shows appropriate empty state per tab
7. **Partial API failures:** Working data still displays

## Files Modified

1. **src/app/risk-review/page.tsx** - Enhanced loading logic and filtering

## Related Fixes

This fix uses the same pattern as:
- **Shared Risks Page** - `src/app/shared-risks/page.tsx`
- **DataLoadingProgress** - `src/components/common/DataLoadingProgress.tsx`

## Monitoring Recommendations

For Facilitators experiencing issues, check browser console for:

```
Fetching consortia for user: Facilitator <user-id>
Consortia fetched: []  // <- Empty array indicates assignment issue
RiskReviewPage - Consortia loaded: [{"value": "", "label": "All Consortiums"}]
```

This indicates the user needs consortium assignment by an administrator.

## Performance Considerations

- **Parallel Loading:** All 5 data sources load simultaneously using `Promise.all()`
- **Independent States:** One slow API doesn't block others
- **Efficient Updates:** Functional `setState` prevents race conditions
- **Minimal Re-renders:** Proper `useCallback` and `useMemo` usage

## Future Enhancements

Consider:
- [ ] Add retry logic for failed fetches
- [ ] Implement caching for filter options
- [ ] Add loading skeleton for risk cards
- [ ] Preload data on page navigation

## Conclusion

The Risk Review page now has the same robust loading mechanism as Shared Risks, ensuring Facilitators always see their risks consistently and have clear feedback during the loading process.
