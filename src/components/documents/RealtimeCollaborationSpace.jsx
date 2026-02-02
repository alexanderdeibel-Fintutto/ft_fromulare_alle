import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Dot } from 'lucide-react';

export default function RealtimeCollaborationSpace({ documentId, currentUser }) {
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    // Subscribe to real-time presence
    const unsubscribe = base44.entities.DocumentShare.subscribe((event) => {
      if (event.data?.document_id === documentId) {
        setActiveUsers(prev => {
          const exists = prev.find(u => u.email === event.data.shared_with_email);
          if (!exists && event.type === 'update') {
            return [...prev, { 
              email: event.data.shared_with_email,
              timestamp: new Date(),
              color: Math.random().toString(16).slice(2, 8)
            }];
          }
          return prev;
        });
      }
    });

    return unsubscribe;
  }, [documentId]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
      <Users className="w-4 h-4 text-blue-600" />
      <div className="flex items-center gap-1">
        {activeUsers.slice(0, 3).map(user => (
          <div
            key={user.email}
            title={user.email}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
            style={{ backgroundColor: `#${user.color}` }}
          >
            {user.email.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
      <span className="text-sm text-blue-600">
        {activeUsers.length} aktiv
      </span>
    </div>
  );
}