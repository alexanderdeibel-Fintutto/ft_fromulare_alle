import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Trash2, RefreshCw, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function CacheManagement() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const { data: cacheEntries } = useQuery({
    queryKey: ['cacheEntries'],
    queryFn: async () => {
      return await base44.entities.CacheEntry.list('-created_date', 100);
    },
    enabled: !!user,
  });

  const clearCacheMutation = useMutation({
    mutationFn: async (cacheId) => {
      await base44.entities.CacheEntry.delete(cacheId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cacheEntries'] });
      toast.success('Cache cleared');
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      for (const entry of cacheEntries || []) {
        await base44.entities.CacheEntry.delete(entry.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cacheEntries'] });
      toast.success('All cache cleared');
    },
  });

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const totalSize = cacheEntries?.reduce((sum, e) => sum + (e.size_bytes || 0), 0) || 0;
  const totalHits = cacheEntries?.reduce((sum, e) => sum + (e.hit_count || 0), 0) || 0;
  const avgHitRate = cacheEntries?.length > 0 ? (totalHits / cacheEntries.length).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Cache Management</h1>
            <p className="text-gray-600 mt-2">Monitor and manage application cache</p>
          </div>
          <Button onClick={() => clearAllMutation.mutate()} variant="destructive" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All Cache
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Database className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{cacheEntries?.length || 0}</p>
                  <p className="text-sm text-gray-600">Cache Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Database className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{(totalSize / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="text-sm text-gray-600">Total Size</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{totalHits}</p>
                  <p className="text-sm text-gray-600">Total Hits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{avgHitRate}</p>
                  <p className="text-sm text-gray-600">Avg Hit Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cache Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {cacheEntries && cacheEntries.length > 0 ? (
              <div className="space-y-2">
                {cacheEntries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">{entry.cache_type}</Badge>
                        <span className="text-sm font-mono text-gray-700">{entry.cache_key}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Hits: {entry.hit_count}</span>
                        <span>Size: {(entry.size_bytes / 1024).toFixed(2)} KB</span>
                        <span>TTL: {entry.ttl_seconds}s</span>
                        <span>Expires: {new Date(entry.expires_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => clearCacheMutation.mutate(entry.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No cache entries</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}