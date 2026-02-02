import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorState({ 
  title = 'Ein Fehler ist aufgetreten', 
  message = 'Bitte versuche es erneut.', 
  onRetry 
}) {
  return (
    <div className="bg-white rounded-2xl p-12 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Erneut versuchen
        </Button>
      )}
    </div>
  );
}