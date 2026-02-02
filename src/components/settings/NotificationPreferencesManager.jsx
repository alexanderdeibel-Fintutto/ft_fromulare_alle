import React, { useState } from 'react';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Notification Preferences Manager
 * Manages all notification types and delivery methods
 */
export default function NotificationPreferencesManager({ userEmail }) {
  const { preferences, isLoading, eventTypes, updatePreference, isUpdating, bulkUpdate, isBulkUpdating } =
    useNotificationPreferences(userEmail);

  const [expandedCategory, setExpandedCategory] = useState('Aufgaben');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const categories = [...new Set(eventTypes.map(et => et.category))];
  const preferenceMap = new Map(preferences.map(p => [p.event_type, p]));

  function handleToggle(eventType, field) {
    const pref = preferenceMap.get(eventType);
    if (!pref) return;

    updatePreference({
      preferenceId: pref.id,
      data: { [field]: !pref[field] },
    });
  }

  function handleFrequencyChange(eventType, value) {
    const pref = preferenceMap.get(eventType);
    if (!pref) return;

    updatePreference({
      preferenceId: pref.id,
      data: { email_frequency: value },
    });
  }

  function handleBulkEnable(field, value) {
    bulkUpdate({ [field]: value });
  }

  const PreferenceRow = ({ eventType }) => {
    const eventConfig = eventTypes.find(et => et.id === eventType);
    const pref = preferenceMap.get(eventType);

    if (!pref || !eventConfig) return null;

    return (
      <div key={eventType} className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-medium text-sm text-gray-900">{eventConfig.label}</p>
            <p className="text-xs text-gray-600">
              {eventType.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* In-App */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">In-App</span>
            <Switch
              checked={pref.in_app_enabled}
              onCheckedChange={() => handleToggle(eventType, 'in_app_enabled')}
              disabled={isUpdating}
            />
          </div>

          {/* Email */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">E-Mail</span>
            <Switch
              checked={pref.email_enabled}
              onCheckedChange={() => handleToggle(eventType, 'email_enabled')}
              disabled={isUpdating}
            />
          </div>

          {/* Email Frequency */}
          <div>
            <Select
              value={pref.email_frequency}
              onValueChange={(value) => handleFrequencyChange(eventType, value)}
              disabled={!pref.email_enabled || isUpdating}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Sofort</SelectItem>
                <SelectItem value="daily">Täglich</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="never">Nie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Benachrichtigungseinstellungen
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-gray-900 mb-3">
              Schnellaktionen
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkEnable('in_app_enabled', true)}
                disabled={isBulkUpdating}
              >
                Alle In-App aktivieren
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkEnable('email_enabled', true)}
                disabled={isBulkUpdating}
              >
                Alle E-Mails aktivieren
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkEnable('in_app_enabled', false)}
                disabled={isBulkUpdating}
              >
                Alle In-App deaktivieren
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-gray-50 rounded-lg border">
            <div className="text-xs font-medium text-gray-600">In-App</div>
            <div className="text-xs font-medium text-gray-600">E-Mail</div>
            <div className="text-xs font-medium text-gray-600">E-Mail-Häufigkeit</div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {categories.map((category) => {
              const categoryEvents = eventTypes.filter(et => et.category === category);
              return (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedCategory(
                        expandedCategory === category ? null : category
                      )
                    }
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 font-medium text-sm text-left flex items-center justify-between transition-colors"
                  >
                    <span>{category}</span>
                    <span className="text-xs text-gray-600">
                      {expandedCategory === category ? '−' : '+'}
                    </span>
                  </button>

                  {expandedCategory === category && (
                    <div className="divide-y">
                      {categoryEvents.map(et => (
                        <PreferenceRow key={et.id} eventType={et.id} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info */}
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-900">
              💡 <strong>Hinweis:</strong> Dringende Benachrichtigungen werden immer sofort zugestellt, unabhängig
              von den E-Mail-Häufigkeitseinstellungen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}