import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Plus, ChevronDown } from 'lucide-react';
import useOrg from './useOrg';

export default function OrgSwitcher() {
  const { currentOrg, organizations, switchOrg, loading } = useOrg();
  const [open, setOpen] = useState(false);

  if (loading || !currentOrg) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
        <div className="w-24 h-4 bg-gray-300 rounded" />
      </div>
    );
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-auto px-3 py-2">
          <Avatar className="w-8 h-8">
            {currentOrg.logo_url ? (
              <AvatarImage src={currentOrg.logo_url} alt={currentOrg.name} />
            ) : (
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {getInitials(currentOrg.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{currentOrg.name}</span>
            <span className="text-xs text-gray-500">{organizations.length} Organisationen</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-gray-500">
          Organisation wechseln
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => {
              switchOrg(org.id);
              setOpen(false);
            }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Avatar className="w-8 h-8">
              {org.logo_url ? (
                <AvatarImage src={org.logo_url} alt={org.name} />
              ) : (
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {getInitials(org.name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{org.name}</div>
              <div className="text-xs text-gray-500">{org.role}</div>
            </div>
            {currentOrg.id === org.id && (
              <Check className="w-4 h-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer text-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Neue Organisation erstellen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}