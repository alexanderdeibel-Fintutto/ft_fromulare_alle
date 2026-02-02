import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useWorkflowManagement } from '../components/hooks/useWorkflowManagement';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder';
import WorkflowList from '../components/workflow/WorkflowList';
import AppHeader from '../components/layout/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Workflow Automation Page
 */
export default function WorkflowAutomation() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const {
    workflows,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    executeWorkflow,
    isCreating,
    isUpdating,
    isExecuting,
  } = useWorkflowManagement(user?.email);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        navigate('/Register');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
      navigate('/Register');
    } finally {
      setLoading(false);
    }
  }

  function handleSaveWorkflow(data) {
    if (editingWorkflow) {
      updateWorkflow({ id: editingWorkflow.id, data });
    } else {
      createWorkflow(data);
    }
    setEditingWorkflow(null);
    setShowBuilder(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-yellow-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Workflow-Automatisierung
            </h1>
          </div>
          <p className="text-gray-600">
            Erstellen Sie automatisierte Workflows, um sich wiederholende Aufgaben zu automatisieren und die Produktivität zu steigern.
          </p>
        </div>

        {showBuilder ? (
          <>
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBuilder(false);
                  setEditingWorkflow(null);
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück zur Liste
              </Button>
            </div>

            <WorkflowBuilder
              workflow={editingWorkflow}
              onSave={handleSaveWorkflow}
              isSaving={isCreating || isUpdating}
            />
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Meine Workflows</h2>
              <Button onClick={() => setShowBuilder(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Neuer Workflow
              </Button>
            </div>

            {workflows.length === 0 && !isLoading ? (
              <Card className="p-12 text-center">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Keine Workflows vorhanden
                </h3>
                <p className="text-gray-600 mb-6">
                  Erstellen Sie Ihren ersten Workflow, um Prozesse zu automatisieren
                </p>
                <Button onClick={() => setShowBuilder(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Workflow erstellen
                </Button>
              </Card>
            ) : (
              <WorkflowList
                workflows={workflows}
                onEdit={(workflow) => {
                  setEditingWorkflow(workflow);
                  setShowBuilder(true);
                }}
                onDelete={deleteWorkflow}
                onToggle={toggleWorkflow}
                onExecute={executeWorkflow}
                isExecuting={isExecuting}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-12 bg-blue-50 border-blue-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">💡 Workflow-Beispiele</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✓ Nach Aufgabenabschluss automatisch Folgeaufgabe erstellen</li>
            <li>✓ Bei neuer Nachricht Benachrichtigung an Team senden</li>
            <li>✓ Dokumentfreigabe → Automatische Aufgabe für Review</li>
            <li>✓ Workflow-Verzögerung für zeitgesteuerte Aktionen</li>
          </ul>
        </Card>
      </main>
    </div>
  );
}