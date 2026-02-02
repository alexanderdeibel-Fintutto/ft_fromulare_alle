import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare } from 'lucide-react';

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const eventTypes = [
    { id: 'document_shared', label: 'Document Shared' },
    { id: 'document_viewed', label: 'Document Viewed' },
    { id: 'share_approved', label: 'Share Approved' },
    { id: 'comment_added', label: 'Comment Added' }
  ];

  const methods = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'push', label: 'Push Notification', icon: Bell },
    { id: 'webhook', label: 'Webhook', icon: MessageSquare }
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const prefs = await base44.entities.NotificationSubscription.filter({
        user_email: currentUser.email
      });
      setPreferences(prefs || []);
    } catch (error) {
      console.error('Error loading preferences:', error);
      setPreferences([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = async (eventType, method) => {
    try {
      const existing = preferences.find(p => p.event_type === eventType && p.notification_method === method);
      
      if (existing) {
        await base44.entities.NotificationSubscription.delete(existing.id);
        setPreferences(prev => prev.filter(p => p.id !== existing.id));
      } else {
        await base44.entities.NotificationSubscription.create({
          user_email: user.email,
          event_type: eventType,
          notification_method: method,
          is_enabled: true
        });
        loadPreferences();
      }
    } catch (error) {
      console.error('Error toggling preference:', error);
    }
  };

  const isEnabled = (eventType, method) => {
    return preferences.some(p => p.event_type === eventType && p.notification_method === method && p.is_enabled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Notification Preferences</h1>
          <p className="text-gray-600">Customize how you receive notifications</p>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-4">
            {eventTypes.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{event.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {methods.map((method) => {
                      const Icon = method.icon;
                      const enabled = isEnabled(event.id, method.id);
                      return (
                        <button
                          key={method.id}
                          onClick={() => togglePreference(event.id, method.id)}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                            enabled
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 ${enabled ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className={enabled ? 'text-blue-900 font-semibold' : 'text-gray-700'}>
                              {method.label}
                            </span>
                          </div>
                          <div className={`w-4 h-4 rounded border ${enabled ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`} />
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}