import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useEmailNotifications(userEmail) {
  const queryClient = useQueryClient();

  // Load email preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['emailPreferences', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      try {
        const result = await base44.entities.EmailNotificationPreference.filter({
          user_email: userEmail,
        });
        return result[0] || null;
      } catch (error) {
        console.error('Error loading preferences:', error);
        return null;
      }
    },
    enabled: !!userEmail,
  });

  // Create or update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return await base44.entities.EmailNotificationPreference.update(
          preferences.id,
          data
        );
      } else {
        return await base44.entities.EmailNotificationPreference.create({
          user_email: userEmail,
          ...data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['emailPreferences', userEmail],
      });
      toast.success('Einstellungen gespeichert');
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern');
      console.error(error);
    },
  });

  // Send test email
  const sendTestEmailMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('sendEmailNotification', {
        type: 'test',
        userEmail,
      });
    },
    onSuccess: () => {
      toast.success('Test-Email gesendet');
    },
    onError: (error) => {
      toast.error('Fehler beim Versenden');
      console.error(error);
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences: updatePreferencesMutation.mutate,
    updatePreferencesAsync: updatePreferencesMutation.mutateAsync,
    isUpdating: updatePreferencesMutation.isPending,
    sendTestEmail: sendTestEmailMutation.mutate,
    sendingTestEmail: sendTestEmailMutation.isPending,
  };
}