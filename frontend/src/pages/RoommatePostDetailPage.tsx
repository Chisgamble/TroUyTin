import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Heart, MapPin, CheckCircle, ShieldAlert, Loader, Flag, Phone } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { chatService } from "../services/chatService";
import { roommatePostService } from "../services/roommates";
import { getAmenities, type Amenity } from "../services/roomListing";
import { formatPriceVND } from "../utils/formatters";
import { getIcon } from "../utils/iconMap";
import { api } from "../lib/axios";
import StarRating from "../components/StarRating";
import ReviewCard from "../components/ReviewCard";
import ReportModal from "../components/ReportModal";
import type { Review } from "../types";
import "./ListingDetailPage.css"; 
import "../components/ui/Button.css";
import toast from "react-hot-toast";

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
const DEFAULT_ROOM_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 400'%3E%3Crect width='640' height='400' fill='%23f8fafc'/%3E%3Cpath d='M120 280h400v24H120z' fill='%23cbd5e1'/%3E%3Cpath d='M140 160h170v120H140zM340 120h160v160H340z' fill='%23dbeafe'/%3E%3Ccircle cx='215' cy='215' r='26' fill='%2393c5fd'/%3E%3Cpath d='M390 250l48-54 58 54z' fill='%2360a5fa'/%3E%3C/svg%3E";

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
  status: string;
  viewCount: number;
  createdAt: string;
  amenities: Amenity[];
  author: {
    id: string;
    fullName: string;
    avatarUrl: string;
    phone?: string;
    gender?: string;
    age?: number;
    isVerified?: boolean;
    createdAt?: string;
  };
}

function normalizeReview(review: Review): Review {
  return {
    ...review,
    comment: review.comment ?? "",
    reviewer: review.reviewer ?? undefined,
  };
}

async function fetchAuthorReviews(authorId: string) {
  const { data } = await api.get<Review[]>(`/api/reviews/reviewee/${authorId}`);
  return data.map(normalizeReview);
}

function getFullYearsSince(dateValue?: string | null) {
  if (!dateValue) return null;

  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp) || timestamp > Date.now()) return null;

  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - timestamp) / MS_PER_YEAR);
}

function formatYearsActive(years: number | null) {
  if (years === null) return "—";
  if (years === 0) return "Dưới 1 năm";
  return `${years} năm`;
}

function formatAverageRating(rating: number | null) {
  return rating === null ? "—" : rating.toFixed(1);
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Chờ duyệt",
    APPROVED: "Tin sạch",
    REJECTED: "Từ chối",
    RENTED: "Đã ghép xong",
  };

  return labels[status] || status;
}

function getStatusBadgeClass(status: string) {
  const badges: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    APPROVED: "bg-blue-50 text-blue-700 border-blue-100",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-100",
    RENTED: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return badges[status] || "bg-gray-100 text-gray-700 border-gray-200";
}

// Backend (Drizzle) trả về imageUrl/displayOrder dạng camelCase, nhưng một số nơi
// vẫn dùng snake_case. Hàm này chuẩn hoá cả hai và chỉ giữ lại link ảnh hợp lệ.
function normalizePostImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (typeof item === "string") {
        return { url: item.trim(), order: index };
      }

      if (typeof item === "object" && item !== null) {
        const image = item as {
          url?: unknown;
          imageUrl?: unknown;
          image_url?: unknown;
          displayOrder?: unknown;
          display_order?: unknown;
        };
        const rawUrl = image.imageUrl ?? image.image_url ?? image.url;
        const rawOrder = image.displayOrder ?? image.display_order;
        const order = Number(rawOrder);

        return {
          url: typeof rawUrl === "string" ? rawUrl.trim() : "",
          order: Number.isFinite(order) ? order : index,
        };
      }

      return { url: "", order: index };
    })
    .filter((image) => image.url.length > 0)
    .sort((a, b) => a.order - b.order)
    .map((image) => image.url);
}

