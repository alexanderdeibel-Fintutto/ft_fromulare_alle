import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useUserDocuments(options = {}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  const loadDocuments = useCallback(async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        setDocuments([]);
        setLoading(false);
        return;
      }
      setUser(currentUser);
      
      const filters = { user_email: currentUser.email };
      if (options.favoritesOnly) filters.is_favorite = true;
      
      const data = await base44.entities.GeneratedDocument?.filter?.(
        filters,
        '-created_date',
        100
      ) || [];
      setDocuments(data);
    } catch (err) {
      console.error('Load documents failed:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);
  
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);
  
  const toggleFavorite = async (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    
    await base44.entities.GeneratedDocument.update(docId, {
      is_favorite: !doc.is_favorite
    });
    setDocuments(prev => 
      prev.map(d => d.id === docId ? { ...d, is_favorite: !d.is_favorite } : d)
    );
  };
  
  const removeDocument = async (docId) => {
    await base44.entities.GeneratedDocument.delete(docId);
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };
  
  return {
    documents,
    loading,
    user,
    refresh: loadDocuments,
    toggleFavorite,
    removeDocument
  };
}