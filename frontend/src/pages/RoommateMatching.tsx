import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roommateService } from "../services/roommates";
import { chatService } from "../services/chatService";
import { Heart, X, ThumbsUp, Loader, MessageSquare, Bookmark, Home, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

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
  // Bổ sung 2 trường để kiểm tra xem người này có bài đăng phòng không
  hasRoom?: boolean;
  roomId?: number | string;
  roomAddress?: string;
}

export default function RoommateMatching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<RoommateCandidate[]>([]);
  const [savedUserIds, setSavedUserIds] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    void Promise.all([loadCandidates(), loadSavedState()]);
  }, []);

  const loadSavedState = async () => {
    try {
      const [savedRes, savedCountRes] = await Promise.all([
        roommateService.getSavedRoommates(),
        roommateService.getSavedRoommatesCount(),
      ]);

      const savedIds = savedRes.data.map((item: any) => item.userId).filter(Boolean);
      setSavedUserIds(savedIds);
      setSavedCount(savedCountRes.data?.count ?? savedIds.length);
    } catch (error) {
      console.error("Error loading saved roommate state:", error);
    }
  };

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const res = await roommateService.getDiscover();
      setCandidates(res.data);
    } catch (error: any) {
      console.error("Error:", error);
      
      if (error.response?.status === 400) {
        toast.error("Bạn cần hoàn thiện hồ sơ thói quen sinh hoạt trước khi tìm bạn ở ghép!");
        navigate("/roommate-onboarding");
      } else {
        toast.error("Lỗi khi tải danh sách ứng viên");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReloadCandidates = async () => {
    try {
      setReloading(true);
      await roommateService.resetDiscover();
      await loadCandidates();
      toast.success("Đã tải lại toàn bộ danh sách ứng viên");
    } catch (error) {
      console.error("Error reloading candidates:", error);
      toast.error("Không thể tải lại danh sách ứng viên");
    } finally {
      setReloading(false);
      void loadSavedState();
    }
  };

  const handleAction = async (
    targetUserId: string,
    action: "PASS" | "SAVE" | "LIKE"
  ) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thực hiện chức năng này!");
      navigate("/login");
      return;
    }

    if (String(user.id) === String(targetUserId)) {
      toast.error("Bạn không thể tự kết nối với chính mình!");
      return;
    }

    try {
      setActionLoading(`${targetUserId}-${action}`);

      if (action === "SAVE") {
        const isAlreadySaved = savedUserIds.includes(targetUserId);
        if (isAlreadySaved) {
          await roommateService.removeSavedRoommate(targetUserId);
          toast.success("Đã bỏ lưu hồ sơ!");
        } else {
          await roommateService.saveRoommate(targetUserId);
          toast.success("Đã lưu hồ sơ ứng viên!");
        }
        void loadSavedState();
        return; 
      }

      if (action === "LIKE") {
        const conversationId = await chatService.getOrCreateConversation(
          String(user.id),
          String(targetUserId)
        );

        toast.success("Đang chuyển đến phòng trò chuyện...");

        navigate("/chat", {
          state: { 
            conversationId, 
            participantId: targetUserId 
          },
        });
        return; 
      }

      if (action === "PASS") {
        await roommateService.createMatch(targetUserId, "PASS");
        toast("Đã bỏ qua ứng viên", { icon: "👋" });
        setCandidates((prev) => prev.filter((c) => c.userId !== targetUserId));
      }

    } catch (error: any) {
      console.error("Lỗi khi xử lý thao tác:", error);
      if (error.response?.status === 409) {
        toast.error("Đã tương tác với người này rồi!");
        setCandidates((prev) => prev.filter((c) => c.userId !== targetUserId));
      } else {
        const message = error instanceof Error ? error.message : "Lỗi hệ thống, vui lòng thử lại sau";
        toast.error(message);
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
          <Loader className="animate-spin mx-auto mb-3 text-[var(--brand-600)]" size={40} />
          <div className="text-gray-600 font-medium">Đang tìm kiếm các ứng viên phù hợp...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER CỦA TRANG TÌM Ở GHÉP */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Khám phá bạn cùng phòng</h1>
            <p className="text-sm text-gray-500 mt-1">Hệ thống đã chọn lọc những người có độ tương thích cao nhất với bạn</p>
          </div>
          
          <button
            onClick={() => navigate('/saved-roommates')}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all font-semibold shadow-sm shrink-0 text-sm"
          >
            <Bookmark className="w-4 h-4 fill-amber-700" />
            Hồ sơ đã lưu ({savedCount})
          </button>
          <button
            onClick={handleReloadCandidates}
            disabled={loading || reloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all font-semibold shadow-sm shrink-0 text-sm disabled:opacity-60"
          >
            <RefreshCcw className={reloading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            Tải lại
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
              onClick={handleReloadCandidates}
              className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-colors text-sm"
            >
              Cập nhật lại danh sách
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => {
              const isSaved = savedUserIds.includes(candidate.userId);

              return (
                <div
                  key={candidate.userId}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition duration-200 overflow-hidden flex flex-col"
                >
                  {/* Visual Header Section */}
                  <div className="h-44 bg-gradient-to-br from-[var(--brand-800)] via-[var(--brand-600)] to-[#7c3aed] flex items-center justify-center relative shrink-0">
                    
                    {/* BỔ SUNG: Tag Đã có phòng */}
                    {candidate.hasRoom && (
                      <div className="absolute top-4 left-4 bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10 flex items-center gap-1 border border-blue-400">
                        <Home size={12} /> Đã có phòng
                      </div>
                    )}

                    {candidate.avatarUrl ? (
                      <img 
                        src={candidate.avatarUrl} 
                        alt={candidate.fullName} 
                        className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-4xl shadow-sm select-none">
                        👤
                      </div>
                    )}

                    {/* Compatibility Circular Badge */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-2 min-w-[56px] text-center shadow-md border border-blue-100">
                      <p className="text-lg font-black text-[var(--brand-600)] leading-none">
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
                        
                        {/* <button
                          onClick={() => handleAction(candidate.userId, "LIKE")}
                          disabled={!!actionLoading}
                          className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title={`Nhắn tin ngay với ${candidate.fullName || 'ứng viên'}`}
                        >
                          {actionLoading === `${candidate.userId}-LIKE` ? (
                             <Loader size={18} className="animate-spin text-blue-600" />
                          ) : (
                             <MessageSquare size={18} />
                          )}
                        </button> */}
                      </div>

                      <p className="text-xs font-semibold text-[var(--brand-600)] bg-blue-50 inline-block px-2 py-0.5 rounded-md mb-4">
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
                    
                      {candidate.hasRoom && candidate.roomAddress && (
                        <div className="flex items-start gap-2 text-sm text-blue-700 mb-4 bg-blue-50/80 border border-blue-100 rounded-xl p-2.5">
                          <span className="shrink-0">🏠</span>
                          <span className="line-clamp-2">Địa chỉ phòng: {candidate.roomAddress}</span>
                        </div>
                      )}

                    {/* BỔ SUNG: Nút Xem Phòng (Nằm trên Footer Actions) */}
                    {candidate.hasRoom && candidate.roomId && (
                      <button
                        onClick={() => navigate(`/roommate-posts/${candidate.roomId}`, { 
                          state: { compatibilityPct: candidate.compatibilityPct } // Truyền độ tương thích qua state
                        })}
                        className="w-full mt-3 mb-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 rounded-xl text-xs transition-colors border border-blue-200 flex items-center justify-center gap-1.5"
                      >
                        <Home size={14} /> Xem phòng của họ
                      </button>
                    )}

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
                        className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all font-semibold text-xs border ${
                          isSaved 
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 shadow-sm" 
                            : "bg-amber-50 hover:bg-amber-100/80 text-amber-700 border-amber-100"
                        } disabled:opacity-50`}
                      >
                        {actionLoading === `${candidate.userId}-SAVE` ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <>
                            <Heart size={14} className={isSaved ? "fill-rose-500 text-rose-500" : ""} />
                            {isSaved ? "Đã lưu" : "Lưu"}
                          </>
                        )}
                      </button>

                      {/* Like/Connect Action */}
                      <button
                        onClick={() => handleAction(candidate.userId, "LIKE")}
                        disabled={!!actionLoading}
                        className="flex-1 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-50 text-white py-2 rounded-xl flex items-center justify-center gap-1 transition-colors font-semibold text-xs shadow-sm shadow-blue-100"
                      >
                        {actionLoading === `${candidate.userId}-LIKE` ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <>
                            <ThumbsUp size={14} />
                            Chat ngay
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}