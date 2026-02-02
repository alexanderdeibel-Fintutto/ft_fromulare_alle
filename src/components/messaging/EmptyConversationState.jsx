import React from 'react';
import { MessageCircle } from 'lucide-react';

/**
 * Empty State wenn keine Conversation ausgewählt
 */
export default function EmptyConversationState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Keine Unterhaltung ausgewählt
        </h3>
        <p className="text-sm text-gray-600">
          Wähle eine Unterhaltung aus oder starte eine neue
        </p>
      </div>
    </div>
  );
}