function normalizePostAmenities(value: unknown, catalog: Amenity[]): Amenity[] {
  let parsedValue = value;

  if (typeof parsedValue === "string") {
    try {
      parsedValue = JSON.parse(parsedValue);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsedValue)) return [];

  return parsedValue
    .map((item): Amenity | null => {
      if (typeof item === "object" && item !== null && "id" in item) {
        const rawAmenity = item as { id: unknown; name?: unknown; icon?: unknown };
        const id = Number(rawAmenity.id);
        if (!Number.isFinite(id)) return null;

        if (typeof rawAmenity.name === "string" && rawAmenity.name.trim()) {
          return {
            id,
            name: rawAmenity.name,
            icon: typeof rawAmenity.icon === "string" ? rawAmenity.icon : null,
          };
        }

        return catalog.find((amenity) => amenity.id === id) ?? null;
      }

      const id = Number(item);
      if (!Number.isFinite(id)) return null;
      return catalog.find((amenity) => amenity.id === id) ?? null;
    })
    .filter((amenity): amenity is Amenity => amenity !== null);
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
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

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
        const [res, amenitiesCatalog] = await Promise.all([
          roommatePostService.getPostDetail(Number(id)),
          getAmenities().catch((amenitiesError) => {
            console.error("Lỗi lấy danh mục tiện ích:", amenitiesError);
            return [] as Amenity[];
          }),
        ]);
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
          status: rawData.status || "APPROVED",
          viewCount: Number(rawData.viewCount || rawData.view_count || 0),
          createdAt: rawData.createdAt || rawData.created_at || "",
          
          images: normalizePostImages(
            rawData.images ?? rawData.roommatePostImages ?? rawData.roommate_post_images,
          ),
            
          wardName: rawData.ward?.name || rawData.wardName || "",
          districtName: rawData.ward?.district?.name || rawData.districtName || "",
          
          amenities: normalizePostAmenities(rawData.amenities, amenitiesCatalog),
          
          author: {
            id: String(rawData.userId || rawData.user_id || rawData.author?.id || ""),
            fullName:
              rawData.userName ||
              rawData.author?.full_name ||
              rawData.author?.fullName ||
              "Chủ phòng ẩn danh",
            avatarUrl:
              rawData.userAvatar ||
              rawData.author?.avatar_url ||
              rawData.author?.avatarUrl ||
              "",
            phone: rawData.userPhone || rawData.author?.phone,
            gender: rawData.author?.gender,
            age: rawData.author?.age,
            isVerified: rawData.author?.is_verified ?? rawData.author?.isVerified,
            createdAt: rawData.author?.created_at || rawData.author?.createdAt,
          }
        };

        // if (mappedPost.images.length === 0) {
        //   mappedPost.images = ["https://images.unsplash.com/photo-1486304873000-235643847519?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"];
        // }

        setPost(mappedPost);
        if (user) {
          const savedRoommatePostsKey = `tro-uy-tin:saved-roommate-posts:${user.id}`;
          const savedPosts = JSON.parse(localStorage.getItem(savedRoommatePostsKey) || "[]") as number[];
          setIsSaved(savedPosts.includes(mappedPost.id));
        }
        
      } catch (err: any) {
        console.error("Lỗi lấy chi tiết bài đăng:", err);
        setError(err.response?.data?.message || "Không tìm thấy thông tin bài đăng");
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [id]);

  useEffect(() => {
    const authorId = post?.author.id;
    if (typeof authorId !== "string" || !authorId.trim()) return;

    let ignore = false;

    async function loadReviews(currentAuthorId: string) {
      try {
        setReviewsLoading(true);
        const authorReviews = await fetchAuthorReviews(currentAuthorId);
        if (!ignore) {
          setReviews(authorReviews);
        }
      } catch (error) {
        console.error("Lỗi lấy đánh giá người đăng:", error);
      } finally {
        if (!ignore) {
          setReviewsLoading(false);
        }
      }
    }

    loadReviews(authorId);

    return () => {
      ignore = true;
    };
  }, [post?.author.id]);

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

    if (!post) return;

    try {
      setSaving(true);
      const savedRoommatePostsKey = `tro-uy-tin:saved-roommate-posts:${user.id}`;
      const currentSavedPosts = JSON.parse(localStorage.getItem(savedRoommatePostsKey) || "[]") as number[];

      if (isSaved) {
        const nextSavedPosts = currentSavedPosts.filter((savedPostId) => savedPostId !== post.id);
        localStorage.setItem(savedRoommatePostsKey, JSON.stringify(nextSavedPosts));
        setIsSaved(false);
        toast.success("Đã bỏ lưu bài đăng");
      } else {
        const nextSavedPosts = Array.from(new Set([...currentSavedPosts, post.id]));
        localStorage.setItem(savedRoommatePostsKey, JSON.stringify(nextSavedPosts));
        setIsSaved(true);
        toast.success("Đã lưu bài đăng");
      }
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="legacy-page-wrapper flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-blue-600 font-bold flex flex-col items-center">
          <Loader className="animate-spin mb-3 text-blue-600" size={40} />
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
          <button onClick={() => navigate(-1)} className="btn-primary bg-blue-600 hover:bg-blue-700 border-none px-8 py-3 rounded-xl font-bold">Quay lại</button>
        </div>
      </div>
    );
  }

  const galleryImages = post.images.length > 0 ? post.images : [DEFAULT_ROOM_IMAGE];
  const displayedActiveImage = Math.min(activeImage, Math.max(galleryImages.length - 1, 0));
  const authorReviewsCount = reviews.length;
  const authorAvgRating = authorReviewsCount
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / authorReviewsCount
    : null;
  const authorYearsActive = getFullYearsSince(post.author.createdAt);
  const responseRate = 98;

  return (
    <>
      <div className="legacy-page-wrapper bg-gray-50 pb-16">
        <div className="detail-page">
          <div className="detail-layout">
            <div className="detail-main">
              <div className="detail-gallery rounded-3xl overflow-hidden shadow-lg border border-slate-100 bg-white">
                <div className="detail-gallery-main h-[380px] md:h-[540px] bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 sm:p-5 relative">
                  <div className="w-full h-full rounded-[24px] overflow-hidden bg-white shadow-inner">
                    <img
                      src={galleryImages[displayedActiveImage]}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {post.author.isVerified && (
                    <span className="absolute top-5 left-5 inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white text-xs font-black px-3 py-1.5 shadow-sm">
                      <CheckCircle size={14} />
                      Đã xác minh
                    </span>
                  )}

                  <span className={`absolute top-5 right-5 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusBadgeClass(post.status)}`}>
                    {getStatusLabel(post.status)}
                  </span>
                </div>

                <div className="bg-white px-5 sm:px-6 py-4 sm:py-5 border-t border-slate-100">
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                      {galleryImages.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                            displayedActiveImage === i
                              ? "border-blue-500 shadow-md opacity-100"
                              : "border-slate-200 opacity-70 hover:opacity-100"
                          }`}
                          onClick={() => setActiveImage(i)}
                        >
                          <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-2">
                        {post.title}
                      </h1>
                      <div className="flex items-start gap-2 text-gray-600 font-medium text-sm">
                        <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                        <span>
                          {[post.addressDetail, post.wardName, post.districtName].filter(Boolean).join(", ")}
                        </span>
                        {/* <a href="#detail-sidebar" className="detail-map-link shrink-0">Xem liên hệ</a> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-description bg-white rounded-2xl shadow-sm border border-gray-100">
                <p className="whitespace-pre-line">{post.description || "Chưa có mô tả chi tiết."}</p>
              </div>

              <div className="detail-reviews">
                <div className="detail-reviews-header">
                  <h2>Đánh giá từ người dùng trước</h2>
                  <div className="detail-reviews-summary">
                    {reviewsLoading ? (
                      <span className="detail-reviews-count">Đang tải đánh giá...</span>
                    ) : reviews.length > 0 ? (
                      <StarRating
                        rating={authorAvgRating ?? 0}
                        size="md"
                        showValue
                        count={authorReviewsCount}
                      />
                    ) : (
                      <span className="detail-reviews-count">Chưa có đánh giá</span>
                    )}
                  </div>
                </div>

                {reviews.length > 0 ? (
                  <div className="detail-reviews-grid">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <div className="detail-reviews-empty">Người đăng này chưa có đánh giá từ cộng đồng.</div>
                )}
              </div>

              {post.rules && (
                <div className="bg-amber-50 p-6 sm:p-8 rounded-2xl shadow-sm border border-amber-100 mb-6">
                  <h3 className="text-lg font-bold mb-3 text-amber-900 flex items-center gap-2 border-b border-amber-200/50 pb-3">
                    <ShieldAlert size={22} className="text-amber-500" /> Nội quy phòng ở ghép
                  </h3>
                  <p className="whitespace-pre-line text-amber-800 leading-relaxed text-sm">{post.rules}</p>
                </div>
              )}

              {post.amenities && post.amenities.length > 0 && (
                <div className="detail-amenities-card bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-3">Tiện ích</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {post.amenities.map((amenity) => {
                      const Icon = getIcon(amenity.icon);

                      return (
                        <div key={amenity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <span className="text-blue-600 bg-blue-100 p-2 rounded-lg">
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

            <div className="detail-sidebar sticky top-24" id="detail-sidebar">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-blue-600 font-black text-3xl mb-1">
                  {formatPriceVND(post.pricePerMonth)}
                </div>
                <div className="text-gray-500 text-sm font-medium mb-6">/tháng</div>

                <div className="flex flex-col gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-blue-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Diện tích</div>
                      <div className="text-sm font-bold text-gray-900">{post.area ? `${post.area} m²` : "Chưa cập nhật"}</div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 w-full"></div>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-blue-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Loại phòng</div>
                      <div className="text-sm font-bold text-gray-900">{getRoomTypeLabel(post.roomType)}</div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 w-full"></div>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-blue-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Có thể vào ở</div>
                      <div className="text-sm font-bold text-gray-900">{post.availableFrom ? new Date(post.availableFrom).toLocaleDateString("vi-VN") : "Chưa cập nhật"}</div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 w-full"></div>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-blue-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Ngày đăng</div>
                      <div className="text-sm font-bold text-gray-900">{post.createdAt ? new Date(post.createdAt).toLocaleDateString("vi-VN") : "Chưa cập nhật"}</div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 w-full"></div>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-blue-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Lượt xem</div>
                      <div className="text-sm font-bold text-gray-900">{post.viewCount} lượt</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl shadow-sm transition-all border-0 hover:opacity-90"
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    onClick={(e) => {
                      e.preventDefault();
                      if (post.author?.phone) {
                        setShowPhoneModal(true);
                      } else {
                        alert("Chủ nhà chưa cập nhật số điện thoại!");
                      }
                    }}
                  >
                    <div 
                      className="p-2 rounded-lg flex items-center justify-center" 
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    >
                      <Phone size={20} color="#ffffff" strokeWidth={2.5} />
                    </div>
                    
                    <div className="flex flex-col items-start leading-tight">
                      <span className="font-bold text-base" style={{ color: '#ffffff' }}>
                        Gọi điện thoại
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: '#dbeafe' }}>
                        {post.author?.phone ? "Bấm để xem số liên lạc" : "Chủ nhà chưa cung cấp số"}
                      </span>
                    </div>
                  </button>
                  {/* NÚT CHAT VÀ NÚT LƯU BÀI VIẾT */}
                    <div className="flex gap-2 mt-3 mb-4">
                      <button
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all hover:bg-blue-50 disabled:opacity-50"
                        style={{ 
                          border: '2px solid #2563eb', /* Viền màu xanh blue-600 */
                          color: '#2563eb', 
                          backgroundColor: '#ffffff' 
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          handleChatClick();
                        }}
                        disabled={chatLoading}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {chatLoading ? "Đang mở..." : "Chat ngay"}
                      </button>

                      <button
                        className="w-14 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
                        style={{ 
                          border: '2px solid #e5e7eb', /* Viền xám gray-200 */
                          backgroundColor: '#ffffff' 
                        }}
                        onClick={handleToggleSave}
                        disabled={saving}
                        title={isSaved ? "Bỏ lưu bài đăng" : "Lưu bài đăng"}
                      >
                        <Heart className={isSaved ? "text-rose-500 fill-rose-500" : "text-gray-400"} size={22} />
                      </button>
                    </div>

                    {/* NÚT BÁO CÁO / KHIẾU NẠI */}
                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all hover:opacity-80"
                      style={{
                        border: '2px solid #fecdd3', /* Viền đỏ nhạt rose-200 */
                        backgroundColor: '#fff1f2',  /* Nền hồng nhạt rose-50 */
                        color: '#be123c'             /* Chữ đỏ đậm rose-700 */
                      }}
                      onClick={() => setShowReportModal(true)}
                    >
                      <Flag size={18} />
                      Báo cáo / Khiếu nại tin đăng
                    </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6 relative overflow-hidden">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">THÔNG TIN NGƯỜI ĐĂNG</h3>

                <Link to={`/user/${post.author.id}`} className="flex items-center gap-4 hover:bg-gray-50 p-2 -m-2 rounded-xl transition-colors">
                  <img
                    src={post.author.avatarUrl || DEFAULT_AVATAR}
                    alt={post.author.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-100 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col items-start gap-1.5 mb-1.5">
                      <span className="font-bold text-gray-900 text-lg truncate w-full">{post.author.fullName}</span>
                      {compatibilityPct && (
                        <span className="bg-gradient-to-r from-blue-500 to-sky-500 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1 shrink-0">
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

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-blue-50 px-3 py-3">
                    <div className="text-blue-600 font-black text-lg">{responseRate}%</div>
                    <div className="text-[11px] text-blue-700 font-semibold">Phản hồi</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-3">
                    <div className="text-slate-900 font-black text-lg">{authorReviewsCount}</div>
                    <div className="text-[11px] text-slate-600 font-semibold">Đánh giá</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-3 py-3">
                    <div className="text-emerald-700 font-black text-lg">{formatYearsActive(authorYearsActive)}</div>
                    <div className="text-[11px] text-emerald-700 font-semibold">Hoạt động</div>
                  </div>
                </div>

                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>
              </div>

              <div className="detail-landlord-reviews-card">
                <h3 className="detail-amenities-title">Đánh giá người đăng</h3>
                <div className="detail-landlord-reviews-content">
                  <div className="detail-landlord-avg-box">
                    <div className="detail-landlord-avg-score">
                      {formatAverageRating(authorAvgRating)}
                    </div>
                    <StarRating rating={authorAvgRating ?? 0} size="sm" showValue={false} />
                    <div className="detail-landlord-avg-count">{authorReviewsCount} đánh giá</div>
                  </div>

                  <div className="detail-landlord-star-bars" style={{ marginTop: "8px", width: "100%" }}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((review) => review.rating === star).length;
                      const pct = authorReviewsCount ? (count / authorReviewsCount) * 100 : 0;

                      return (
                        <div
                          key={star}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12px",
                            color: "var(--gray-600)",
                            marginBottom: "4px",
                          }}
                        >
                          <span style={{ width: "36px" }}>{star} sao</span>
                          <div
                            style={{
                              flex: 1,
                              height: "8px",
                              borderRadius: "4px",
                              overflow: "hidden",
                              background: "#e2e8f0",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: "#fbbf24",
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                          <span style={{ width: "20px", textAlign: "right" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  {reviews.filter((review) => review.rating >= 4 && review.comment).length > 0 && (
                    <div
                      className="detail-landlord-featured-comments"
                      style={{
                        marginTop: "12px",
                        borderTop: "1px solid var(--gray-100)",
                        paddingTop: "12px",
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--gray-800)", marginBottom: "8px" }}>
                        Nhận xét tiêu biểu:
                      </div>
                      {reviews
                        .filter((review) => review.rating >= 4 && review.comment)
                        .slice(0, 2)
                        .map((review) => (
                          <div
                            key={review.id}
                            style={{
                              fontSize: "12px",
                              color: "var(--gray-600)",
                              marginBottom: "8px",
                              background: "#f8fafc",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              border: "1px solid var(--gray-100)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontWeight: "600", color: "var(--gray-700)" }}>
                                {review.reviewer?.full_name || "Người dùng ẩn danh"}
                              </span>
                              <span style={{ color: "#fbbf24" }}>{"★".repeat(review.rating)}</span>
                            </div>
                            <p style={{ fontStyle: "italic", margin: 0 }}>"{review.comment}"</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
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
              <div className="text-3xl font-black text-blue-600 mb-6 tracking-wide">{post.author.phone}</div>
              <a href={`tel:${post.author.phone}`} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-center transition-colors shadow-sm">
                Gọi ngay
              </a>
            </div>
          </div>
        </div>
      )}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={post.id}
        postTitle={post.title}
      />
    </>
  );
}
