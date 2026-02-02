import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Bell, User, Lock, LogOut, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NotificationPreferencesManager from '../components/settings/NotificationPreferencesManager';
import { toast } from 'sonner';

export default function UserProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
  });

  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => await base44.auth.me(),
  });

  const { data: preferences, isLoading: prefLoading } = useQuery({
    queryKey: ['notificationPreferences', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.NotificationSubscription.filter({
        user_email: currentUser.email,
      });
    },
    enabled: !!currentUser?.email,
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({ full_name: currentUser.full_name || '' });
    }
  }, [currentUser]);

  const updateUserMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error(error);
    },
  });

  const toggleNotificationMutation = useMutation({
    mutationFn: async (prefId) => {
      const pref = preferences.find((p) => p.id === prefId);
      await base44.entities.NotificationSubscription.update(prefId, {
        is_enabled: !pref.is_enabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      toast.success('Preference updated');
    },
    onError: (error) => {
      toast.error('Failed to update preference');
      console.error(error);
    },
  });

  const handleSaveProfile = () => {
    updateUserMutation.mutate({ full_name: formData.full_name });
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (userLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Profile Settings</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ full_name: e.target.value })}
                      disabled={!isEditing}
                      className="max-w-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      value={currentUser?.email || ''}
                      disabled
                      className="max-w-sm bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="max-w-sm px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-700 capitalize">
                      {currentUser?.role || 'user'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="default">
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleSaveProfile} disabled={updateUserMutation.isPending}>
                        {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button onClick={() => setIsEditing(false)} variant="outline">
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
           <TabsContent value="notifications" className="space-y-6">
             <NotificationPreferencesManager userEmail={currentUser?.email} />

             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Mail className="w-5 h-5" />
                   Erweiterte E-Mail-Einstellungen
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-gray-600 mb-4">
                   Verwalte zusätzliche E-Mail-Benachrichtigungsoptionen wie tägliche Zusammenfassungen und stille Stunden.
                 </p>
                 <Button onClick={() => navigate(createPageUrl('EmailNotificationSettings'))} variant="default" className="gap-2">
                   <Mail className="w-4 h-4" />
                   Zu E-Mail-Einstellungen
                 </Button>
               </CardContent>
             </Card>
           </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security & Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Logout</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Sign out from your account on this device.
                  </p>
                  <Button onClick={handleLogout} variant="destructive" size="sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>

                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Account Information</h3>
                  <p className="text-sm text-gray-600">
                    Member since {new Date(currentUser?.created_date).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}