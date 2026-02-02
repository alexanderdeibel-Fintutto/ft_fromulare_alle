// components/documents/DocumentFilters.jsx
import React from 'react';
import { Search, Filter, Calendar, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DocumentFilters({ 
  searchTerm, 
  onSearchChange,
  sortBy,
  onSortChange,
  filterType,
  onFilterTypeChange,
  templates = []
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Dokumente durchsuchen..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={filterType} onValueChange={onFilterTypeChange}>
        <SelectTrigger className="w-full sm:w-48">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Typ filtern" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Typen</SelectItem>
          {templates.map(t => (
            <SelectItem key={t.id} value={t.slug}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-48">
          <Calendar className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Sortieren" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Neueste zuerst</SelectItem>
          <SelectItem value="oldest">Älteste zuerst</SelectItem>
          <SelectItem value="name_asc">Name A-Z</SelectItem>
          <SelectItem value="name_desc">Name Z-A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}