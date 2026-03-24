export type UserRole = 'Super_user' | 'Admin' | 'Facilitator' | 'Organization User';

/**
 * Role Hierarchy System
 * 
 * Users can only see and manage users of equal or lower hierarchy levels:
 * - Super_user (Level 4): Can see all users
 * - Admin (Level 3): Can see Admin, Facilitator, and Organization User users
 * - Facilitator (Level 2): Can see Facilitator and Organization User users  
 * - Organization User (Level 1): Can only see Organization User users
 */
const roleHierarchy: Record<UserRole, number> = {
  'Super_user': 4,
  'Admin': 3,
  'Facilitator': 2,
  'Organization User': 1,
};

/**
 * Normalize role names from API to match our hierarchy system
 */
export function normalizeRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    'Super_user': 'Super_user',
    'super_user': 'Super_user',
    'superuser': 'Super_user',
    'Admin': 'Admin',
    'Facilitator': 'Facilitator',
    'Organization': 'Organization User',
    'organization': 'Organization User',
    'org': 'Organization User',
    'Organization User': 'Organization User',
  };
  
  return roleMap[role] || 'Organization User'; // Default to lowest level if unknown
}

/**
 * Check if a user can view another user based on role hierarchy
 * Users can only see users of equal or lower hierarchy levels
 */
export function canViewUser(viewerRole: UserRole, targetUserRole: UserRole): boolean {
  const viewerLevel = roleHierarchy[viewerRole];
  const targetLevel = roleHierarchy[targetUserRole];
  
  return viewerLevel >= targetLevel;
}

/**
 * Get the hierarchy level of a role
 */
export function getRoleLevel(role: UserRole): number {
  return roleHierarchy[role];
}

/**
 * Check if a role is higher in hierarchy than another
 */
export function isHigherRole(role1: UserRole, role2: UserRole): boolean {
  return roleHierarchy[role1] > roleHierarchy[role2];
}

/**
 * Get all roles that a user can view
 */
export function getViewableRoles(userRole: UserRole): UserRole[] {
  const userLevel = roleHierarchy[userRole];
  return Object.entries(roleHierarchy)
    .filter(([, level]) => level <= userLevel)
    .map(([role]) => role as UserRole);
} 