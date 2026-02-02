import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Task Card Component
 */
export default function TaskCard({ task, onClick }) {
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const statusIcons = {
    todo: '○',
    in_progress: '●',
    done: '✓',
    cancelled: '✕',
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <Card
      onClick={onClick}
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-xl text-gray-400 mt-1">
            {statusIcons[task.status]}
          </span>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-3">
        <Badge className={priorityColors[task.priority]}>
          {task.priority}
        </Badge>

        {task.due_date && (
          <div className={`flex items-center gap-1 text-xs ${
            isOverdue ? 'text-red-600' : 'text-gray-500'
          }`}>
            {isOverdue && <AlertCircle className="w-3 h-3" />}
            <Calendar className="w-3 h-3" />
            {format(new Date(task.due_date), 'd. MMM', { locale: de })}
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1">
            {task.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}