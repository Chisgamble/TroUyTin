import { useState, useEffect } from "react";
import { roommateService } from "../services/roommates";
import { MessageCircle, Trash2, Loader, Bookmark, ChevronLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SavedRoommate {
  id: number;
  userId: string;
  fullName?: string;
  avatarUrl?: string;
  gender?: string;
  age?: number;
  hometown?: string;
  schoolOrJob?: string;
  bio?: string;
  hasPet?: boolean;
  sleepSchedule?: string;
  hasRoom?: boolean;
  roomId?: number | string;
  roomAddress?: string;
  savedAt: string;
}

export default function SavedRoommates() {
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

  const getTags = (roommate: SavedRoommate) => {
    const tags: Array<{ label: string; type: "error" | "info" }> = [];
    if (roommate.hasPet) tags.push({ label: "🐕 Có thú cưng", type: "error" });
    if (roommate.sleepSchedule) tags.push({ label: `⏰ ${roommate.sleepSchedule}`, type: "info" });
    return tags;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-3 text-blue-600" size={36} />
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
              className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-wider mb-2 transition-colors"
            >
              <ChevronLeft size={14} /> Trở về trang khám phá
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              👤 Hồ Sơ Ở Ghép Đã Lưu
            </h1>
              <p className="text-xs text-gray-400 mt-1">
              Bạn đang lưu trữ <span className="font-bold text-blue-600">{saved.length}</span> ứng viên tiềm năng để liên hệ trao đổi hợp đồng
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
              Bạn chưa lưu bất kỳ hồ sơ người ở ghép nào. Hãy truy cập trang khám phá, tìm người hợp gu và nhấn nút "Lưu".
            </p>
            <button
              onClick={() => navigate("/roommate-matching")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md shadow-blue-50 transition"
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
                className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition duration-200 overflow-hidden flex flex-col"
              >
                <div className="h-44 bg-gradient-to-br from-[var(--brand-800)] via-[var(--brand-600)] to-[#7c3aed] flex items-center justify-center relative shrink-0">
                  {roommate.hasRoom && (
                    <div className="absolute top-4 left-4 bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10 flex items-center gap-1 border border-blue-400">
                      <Home size={12} /> Đã có phòng
                    </div>
                  )}

                  {roommate.avatarUrl ? (
                    <img
                      src={roommate.avatarUrl}
                      alt={roommate.fullName || "Sinh viên ẩn danh"}
                      className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-4xl shadow-sm select-none">
                      👤
                    </div>
                  )}

                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-2 min-w-[56px] text-center shadow-md border border-blue-100">
                    <p className="text-lg font-black text-[var(--brand-600)] leading-none">
                      {roommate.age ?? "--"}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                      Tuổi
                    </p>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {roommate.fullName || "Sinh viên ẩn danh"}
                      </h3>

                      <button
                        onClick={() => handleChat(roommate.userId)}
                        className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                        title={`Nhắn tin ngay với ${roommate.fullName || "ứng viên"}`}
                      >
                        <MessageCircle size={18} />
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-[var(--brand-600)] bg-blue-50 inline-block px-2 py-0.5 rounded-md mb-4">
                      {roommate.gender === "MALE" ? "Nam" : roommate.gender === "FEMALE" ? "Nữ" : roommate.gender || "Chưa cập nhật"}
                      {roommate.age ? ` • ${roommate.age} tuổi` : ""}
                    </p>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 shrink-0">📍</span>
                        <span className="truncate">Quê quán: {roommate.hometown || "Chưa cập nhật"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 shrink-0">🎓</span>
                        <span className="line-clamp-1">Học vấn/Công việc: {roommate.schoolOrJob || "Chưa cập nhật"}</span>
                      </div>
                    </div>

                    {roommate.hasRoom && roommate.roomAddress && (
                      <div className="flex items-start gap-2 text-sm text-blue-700 mb-4 bg-blue-50/80 border border-blue-100 rounded-xl p-2.5">
                        <span className="shrink-0">🏠</span>
                        <span className="line-clamp-2">Địa chỉ phòng: {roommate.roomAddress}</span>
                      </div>
                    )}

                    {getTags(roommate).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {getTags(roommate).map((tag, i) => (
                          <span
                            key={i}
                            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md ${
                              tag.type === "error"
                                ? "bg-rose-50 text-rose-700 border border-rose-100"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                    <button
                      onClick={() => handleRemove(roommate.userId)}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-600 py-2 rounded-xl flex items-center justify-center gap-1 transition-colors font-semibold text-xs border border-gray-200"
                      title="Xóa khỏi danh sách lưu trữ"
                    >
                      <Trash2 size={14} />
                      Bỏ lưu
                    </button>

                    {roommate.hasRoom && roommate.roomId && (
                      <button
                        onClick={() => navigate(`/roommate-posts/${roommate.roomId}`)}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-xl flex items-center justify-center gap-1 transition-colors font-semibold text-xs border border-blue-200"
                      >
                        <Home size={14} />
                        Xem phòng
                      </button>
                    )}
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