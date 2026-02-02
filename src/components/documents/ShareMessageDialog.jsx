import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareMessageDialog({ documentTitle, onClose, onShare }) {
  const [message, setMessage] = useState('');

  const handleShare = () => {
    onShare(message);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Persönliche Nachricht
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Füge eine persönliche Nachricht zur Freigabe von <strong>{documentTitle}</strong> hinzu
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, 500))}
        placeholder="Deine Nachricht hier..."
        className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1 h-24"
      />
      <p className="text-xs text-gray-500 mb-4">
        {message.length}/500 Zeichen
      </p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Abbrechen
        </Button>
        <Button onClick={handleShare} className="flex-1 bg-blue-600 hover:bg-blue-700">
          Teilen
        </Button>
      </div>
    </div>
  );
}