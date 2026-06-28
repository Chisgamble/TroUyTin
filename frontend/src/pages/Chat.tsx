import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import InboxList from '../components/chat/InboxList';
import ChatWindow from '../components/chat/ChatWindow';

export const Chat: React.FC = () => {
  const location = useLocation();
  const initialState = location.state as { conversationId?: number, participantId?: string } | null;

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(initialState?.conversationId || null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(initialState?.participantId || null);

  useEffect(() => {
    if (location.state) {
      const state = location.state as { conversationId?: number, participantId?: string };
      if (state.conversationId) setSelectedConversationId(state.conversationId);
      if (state.participantId) setSelectedParticipantId(state.participantId);
    }
  }, [location.state]);

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
