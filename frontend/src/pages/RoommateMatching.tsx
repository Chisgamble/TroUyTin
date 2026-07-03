import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roommateService } from "../services/roommates";
import { Heart, X, ThumbsUp, Loader, MessageSquare, Sparkles, Bookmark } from "lucide-react";

interface RoommateCandidate {
  id: number;
  userId: string;
  fullName?: string;
  avatarUrl?: string;
  gender: string;
  age: number;
  hometown: string;
  schoolOrJob: string;
  compatibilityPct: number;
  hasPet: boolean;
  sleepSchedule: string;
}

export default function RoommateMatching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<RoommateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Trạng thái hiển thị modal chúc mừng khi match thành công 2 chiều
  const [matchNotification, setMatchNotification] = useState<{ userName: string; avatarUrl?: string } | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const res = await roommateService.getDiscover();
      setCandidates(res.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Lỗi khi tải danh sách ứng viên");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    targetUserId: string,
    action: "PASS" | "SAVE" | "LIKE",
    candidateName?: string,
    candidateAvatar?: string
  ) => {
    try {
      setActionLoading(`${targetUserId}-${action}`);

      if (action === "SAVE") {
        await roommateService.saveRoommate(targetUserId);
        alert("Đã lưu hồ sơ ứng viên thành công!");
      } else {
        const matchAction = action === "LIKE" ? "LIKE" : "PASS";
        const res = await roommateService.createMatch(targetUserId, matchAction);
        
        // Kiểm tra xem phản hồi từ Backend có trả về trạng thái MATCHED hay không (Cả 2 cùng LIKE nhau)
        if (action === "LIKE" && res.data?.status === "MATCHED") {
          setMatchNotification({
            userName: candidateName || "Bạn cùng phòng",
            avatarUrl: candidateAvatar
          });
        }
      }

      // Loại bỏ ứng viên ra khỏi danh sách hiển thị hiện tại sau khi đã tương tác
      setCandidates(candidates.filter((c) => c.userId !== targetUserId));
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert("Đã tương tác với người này rồi!");
        setCandidates(candidates.filter((c) => c.userId !== targetUserId));
      } else {
        alert("Lỗi hệ thống, vui lòng thử lại sau");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getTags = (candidate: RoommateCandidate) => {
    const tags = [];
    if (candidate.hasPet) tags.push({ label: "🐕 Có thú cưng", type: "error" });
    if (candidate.sleepSchedule) tags.push({ label: `⏰ ${candidate.sleepSchedule}`, type: "info" });
    return tags;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-3 text-emerald-600" size={40} />
          <div className="text-gray-600 font-medium">Đang tìm kiếm các ứng viên phù hợp...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* 🚀 HEADER CỦA TRANG TÌM Ở GHÉP ĐÃ ĐƯỢC CẬP NHẬT */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Khám phá bạn cùng phòng</h1>
            <p className="text-sm text-gray-500 mt-1">Hệ thống đã chọn lọc những người có độ tương thích cao nhất với bạn</p>
          </div>
          
          {/* Nút chuyển sang trang Hồ sơ đã lưu */}
          <button
            onClick={() => navigate('/saved-roommates')}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-all font-medium shadow-sm shrink-0"
          >
            <Bookmark className="w-5 h-5 fill-yellow-700" />
            Hồ sơ đã lưu
          </button>
        </div>

        {/* Empty State */}
        {candidates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Không còn ứng viên nào mới</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm">
              Bạn đã lướt hết các gợi ý hiện tại. Hãy quay lại sau hoặc cập nhật thêm thói quen tại hồ sơ cá nhân để mở rộng tệp tìm kiếm.
            </p>
            <button
              onClick={loadCandidates}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-colors text-sm"
            >
              Cập nhật lại danh sách
            </button>
          </div>
        ) : (
          /* Candidates Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div
                key={candidate.userId}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition duration-200 overflow-hidden flex flex-col"
              >
                {/* Visual Header Section */}
                <div className="h-44 bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center relative shrink-0">
                  {candidate.avatarUrl ? (
                    <img 
                      src={candidate.avatarUrl} 
                      alt={candidate.fullName} 
                      className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-emerald-100 flex items-center justify-center text-4xl shadow-sm select-none">
                      👤
                    </div>
                  )}

                  {/* Compatibility Circular Badge */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-2 min-w-[56px] text-center shadow-md border border-emerald-50">
                    <p className="text-lg font-black text-emerald-600 leading-none">
                      {candidate.compatibilityPct}%
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">Hợp gu</p>
                  </div>
                </div>

                {/* Body Content Section */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {candidate.fullName || "Sinh viên ẩn danh"}
                      </h3>
                      
                      {/* 🔥 Nút Chat nội bộ nhanh ngay tại góc thẻ hồ sơ theo nốt họp */}
                      <button
                        onClick={() => navigate("/chat")}
                        className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                        title={`Nhắn tin ngay với ${candidate.fullName || 'ứng viên'}`}
                      >
                        <MessageSquare size={18} />
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded-md mb-4">
                      {candidate.age} tuổi • {candidate.gender === "MALE" ? "Nam" : candidate.gender === "FEMALE" ? "Nữ" : candidate.gender}
                    </p>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 shrink-0">📍</span>
                        <span className="truncate">Quê quán: {candidate.hometown || "Chưa cập nhật"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 shrink-0">🎓</span>
                        <span className="line-clamp-1">Học vấn/Công việc: {candidate.schoolOrJob || "Chưa cập nhật"}</span>
                      </div>
                    </div>

                    {/* Behavior Tags */}
                    {getTags(candidate).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {getTags(candidate).map((tag, i) => (
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

                  {/* Core Action Footer Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                    {/* Pass Action */}
                    <button
                      onClick={() => handleAction(candidate.userId, "PASS")}
                      disabled={!!actionLoading}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-600 py-2 rounded-xl flex items-center justify-center gap-1 transition-colors font-semibold text-xs border border-gray-200"
                    >
                      {actionLoading === `${candidate.userId}-PASS` ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <>
                          <X size={14} />
                          Bỏ qua
                        </>
                      )}
                    </button>

                    {/* Save Action */}
                    <button
                      onClick={() => handleAction(candidate.userId, "SAVE")}
                      disabled={!!actionLoading}
                      className="flex-1 bg-amber-50 hover:bg-amber-100/80 disabled:opacity-50 text-amber-700 py-2 rounded-xl flex items-center justify-center gap-1 transition-colors font-semibold text-xs border border-amber-100"
                    >
                      {actionLoading === `${candidate.userId}-SAVE` ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Heart size={14} />
                          Lưu
                        </>
                      )}
                    </button>

                    {/* Like/Connect Action */}
                    <button
                      onClick={() => handleAction(candidate.userId, "LIKE", candidate.fullName, candidate.avatarUrl)}
                      disabled={!!actionLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-xl flex items-center justify-center gap-1 transition-colors font-semibold text-xs shadow-sm shadow-emerald-100"
                    >
                      {actionLoading === `${candidate.userId}-LIKE` ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <>
                          <ThumbsUp size={14} />
                          Kết nối
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🔥 Modal Pop-up hiện ra ăn mừng khi 2 bên tương thích và quẹt trúng nhau (Match 2 chiều) */}
        {matchNotification && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-emerald-100 relative overflow-hidden transform transition-all scale-100">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-400" />
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 mt-2 text-emerald-600">
                <Sparkles size={32} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-gray-900">Kết nối thành công!</h3>
              <p className="text-sm text-gray-500 mt-2 px-2">
                Bạn và <span className="font-bold text-gray-800">{matchNotification.userName}</span> đều có mong muốn ở ghép cùng nhau.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMatchNotification(null);
                    navigate("/chat");
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md text-sm transition-colors"
                >
                  Nhắn tin trao đổi ngay
                </button>
                <button
                  onClick={() => setMatchNotification(null)}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-semibold py-2 rounded-xl text-sm transition-colors"
                >
                  Để sau
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}