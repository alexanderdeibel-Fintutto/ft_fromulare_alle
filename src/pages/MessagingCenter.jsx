import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import ConversationList from '../components/messaging/ConversationList';
import ChatView from '../components/messaging/ChatView';
import { MessageCircle } from 'lucide-react';

export default function MessagingCenter() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Messaging Center</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Conversation List */}
          <Card className="col-span-1 border-r rounded-none">
            <ConversationList
              onSelect={setSelectedConversation}
              selectedId={selectedConversation?.id}
            />
          </Card>

          {/* Chat View */}
          <Card className="col-span-2 rounded-none">
            {selectedConversation ? (
              <ChatView
                conversationId={selectedConversation.id}
                conversation={selectedConversation}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Wähle eine Conversation aus</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}