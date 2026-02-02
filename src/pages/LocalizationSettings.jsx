import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Clock, Hash, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function LocalizationSettings() {
  const [user, setUser] = useState(null);
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

  const { data: preferences } = useQuery({
    queryKey: ['localizationPreferences', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const results = await base44.entities.UserLanguagePreference.filter({
        user_email: user.email,
      });
      return results?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return await base44.entities.UserLanguagePreference.update(preferences.id, data);
      } else {
        return await base44.entities.UserLanguagePreference.create({
          user_email: user.email,
          ...data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localizationPreferences'] });
      toast.success('Preferences updated');
    },
    onError: () => toast.error('Failed to update preferences'),
  });

  const languages = [
    { code: 'de', name: '🇩🇪 Deutsch' },
    { code: 'en', name: '🇺🇸 English' },
    { code: 'fr', name: '🇫🇷 Français' },
    { code: 'es', name: '🇪🇸 Español' },
    { code: 'it', name: '🇮🇹 Italiano' },
  ];

  const timezones = [
    'Europe/Berlin',
    'Europe/London',
    'Europe/Paris',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Asia/Dubai',
  ];

  const dateFormats = ['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
  const numberFormats = [
    { code: 'de', name: '1.234,56 (German)' },
    { code: 'en', name: '1,234.56 (English)' },
  ];

  if (!preferences && !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Localization Settings</h1>
          <p className="text-gray-600">Customize language, timezone, and regional formats</p>
        </div>

        <div className="space-y-6">
          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Language</label>
                <Select
                  value={preferences?.preferred_language || 'de'}
                  onValueChange={(value) =>
                    updatePreferencesMutation.mutate({ preferred_language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Timezone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timezone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Timezone</label>
                <Select
                  value={preferences?.timezone || 'Europe/Berlin'}
                  onValueChange={(value) =>
                    updatePreferencesMutation.mutate({ timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Date Format */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Date Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Format</label>
                <Select
                  value={preferences?.date_format || 'DD.MM.YYYY'}
                  onValueChange={(value) =>
                    updatePreferencesMutation.mutate({ date_format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map(format => (
                      <SelectItem key={format} value={format}>
                        {format} (Example: {format === 'DD.MM.YYYY' ? '25.12.2026' : format === 'MM/DD/YYYY' ? '12/25/2026' : '2026-12-25'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Number Format */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Number Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Format</label>
                <Select
                  value={preferences?.number_format || 'de'}
                  onValueChange={(value) =>
                    updatePreferencesMutation.mutate({ number_format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {numberFormats.map(fmt => (
                      <SelectItem key={fmt.code} value={fmt.code}>
                        {fmt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-gray-500 p-4 bg-blue-50 rounded">
            Your preferences will be applied across the entire application for a localized experience.
          </div>
        </div>
      </div>
    </div>
  );
}