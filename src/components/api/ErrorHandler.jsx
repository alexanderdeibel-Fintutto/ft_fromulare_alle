import React from 'react';
import ErrorState from '../feedback/ErrorState';

/**
 * Error Handler
 * Centralized error handling and display
 */

export class ErrorHandler {
  static handle(error) {
    const errorMap = {
      401: 'Authentifizierung erforderlich',
      403: 'Zugriff verweigert',
      404: 'Ressource nicht gefunden',
      429: 'Zu viele Anfragen. Bitte versuchen Sie es später',
      500: 'Serverfehler',
      503: 'Service nicht verfügbar'
    };

    return {
      title: errorMap[error.status] || 'Fehler',
      message: error.message || 'Ein unerwarteter Fehler ist aufgetreten',
      status: error.status,
      isRetryable: [408, 429, 500, 503].includes(error.status)
    };
  }

  static formatError(error) {
    if (typeof error === 'string') {
      return { title: 'Fehler', message: error };
    }

    if (error instanceof Error) {
      return { title: 'Fehler', message: error.message };
    }

    return this.handle(error);
  }
}

export function ErrorBoundaryFallback({ error, resetError }) {
  return (
    <div className="p-6">
      <ErrorState
        title={error?.title || 'Fehler'}
        message={error?.message || 'Ein Fehler ist aufgetreten'}
        error={error?.stack}
        onRetry={resetError}
      />
    </div>
  );
}

export default ErrorHandler;