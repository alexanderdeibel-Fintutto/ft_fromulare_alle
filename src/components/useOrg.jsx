import { useState, useEffect } from 'react';
import { getUserOrganizations } from './services/supabase';
import useAuth from './useAuth';

export default function useOrg() {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadOrganizations = async () => {
    try {
      const orgs = await getUserOrganizations(user.id);
      setOrganizations(orgs);
      
      // Set current org from localStorage or use first org
      const savedOrgId = localStorage.getItem('currentOrgId');
      const defaultOrg = orgs.find(o => o.id === savedOrgId) || orgs[0];
      
      if (defaultOrg) {
        setCurrentOrg(defaultOrg);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchOrg = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrg(org);
      localStorage.setItem('currentOrgId', orgId);
    }
  };

  return {
    currentOrg,
    organizations,
    loading,
    switchOrg,
    refetch: loadOrganizations
  };
}