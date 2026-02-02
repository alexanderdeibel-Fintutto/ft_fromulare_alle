import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Users, Building2, Wrench, FileText } from 'lucide-react';

/**
 * Header für eine Conversation
 * Zeigt Titel, Typ und Teilnehmer
 */
export default function ConversationHeader({ conversation, members, onClose }) {
  const typeIcons = {
    direct: Users,
    task: Wrench,
    building: Building2,
    unit: Building2,
    document: FileText,
  };

  const typeLabels = {
    direct: 'Direktnachricht',
    task: 'Aufgabe',
    building: 'Gebäude',
    unit: 'Wohnung',
    document: 'Dokument',
  };

  const Icon = typeIcons[conversation.type] || Users;

  return (
    <div className="border-b bg-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            {conversation.title || 'Unterhaltung'}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {typeLabels[conversation.type]}
            </Badge>
            {members && members.length > 0 && (
              <span className="text-xs text-gray-500">
                {members.length} Teilnehmer
              </span>
            )}
          </div>
        </div>
      </div>

      {onClose && (
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}