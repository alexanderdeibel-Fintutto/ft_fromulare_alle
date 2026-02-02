import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Command } from 'lucide-react';

/**
 * Keyboard Shortcuts Handler
 * Global keyboard shortcuts with help modal
 */

const SHORTCUTS = [
  { keys: ['Cmd', 'K'], description: 'Command Palette öffnen', category: 'Navigation' },
  { keys: ['Cmd', '/', 'Ctrl', '/'], description: 'Shortcuts anzeigen', category: 'Navigation' },
  { keys: ['Cmd', 'S', 'Ctrl', 'S'], description: 'Speichern', category: 'General' },
  { keys: ['Cmd', 'Z', 'Ctrl', 'Z'], description: 'Rückgängig machen', category: 'General' },
  { keys: ['Cmd', 'Shift', 'Z', 'Ctrl', 'Shift', 'Z'], description: 'Wiederherstellen', category: 'General' },
  { keys: ['Escape'], description: 'Dialog/Modal schließen', category: 'General' },
  { keys: ['Enter'], description: 'Bestätigen/Absenden', category: 'General' },
  { keys: ['Tab'], description: 'Zur nächsten Komponente wechseln', category: 'Navigation' },
  { keys: ['Shift', 'Tab'], description: 'Zur vorherigen Komponente wechseln', category: 'Navigation' },
];

export default function KeyboardShortcutsHandler() {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+/ oder Ctrl+/ zum Anzeigen von Shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowHelp(!showHelp);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp]);

  return (
    <AnimatePresence>
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {Object.entries(
                SHORTCUTS.reduce((acc, shortcut) => {
                  if (!acc[shortcut.category]) acc[shortcut.category] = [];
                  acc[shortcut.category].push(shortcut);
                  return acc;
                }, {})
              ).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">{category}</h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, j) => (
                            <React.Fragment key={j}>
                              {j > 0 && <span className="text-gray-400 text-xs mx-1">+</span>}
                              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-700">
                                {key}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 text-xs text-gray-600">
              Drücke <kbd className="px-1.5 py-0.5 bg-gray-200 rounded inline">Cmd</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-200 rounded inline">/</kbd> um diese Liste zu schließen
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}