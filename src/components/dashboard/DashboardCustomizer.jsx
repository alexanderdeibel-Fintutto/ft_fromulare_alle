import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Dashboard Customizer - erlaubt Anpassung der Widgets
 */
export default function DashboardCustomizer({ onCustomize }) {
  const [open, setOpen] = useState(false);
  const [widgets, setWidgets] = useState({
    tasks: true,
    messages: true,
    notifications: true,
  });

  // Load user preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboardWidgets');
    if (saved) {
      setWidgets(JSON.parse(saved));
    }
  }, []);

  function handleToggle(widget) {
    const updated = { ...widgets, [widget]: !widgets[widget] };
    setWidgets(updated);
    localStorage.setItem('dashboardWidgets', JSON.stringify(updated));
    onCustomize(updated);
    toast.success('Dashboard aktualisiert');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="gap-2">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dashboard anpassen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {widgets.tasks ? (
                <Eye className="w-4 h-4 text-blue-600" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Aufgaben-Widget</p>
                <p className="text-xs text-gray-600">
                  {widgets.tasks ? 'Sichtbar' : 'Verborgen'}
                </p>
              </div>
            </div>
            <Switch
              checked={widgets.tasks}
              onCheckedChange={() => handleToggle('tasks')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {widgets.messages ? (
                <Eye className="w-4 h-4 text-green-600" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Nachrichten-Widget</p>
                <p className="text-xs text-gray-600">
                  {widgets.messages ? 'Sichtbar' : 'Verborgen'}
                </p>
              </div>
            </div>
            <Switch
              checked={widgets.messages}
              onCheckedChange={() => handleToggle('messages')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {widgets.notifications ? (
                <Eye className="w-4 h-4 text-purple-600" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Benachrichtigungs-Widget</p>
                <p className="text-xs text-gray-600">
                  {widgets.notifications ? 'Sichtbar' : 'Verborgen'}
                </p>
              </div>
            </div>
            <Switch
              checked={widgets.notifications}
              onCheckedChange={() => handleToggle('notifications')}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}