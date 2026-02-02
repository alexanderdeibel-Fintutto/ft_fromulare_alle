// components/documents/DocumentActions.jsx
import React, { useState } from 'react';
import { Download, Edit, Share2, Trash2, Copy, Mail, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DocumentActions({ 
  document, 
  onEdit, 
  onDelete, 
  onShare,
  compact = false 
}) {
  const [copying, setCopying] = useState(false);

  const handleDownload = () => {
    window.open(document.file_url, '_blank');
  };

  const handleCopyLink = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(document.file_url);
      toast.success('Link kopiert!');
    } catch (err) {
      toast.error('Fehler beim Kopieren');
    } finally {
      setCopying(false);
    }
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Herunterladen
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Neu generieren
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink} disabled={copying}>
            <Copy className="w-4 h-4 mr-2" />
            Link kopieren
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShare}>
            <Mail className="w-4 h-4 mr-2" />
            Per E-Mail teilen
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={handleDownload}>
        <Download className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onShare}>
        <Share2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-600 hover:text-red-700">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}