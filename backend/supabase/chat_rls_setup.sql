-- ==========================================
-- CHAT FEATURE: RLS & REALTIME SETUP
-- Vui lòng chạy script này trong Supabase SQL Editor
-- ==========================================

-- 1. Kích hoạt RLS cho bảng chat_conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: User chỉ xem được hội thoại của chính mình
CREATE POLICY "Users can view their own conversations" 
ON chat_conversations FOR SELECT 
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Policy: User chỉ có thể tạo hội thoại nếu họ là một trong 2 người tham gia
CREATE POLICY "Users can create conversations where they are a participant" 
ON chat_conversations FOR INSERT 
WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Policy: User chỉ có thể update hội thoại của mình
CREATE POLICY "Users can update their conversations"
ON chat_conversations FOR UPDATE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- 2. Kích hoạt RLS cho bảng messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: User chỉ xem được tin nhắn trong hội thoại của mình
CREATE POLICY "Users can view messages of their conversations" 
ON messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_conversations c
    WHERE c.id = messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

-- Policy: User chỉ được gửi tin (INSERT) nếu sender_id chính là user đang login 
-- VÀ hội thoại đó thuộc về họ
CREATE POLICY "Users can insert messages into their conversations" 
ON messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM chat_conversations c
    WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

-- Policy: Chỉ người nhận (không phải người gửi) mới được phép update is_read
CREATE POLICY "Users can update read status of received messages"
ON messages FOR UPDATE
USING (
  auth.uid() != sender_id AND
  EXISTS (
    SELECT 1 FROM chat_conversations c
    WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

-- 3. Bật Realtime (WebSockets) cho bảng messages
-- Lệnh này sẽ an toàn thêm bảng vào publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;
