import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useWorkflowManagement(userEmail) {
  const queryClient = useQueryClient();

  // Load workflows
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      try {
        return await base44.entities.WorkflowDefinition.filter({
          user_email: userEmail,
        });
      } catch (error) {
        console.error('Error loading workflows:', error);
        return [];
      }
    },
    enabled: !!userEmail,
  });

  // Create workflow
  const createWorkflowMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.WorkflowDefinition.create({
        user_email: userEmail,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', userEmail] });
      toast.success('Workflow erstellt');
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen');
      console.error(error);
    },
  });

  // Update workflow
  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.WorkflowDefinition.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', userEmail] });
      toast.success('Workflow aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren');
      console.error(error);
    },
  });

  // Delete workflow
  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.WorkflowDefinition.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', userEmail] });
      toast.success('Workflow gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen');
      console.error(error);
    },
  });

  // Toggle workflow active
  const toggleWorkflowMutation = useMutation({
    mutationFn: async (id) => {
      const workflow = workflows.find(w => w.id === id);
      return await base44.entities.WorkflowDefinition.update(id, {
        is_active: !workflow?.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', userEmail] });
      toast.success('Workflow aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren');
      console.error(error);
    },
  });

  // Execute workflow manually
  const executeWorkflowMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.functions.invoke('executeWorkflow', {
        workflow_id: id,
        trigger_event_type: 'manual',
      });
    },
    onSuccess: () => {
      toast.success('Workflow gestartet');
    },
    onError: (error) => {
      toast.error('Fehler beim Ausführen');
      console.error(error);
    },
  });

  return {
    workflows,
    isLoading,
    createWorkflow: createWorkflowMutation.mutate,
    updateWorkflow: updateWorkflowMutation.mutate,
    deleteWorkflow: deleteWorkflowMutation.mutate,
    toggleWorkflow: toggleWorkflowMutation.mutate,
    executeWorkflow: executeWorkflowMutation.mutate,
    isCreating: createWorkflowMutation.isPending,
    isUpdating: updateWorkflowMutation.isPending,
    isExecuting: executeWorkflowMutation.isPending,
  };
}