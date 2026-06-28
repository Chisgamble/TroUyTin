import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

interface ChatWindowProps {
  conversationId: number;
  otherParticipantId: string;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  content_type: 'TEXT' | 'IMAGE' | 'FILE';
  content: string;
  is_read: boolean;
  sent_at: string;
}

interface PartnerProfile {
  full_name: string | null;
  avatar_url: string | null;
  email: string;
}

export default function ChatWindow({ conversationId, otherParticipantId }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch partner profile
  useEffect(() => {
    const fetchPartnerProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, email')
          .eq('id', otherParticipantId)
          .maybeSingle(); // Dùng maybeSingle thay vì single để tránh lỗi 406 khi không tìm thấy

        if (error) throw error;
        if (data) {
          setPartner(data);
        }
      } catch (error) {
        console.error('Error fetching partner profile:', error);
      }
    };

    fetchPartnerProfile();
  }, [otherParticipantId]);

  // 2. Fetch message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('sent_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // 3. Subscribe to Realtime messages for this conversation
    const channel = supabase
      .channel(`room:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Tránh trùng lặp tin nhắn vừa tự gửi (đã được local state thêm vào hoặc chuẩn bị nhận)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // 4. Mark messages as read
  useEffect(() => {
    if (!user || messages.length === 0) return;

    // Tìm các tin nhắn chưa đọc của người KHÁC gửi cho mình
    const unreadMessages = messages.filter(
      (m) => m.sender_id !== user.id && !m.is_read
    );

    if (unreadMessages.length > 0) {
      const markAsRead = async () => {
        try {
          const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(m => m.id));

          if (error) throw error;
          
          // Cập nhật lại local state để UI phản ánh ngay
          setMessages(prev => prev.map(m => 
            unreadMessages.some(um => um.id === m.id) 
              ? { ...m, is_read: true } 
              : m
          ));
        } catch (err) {
          console.error("Error marking messages as read:", err);
        }
      };

      markAsRead();
    }
  }, [messages, user]);

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content_type: 'TEXT',
          content: messageText,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state to be instant
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      setSending(false);
    }
  };

  // Helper hàm format giờ fix lỗi Timezone
  const formatLocalTime = (dateStr: string) => {
    // Nếu Drizzle lưu timestamp không có múi giờ, ta thêm 'Z' để trình duyệt hiểu đó là giờ UTC
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    return new Date(utcDateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base mr-3">
          {partner?.avatar_url ? (
            <img src={partner.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            (partner?.full_name || partner?.email || '?').charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">
            {partner?.full_name || partner?.email || 'Người dùng ẩn danh'}
          </h3>
          <span className="text-xs text-green-500 flex items-center">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
            Đang hoạt động
          </span>
        </div>
      </div>

      {/* Message Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" 
        ref={messagesContainerRef}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Đang tải cuộc hội thoại...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-2xl text-sm shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                  }`}
                  style={{ maxWidth: '70%', wordBreak: 'break-word', padding: '10px 16px' }}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <span
                    className={`block text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${
                      isMe ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    {formatLocalTime(msg.sent_at)}
                    {isMe && (
                      <svg className={`w-3 h-3 ${msg.is_read ? 'text-blue-100' : 'text-blue-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        {msg.is_read && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 18l4 4L19 12" className="opacity-70 transform -translate-y-1.5" />}
                      </svg>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 shrink-0">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
          >
            Gửi
          </button>
        </div>
      </form>
    </div>
  );
}
