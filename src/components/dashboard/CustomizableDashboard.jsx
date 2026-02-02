import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CustomizableDashboard({ children }) {
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState({
    stats: true,
    quickActions: true,
    recentDocs: true,
    recommendations: true,
    featureHighlight: true
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.dashboard_preferences) {
        setWidgets(user.dashboard_preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const toggleWidget = async (widgetKey) => {
    const newWidgets = { ...widgets, [widgetKey]: !widgets[widgetKey] };
    setWidgets(newWidgets);

    try {
      await base44.auth.updateMe({ dashboard_preferences: newWidgets });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const widgetNames = {
    stats: 'Statistiken',
    quickActions: 'Schnellaktionen',
    recentDocs: 'Kürzliche Dokumente',
    recommendations: 'Empfehlungen',
    featureHighlight: 'Feature Highlights'
  };

  return (
    <div className="space-y-6">
      {/* Customize Toggle */}
      <div className="flex justify-end">
        <Button
          variant={editMode ? 'default' : 'outline'}
          onClick={() => setEditMode(!editMode)}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          {editMode ? 'Fertig' : 'Dashboard anpassen'}
        </Button>
      </div>

      {/* Edit Mode Controls */}
      {editMode && (
        <Card>
          <CardHeader>
            <CardTitle>Widgets verwalten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(widgetNames).map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => toggleWidget(key)}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    widgets[key]
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className="font-semibold">{name}</span>
                  {widgets[key] ? (
                    <Eye className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render children with widget visibility */}
      {React.Children.map(children, child => {
        if (!child?.props?.widgetKey) return child;
        return widgets[child.props.widgetKey] ? child : null;
      })}
    </div>
  );
}