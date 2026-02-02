import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function WorkspaceManager() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    workspace_name: '',
    workspace_type: 'personal'
  });

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const data = await base44.entities.Workspace.filter(
        { owner_email: currentUser.email },
        '-created_at',
        50
      );

      setWorkspaces(data || []);
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      await base44.functions.invoke('manageWorkspace', {
        action: 'create',
        workspace_name: formData.workspace_name,
        workspace_type: formData.workspace_type
      });

      toast.success('Workspace erstellt');
      setFormData({ workspace_name: '', workspace_type: 'personal' });
      setShowCreate(false);
      loadWorkspaces();
    } catch (err) {
      toast.error('Fehler beim Erstellen');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="w-8 h-8" />
          Workspace Manager
        </h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Workspace
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <input
            type="text"
            placeholder="Workspace Name"
            value={formData.workspace_name}
            onChange={(e) => setFormData({ ...formData, workspace_name: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          <select
            value={formData.workspace_type}
            onChange={(e) => setFormData({ ...formData, workspace_type: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="personal">Personal</option>
            <option value="team">Team</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <div className="flex gap-3">
            <Button onClick={handleCreateWorkspace} className="bg-green-600 hover:bg-green-700">
              Erstellen
            </Button>
            <Button onClick={() => setShowCreate(false)} variant="outline">
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {workspaces.map(ws => (
          <div key={ws.id} className="bg-white rounded-lg border p-6 hover:shadow-lg transition">
            <h3 className="font-bold text-gray-900 mb-2">{ws.workspace_name}</h3>
            <p className="text-sm text-gray-600 mb-4 capitalize">{ws.workspace_type}</p>
            <div className="space-y-2 mb-4 text-xs text-gray-600">
              <p>Members: {ws.members?.length || 1}</p>
              <p>Storage: {ws.storage_used_gb?.toFixed(1) || 0} / {ws.storage_limit_gb} GB</p>
            </div>
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
              <Users className="w-4 h-4 mr-2" />
              Verwalten
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}