import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Share2, Check } from 'lucide-react';

export default function ShareNotificationToast({ share }) {
  useEffect(() => {
    if (share) {
      toast.success(
        <div className="flex items-start gap-3">
          <Share2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Dokument geteilt</p>
            <p className="text-sm text-gray-600">
              "{share.document_title}" wurde mit {share.shared_with_email} geteilt
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Zugriff: {share.access_level}
            </p>
          </div>
        </div>
      );
    }
  }, [share]);

  return null;
}