import React from 'react';
import { useAuth } from './AuthContext';

/**
 * Permission Check
 * Conditionally renders children based on permissions
 */

export default function PermissionCheck({
  children,
  require = [],
  requireAll = false,
  fallback = null
}) {
  const { user, isAdmin } = useAuth();

  if (!user) return fallback;

  // Admin has all permissions
  if (isAdmin) return children;

  // Get user permissions (stored in user object)
  const userPermissions = user.permissions || [];

  // Check permissions
  const hasPermission = requireAll
    ? require.every(perm => userPermissions.includes(perm))
    : require.some(perm => userPermissions.includes(perm));

  return hasPermission ? children : fallback;
}

/**
 * usePermission Hook
 */

export function usePermission() {
  const { user, isAdmin } = useAuth();

  const hasPermission = (permission) => {
    if (isAdmin) return true;
    return user?.permissions?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions) => {
    if (isAdmin) return true;
    return permissions.some(perm => user?.permissions?.includes(perm));
  };

  const hasAllPermissions = (permissions) => {
    if (isAdmin) return true;
    return permissions.every(perm => user?.permissions?.includes(perm));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
}