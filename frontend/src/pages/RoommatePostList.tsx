import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roommatePostService } from "../services/roommates";
import { Eye, Trash2, Edit, MapPin, Home, DollarSign, Layers, Calendar, Loader, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

interface RoommatePost {
  id: number;
  userId: string;
  title: string;
  description?: string;
  area?: number;
  pricePerMonth: string;
  roomType: string;
  wardName?: string;
  districtName?: string;
  addressDetail?: string;
  status: string;
  viewCount: number;
  createdAt: string;
  latitude?: number;
  longitude?: number;
}

export default function RoommatePostList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<RoommatePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    loadPosts();
  }, [user, navigate]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await roommatePostService.getMyPosts();
      setPosts(res.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Lỗi hệ thống khi tải danh sách bài đăng");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn kích hoạt sự kiện click thẻ bọc ngoài
    if (!window.confirm("Bạn có chắc chắn muốn gỡ bỏ bài đăng tuyển ở ghép này không?")) return;

    try {
      await roommatePostService.deletePost(postId);
      setPosts(posts.filter((p) => p.id !== postId));
      toast.success("Bài đăng đã được xóa thành công!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Lỗi khi xóa bài đăng");
    }
  };

  const getRoomTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      PHONG_TRO: "Phòng trọ",
      CAN_HO_MINI: "Căn hộ mini",
      KTX: "Kí túc xá",
      NGUYEN_CAN: "Nhà nguyên căn",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; label: string }> = {
      PENDING: { bg: "bg-amber-50 text-amber-700 border-amber-100", label: "Chờ duyệt" },
      APPROVED: { bg: "bg-blue-50 text-blue-700 border-blue-100", label: "Tin sạch" },
      REJECTED: { bg: "bg-rose-50 text-rose-700 border-rose-100", label: "Từ chối" },
      RENTED: { bg: "bg-gray-100 text-gray-700 border-gray-200", label: "Đã ghép xong" },
    };

    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badge.bg}`}>
        {badge.label}
      </span>
    );
  };

  // Hàm ghép chuỗi địa chỉ đầy đủ từ addressDetail, wardName, districtName
  const getFullAddress = (post: RoommatePost) => {
    const parts = [
      post.addressDetail,
      post.wardName,
      post.districtName
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "Chưa cập nhật địa chỉ";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-3 text-blue-600" size={36} />
          <div className="text-sm font-semibold text-gray-500">Đang truy vấn danh sách phòng trọ...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Banner Header Navbar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0 shadow-sm z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">📋 Khám Phá Phòng Ở Ghép</h1>
            <p className="text-xs text-gray-400 mt-0.5">Tìm kiếm không gian sống chung minh bạch và an toàn</p>
          </div>
        </div>
      </div>

      {/* Main Split-view Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: FILTER + POSTS LIST (Scrollable) */}
        <div className="w-full md:w-[55%] lg:w-[60%] p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Empty State */}
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md mx-auto">
              <div className="text-5xl mb-3">📋</div>
              <h3 className="text-lg font-bold text-gray-800">Kho dữ liệu trống</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 mb-6">
                Chưa có tin bài đăng nào. Hãy là người đầu tiên chia sẻ phòng trọ của bạn!
              </p>
            </div>
          ) : (
            /* Posts Vertical List */
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/roommate-posts/${post.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5 cursor-pointer relative group flex flex-col sm:flex-row gap-4"
                >
                  {/* Pseudo Image Placeholder for Card */}
                  <div className="w-full sm:w-32 h-28 bg-gradient-to-br from-blue-500/20 to-sky-500/20 rounded-xl flex items-center justify-center text-blue-600 shrink-0 font-bold text-xs">
                    TroUyTin Pic
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate pr-14 mb-1.5">
                        {post.title}
                      </h3>

                      {/* Detail Metrics Grid Line */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 font-medium mb-2">
                        <span className="flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                          <DollarSign size={13} /> {parseFloat(post.pricePerMonth).toLocaleString("vi-VN")} ₫/tháng
                        </span>
                        {post.area && (
                          <span className="flex items-center gap-1"><Layers size={13} /> {post.area} m²</span>
                        )}
                        <span className="flex items-center gap-1"><Home size={13} /> {getRoomTypeLabel(post.roomType)}</span>
                      </div>

                      {/* 📍 ĐỊA CHỈ CHI TIẾT (MỤC 3) */}
                      <div className="flex items-start gap-1 text-xs text-gray-600 font-medium mb-2.5">
                        <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{getFullAddress(post)}</span>
                      </div>

                      {post.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                          {post.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata Footer Row & Xem chi tiết button (MỤC 3) */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-[11px] font-semibold text-gray-400">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(post.status)}
                        <span className="flex items-center gap-0.5"><Eye size={12} /> {post.viewCount} xem</span>
                        <span className="flex items-center gap-0.5"><Calendar size={12} /> {new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>

                      {/* Nút Xem Chi Tiết Phòng */}
                      <span className="flex items-center gap-1 text-blue-600 group-hover:translate-x-1 transition-transform font-bold">
                        Xem chi tiết <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>

                  {/* Absolute Corner Management Buttons */}
                  {user && user.id === post.userId && (
                    <div className="absolute top-4 right-4 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/roommate-posts/${post.id}/edit`);
                        }}
                        className="p-1.5 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg border border-gray-100 transition"
                        title="Sửa tin đăng"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(post.id, e)}
                        className="p-1.5 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg border border-gray-100 transition"
                        title="Xóa tin đăng"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: MAP PLATFORM MOCKUP INTERACTIVE VIEW
        <div className="hidden md:block md:w-[45%] lg:w-[40%] border-l border-gray-100 bg-gray-100 relative overflow-hidden">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-400 bg-blue-50/30">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md animate-bounce">
              <MapPin size={24} />
            </div>
            <h4 className="text-sm font-bold text-gray-800">Bản đồ tương tác TroUyTin</h4>
            <p className="text-xs text-gray-400 max-w-xs mt-1">
              Đang đồng bộ hóa tọa độ vệ tinh các tin đăng phòng ở ghép của bạn lên bản đồ. Bạn có thể nhấp vào các ghim để xem chi tiết phòng.
            </p>
            {posts.length > 0 && (
              <div className="mt-4 bg-white/90 backdrop-blur-sm border border-blue-100 px-3 py-1.5 rounded-xl text-[11px] font-bold text-blue-700 shadow-sm">
                📍 Đã ghim {posts.filter(p => p.latitude && p.longitude).length} vị trí phòng lên Maps
              </div>
            )}
          </div>
          
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div> */}

      </div>
    </div>
  );
}