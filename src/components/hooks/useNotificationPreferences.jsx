import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { id: 'task_assigned', label: 'Aufgabe zugewiesen', category: 'Aufgaben' },
  { id: 'task_updated', label: 'Aufgabe aktualisiert', category: 'Aufgaben' },
  { id: 'task_completed', label: 'Aufgabe abgeschlossen', category: 'Aufgaben' },
  { id: 'new_message', label: 'Neue Nachricht', category: 'Nachrichten' },
  { id: 'message_reply', label: 'Antwort auf Nachricht', category: 'Nachrichten' },
  { id: 'notification_urgent', label: 'Dringende Benachrichtigung', category: 'System' },
  { id: 'document_shared', label: 'Dokument geteilt', category: 'Dokumente' },
  { id: 'collaboration_invite', label: 'Zusammenarbeitseinladung', category: 'Zusammenarbeit' },
  { id: 'system_alert', label: 'Systemwarnung', category: 'System' },
  { id: 'weekly_summary', label: 'Wöchentliche Zusammenfassung', category: 'Zusammenfassungen' },
];

export function useNotificationPreferences(userEmail) {
  const queryClient = useQueryClient();

  // Load all preferences
  const { data: preferences = [], isLoading } = useQuery({
    queryKey: ['notificationPreferences', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      try {
        const result = await base44.entities.NotificationPreference.filter({
          user_email: userEmail,
        });
        
        // Ensure all event types exist with defaults
        const existingIds = new Set(result.map(p => p.event_type));
        const missing = EVENT_TYPES.filter(et => !existingIds.has(et.id));
        
        if (missing.length > 0) {
          // Create missing preferences with defaults
          await Promise.all(
            missing.map(et => 
              base44.entities.NotificationPreference.create({
                user_email: userEmail,
                event_type: et.id,
                in_app_enabled: true,
                email_enabled: true,
                email_frequency: 'instant',
                quiet_hours_enabled: false,
              })
            )
          );
          // Refetch
          return await base44.entities.NotificationPreference.filter({
            user_email: userEmail,
          });
        }
        
        return result;
      } catch (error) {
        console.error('Error loading preferences:', error);
        return [];
      }
    },
    enabled: !!userEmail,
  });

  // Update preference
  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ preferenceId, data }) => {
      return await base44.entities.NotificationPreference.update(preferenceId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notificationPreferences', userEmail],
      });
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern');
      console.error(error);
    },
  });

  // Bulk update all
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates) => {
      // updates: { inAppEnabled?: boolean, emailEnabled?: boolean, emailFrequency?: string }
      return Promise.all(
        preferences.map(pref =>
          base44.entities.NotificationPreference.update(pref.id, updates)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notificationPreferences', userEmail],
      });
      toast.success('Alle Einstellungen aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren');
      console.error(error);
    },
  });

  return {
    preferences,
    isLoading,
    eventTypes: EVENT_TYPES,
    updatePreference: updatePreferenceMutation.mutate,
    isUpdating: updatePreferenceMutation.isPending,
    bulkUpdate: bulkUpdateMutation.mutate,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
}