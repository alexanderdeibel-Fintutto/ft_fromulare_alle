import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Download, Plus, Loader2, FileText, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function DataExportCenter() {
  const [user, setUser] = useState(null);
  const [newExport, setNewExport] = useState({
    export_name: '',
    export_type: 'full',
    entities: [],
    format: 'json',
  });
  const [showDialog, setShowDialog] = useState(false);
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

  const { data: exports } = useQuery({
    queryKey: ['exports', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.DataExport.filter({
        user_email: user.email,
      }, '-created_date', 20);
    },
    enabled: !!user?.email,
  });

  const createExportMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('exportData', {
        export_name: newExport.export_name,
        export_type: newExport.export_type,
        entities: newExport.entities,
        format: newExport.format,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      setNewExport({ export_name: '', export_type: 'full', entities: [], format: 'json' });
      setShowDialog(false);
      toast.success('Export started');
    },
    onError: () => toast.error('Failed to start export'),
  });

  const availableEntities = [
    'GeneratedDocument',
    'DocumentShare',
    'DocumentTemplate',
    'Notification',
    'Analytics',
    'AuditLog',
  ];

  const formats = ['json', 'csv', 'sql'];

  const toggleEntity = (entity) => {
    setNewExport(prev => ({
      ...prev,
      entities: prev.entities.includes(entity)
        ? prev.entities.filter(e => e !== entity)
        : [...prev.entities, entity]
    }));
  };

  const downloadExport = (exportItem) => {
    if (!exportItem.file_url) return;
    
    const a = document.createElement('a');
    a.href = exportItem.file_url;
    a.download = `${exportItem.export_name}.${exportItem.format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Download started');
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Data Export Center</h1>
            <p className="text-gray-600 mt-2">Export your data in various formats</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Data Export</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Export Name</label>
                  <Input
                    value={newExport.export_name}
                    onChange={(e) => setNewExport({...newExport, export_name: e.target.value})}
                    placeholder="e.g., Full Data Backup"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Export Type</label>
                  <Select 
                    value={newExport.export_type} 
                    onValueChange={(value) => setNewExport({...newExport, export_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Export</SelectItem>
                      <SelectItem value="partial">Partial Export</SelectItem>
                      <SelectItem value="filtered">Filtered Export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Entities to Export</label>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {availableEntities.map(entity => (
                      <label key={entity} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newExport.entities.includes(entity)}
                          onChange={() => toggleEntity(entity)}
                          className="rounded"
                        />
                        <span className="text-sm">{entity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Format</label>
                  <Select 
                    value={newExport.format} 
                    onValueChange={(value) => setNewExport({...newExport, format: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map(fmt => (
                        <SelectItem key={fmt} value={fmt}>
                          {fmt.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => createExportMutation.mutate()}
                  disabled={!newExport.export_name.trim() || newExport.entities.length === 0}
                  className="w-full"
                >
                  Start Export
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {exports && exports.length > 0 ? (
            exports.map(exportItem => (
              <Card key={exportItem.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        {exportItem.export_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 capitalize">
                        {exportItem.export_type} • {exportItem.format.toUpperCase()}
                      </p>
                    </div>
                    <Badge className={statusColors[exportItem.status]}>
                      {exportItem.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    {exportItem.record_count && (
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-gray-600">Records</p>
                        <p className="font-semibold">{exportItem.record_count.toLocaleString()}</p>
                      </div>
                    )}
                    {exportItem.file_size_mb && (
                      <div className="p-2 bg-purple-50 rounded">
                        <p className="text-gray-600">Size</p>
                        <p className="font-semibold">{exportItem.file_size_mb.toFixed(2)} MB</p>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Entities:</p>
                    <div className="flex flex-wrap gap-1">
                      {exportItem.entities?.map(entity => (
                        <span key={entity} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {entity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {exportItem.status === 'completed' && exportItem.file_url && (
                    <Button 
                      size="sm" 
                      onClick={() => downloadExport(exportItem)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  )}

                  {exportItem.status === 'processing' && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No exports created yet
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}