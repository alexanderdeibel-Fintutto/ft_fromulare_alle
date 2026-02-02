import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, AlertCircle } from 'lucide-react';

/**
 * Auto-Save Hook für Formulare
 * Speichert Änderungen automatisch in localStorage + DB
 */

export function useAutoSave(engine, storageKey, options = {}) {
  const { interval = 30000, onSave = null, maxDrafts = 5 } = options;
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    // Load draft on mount
    loadDraft();

    // Auto-save interval
    const timer = setInterval(() => {
      if (engine.isDirty) {
        performSave();
      }
    }, interval);

    // Save on page unload
    const beforeUnload = (e) => {
      if (engine.isDirty) {
        performSave();
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [engine, storageKey, interval, onSave]);

  function loadDraft() {
    try {
      const draft = localStorage.getItem(`${storageKey}_draft`);
      if (draft) {
        const parsed = JSON.parse(draft);
        engine.data = parsed.data;
        setLastSaved(parsed.timestamp);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }

  async function performSave() {
    setSaveStatus('saving');

    try {
      const data = engine.getData();

      // Save to localStorage
      localStorage.setItem(`${storageKey}_draft`, JSON.stringify({
        data: data,
        timestamp: new Date().toISOString()
      }));

      // Call optional DB save
      if (onSave) {
        await onSave(data);
      }

      setSaveStatus('saved');
      setLastSaved(new Date());

      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);

      // Cleanup old drafts
      cleanupOldDrafts();
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }

  function cleanupOldDrafts() {
    try {
      const pattern = new RegExp(`^${storageKey}_draft_\\d+$`);
      const keys = Object.keys(localStorage).filter(k => pattern.test(k));

      if (keys.length > maxDrafts) {
        keys.sort().slice(0, keys.length - maxDrafts).forEach(k => {
          localStorage.removeItem(k);
        });
      }
    } catch (error) {
      console.warn('Error cleanup drafts:', error);
    }
  }

  return {
    saveStatus,
    lastSaved,
    manualSave: performSave,
    clearDraft: () => {
      localStorage.removeItem(`${storageKey}_draft`);
      engine.reset();
    }
  };
}

/**
 * Auto-Save Status Indicator Component
 */
export function AutoSaveIndicator({ status, lastSaved }) {
  if (status === 'idle' && !lastSaved) return null;

  const messages = {
    idle: lastSaved ? `Gespeichert ${formatTime(lastSaved)}` : null,
    saving: 'Wird gespeichert...',
    saved: '✓ Gespeichert',
    error: 'Speicherfehler'
  };

  const colors = {
    idle: 'text-gray-500',
    saving: 'text-blue-500',
    saved: 'text-green-500',
    error: 'text-red-500'
  };

  return (
    <div className={`text-xs flex items-center gap-1 ${colors[status]}`}>
      {status === 'saving' && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {status === 'saved' && <Check className="w-3 h-3" />}
      {status === 'error' && <AlertCircle className="w-3 h-3" />}
      <span>{messages[status]}</span>
    </div>
  );
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'gerade eben';
  if (minutes === 1) return 'vor 1 Minute';
  if (minutes < 60) return `vor ${minutes} Min.`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'vor 1 Stunde';
  if (hours < 24) return `vor ${hours} Std.`;

  return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
}