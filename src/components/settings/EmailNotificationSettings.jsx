import React, { useEffect, useState } from 'react';
import { useEmailNotifications } from '../hooks/useEmailNotifications';
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
import { Mail, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Email Notification Settings Component
 */
export default function EmailNotificationSettings({ userEmail }) {
  const { preferences, isLoading, updatePreferences, sendTestEmail, sendingTestEmail } =
    useEmailNotifications(userEmail);

  const [formData, setFormData] = useState({
    tasks_assigned: true,
    tasks_completed: true,
    tasks_due_soon: true,
    new_messages: true,
    message_digest: false,
    notifications_urgent: true,
    weekly_summary: false,
    email_frequency: 'instant',
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        tasks_assigned: preferences.tasks_assigned ?? true,
        tasks_completed: preferences.tasks_completed ?? true,
        tasks_due_soon: preferences.tasks_due_soon ?? true,
        new_messages: preferences.new_messages ?? true,
        message_digest: preferences.message_digest ?? false,
        notifications_urgent: preferences.notifications_urgent ?? true,
        weekly_summary: preferences.weekly_summary ?? false,
        email_frequency: preferences.email_frequency ?? 'instant',
      });
    }
  }, [preferences]);

  function handleToggle(field) {
    const updated = { ...formData, [field]: !formData[field] };
    setFormData(updated);
  }

  function handleFrequencyChange(value) {
    const updated = { ...formData, email_frequency: value };
    setFormData(updated);
  }

  function handleSave() {
    updatePreferences(formData);
  }

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            E-Mail-Benachrichtigungen
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Frequency */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Allgemeine E-Mail-Häufigkeit
            </label>
            <Select value={formData.email_frequency} onValueChange={handleFrequencyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Sofort</SelectItem>
                <SelectItem value="daily">Täglich</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="never">Nie</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 mt-1">
              Kontrolliert die Standard-Häufigkeit für E-Mail-Benachrichtigungen
            </p>
          </div>

          {/* Notification Settings */}
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-4">Benachrichtigungstypen</h4>
            <div className="space-y-4">
              {/* Tasks */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Aufgaben zugewiesen</p>
                  <p className="text-xs text-gray-600">
                    Benachrichtigung wenn dir eine Aufgabe zugewiesen wird
                  </p>
                </div>
                <Switch
                  checked={formData.tasks_assigned}
                  onCheckedChange={() => handleToggle('tasks_assigned')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Aufgaben abgeschlossen</p>
                  <p className="text-xs text-gray-600">
                    Benachrichtigung wenn zugewiesene Aufgaben abgeschlossen werden
                  </p>
                </div>
                <Switch
                  checked={formData.tasks_completed}
                  onCheckedChange={() => handleToggle('tasks_completed')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Aufgaben bald fällig</p>
                  <p className="text-xs text-gray-600">
                    Erinnerung wenn Aufgaben bald fällig werden
                  </p>
                </div>
                <Switch
                  checked={formData.tasks_due_soon}
                  onCheckedChange={() => handleToggle('tasks_due_soon')}
                />
              </div>

              {/* Messages */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-sm">Neue Nachrichten</p>
                    <p className="text-xs text-gray-600">
                      Benachrichtigung für neue Nachrichten
                    </p>
                  </div>
                  <Switch
                    checked={formData.new_messages}
                    onCheckedChange={() => handleToggle('new_messages')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Tägliche Nachrichten-Zusammenfassung</p>
                    <p className="text-xs text-gray-600">
                      Einmal täglich alle neuen Nachrichten zusammengefasst
                    </p>
                  </div>
                  <Switch
                    checked={formData.message_digest}
                    onCheckedChange={() => handleToggle('message_digest')}
                  />
                </div>
              </div>

              {/* Other */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-sm">Dringende Benachrichtigungen</p>
                    <p className="text-xs text-gray-600">
                      Sofort für dringende Benachrichtigungen
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications_urgent}
                    onCheckedChange={() => handleToggle('notifications_urgent')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Wöchentliche Zusammenfassung</p>
                    <p className="text-xs text-gray-600">
                      Jeden Montag eine Zusammenfassung der Woche erhalten
                    </p>
                  </div>
                  <Switch
                    checked={formData.weekly_summary}
                    onCheckedChange={() => handleToggle('weekly_summary')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-6 flex gap-2">
            <Button onClick={handleSave} className="gap-2">
              Einstellungen speichern
            </Button>
            <Button
              variant="outline"
              onClick={() => sendTestEmail()}
              disabled={sendingTestEmail}
              className="gap-2"
            >
              {sendingTestEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Test-Email senden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}