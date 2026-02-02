import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

/**
 * Task Filter Component
 */
export default function TaskFilter({ filters, onFilterChange }) {
  const hasFilters = Object.values(filters).some((v) => v !== 'all');

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="w-4 h-4 text-gray-500" />

      <Select
        value={filters.status}
        onValueChange={(value) =>
          onFilterChange({ ...filters, status: value })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Status</SelectItem>
          <SelectItem value="todo">Zu erledigen</SelectItem>
          <SelectItem value="in_progress">In Bearbeitung</SelectItem>
          <SelectItem value="done">Erledigt</SelectItem>
          <SelectItem value="cancelled">Storniert</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(value) =>
          onFilterChange({ ...filters, priority: value })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Priorität" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Prioritäten</SelectItem>
          <SelectItem value="low">Niedrig</SelectItem>
          <SelectItem value="medium">Mittel</SelectItem>
          <SelectItem value="high">Hoch</SelectItem>
          <SelectItem value="urgent">Dringend</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onFilterChange({ status: 'all', priority: 'all', assigned: 'all' })
          }
          className="gap-1"
        >
          <X className="w-3 h-3" />
          Filter zurücksetzen
        </Button>
      )}
    </div>
  );
}