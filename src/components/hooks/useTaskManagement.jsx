import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useTaskManagement() {
  const queryClient = useQueryClient();

  // Load all tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        return await base44.entities.Task.list();
      } catch (error) {
        console.error('Error loading tasks:', error);
        return [];
      }
    },
  });

  // Create task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      return await base44.entities.Task.create(taskData);
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task erstellt');
      return newTask;
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen');
      console.error(error);
    },
  });

  // Update task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Task.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren');
      console.error(error);
    },
  });

  // Delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.Task.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen');
      console.error(error);
    },
  });

  return {
    tasks,
    isLoading,
    createTask: createTaskMutation.mutate,
    createTaskAsync: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutate,
    updateTaskAsync: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
}