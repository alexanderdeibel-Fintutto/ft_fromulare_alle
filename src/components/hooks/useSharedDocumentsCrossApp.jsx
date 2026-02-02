import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useSharedDocumentsCrossApp() {
  const [documents, setDocuments] = useState([]);
  const [groupedByApp, setGroupedByApp] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSharedDocuments();
  }, []);

  const fetchSharedDocuments = async () => {
    try {
      setLoading(true);
      const { data } = await base44.functions.invoke('getSharedDocumentsCrossApp');
      setDocuments(data.shared_documents || []);
      setGroupedByApp(data.grouped_by_app || {});
    } catch (err) {
      console.error('Fetch shared documents error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (shareId) => {
    try {
      await base44.functions.invoke('revokeDocumentShareCrossApp', {
        share_id: shareId
      });
      setDocuments(prev => prev.filter(d => d.id !== shareId));
      
      // Aktualisiere groupedByApp
      const newGrouped = {};
      documents
        .filter(d => d.id !== shareId)
        .forEach(share => {
          if (!newGrouped[share.source_app]) {
            newGrouped[share.source_app] = [];
          }
          newGrouped[share.source_app].push(share);
        });
      setGroupedByApp(newGrouped);
    } catch (err) {
      throw err;
    }
  };

  return {
    documents,
    groupedByApp,
    loading,
    error,
    refetch: fetchSharedDocuments,
    revokeShare
  };
}