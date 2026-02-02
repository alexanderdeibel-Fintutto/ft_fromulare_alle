import React, { useState } from 'react';
import { HelpCircle, X, BookOpen, Video, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function QuickHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const helpResources = [
    {
      icon: BookOpen,
      title: 'Quick Start Guide',
      description: 'Erste Schritte und grundlegende Funktionen',
      action: () => window.location.href = '/quick-start'
    },
    {
      icon: BookOpen,
      title: 'API Dokumentation',
      description: 'Vollständige API Referenz',
      action: () => window.location.href = '/api-reference'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Schritt-für-Schritt Anleitungen',
      action: () => alert('Video Tutorials coming soon!')
    },
    {
      icon: MessageCircle,
      title: 'Support kontaktieren',
      description: 'Direkter Support via Email',
      action: () => window.location.href = 'mailto:support@fintutt.de'
    }
  ];

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
      >
        {isOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
      </button>

      {/* Help Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80">
          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle>Wie können wir helfen?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {helpResources.map((resource, i) => {
                const Icon = resource.icon;
                return (
                  <button
                    key={i}
                    onClick={resource.action}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{resource.title}</p>
                      <p className="text-xs text-gray-500">{resource.description}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}