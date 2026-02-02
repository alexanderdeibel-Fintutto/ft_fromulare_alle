import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, Save, Share2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function RealtimeCollaborationEditor() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [content, setContent] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (documentId && user) {
      subscribeToSession();
    }
  }, [documentId, user]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const subscribeToSession = async () => {
    try {
      const unsubscribe = base44.entities.RealtimeCollaborationSession.subscribe((event) => {
        if (event.data?.document_id === documentId) {
          if (event.type === 'update') {
            setContent(event.data.content || '');
            setActiveUsers(event.data.active_users || []);
            setSession(event.data);
          }
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to session:', error);
    }
  };

  const createSession = async () => {
    if (!documentName.trim()) {
      toast.error('Please enter document name');
      return;
    }

    try {
      const docId = `doc_${Date.now()}`;
      const newSession = await base44.entities.RealtimeCollaborationSession.create({
        document_id: docId,
        document_name: documentName,
        content: '',
        active_users: [
          {
            email: user.email,
            full_name: user.full_name,
            cursor_position: 0,
            color: generateColor(),
          },
        ],
      });

      setDocumentId(docId);
      setSession(newSession);
      setActiveUsers(newSession.active_users);
      toast.success('Collaboration session created');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  const updateContent = async (newContent) => {
    setContent(newContent);

    try {
      await base44.entities.RealtimeCollaborationSession.update(session.id, {
        content: newContent,
        version: (session.version || 0) + 1,
      });
    } catch (error) {
      console.error('Error updating content:', error);
    }
  };

  const saveDocument = async () => {
    if (!session) {
      toast.error('No active session');
      return;
    }

    setIsSaving(true);
    try {
      await base44.functions.invoke('saveDocument', {
        document_id: documentId,
        document_name: documentName,
        content: content,
        version: session.version,
      });
      toast.success('Document saved successfully');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const generateColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Real-time Collaboration</h1>
            <p className="text-gray-600 mt-2">Edit documents together in real-time</p>
          </div>
          {session && (
            <div className="flex gap-2">
              <Button onClick={saveDocument} disabled={isSaving} className="gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>

        {!session ? (
          <Card>
            <CardHeader>
              <CardTitle>Create New Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Document Name</label>
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter document name..."
                />
              </div>
              <Button onClick={createSession} className="w-full">
                Create Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Editor */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>{documentName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    ref={contentRef}
                    value={content}
                    onChange={(e) => updateContent(e.target.value)}
                    placeholder="Start typing..."
                    className="min-h-96 font-mono"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Active Users */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeUsers && activeUsers.length > 0 ? (
                    activeUsers.map((u, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: u.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No other users</p>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Session Info</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <p>
                    <span className="font-medium">Version:</span> {session?.version || 0}
                  </p>
                  <p>
                    <span className="font-medium">Words:</span> {content.split(/\s+/).length}
                  </p>
                  <p>
                    <span className="font-medium">Chars:</span> {content.length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}