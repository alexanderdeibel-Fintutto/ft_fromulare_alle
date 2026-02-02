import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit2, Play, ChevronDown } from 'lucide-react';
import AIWorkflowAssistant from './AIWorkflowAssistant';

const generateId = () => Math.random().toString(36).slice(2, 10);

const STEP_TYPES = [
  { id: 'task', label: 'Aufgabe erstellen', icon: '✓' },
  { id: 'notification', label: 'Benachrichtigung senden', icon: '🔔' },
  { id: 'email', label: 'E-Mail senden', icon: '✉️' },
  { id: 'condition', label: 'Bedingung prüfen', icon: '❓' },
  { id: 'delay', label: 'Verzögerung', icon: '⏱️' },
];

const TRIGGER_TYPES = [
  { id: 'task_completed', label: 'Aufgabe abgeschlossen' },
  { id: 'task_assigned', label: 'Aufgabe zugewiesen' },
  { id: 'task_updated', label: 'Aufgabe aktualisiert' },
  { id: 'new_message', label: 'Neue Nachricht' },
  { id: 'document_shared', label: 'Dokument geteilt' },
  { id: 'manual', label: 'Manuell' },
];

/**
 * Visual Workflow Builder
 */
export default function WorkflowBuilder({ workflow, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    trigger_type: workflow?.trigger_type || 'task_completed',
    trigger_conditions: workflow?.trigger_conditions || {},
    steps: workflow?.steps || [],
  });

  const [editingStep, setEditingStep] = useState(null);
  const [showStepDialog, setShowStepDialog] = useState(false);

  function addStep(stepType) {
    const newStep = {
      id: generateId(),
      type: stepType,
      name: STEP_TYPES.find(s => s.id === stepType)?.label || stepType,
      config: {},
      next_step_id: null,
    };

    setFormData({
      ...formData,
      steps: [...formData.steps, newStep],
    });
    setShowStepDialog(false);
  }

  function updateStep(stepId, updates) {
    setFormData({
      ...formData,
      steps: formData.steps.map(s =>
        s.id === stepId ? { ...s, ...updates } : s
      ),
    });
  }

  function removeStep(stepId) {
    setFormData({
      ...formData,
      steps: formData.steps.filter(s => s.id !== stepId),
    });
    setEditingStep(null);
  }

  function handleSave() {
    if (!formData.name.trim()) {
      alert('Bitte geben Sie einen Workflow-Namen ein');
      return;
    }
    if (formData.steps.length === 0) {
      alert('Bitte fügen Sie mindestens einen Schritt hinzu');
      return;
    }
    onSave(formData);
  }

  const handleStepsSuggested = (suggestedSteps) => {
    suggestedSteps.forEach(step => {
      addStep(step.type);
    });
  };

  const StepEditor = ({ step }) => {
    const [stepData, setStepData] = useState(step);

    return (
      <Dialog open={editingStep === step.id} onOpenChange={(open) => !open && setEditingStep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schritt bearbeiten: {step.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Task Step */}
            {step.type === 'task' && (
              <>
                <div>
                  <label className="text-sm font-medium">Aufgabentitel</label>
                  <Input
                    value={stepData.config.title || ''}
                    onChange={(e) =>
                      setStepData({
                        ...stepData,
                        config: { ...stepData.config, title: e.target.value },
                      })
                    }
                    placeholder="z.B. Folgeaufgabe erstellt"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Priorität</label>
                  <Select
                    value={stepData.config.priority || 'medium'}
                    onValueChange={(value) =>
                      setStepData({
                        ...stepData,
                        config: { ...stepData.config, priority: value },
                      })
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
                <div>
                  <label className="text-sm font-medium">Assign To (optional)</label>
                  <Input
                    value={stepData.config.assigned_to || ''}
                    onChange={(e) =>
                      setStepData({
                        ...stepData,
                        config: { ...stepData.config, assigned_to: e.target.value },
                      })
                    }
                    placeholder="E-Mail-Adresse"
                  />
                </div>
              </>
            )}

            {/* Notification Step */}
            {step.type === 'notification' && (
              <>
                <div>
                  <label className="text-sm font-medium">Nachricht</label>
                  <Input
                    value={stepData.config.message || ''}
                    onChange={(e) =>
                      setStepData({
                        ...stepData,
                        config: { ...stepData.config, message: e.target.value },
                      })
                    }
                    placeholder="Benachrichtigungstext"
                  />
                </div>
              </>
            )}

            {/* Email Step */}
            {step.type === 'email' && (
              <>
                <div>
                  <label className="text-sm font-medium">Betreff</label>
                  <Input
                    value={stepData.config.subject || ''}
                    onChange={(e) =>
                      setStepData({
                        ...stepData,
                        config: { ...stepData.config, subject: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Empfänger E-Mail</label>
                  <Input
                    value={stepData.config.recipient || ''}
                    onChange={(e) =>
                      setStepData({
                        ...stepData,
                        config: { ...stepData.config, recipient: e.target.value },
                      })
                    }
                    placeholder="E-Mail-Adresse"
                  />
                </div>
              </>
            )}

            {/* Delay Step */}
            {step.type === 'delay' && (
              <div>
                <label className="text-sm font-medium">Verzögerung (Minuten)</label>
                <Input
                  type="number"
                  value={stepData.config.minutes || 0}
                  onChange={(e) =>
                    setStepData({
                      ...stepData,
                      config: { ...stepData.config, minutes: parseInt(e.target.value) },
                    })
                  }
                  min="0"
                />
              </div>
            )}

            {/* Next Step */}
            <div>
              <label className="text-sm font-medium">Nächster Schritt</label>
              <Select
                value={stepData.next_step_id || ''}
                onValueChange={(value) =>
                  setStepData({
                    ...stepData,
                    next_step_id: value || null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ende" />
                </SelectTrigger>
                <SelectContent>
                  {formData.steps
                    .filter(s => s.id !== step.id)
                    .map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => {
                updateStep(step.id, stepData);
                setEditingStep(null);
              }}
              className="w-full"
            >
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Tabs defaultValue="builder" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
        <TabsTrigger value="ai">AI Assistant</TabsTrigger>
      </TabsList>

      <TabsContent value="builder" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow-Grundlagen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Nach Aufgabenabschluss Bericht erstellen"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Beschreibung</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optionale Beschreibung"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Auslöser</label>
            <Select
              value={formData.trigger_type}
              onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Workflow-Schritte</CardTitle>
            <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Schritt hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schritt auswählen</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-2">
                  {STEP_TYPES.map(st => (
                    <Button
                      key={st.id}
                      variant="outline"
                      onClick={() => addStep(st.id)}
                      className="justify-start"
                    >
                      <span className="mr-2">{st.icon}</span>
                      {st.label}
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {formData.steps.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Keine Schritte hinzugefügt</p>
          ) : (
            <div className="space-y-2">
              {formData.steps.map((step, index) => (
                <div key={step.id}>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {STEP_TYPES.find(s => s.id === step.type)?.icon}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{step.name}</p>
                        <p className="text-xs text-gray-600">
                          {Object.entries(step.config)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ') || 'Keine Konfiguration'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingStep(step.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(step.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  {step.next_step_id && (
                    <div className="flex justify-center py-2">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  {editingStep === step.id && <StepEditor step={step} />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? 'Speichern...' : 'Workflow speichern'}
        </Button>
      </div>
      </TabsContent>

      <TabsContent value="ai" className="space-y-6">
        <AIWorkflowAssistant 
          currentWorkflow={formData}
          onStepsSuggested={handleStepsSuggested}
        />
      </TabsContent>
    </Tabs>
  );
}