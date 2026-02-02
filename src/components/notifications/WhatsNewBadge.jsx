import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WhatsNewBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const updates = [
    {
      date: '2026-01-20',
      title: 'LetterXpress Integration',
      description: 'Versenden Sie Briefe direkt als Einschreiben',
      badge: 'Neu',
      color: 'bg-blue-500'
    },
    {
      date: '2026-01-18',
      title: 'SCHUFA Bonitätsprüfung',
      description: 'Prüfen Sie Mieter-Bonität in Sekunden',
      badge: 'Neu',
      color: 'bg-purple-500'
    },
    {
      date: '2026-01-15',
      title: 'Globale Suche',
      description: 'Drücken Sie ⌘K für schnellen Zugriff',
      badge: 'Feature',
      color: 'bg-green-500'
    }
  ];

  useEffect(() => {
    const lastSeen = localStorage.getItem('lastSeenUpdate');
    const latestUpdate = updates[0].date;
    
    if (!lastSeen || new Date(lastSeen) < new Date(latestUpdate)) {
      setHasUnread(true);
    }
  }, []);

  const markAsRead = () => {
    localStorage.setItem('lastSeenUpdate', new Date().toISOString());
    setHasUnread(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* Badge Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Sparkles className="w-5 h-5 text-yellow-500" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  Was ist neu?
                </CardTitle>
                <button onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {updates.map((update, i) => (
                  <div key={i} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex items-start gap-3 mb-2">
                      <span className={`text-xs ${update.color} text-white px-2 py-1 rounded-full`}>
                        {update.badge}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(update.date).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{update.title}</h3>
                    <p className="text-sm text-gray-600">{update.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t">
                <Button onClick={markAsRead} className="w-full">
                  Alles klar!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}