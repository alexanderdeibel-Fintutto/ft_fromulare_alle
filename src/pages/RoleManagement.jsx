import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RoleManagement() {
  const [user, setUser] = useState(null);
  const [newRole, setNewRole] = useState({ role_name: '', description: '', permissions: [] });
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

  const { data: roles } = useQuery({
    queryKey: ['roles', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.PermissionRole.filter({
        organization_email: user.email,
      });
    },
    enabled: !!user?.email,
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.PermissionRole.create({
        role_name: data.role_name,
        description: data.description,
        permissions: data.permissions,
        organization_email: user.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setNewRole({ role_name: '', description: '', permissions: [] });
      setShowDialog(false);
      toast.success('Role created');
    },
    onError: () => toast.error('Failed to create role'),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.PermissionRole.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted');
    },
    onError: () => toast.error('Failed to delete role'),
  });

  const availablePermissions = [
    'read_documents',
    'create_documents',
    'edit_documents',
    'delete_documents',
    'share_documents',
    'manage_users',
    'manage_roles',
    'view_analytics',
    'export_data',
  ];

  const togglePermission = (perm) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Role Management</h1>
            <p className="text-gray-600 mt-2">Create and manage user roles with permissions</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role Name</label>
                  <Input
                    value={newRole.role_name}
                    onChange={(e) => setNewRole({...newRole, role_name: e.target.value})}
                    placeholder="e.g., Editor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                    placeholder="Role description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">Permissions</label>
                  <div className="grid grid-cols-2 gap-3">
                    {availablePermissions.map(perm => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRole.permissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                          className="rounded"
                        />
                        <span className="text-sm capitalize">{perm.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => createRoleMutation.mutate(newRole)}
                  disabled={!newRole.role_name || newRole.permissions.length === 0}
                  className="w-full"
                >
                  Create Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {roles && roles.length > 0 ? (
            roles.map(role => (
              <Card key={role.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        {role.role_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteRoleMutation.mutate(role.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions?.map(perm => (
                      <span key={perm} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {perm}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No roles created yet
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}