import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TeamManagement() {
  const [members, setMembers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [formData, setFormData] = useState({
    user_email: '',
    full_name: '',
    role: 'viewer'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const ws = await base44.entities.Workspace.filter(
        { owner_email: currentUser.email },
        null,
        10
      );

      setWorkspaces(ws || []);

      if (ws && ws.length > 0) {
        const memberData = await base44.entities.TeamMember.filter(
          { workspace_id: ws[0].id },
          null,
          50
        );

        setMembers(memberData || []);
      }
    } catch (err) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!formData.user_email || !workspaces[0]) {
      toast.error('Alle Felder erforderlich');
      return;
    }

    try {
      await base44.functions.invoke('manageTeamMember', {
        action: 'invite',
        workspace_id: workspaces[0].id,
        member_data: formData
      });

      toast.success('Invitation sent');
      setFormData({ user_email: '', full_name: '', role: 'viewer' });
      setShowInvite(false);
      loadData();
    } catch (err) {
      toast.error('Fehler beim Einladen');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await base44.functions.invoke('manageTeamMember', {
        action: 'remove',
        member_id: memberId
      });

      toast.success('Member removed');
      loadData();
    } catch (err) {
      toast.error('Fehler beim Entfernen');
    }
  };

  if (loading) return <div className="p-6">Wird geladen...</div>;

  const activeMembers = members.filter(m => m.status === 'active').length;
  const pendingInvites = members.filter(m => m.status === 'invited').length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="w-8 h-8" />
          Team Management
        </h1>
        <Button onClick={() => setShowInvite(!showInvite)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Total Members</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{members.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{activeMembers}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-600">Pending Invites</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{pendingInvites}</p>
        </div>
      </div>

      {showInvite && (
        <div className="bg-white rounded-lg border p-6 mb-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={formData.user_email}
            onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
            className="w-full border rounded-lg p-2"
          />
          <input
            type="text"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full border rounded-lg p-2"
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full border rounded-lg p-2"
          >
            <option value="viewer">Viewer</option>
            <option value="accountant">Accountant</option>
            <option value="finance_manager">Finance Manager</option>
            <option value="admin">Admin</option>
          </select>
          <div className="flex gap-3">
            <Button onClick={handleInviteMember} className="flex-1 bg-green-600 hover:bg-green-700">
              Send Invite
            </Button>
            <Button onClick={() => setShowInvite(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {members.map(member => (
          <div key={member.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="font-bold text-gray-900">{member.full_name || member.user_email}</p>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                <Shield className="w-3 h-3" />
                {member.role}
              </p>
            </div>
            <div className="text-right space-y-2">
              <span className={`block px-2 py-1 rounded text-xs font-bold capitalize ${
                member.status === 'active' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {member.status}
              </span>
              {member.status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}