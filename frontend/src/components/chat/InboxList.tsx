import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatService, type ConversationDisplay } from '../../services/chatService';

interface InboxListProps {
  selectedConversationId: number | null;
  onSelectConversation: (conversationId: number, otherParticipantId: string) => void;
}



export default function InboxList({ selectedConversationId, onSelectConversation }: InboxListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const data = await chatService.fetchInboxConversations(user.id);
        setConversations(data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // 5. Subscribe to Realtime messages for Inbox updates
    const channel = chatService.subscribeToInbox((newMsg) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === newMsg.conversation_id);
        if (index > -1) {
          const updatedConv = { ...prev[index], lastMessageAt: newMsg.sent_at };
          const newConvs = [...prev];
          newConvs.splice(index, 1);
          return [updatedConv, ...newConvs]; // Push to top
        } else {
          // Nếu là hội thoại mới hoàn toàn, gọi lại fetchConversations
          fetchConversations();
          return prev;
        }
      });
    });

    return () => {
      chatService.unsubscribe(channel);
    };
  }, [user]);

  function formatTime(dateStr?: string | null) {
    if (!dateStr) return '';
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    const d = new Date(utcDateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 shrink-0">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tin nhắn</h2>
        <div className="relative">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className="w-full pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            style={{ paddingLeft: '40px' }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">Chưa có tin nhắn nào</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {conversations.map(conv => {
              const isSelected = selectedConversationId === conv.id;
              return (
                <li
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id, conv.otherUserId)}
                  className={`flex items-center p-4 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="relative shrink-0">
                    {conv.otherUserAvatar ? (
                      <img src={conv.otherUserAvatar} alt={conv.otherUserName} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                        {conv.otherUserName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`text-sm truncate ${isSelected ? 'font-bold text-blue-900' : 'font-semibold text-gray-900'}`}>
                        {conv.otherUserName}
                      </h3>
                      <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    {/* Snippet could go here if we fetched the last message content */}
                    <p className="text-xs text-gray-500 truncate">
                      {/* Tạm thời hiển thị tin nhắn tĩnh hoặc lấy từ DB */}
                      Bấm vào để xem tin nhắn...
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
