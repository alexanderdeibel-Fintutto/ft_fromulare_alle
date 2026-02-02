import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { Search, X } from 'lucide-react';
import { createPageUrl } from '@/utils/createPageUrl';

/**
 * Command Palette
 * Cmd+K global search and navigation
 */

const COMMANDS = [
  { id: 'home', label: 'Home', description: 'Go to homepage', href: createPageUrl('Home'), category: 'Navigation' },
  { id: 'settings', label: 'Settings', description: 'Open settings', href: createPageUrl('Settings'), category: 'Navigation' },
  { id: 'profile', label: 'Profile', description: 'View your profile', href: createPageUrl('Profile'), category: 'Navigation' },
  { id: 'billing', label: 'Billing', description: 'Manage billing', href: createPageUrl('Billing'), category: 'Navigation' },
  { id: 'help', label: 'Help & Support', description: 'Get help', href: createPageUrl('Help'), category: 'Navigation' },
];

export default function CommandPalette({ open = false, onOpenChange }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
        onOpenChange?.(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  const handleSelect = (href) => {
    window.location.href = href;
    setIsOpen(false);
    onOpenChange?.(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="w-full max-w-md">
        <Command className="rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 px-4 py-3">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              placeholder="Search commands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
              autoFocus
            />
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenChange?.(false);
              }}
              className="ml-2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {COMMANDS.filter(cmd =>
              cmd.label.toLowerCase().includes(search.toLowerCase()) ||
              cmd.description.toLowerCase().includes(search.toLowerCase())
            ).length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Keine Befehle gefunden
              </div>
            ) : (
              Object.entries(
                COMMANDS.filter(cmd =>
                  cmd.label.toLowerCase().includes(search.toLowerCase()) ||
                  cmd.description.toLowerCase().includes(search.toLowerCase())
                ).reduce((acc, cmd) => {
                  if (!acc[cmd.category]) acc[cmd.category] = [];
                  acc[cmd.category].push(cmd);
                  return acc;
                }, {})
              ).map(([category, cmds]) => (
                <div key={category}>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    {category}
                  </div>
                  {cmds.map(cmd => (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd.href)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between text-sm"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{cmd.label}</div>
                        <div className="text-xs text-gray-500">{cmd.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
            <span>Drücke ESC zum Schließen</span>
          </div>
        </Command>
      </div>
    </div>
  );
}