import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * Reaction Picker für Messages
 */
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function MessageReactions({ messageId, reactions = {}, onReact }) {
  const [showPicker, setShowPicker] = useState(false);

  function handleReact(emoji) {
    onReact(messageId, emoji);
    setShowPicker(false);
  }

  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div className="flex items-center gap-1 mt-1">
      {hasReactions && (
        <div className="flex gap-1">
          {Object.entries(reactions).map(([emoji, count]) => (
            <Button
              key={emoji}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleReact(emoji)}
            >
              {emoji} {count}
            </Button>
          ))}
        </div>
      )}

      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Smile className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex gap-1">
            {REACTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
                onClick={() => handleReact(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default MessageReactions;