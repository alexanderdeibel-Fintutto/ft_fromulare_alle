import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Trash2, Edit2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Workflow List Component
 */
export default function WorkflowList({
  workflows,
  onEdit,
  onDelete,
  onToggle,
  onExecute,
  isExecuting,
  isLoading,
}) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (workflows.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-600 mb-4">Keine Workflows vorhanden</p>
        <p className="text-sm text-gray-500">
          Erstellen Sie einen neuen Workflow, um Prozesse zu automatisieren
        </p>
      </Card>
    );
  }

  const getTriggerLabel = (triggerType) => {
    const triggers = {
      task_completed: 'Nach Aufgabenabschluss',
      task_assigned: 'Nach Aufgabenzuweisung',
      task_updated: 'Nach Aufgabenaktualisierung',
      new_message: 'Nach neuer Nachricht',
      document_shared: 'Nach Dokumentfreigabe',
      manual: 'Manuell',
    };
    return triggers[triggerType] || triggerType;
  };

  return (
    <div className="space-y-4">
      {workflows.map((workflow) => (
        <Card key={workflow.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                  {workflow.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>

              {workflow.description && (
                <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>🔔 {getTriggerLabel(workflow.trigger_type)}</span>
                <span>📋 {workflow.steps?.length || 0} Schritte</span>
                <span>▶️ {workflow.execution_count || 0}x ausgeführt</span>
                {workflow.last_executed && (
                  <span>
                    Zuletzt:{' '}
                    {formatDistanceToNow(new Date(workflow.last_executed), {
                      locale: de,
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onExecute(workflow.id)}
                disabled={isExecuting}
                title="Manuell ausführen"
              >
                <Play className="w-4 h-4 text-blue-600" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggle(workflow.id)}
                title={workflow.is_active ? 'Deaktivieren' : 'Aktivieren'}
              >
                {workflow.is_active ? (
                  <ToggleRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(workflow)}
                title="Bearbeiten"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(workflow.id)}
                title="Löschen"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}