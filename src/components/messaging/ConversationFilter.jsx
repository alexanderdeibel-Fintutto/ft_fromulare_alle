import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

/**
 * Filter für Conversations
 */
export function ConversationFilter({ filters, onFilterChange, counts }) {
  const filterOptions = [
    { key: 'unread', label: 'Ungelesen', count: counts.unread },
    { key: 'direct', label: 'Direkt', count: counts.direct },
    { key: 'task', label: 'Aufgaben', count: counts.task },
    { key: 'building', label: 'Gebäude', count: counts.building },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
          {Object.values(filters).some((v) => v) && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
              {Object.values(filters).filter((v) => v).length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filtern nach</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filterOptions.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.key}
            checked={filters[option.key]}
            onCheckedChange={(checked) =>
              onFilterChange({ ...filters, [option.key]: checked })
            }
          >
            <div className="flex items-center justify-between w-full">
              <span>{option.label}</span>
              {option.count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {option.count}
                </Badge>
              )}
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ConversationFilter;