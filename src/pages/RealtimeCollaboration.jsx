import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Edit2, Activity } from 'lucide-react';

export default function RealtimeCollaboration() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
    const unsubscribe = base44.entities.RealtimeSession.subscribe((event) => {
      if (event.type === 'create') {
        setActiveSessions(prev => [...prev, event.data]);
      } else if (event.type === 'update') {
        setActiveSessions(prev => prev.map(s => s.id === event.id ? event.data : s));
      } else if (event.type === 'delete') {
        setActiveSessions(prev => prev.filter(s => s.id !== event.id));
      }
    });

    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const sessions = await base44.entities.RealtimeSession.filter({ session_status: 'active' });
      setActiveSessions(sessions || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setActiveSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const startCollaborativeSession = async () => {
    try {
      await base44.entities.RealtimeSession.create({
        document_id: 'doc_' + Date.now(),
        user_email: user.email,
        session_status: 'active',
        cursor_position: 0
      });
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Real-time Collaboration</h1>
          <p className="text-gray-600">Edit documents together in real-time with live presence</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : activeSessions.length > 0 ? (
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{session.user_email}</p>
                          <p className="text-sm text-gray-500">Document: {session.document_id}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Activity className="w-3 h-3" /> {session.session_status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No active collaboration sessions</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit2 className="w-5 h-5" /> Start Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={startCollaborativeSession}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Collaborative Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}