import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { roommateService } from "../services/roommates";
import { MessageCircle, Trash2, Loader, Bookmark, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SavedRoommate {
  id: number;
  userId: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  savedAt: string;
}

export default function SavedRoommates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState<SavedRoommate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    try {
      setLoading(true);
      const res = await roommateService.getSavedRoommates();
      setSaved(res.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Lỗi hệ thống khi tải danh sách hồ sơ đã lưu");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (roommateId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn bỏ lưu hồ sơ ứng viên này không?")) return;

    try {
      await roommateService.removeSavedRoommate(roommateId);
      setSaved(saved.filter((r) => r.userId !== roommateId));
    } catch (error) {
      console.error("Error:", error);
      alert("Lỗi khi xóa dữ liệu khỏi danh sách");
    }
  };

  const handleChat = (roommateId: string) => {
    navigate(`/chat?userId=${roommateId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-3 text-emerald-600" size={36} />
          <div className="text-sm font-semibold text-gray-500">Đang lôi danh sách hồ sơ đã lưu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button 
              onClick={() => navigate("/roommate-matching")}
              className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-emerald-600 uppercase tracking-wider mb-2 transition-colors"
            >
              <ChevronLeft size={14} /> Trở về trang quẹt thẻ
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              👤 Hồ Sơ Ở Ghép Đã Lưu
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Bạn đang lưu trữ <span className="font-bold text-emerald-600">{saved.length}</span> ứng viên tiềm năng để liên hệ trao đổi hợp đồng
            </p>
          </div>
        </div>

        {/* Empty State Layout */}
        {saved.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Bookmark size={24} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Danh sách trống</h2>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 mb-6 leading-relaxed">
              Bạn chưa lưu bất kỳ hồ sơ sinh viên nào. Hãy truy cập trang khám phá, quẹt tìm người hợp gu và nhấn nút "Lưu".
            </p>
            <button
              onClick={() => navigate("/roommate-matching")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md shadow-emerald-50 transition"
            >
              Khám phá ứng viên ngay
            </button>
          </div>
        ) : (
          /* Grid Cards Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {saved.map((roommate) => (
              <div
                key={roommate.userId}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Image / Gradient Header Area */}
                <div className="h-36 bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center relative shrink-0">
                  {roommate.avatarUrl ? (
                    <img
                      src={roommate.avatarUrl}
                      alt={roommate.fullName}
                      className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-4 border-white bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl shadow-sm select-none">
                      👤
                    </div>
                  )}
                </div>

                {/* Content Details Area */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                      {roommate.fullName || "Sinh viên ẩn danh"}
                    </h3>

                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-3">
                      {roommate.bio || "Thành viên này chưa cập nhật dòng giới thiệu bản thân."}
                    </p>
                  </div>

                  {/* Operational Controls Footer Line */}
                  <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      Lưu: {new Date(roommate.savedAt).toLocaleDateString("vi-VN")}
                    </span>

                    <div className="flex gap-1.5 shrink-0">
                      {/* Trash action */}
                      <button
                        onClick={() => handleRemove(roommate.userId)}
                        className="p-2 bg-gray-50 hover:bg-rose-50 border border-gray-100 text-gray-400 hover:text-rose-600 rounded-xl transition-colors"
                        title="Xóa khỏi danh sách lưu trữ"
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Chat action */}
                      <button
                        onClick={() => handleChat(roommate.userId)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <MessageCircle size={14} />
                        Nhắn tin
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}