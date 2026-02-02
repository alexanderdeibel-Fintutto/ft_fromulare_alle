import React, { useState } from 'react';
import TaskList from '../components/tasks/TaskList';
import TaskDetail from '../components/tasks/TaskDetail';
import TaskCreateDialog from '../components/tasks/TaskCreateDialog';
import { useTaskManagement } from '../components/hooks/useTaskManagement';

/**
 * Task Management Page
 * Main page for task management with list and detail views
 */
export default function TaskManagement() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { createTaskAsync } = useTaskManagement();

  async function handleCreateTask(taskData) {
    const newTask = await createTaskAsync(taskData);
    setShowCreateDialog(false);
    setSelectedTask(newTask);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {selectedTask ? (
          <TaskDetail
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onTaskUpdated={(updated) => setSelectedTask(updated)}
          />
        ) : null}

        <TaskList
          onSelectTask={setSelectedTask}
          onCreateNew={() => setShowCreateDialog(true)}
        />

        {showCreateDialog && (
          <TaskCreateDialog
            onClose={() => setShowCreateDialog(false)}
            onCreate={handleCreateTask}
          />
        )}
      </div>
    </div>
  );
}