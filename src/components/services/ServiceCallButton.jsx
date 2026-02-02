import React, { useState } from 'react';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Universal Service Call Button
 * Verwendung: <ServiceCallButton service="letterxpress" onSuccess={...} />
 */
export default function ServiceCallButton({
  service,
  appName,
  payload,
  children,
  onSuccess,
  onError,
  className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCall = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/call-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: appName,
          service_key: service,
          payload
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Service call failed');
      }

      toast.success(`${service} erfolgreich aufgerufen`);
      onSuccess?.(data);
    } catch (err) {
      setError(err.message);
      toast.error(`Fehler: ${err.message}`);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleCall}
        disabled={isLoading}
        className={`flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : null}
        {children || `${service} aufrufen`}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}