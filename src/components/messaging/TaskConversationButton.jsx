import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getTaskConversation } from '../services/messaging';

/**
 * Button um zur Task-Conversation zu navigieren
 * Usage: <TaskConversationButton taskId="task-123" />
 */
export default function TaskConversationButton({ taskId, variant = 'outline' }) {
  const navigate = useNavigate();

  async function handleClick() {
    const conversation = await getTaskConversation(taskId);
    if (conversation) {
      navigate(createPageUrl('MessagingCenter') + `?conv=${conversation.id}`);
    }
  }

  return (
    <Button variant={variant} size="sm" onClick={handleClick} className="gap-2">
      <MessageCircle className="w-4 h-4" />
      Zur Diskussion
    </Button>
  );
}