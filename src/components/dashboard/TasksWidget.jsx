import React from 'react';
import { useTaskManagement } from '../hooks/useTaskManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

/**
 * Tasks Widget - zeigt anstehende Aufgaben an
 */
export default function TasksWidget() {
  const { tasks, isLoading } = useTaskManagement();

  const upcomingTasks = tasks
    .filter((t) => t.status !== 'done' && t.status !== 'cancelled')
    .sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.due_date && !b.due_date) return -1;
      if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
      return 0;
    })
    .slice(0, 4);

  const urgentCount = upcomingTasks.filter((t) => t.priority === 'urgent').length;
  const overdueTasks = upcomingTasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date()
  ).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aufgaben</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            Aufgaben
          </CardTitle>
          <div className="text-xs font-semibold text-gray-600">
            {tasks.filter((t) => t.status === 'todo').length} offen
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stats */}
        {(urgentCount > 0 || overdueTasks > 0) && (
          <div className="flex gap-2">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                {urgentCount} dringend
              </Badge>
            )}
            {overdueTasks > 0 && (
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {overdueTasks} überfällig
              </Badge>
            )}
          </div>
        )}

        {/* Tasks List */}
        {upcomingTasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Keine anstehenden Aufgaben
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      task.priority === 'urgent'
                        ? 'bg-red-500'
                        : task.priority === 'high'
                        ? 'bg-orange-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-gray-500">
                        Fällig: {new Date(task.due_date).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        {tasks.length > 0 && (
          <Link to={createPageUrl('TaskManagement')}>
            <Button variant="outline" className="w-full mt-2 text-xs" size="sm">
              Alle Aufgaben anzeigen
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}