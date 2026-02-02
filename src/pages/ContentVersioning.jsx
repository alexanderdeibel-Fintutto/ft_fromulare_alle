import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Clock, Eye, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function ContentVersioning() {
  const [user, setUser] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
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

  const { data: versions } = useQuery({
    queryKey: ['contentVersions'],
    queryFn: async () => {
      return await base44.entities.ContentVersion.list('-created_date', 50);
    },
    enabled: !!user,
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async (versionId) => {
      await base44.entities.ContentVersion.update(versionId, { is_published: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentVersions'] });
      toast.success('Version restored');
    },
  });

  const groupedVersions = versions?.reduce((acc, version) => {
    const key = `${version.content_type}-${version.content_id}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(version);
    return acc;
  }, {}) || {};

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Content Versioning</h1>
          <p className="text-gray-600 mt-2">Track and restore content versions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <GitBranch className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{Object.keys(groupedVersions).length}</p>
                  <p className="text-sm text-gray-600">Content Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-10 h-10 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{versions?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Versions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Eye className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {versions?.filter(v => v.is_published).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedVersions).map(([key, contentVersions]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  {contentVersions[0].content_type} - {contentVersions[0].content_id}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contentVersions.map(version => (
                    <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">v{version.version_number}</Badge>
                          {version.is_published && (
                            <Badge className="bg-green-100 text-green-800">Published</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{version.change_summary || 'No description'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          By {version.created_by} • {new Date(version.created_date).toLocaleString()}
                        </p>
                      </div>
                      {!version.is_published && (
                        <Button 
                          size="sm" 
                          onClick={() => restoreVersionMutation.mutate(version.id)}
                          className="gap-1"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restore
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {Object.keys(groupedVersions).length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No content versions yet
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}