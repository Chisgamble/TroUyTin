import { supabase } from './supabase';

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: string;
  content_type: string;
  content: string;
  sent_at: string;
  is_read: boolean;
};

export type ConversationDisplay = {
  id: number;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessageAt: string;
};

export const chatService = {
  // ==========================================
  // Lấy danh sách hội thoại cho Inbox
  // ==========================================
  async fetchInboxConversations(userId: string): Promise<ConversationDisplay[]> {
    // 1. Fetch conversations
    const { data: convs, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (convError) throw convError;
    if (!convs || convs.length === 0) return [];

    // 2. Collect other user IDs
    const otherUserIds = convs.map(c =>
      c.participant_1_id === userId ? c.participant_2_id : c.participant_1_id
    );

    // 3. Fetch profiles of other users
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .in('id', otherUserIds);

    if (profError) throw profError;

    // 4. Map data
    return convs.map(c => {
      const otherId = c.participant_1_id === userId ? c.participant_2_id : c.participant_1_id;
      const profile = profiles?.find(p => p.id === otherId);
      return {
        id: c.id,
        otherUserId: otherId,
        otherUserName: profile?.full_name || profile?.email || 'Người dùng ẩn danh',
        otherUserAvatar: profile?.avatar_url || null,
        lastMessageAt: c.last_message_at
      };
    });
  },

  // ==========================================
  // Lấy thông tin user chat cùng
  // ==========================================
  async fetchPartnerProfile(partnerId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, email')
      .eq('id', partnerId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // ==========================================
  // Tìm hoặc tạo hội thoại mới giữa 2 user
  // ==========================================
  async getOrCreateConversation(userId: string, partnerId: string): Promise<number> {
    // 1. Kiểm tra xem đã có hội thoại chưa
    const { data: existingConvs, error: checkError } = await supabase
      .from('chat_conversations')
      .select('id')
      .or(
        `and(participant_1_id.eq.${userId},participant_2_id.eq.${partnerId}),and(participant_1_id.eq.${partnerId},participant_2_id.eq.${userId})`
      )
      .maybeSingle();

    if (checkError) throw checkError;

    // Nếu đã có, trả về ID
    if (existingConvs) {
      return existingConvs.id;
    }

    // 2. Nếu chưa có, tạo mới
    const { data: newConv, error: insertError } = await supabase
      .from('chat_conversations')
      .insert({
        participant_1_id: userId,
        participant_2_id: partnerId,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    return newConv.id;
  },

  // ==========================================
  // Lấy lịch sử tin nhắn của 1 hội thoại
  // ==========================================
  async fetchMessages(conversationId: number): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // ==========================================
  // Gửi tin nhắn mới
  // ==========================================
  async sendMessage(conversationId: number, senderId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content_type: 'TEXT',
        content,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==========================================
  // Đánh dấu mảng tin nhắn là đã đọc
  // ==========================================
  async markMessagesAsRead(messageIds: number[]) {
    if (!messageIds || messageIds.length === 0) return;
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds);

    if (error) throw error;
  },

  // ==========================================
  // Realtime: Đăng ký nghe sự kiện có tin nhắn mới cho Inbox
  // ==========================================
  subscribeToInbox(callback: (newMsg: any) => void) {
    const channel = supabase
      .channel('public:messages_inbox')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => callback(payload.new)
      )
      .subscribe();
    return channel;
  },

  // ==========================================
  // Realtime: Đăng ký nghe sự kiện có tin nhắn mới cho ChatWindow
  // ==========================================
  subscribeToMessages(conversationId: number, callback: (newMsg: Message) => void) {
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
        (payload) => callback(payload.new as Message)
      )
      .subscribe();
    return channel;
  },

  // ==========================================
  // Realtime: Hủy đăng ký kênh
  // ==========================================
  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  }
};
