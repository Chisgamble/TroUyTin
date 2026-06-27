-- Hàm cập nhật last_message_at
CREATE OR REPLACE FUNCTION update_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET last_message_at = NEW.sent_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn Trigger vào bảng messages
DROP TRIGGER IF EXISTS trigger_update_last_message_at ON messages;
CREATE TRIGGER trigger_update_last_message_at
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_last_message_at();
