import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { toast } from 'sonner';
import DocumentCard from './DocumentCard';

export default function SharedDocumentsPaginated() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    hasMore: false
  });

  useEffect(() => {
    loadDocuments();
  }, [pagination.page]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const offset = (pagination.page - 1) * pagination.pageSize;
      
      // Fetch shared documents using cross-app function
      const response = await base44.functions.invoke('getSharedDocumentsCrossApp', {
        limit: pagination.pageSize,
        offset
      });

      const allShares = response.data.shares || [];
      const total = response.data.total || 0;

      setDocuments(allShares);
      setPagination(prev => ({
        ...prev,
        total,
        hasMore: offset + pagination.pageSize < total
      }));
    } catch (err) {
      toast.error('Fehler beim Laden der Dokumente');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && (newPage === 1 || pagination.hasMore)) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (documents.length === 0 && pagination.page === 1) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Keine Dokumente mit dir geteilt</p>
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="space-y-6">
      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(share => (
          <div key={share.id} className="relative">
            <DocumentCard
              document={{
                id: share.document_id,
                title: share.document_title,
                created_date: share.shared_at,
                ...share
              }}
              isShared={true}
            />
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Seite {pagination.page} von {totalPages} • {pagination.total} Dokument(e)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasMore || loading}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}