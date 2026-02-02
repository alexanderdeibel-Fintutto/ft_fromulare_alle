import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AccessControlManager() {
  const [user, setUser] = useState(null);
  const [newAccess, setNewAccess] = useState({
    resource_type: 'document',
    resource_id: '',
    user_email: '',
    permission_level: 'read',
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

  const { data: accessControls } = useQuery({
    queryKey: ['accessControls'],
    queryFn: async () => {
      return await base44.entities.AccessControl.list('-created_date', 100);
    },
    enabled: !!user,
  });

  const createAccessMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.AccessControl.create({
        ...newAccess,
        granted_by: user.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessControls'] });
      setNewAccess({ resource_type: 'document', resource_id: '', user_email: '', permission_level: 'read' });
      setShowDialog(false);
      toast.success('Access granted');
    },
    onError: () => toast.error('Failed to grant access'),
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.AccessControl.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessControls'] });
      toast.success('Access revoked');
    },
  });

  const permissionColors = {
    read: 'bg-blue-100 text-blue-800',
    write: 'bg-green-100 text-green-800',
    delete: 'bg-orange-100 text-orange-800',
    admin: 'bg-purple-100 text-purple-800',
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activeAccess = accessControls?.filter(ac => ac.is_active).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Access Control</h1>
            <p className="text-gray-600 mt-2">Manage resource permissions</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Grant Access
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grant Resource Access</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Resource Type</label>
                  <Select 
                    value={newAccess.resource_type} 
                    onValueChange={(value) => setNewAccess({...newAccess, resource_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="page">Page</SelectItem>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="workspace">Workspace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Resource ID</label>
                  <Input
                    value={newAccess.resource_id}
                    onChange={(e) => setNewAccess({...newAccess, resource_id: e.target.value})}
                    placeholder="e.g., doc_123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">User Email</label>
                  <Input
                    value={newAccess.user_email}
                    onChange={(e) => setNewAccess({...newAccess, user_email: e.target.value})}
                    placeholder="user@example.com"
                    type="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Permission Level</label>
                  <Select 
                    value={newAccess.permission_level} 
                    onValueChange={(value) => setNewAccess({...newAccess, permission_level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="write">Write</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => createAccessMutation.mutate()}
                  disabled={!newAccess.resource_id.trim() || !newAccess.user_email.trim()}
                  className="w-full"
                >
                  Grant Access
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <UserCheck className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{activeAccess}</p>
                  <p className="text-sm text-gray-600">Active Permissions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{accessControls?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Rules</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Access Control List</CardTitle>
          </CardHeader>
          <CardContent>
            {accessControls && accessControls.length > 0 ? (
              <div className="space-y-2">
                {accessControls.map(access => (
                  <div key={access.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">{access.resource_type}</Badge>
                        <Badge className={permissionColors[access.permission_level]} className="capitalize">
                          {access.permission_level}
                        </Badge>
                        {!access.is_active && (
                          <Badge variant="outline" className="bg-gray-100">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm font-mono text-gray-700">
                        {access.resource_id} → {access.user_email}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Granted by {access.granted_by}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => revokeAccessMutation.mutate(access.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No access controls configured</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}