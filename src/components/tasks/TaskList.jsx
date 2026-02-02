import React, { useState } from 'react';
import { useTaskManagement } from '../hooks/useTaskManagement';
import TaskCard from './TaskCard';
import TaskFilter from './TaskFilter';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Task List Component
 * Displays all tasks with filtering and sorting
 */
export default function TaskList({ onSelectTask, onCreateNew }) {
  const { tasks, isLoading } = useTaskManagement();
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assigned: 'all',
  });

  const filteredTasks = tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.assigned !== 'all' && task.assigned_to !== filters.assigned) return false;
    return true;
  });

  // Group tasks by status
  const groupedTasks = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    done: filteredTasks.filter((t) => t.status === 'done'),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Aufgaben</h2>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Neue Aufgabe
        </Button>
      </div>

      {/* Filters */}
      <TaskFilter filters={filters} onFilterChange={setFilters} />

      {/* Task Groups */}
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([status, statusTasks]) => (
          <div key={status}>
            <h3 className="font-semibold text-lg mb-3 text-gray-700">
              {status === 'todo' && 'Zu erledigen'}
              {status === 'in_progress' && 'In Bearbeitung'}
              {status === 'done' && 'Erledigt'}
              <span className="text-gray-400 text-sm ml-2">({statusTasks.length})</span>
            </h3>

            {statusTasks.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">
                Keine Aufgaben in dieser Kategorie
              </Card>
            ) : (
              <div className="space-y-2">
                {statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onSelectTask(task)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}