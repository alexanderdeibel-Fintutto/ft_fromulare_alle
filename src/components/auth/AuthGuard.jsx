import React from 'react';
import { useAuth } from './AuthContext';
import { LoadingState } from '../feedback/LoadingState';
import { AlertCircle } from 'lucide-react';

/**
 * Auth Guard
 * Protects routes and shows login prompt
 */

export default function AuthGuard({
  children,
  requiredRole = null,
  fallback = null,
  onUnauthorized = null
}) {
  const { user, loading, isAuthenticated, isAdmin, login } = useAuth();

  if (loading) {
    return fallback || <LoadingState message="Wird authentifiziert..." />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    const unAuthFallback = onUnauthorized ? (
      onUnauthorized()
    ) : (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentifizierung erforderlich</h1>
        <p className="text-gray-600 mb-6">Sie müssen sich anmelden um auf diese Seite zuzugreifen</p>
        <button
          onClick={() => login()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Anmelden
        </button>
      </div>
    );

    return unAuthFallback;
  }

  // Check role requirement
  if (requiredRole === 'admin' && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h1>
        <p className="text-gray-600">Sie haben keine Berechtigung für diese Seite</p>
      </div>
    );
  }

  return children;
}