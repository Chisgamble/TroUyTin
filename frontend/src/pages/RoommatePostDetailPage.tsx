import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Heart, MapPin, CheckCircle, ShieldAlert, Loader } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { chatService } from "../services/chatService";
import { roommatePostService } from "../services/roommates";
import { formatPriceVND } from "../utils/formatters";
import { getIcon } from "../utils/iconMap";
import "./ListingDetailPage.css"; 
import "../components/ui/Button.css";
import toast from "react-hot-toast";

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

// Interface map theo dữ liệu hiển thị
interface RoommatePostDetail {
  id: number;
  title: string;
  description: string;
  area: number;
  pricePerMonth: number;
  roomType: string;
  addressDetail: string;
  availableFrom: string;
  rules: string;
  images: string[];
  wardName: string;
  districtName: string;
  amenities: { id: number; name: string; icon: string }[];
  author: {
    id: string;
    fullName: string;
    avatarUrl: string;
    phone?: string;
    gender?: string;
    age?: number;
  };
}

export default function RoommatePostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // BẮT STATE TỪ TRANG MATCHING TRUYỀN SANG (Độ tương thích)
  const compatibilityPct = location.state?.compatibilityPct;

  const [post, setPost] = useState<RoommatePostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function loadPost() {
      if (!id) {
        setError("ID bài đăng không hợp lệ");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Sử dụng hàm getPostDetail có sẵn trong service
        const res = await roommatePostService.getPostDetail(Number(id));
        const rawData = res.data;

        // Map dữ liệu từ Backend trả về (cover cả snake_case và camelCase)
        const mappedPost: RoommatePostDetail = {
          id: rawData.id,
          title: rawData.title,
          description: rawData.description || "",
          area: Number(rawData.area) || 0,
          pricePerMonth: Number(rawData.price_per_month || rawData.pricePerMonth),
          roomType: rawData.room_type || rawData.roomType,
          addressDetail: rawData.address_detail || rawData.addressDetail || "",
          availableFrom: rawData.available_from || rawData.availableFrom || "",
          rules: rawData.rules || "",
          
          images: Array.isArray(rawData.images) 
            ? rawData.images
                .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                .map((img: any) => img.image_url || img)
            : [],
            
          wardName: rawData.ward?.name || rawData.wardName || "",
          districtName: rawData.ward?.district?.name || rawData.districtName || "",
          
          amenities: rawData.amenities || [], 
          
          author: {
            id: rawData.author?.id || rawData.user_id,
            fullName: rawData.author?.full_name || rawData.author?.fullName || "Chủ phòng ẩn danh",
            avatarUrl: rawData.author?.avatar_url || rawData.author?.avatarUrl || "",
            phone: rawData.author?.phone,
            gender: rawData.author?.gender,
            age: rawData.author?.age,
          }
        };

        setPost(mappedPost);
        // Nếu backend có trả về trường isSaved, bạn set ở đây
        // setIsSaved(rawData.isSaved);
        
      } catch (err: any) {
        console.error("Lỗi lấy chi tiết bài đăng:", err);
        setError(err.response?.data?.message || "Không tìm thấy thông tin bài đăng");
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [id]);

  const handleChatClick = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để chat với chủ phòng");
      navigate("/login");
      return;
    }

    if (!post?.author) return;

    if (String(user.id) === String(post.author.id)) {
      toast.error("Bạn không thể tự chat với chính mình");
      return;
    }

    try {
      setChatLoading(true);
      const conversationId = await chatService.getOrCreateConversation(
        String(user.id),
        String(post.author.id)
      );
      toast.success("Đang chuyển đến phòng trò chuyện...");
      navigate("/chat", {
        state: { conversationId, participantId: post.author.id },
      });
    } catch (error: any) {
      console.error("Lỗi khi mở chat:", error);
      toast.error("Không thể bắt đầu cuộc trò chuyện.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    // TODO: Gắn API lưu bài đăng ở đây nếu có (ví dụ roommatePostService.savePost)
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Đã bỏ lưu bài đăng" : "Đã lưu bài đăng");
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

  if (loading) {
    return (
      <div className="legacy-page-wrapper flex items-center justify-center min-h-screen bg-gray-50">
         <div className="text-emerald-600 font-bold flex flex-col items-center">
            <Loader className="animate-spin mb-3 text-emerald-600" size={40} />
            Đang tải dữ liệu phòng...
         </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="legacy-page-wrapper flex items-center justify-center min-h-screen bg-gray-50">
        <div className="not-found-page text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{error || "Không tìm thấy phòng"}</h2>
          <button onClick={() => navigate(-1)} className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-none px-8 py-3 rounded-xl font-bold">Quay lại</button>
        </div>
      </div>
    );
  }

  const displayedActiveImage = Math.min(activeImage, Math.max(post.images.length - 1, 0));

  return (
    <>
      <div className="legacy-page-wrapper bg-gray-50 pb-16">
        <div className="detail-page">
          <div className="detail-layout">
            <div className="detail-main">
              
              {/* VÙNG ẢNH GALLERY */}
              <div className="detail-gallery rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="detail-gallery-main h-[400px] md:h-[500px] bg-black">
                  {post.images.length > 0 ? (
                    <img 
                      src={post.images[displayedActiveImage]} 
                      alt={post.title} 
                      className="w-full h-full object-contain bg-black" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-lg">
                      Phòng này chưa cập nhật hình ảnh
                    </div>
                  )}
                </div>

                {post.images.length > 0 && (
                  <div className="detail-thumbs-overlay bg-black/60 backdrop-blur-sm p-4">
                    <div className="detail-gallery-thumbs flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {post.images.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                            displayedActiveImage === i ? "border-emerald-500 opacity-100" : "border-transparent opacity-50 hover:opacity-100"
                          }`}
                          onClick={() => setActiveImage(i)}
                        >
                          <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* THÔNG TIN HEADER */}
              <div className="mt-8 mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">{post.title}</h1>
                <div className="flex items-start gap-2 text-gray-600 font-medium">
                  <MapPin size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    {[post.addressDetail, post.wardName, post.districtName, "TP.HCM"].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>

              {/* MÔ TẢ CHI TIẾT */}
              <div className="detail-description bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-100 pb-3">Mô tả chi tiết phòng</h3>
                <p className="whitespace-pre-line text-gray-700 leading-relaxed">{post.description || "Chưa có mô tả chi tiết."}</p>
              </div>

              {/* NỘI QUY (Lấy từ bảng roommate_posts) */}
              {post.rules && (
                <div className="bg-amber-50 p-6 sm:p-8 rounded-2xl shadow-sm border border-amber-100 mb-6">
                  <h3 className="text-lg font-bold mb-3 text-amber-900 flex items-center gap-2 border-b border-amber-200/50 pb-3">
                    <ShieldAlert size={22} className="text-amber-500"/> Nội quy phòng ở ghép
                  </h3>
                  <p className="whitespace-pre-line text-amber-800 leading-relaxed text-sm">{post.rules}</p>
                </div>
              )}

              {/* TIỆN ÍCH */}
              {post.amenities && post.amenities.length > 0 && (
                <div className="detail-amenities-card bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-3">Tiện ích phòng</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {post.amenities.map((amenity) => {
                      const Icon = getIcon(amenity.icon);
                      return (
                        <div key={amenity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <span className="text-emerald-600 bg-emerald-100 p-2 rounded-lg">
                            <Icon size={18} />
                          </span>
                          <span className="text-sm font-semibold text-gray-700">{amenity.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR BÊN PHẢI (STICKY) */}
            <div className="detail-sidebar sticky top-24">
              
              {/* CARD GIÁ VÀ LIÊN HỆ */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-emerald-600 font-black text-3xl mb-1">
                  {formatPriceVND(post.pricePerMonth)}
                </div>
                <div className="text-gray-500 text-sm font-medium mb-6">/tháng/người</div>

                <div className="flex flex-col gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Diện tích phòng</div>
                      <div className="text-sm font-bold text-gray-900">{post.area ? `${post.area} m²` : "Chưa cập nhật"}</div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 w-full"></div>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Loại phòng</div>
                      <div className="text-sm font-bold text-gray-900">{getRoomTypeLabel(post.roomType)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm shadow-emerald-100 transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      if (post.author?.phone) setShowPhoneModal(true);
                      else toast.error("Chủ phòng chưa cập nhật số điện thoại!");
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Gọi điện thoại
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 flex items-center justify-center gap-2 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                      onClick={handleChatClick}
                      disabled={chatLoading}
                    >
                      {chatLoading ? <Loader size={18} className="animate-spin" /> : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      )}
                      {chatLoading ? "Đang mở..." : "Chat ngay"}
                    </button>
                    <button
                      className="w-14 flex items-center justify-center border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors bg-white"
                      onClick={handleToggleSave}
                      title={isSaved ? "Bỏ lưu bài đăng" : "Lưu bài đăng"}
                    >
                      <Heart className={isSaved ? "text-rose-500 fill-rose-500" : "text-gray-400"} size={22} />
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD THÔNG TIN NGƯỜI ĐĂNG + ĐỘ TƯƠNG THÍCH */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6 relative overflow-hidden">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">THÔNG TIN NGƯỜI ĐĂNG</h3>
                
                <Link to={`/user/${post.author.id}`} className="flex items-center gap-4 hover:bg-gray-50 p-2 -m-2 rounded-xl transition-colors">
                  <img
                    src={post.author.avatarUrl || DEFAULT_AVATAR}
                    alt={post.author.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col items-start gap-1.5 mb-1.5">
                      <span className="font-bold text-gray-900 text-lg truncate w-full">{post.author.fullName}</span>
                      
                      {/* BỔ SUNG: TAG ĐỘ TƯƠNG THÍCH (Bắt từ state của route) */}
                      {compatibilityPct && (
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1 shrink-0">
                          🔥 Hợp gu {compatibilityPct}%
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm font-medium text-gray-500">
                      {post.author.gender === 'MALE' ? 'Nam' : post.author.gender === 'FEMALE' ? 'Nữ' : 'Chưa cập nhật giới tính'} 
                      {post.author.age ? ` • ${post.author.age} tuổi` : ''}
                    </div>
                  </div>
                </Link>
                
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* MODAL SỐ ĐIỆN THOẠI */}
      {showPhoneModal && post.author?.phone && (
        <div className="phone-modal-overlay" onClick={() => setShowPhoneModal(false)}>
          <div className="phone-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="phone-modal-header">
              <h3>Thông tin liên hệ</h3>
              <button className="phone-modal-close" onClick={() => setShowPhoneModal(false)}>&times;</button>
            </div>
            <div className="phone-modal-body flex flex-col items-center pt-2">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-gray-50 shadow-sm">
                <img src={post.author.avatarUrl || DEFAULT_AVATAR} alt={post.author.fullName} className="w-full h-full object-cover" />
              </div>
              <div className="text-lg font-bold text-gray-900 mb-1">{post.author.fullName}</div>
              <div className="text-3xl font-black text-emerald-600 mb-6 tracking-wide">{post.author.phone}</div>
              <a href={`tel:${post.author.phone}`} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-center transition-colors shadow-sm">
                Gọi ngay
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}