import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import useAuth from './useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function AuthGuard({ children, requireAuth = true }) {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && requireAuth && !isAuthenticated) {
            navigate(createPageUrl('Register'));
        }
    }, [isAuthenticated, loading, requireAuth, navigate]);

    if (loading) {
        return <LoadingSpinner text="Lade Authentifizierung..." />;
    }

    if (requireAuth && !isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}