import React from 'react';
import { Download, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DownloadButton({ 
  onClick, 
  loading = false, 
  disabled = false,
  label = 'PDF Herunterladen'
}) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          Wird generiert...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          {label}
        </>
      )}
    </Button>
  );
}