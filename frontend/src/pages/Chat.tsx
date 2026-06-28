import React, { useState } from 'react';
import InboxList from '../components/chat/InboxList';
import ChatWindow from '../components/chat/ChatWindow';

export const Chat: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white border-t border-gray-200 overflow-hidden">
      {/* Cột trái: Danh sách Inbox */}
      <div className="w-[320px] md:w-[380px] border-r border-gray-200 flex flex-col h-full shrink-0 min-w-0">
        <InboxList 
          selectedConversationId={selectedConversationId}
          onSelectConversation={(id, participantId) => {
            setSelectedConversationId(id);
            setSelectedParticipantId(participantId);
          }}
        />
      </div>

      {/* Cột phải: Chat Window */}
      <div className="flex-1 flex flex-col h-full bg-gray-50/50 relative min-w-0">
        {selectedConversationId && selectedParticipantId ? (
          <ChatWindow 
            conversationId={selectedConversationId} 
            otherParticipantId={selectedParticipantId}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Chọn một đoạn chat để bắt đầu
          </div>
        )}
      </div>
    </div>
  );
};
