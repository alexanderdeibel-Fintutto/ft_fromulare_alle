import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SharedDocumentsFilter({ 
  searchTerm, 
  onSearchChange, 
  appFilter, 
  onAppFilterChange,
  accessLevelFilter,
  onAccessLevelChange,
  availableApps 
}) {
  return (
    <div className="space-y-3 mb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Dokumentname suchen..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={appFilter}
          onChange={(e) => onAppFilterChange(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="">Alle Apps</option>
          {availableApps.map(app => (
            <option key={app} value={app}>{app}</option>
          ))}
        </select>

        <select
          value={accessLevelFilter}
          onChange={(e) => onAccessLevelChange(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="">Alle Zugriffe</option>
          <option value="view">Nur Ansicht</option>
          <option value="download">Download</option>
          <option value="edit">Bearbeiten</option>
        </select>
      </div>
    </div>
  );
}