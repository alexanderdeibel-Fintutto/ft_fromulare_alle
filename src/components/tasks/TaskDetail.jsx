import React, { useState, useEffect } from 'react';
import { useTaskManagement } from '../hooks/useTaskManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Save, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import TaskComments from './TaskComments';

/**
 * Task Detail Component
 * View and edit task details with integrated comments
 */
export default function TaskDetail({ task, onClose, onTaskUpdated }) {
  const { updateTask, deleteTask, isUpdating, isDeleting } = useTaskManagement();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(task);

  useEffect(() => {
    setFormData(task);
  }, [task]);

  function handleSave() {
    updateTask(
      { id: task.id, data: formData },
      {
        onSuccess: (updated) => {
          setIsEditing(false);
          if (onTaskUpdated) onTaskUpdated(updated);
        },
      }
    );
  }

  function handleDelete() {
    if (confirm('Möchtest du diese Aufgabe wirklich löschen?')) {
      deleteTask(task.id, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-bold">Aufgabendetails</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Titel</label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Beschreibung
                  </label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Zu erledigen</SelectItem>
                        <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                        <SelectItem value="done">Erledigt</SelectItem>
                        <SelectItem value="cancelled">Storniert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Priorität</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Niedrig</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="high">Hoch</SelectItem>
                        <SelectItem value="urgent">Dringend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Fällig am</label>
                  <Input
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Speichern
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(task);
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
                  {task.description && (
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{task.status}</Badge>
                  <Badge>{task.priority}</Badge>
                  {task.due_date && (
                    <Badge variant="secondary">{task.due_date}</Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    disabled={isDeleting}
                  >
                    Löschen
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Comments Section */}
          {task.conversation_id && (
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Kommentare & Diskussionen
              </h4>
              <TaskComments conversationId={task.conversation_id} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}