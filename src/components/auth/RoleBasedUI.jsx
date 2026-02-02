import React from 'react';
import { useAuth } from './AuthContext';

/**
 * Role Based UI
 * Shows/hides UI based on user role
 */

export function AdminOnly({ children, fallback = null }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : fallback;
}

export function UserOnly({ children, fallback = null }) {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated && !isAdmin ? children : fallback;
}

export function AuthenticatedOnly({ children, fallback = null }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : fallback;
}

export function PublicOnly({ children, fallback = null }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : fallback;
}

/**
 * Generic RoleBasedUI component
 */

export default function RoleBasedUI({
  role,
  children,
  fallback = null
}) {
  const { user, isAdmin, isAuthenticated } = useAuth();

  let hasAccess = false;

  if (role === 'admin') hasAccess = isAdmin;
  else if (role === 'user') hasAccess = isAuthenticated && !isAdmin;
  else if (role === 'authenticated') hasAccess = isAuthenticated;
  else if (role === 'public') hasAccess = !isAuthenticated;
  else if (role === 'any') hasAccess = true;

  return hasAccess ? children : fallback;
}