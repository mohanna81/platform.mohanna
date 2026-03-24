# Facilitator Role Restrictions - Consortium Management

## Overview
This document describes the changes made to restrict Facilitator access to the Consortium Management page, making their view equivalent to Organization Users (no access to consortium management features).

## Changes Made

### 1. Sidebar Navigation (`src/components/common/sidebarPages.json`)

**Before:**
```json
{
  "section": "Facilitator",
  "pages": [
    { "name": "Risk Review", "icon": "book-open", "path": "/risk-review" },
    { "name": "Consortium Management", "icon": "folder", "path": "/consortium-management" }
  ]
}
```

**After:**
```json
{
  "section": "Facilitator",
  "pages": [
    { "name": "Risk Review", "icon": "book-open", "path": "/risk-review" },
    { "name": "Consortium Management", "icon": "folder", "path": "/consortium-management", "roles": ["Super_user", "Admin"] }
  ]
}
```

**Impact:** The "Consortium Management" link is now hidden from the sidebar for Facilitators. Only Super_user and Admin roles can see and access this page.

---

### 2. Consortium Management Header (`src/components/consortium-management/ConsortiumManagementHeader.tsx`)

**Changes:**
- Added `canAddOrganization` prop to control the "New Organization" button visibility
- The "New Organization" button now conditionally renders based on this prop

**Code:**
```typescript
interface ConsortiumManagementHeaderProps {
  onNewConsortium?: () => void;
  onNewOrganization?: () => void;
  onNewUser?: () => void;
  canAddUser?: boolean;
  canAddConsortium?: boolean;
  canAddOrganization?: boolean;  // NEW
}

{canAddOrganization && (
  <Button variant="primary" size="md" onClick={onNewOrganization} className="w-full md:w-auto">
    + New Organization
  </Button>
)}
```

---

### 3. Consortium Management Page (`src/app/consortium-management/page.tsx`)

**Changes:**
- Added `canAddOrganization` logic to restrict organization creation to Super_user and Admin only
- Passed `canAddOrganization` prop to the header component

**Code:**
```typescript
// Check if current user can add organizations
const canAddOrganization = useMemo(() => {
  if (!user) return false;
  const canAdd = user.role === 'Super_user' || user.role === 'Admin';
  console.log('Can add organization:', canAdd);
  return canAdd;
}, [user]);

// In the JSX
<ConsortiumManagementHeader 
  onNewConsortium={handleOpenAddConsortium} 
  onNewOrganization={handleOpenAddOrg} 
  onNewUser={handleOpenAddUser} 
  canAddUser={canAddUser} 
  canAddConsortium={canAddConsortium} 
  canAddOrganization={canAddOrganization}  // NEW
/>
```

---

### 4. Consortium Detail Page (`src/app/consortiums/[id]/page.tsx`)

**Changes:**
- Updated `canEditConsortium` permission check to restrict editing to Super_user and Admin only
- Previously, all users except Organization Users could edit consortiums (including Facilitators)
- Now, only Super_user and Admin can edit consortiums

**Before:**
```typescript
const canEditConsortium = user && normalizeRole(user.role) !== 'Organization User';
```

**After:**
```typescript
const canEditConsortium = user && (normalizeRole(user.role) === 'Super_user' || normalizeRole(user.role) === 'Admin');
```

**Impact:** The edit button (pencil icon) in the consortium detail page header is now hidden for Facilitators and Organization Users. Only Super_user and Admin roles can see and use the edit functionality.

---

### 5. Consortiums List Table (`src/components/consortium-management/ActiveConsortiumsTable.tsx`)

**Changes:**
- Updated the edit button visibility logic to restrict it to Super_user and Admin only
- Previously, all users except Organization Users could see the edit button (including Facilitators)
- Now, only Super_user and Admin can see and use the edit button

**Before:**
```typescript
{user && normalizeRole(user.role) !== 'Organization User' && (
  <button>Edit</button>
)}
```

**After:**
```typescript
{user && (normalizeRole(user.role) === 'Super_user' || normalizeRole(user.role) === 'Admin') && (
  <button>Edit</button>
)}
```

**Impact:** The edit button in the consortiums table (on the main Consortiums page) is now hidden for Facilitators and Organization Users. Only Super_user and Admin roles can see and use the edit functionality.

---

## Role-Based Access Control Summary

### Super_user
- ✅ Can see "Consortium Management" in sidebar
- ✅ Can create consortiums
- ✅ Can create organizations
- ✅ Can create users (all roles)
- ✅ Can delete organizations and users
- ✅ Can edit consortiums

### Admin
- ✅ Can see "Consortium Management" in sidebar
- ✅ Can create consortiums
- ✅ Can create organizations
- ✅ Can create users (Admin, Facilitator, Organization User)
- ✅ Can delete organizations and users
- ✅ Can edit consortiums

### Facilitator
- ❌ Cannot see "Consortium Management" in sidebar
- ❌ Cannot create consortiums
- ❌ Cannot create organizations
- ❌ Cannot create users
- ❌ Cannot delete organizations or users
- ❌ Cannot edit consortiums
- ✅ Can still access "Risk Review" page
- ✅ Can view consortium details (read-only)

### Organization User
- ❌ Cannot see "Consortium Management" in sidebar
- ❌ Cannot create consortiums
- ❌ Cannot create organizations
- ❌ Cannot create users
- ❌ Cannot delete organizations or users
- ❌ Cannot edit consortiums
- ✅ Can view consortium details (read-only)

---

## Implementation Details

### Access Control Mechanism

1. **Sidebar Visibility:** Controlled via `roles` property in `sidebarPages.json`. The sidebar filtering logic in `Sidebar.tsx` checks if the user's role is in the allowed `roles` array.

2. **Button Visibility:** Controlled via `useMemo` hooks that compute boolean values (`canAddUser`, `canAddConsortium`, `canAddOrganization`) based on the current user's role.

3. **API-Level Protection:** The backend should also enforce these restrictions at the API level to prevent unauthorized access via direct API calls.

---

## Previous Related Changes

These changes build upon earlier work documented in `FACILITATOR_VIEW_CHANGES.md`:
- Facilitators can no longer add new users (already restricted)
- Facilitators can no longer manage consortiums (already restricted)
- Now: Facilitators can no longer access the Consortium Management page at all

---

## Testing Recommendations

1. **As Facilitator:**
   - Verify "Consortium Management" link does not appear in sidebar
   - Verify direct navigation to `/consortium-management` is handled appropriately (ideally with a redirect or access denied message)

2. **As Organization User:**
   - Verify "Consortium Management" link does not appear in sidebar
   - Both Facilitator and Organization User should have equivalent access

3. **As Admin/Super_user:**
   - Verify "Consortium Management" link appears in sidebar
   - Verify all buttons (New Consortium, New Organization, New User) are visible and functional

---

## Date Implemented
March 16, 2026
