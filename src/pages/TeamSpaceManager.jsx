import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Plus, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamSpaceManager() {
  const [showNewSpace, setShowNewSpace] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: spaces = [], refetch } = useQuery({
    queryKey: ['teamSpaces'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const result = await base44.asServiceRole.entities.TeamSpace.filter({
        owner_email: user.email
      });
      return result || [];
    }
  });

  const handleCreateSpace = async () => {
    if (!newSpaceName) {
      toast.error('Name erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('createTeamSpace', {
        workspace_name: newSpaceName,
        description: ''
      });
      setNewSpaceName('');
      setShowNewSpace(false);
      await refetch();
      toast.success('Team erstellt');
    } catch (error) {
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !selectedSpace) {
      toast.error('Alle Felder erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('inviteTeamMember', {
        workspace_id: selectedSpace.id,
        member_email: inviteEmail,
        role: 'member'
      });
      setInviteEmail('');
      setShowInvite(false);
      await refetch();
      toast.success('Einladung gesendet');
    } catch (error) {
      toast.error('Einladung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Team Spaces</h1>
        <Button onClick={() => setShowNewSpace(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neues Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {spaces.map(space => (
          <Card key={space.id} className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{space.workspace_name}</h2>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>{space.description || 'Keine Beschreibung'}</p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {space.members?.length || 0} Mitglieder
              </p>
              <p>Plan: <span className="font-medium capitalize">{space.plan}</span></p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedSpace(space);
                  setShowInvite(true);
                }}
                className="flex-1 gap-2"
              >
                <Plus className="w-4 h-4" />
                Einladung
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Space Dialog */}
      <Dialog open={showNewSpace} onOpenChange={setShowNewSpace}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Team name"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              disabled={loading}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewSpace(false)} disabled={loading}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateSpace} disabled={loading} className="flex-1 gap-2">
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitglied einladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="E-Mail"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={loading}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowInvite(false)} disabled={loading}>
                Abbrechen
              </Button>
              <Button onClick={handleInviteMember} disabled={loading} className="flex-1 gap-2">
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Einladen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}