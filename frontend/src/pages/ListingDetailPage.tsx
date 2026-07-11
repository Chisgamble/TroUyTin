import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { chatService } from "../services/chatService";
import StarRating from "../components/StarRating";
import ReviewCard from "../components/ReviewCard";
import { ReviewModal } from "../components/ReviewModal";
import { api } from "../lib/axios";
import { supabase } from "../services/supabase";
import {
  isListingSaved,
  saveListing,
  unsaveListing,
} from "../services/roomListing";
import type { Amenity, Profile, Review, RoomListing } from "../types";
import { formatPriceVND } from "../utils/formatters";
import "./ListingDetailPage.css";
import "../components/ui/Button.css";
import { getIcon } from "../utils/iconMap";

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

interface ListingDetailDbRow {
  id: number;
  landlord_id: string;
  title: string;
  description: string | null;
  price: number | string;
  deposit: number | string | null;
  area: number;
  room_type: string;
  ward_id: number | null;
  address_detail: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  is_verified: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  listing_images: { image_url: string; display_order: number }[] | null;
  landlord_info: (Profile & { phone?: string | null }) | null;
  listing_amenities: { amenities: Amenity }[] | null;
  wards: {
    name: string;
    districts: { name: string } | null;
  } | null;
}

type LandlordReview = Review & {
  reviewer_name?: string;
};

function normalizeReview(review: Review): Review {
  return {
    ...review,
    comment: review.comment ?? "",
    reviewer: review.reviewer ?? undefined,
  };
}

function normalizeLandlordReview(review: Review): LandlordReview {
  const normalized = normalizeReview(review);

  return {
    ...normalized,
    reviewer_name: normalized.reviewer?.full_name,
  };
}

async function fetchListingReviews(listingId: number) {
  const { data } = await api.get<Review[]>(`/api/reviews/listing/${listingId}`);
  return data.map(normalizeReview);
}

async function fetchLandlordReviews(landlordId: string) {
  const { data } = await api.get<Review[]>(
    `/api/reviews/reviewee/${landlordId}`,
  );
  return data.map(normalizeLandlordReview);
}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function getFullYearsSince(dateValue?: string | null) {
  if (!dateValue) return null;

  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp) || timestamp > Date.now()) return null;

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

function mapListingRow(row: ListingDetailDbRow): RoomListing {
  const images =
    row.listing_images
      ?.slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((image) => image.image_url) ?? [];

  return {
    id: row.id,
    landlord_id: row.landlord_id,
    title: row.title,
    description: row.description ?? "",
    price: typeof row.price === "string" ? Number(row.price) : row.price,
    deposit:
      row.deposit == null
        ? 0
        : typeof row.deposit === "string"
          ? Number(row.deposit)
          : row.deposit,
    area: row.area,
    room_type: row.room_type as RoomListing["room_type"],
    ward_id: row.ward_id ?? 0,
    address_detail: row.address_detail ?? "",
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    status:
      row.status === "AVAILABLE"
        ? "AVAILABLE"
        : (row.status as RoomListing["status"]),
    is_verified: row.is_verified,
    view_count: row.view_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
    images:
      images.length > 0
        ? images
        : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
    amenity_ids: row.listing_amenities?.map((item) => item.amenities.id) ?? [],
    district_name: row.wards?.districts?.name ?? "",
    ward_name: row.wards?.name ?? "",
    landlord: row.landlord_info ?? undefined,
    amenities: row.listing_amenities?.map((item) => item.amenities) ?? [],
  };
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<RoomListing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [landlordReviews, setLandlordReviews] = useState<LandlordReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const currentListingId = listing?.id;
  const currentLandlordId = listing?.landlord_id;

  useEffect(() => {
    async function loadListing() {
      if (!id) {
        setError("ID phòng không hợp lệ");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("room_listings")
        .select(
          `*, listing_images(image_url, display_order), wards(name, districts(name)), landlord_info:profiles(*), listing_amenities(amenities(id, name, icon))`,
        )
        .eq("id", Number(id))
        .single();

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Không tìm thấy phòng");
        setLoading(false);
        return;
      }

      setActiveImage(0);
      setListing(mapListingRow(data as ListingDetailDbRow));
      setLoading(false);
    }

    loadListing();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const currentUserId = user.id;
    const listingId = Number(id);

    async function loadSaved() {
      try {
        const saved = await isListingSaved(currentUserId, listingId);
        setIsSaved(saved);
      } catch (err) {
        console.error(err);
      }
    }

    loadSaved();
  }, [user, id]);

  useEffect(() => {
    if (!currentListingId) return;
    const listingId = currentListingId;
    let ignore = false;

    async function loadReviews() {
      try {
        const listingReviews = await fetchListingReviews(listingId);
        if (!ignore) setReviews(listingReviews);
      } catch (err) {
        console.error(err);
      }
    }

    loadReviews();

    return () => {
      ignore = true;
    };
  }, [currentListingId]);

  useEffect(() => {
    if (!currentLandlordId) return;
    const landlordId = currentLandlordId;
    let ignore = false;

    async function loadLandlordReviews() {
      try {
        const revieweeReviews = await fetchLandlordReviews(landlordId);
        if (!ignore) setLandlordReviews(revieweeReviews);
      } catch (err) {
        console.error(err);
      }
    }

    loadLandlordReviews();

    return () => {
      ignore = true;
    };
  }, [currentLandlordId]);
  if (loading) {
    return (
      <div className="legacy-page-wrapper">
        <div className="detail-page">
          <div className="detail-layout">
            <h2>Đang tải thông tin phòng...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="legacy-page-wrapper">
        <div className="not-found-page">
          <h2>{error}</h2>
          <a href="/" className="btn-primary">
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="legacy-page-wrapper">
        <div className="not-found-page">
          <h2>Không tìm thấy phòng</h2>
          <a href="/" className="btn-primary">
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  const amenities = listing.amenities ?? [];
  const landlord = listing.landlord as
    | (Profile & { phone?: string | null })
    | undefined;
  const listingAvgRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const landlordReviewCount = landlordReviews.length;
  const avgRating = landlordReviewCount
    ? landlordReviews.reduce((sum, review) => sum + review.rating, 0) /
      landlordReviewCount
    : null;
  const starRatingValue = avgRating ?? 0;

  const handleToggleSave = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!id) return;

    try {
      setSaving(true);

      if (isSaved) {
        await unsaveListing(user.id, Number(id));
        setIsSaved(false);
      } else {
        await saveListing(user.id, Number(id));
        setIsSaved(true);
      }
    } catch (err) {
      console.error(err);
      alert("Không thể lưu phòng.");
    } finally {
      setSaving(false);
    }
  };

  const handleChatClick = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để chat với chủ nhà");
      navigate("/login");
      return;
    }

    if (!landlord) {
      alert("Không tìm thấy thông tin chủ nhà");
      return;
    }

    if (user.id === landlord.id) {
      alert("Bạn không thể tự chat với chính mình");
      return;
    }

    try {
      setChatLoading(true);
      const conversationId = await chatService.getOrCreateConversation(
        String(user.id),
        String(landlord.id),
      );
      navigate("/profile/messages", {
        state: { conversationId, participantId: landlord.id },
      });
    } catch (error: unknown) {
      console.error("Lỗi khi mở chat:", error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      alert("Không thể bắt đầu cuộc trò chuyện. Lỗi: " + message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleReviewSubmitted = async () => {
    const [updatedListingReviews, updatedLandlordReviews] = await Promise.all([
      fetchListingReviews(listing.id),
      landlord ? fetchLandlordReviews(landlord.id) : Promise.resolve([]),
    ]);

    setReviews(updatedListingReviews);
    setLandlordReviews(updatedLandlordReviews);
  };

  const responseRate = 98;
  const yearsActive = getFullYearsSince(landlord?.created_at);
  const depositMonths = listing.deposit / listing.price;
  const displayedActiveImage = Math.min(
    activeImage,
    Math.max(listing.images.length - 1, 0),
  );

  return (
    <>
      <div className="legacy-page-wrapper">
        <div className="detail-page">
          <div className="detail-layout">
            <div className="detail-main">
              <div className="detail-gallery">
                <div className="detail-gallery-main">
                  <img
                    src={listing.images[displayedActiveImage]}
                    alt={listing.title}
                    className="detail-gallery-hero"
                  />
                  {listing.is_verified && (
                    <span className="detail-verified-badge">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      Đã xác minh
                    </span>
                  )}
                </div>

                <div className="detail-thumbs-overlay">
                  <div className="detail-gallery-thumbs">
                    {listing.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`detail-thumb ${displayedActiveImage === i ? "active" : ""}`}
                        onClick={() => setActiveImage(i)}
                        aria-label={`Xem ảnh ${i + 1}`}
                      >
                        <img src={img} alt={`Ảnh ${i + 1}`} />
                      </button>
                    ))}
                  </div>

                  <div className="detail-title-overlay mt-80">
                    <h1 className="detail-title">{listing.title}</h1>
                    <div className="detail-address">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>
                        {listing.address_detail}, {listing.ward_name},{" "}
                        {listing.district_name}, TP.HCM
                      </span>
                      <a href="#" className="detail-map-link">
                        Xem bản đồ
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-description">
                <p>{listing.description}</p>
              </div>

              <div className="detail-reviews">
                <div className="detail-reviews-header">
                  <h2>Đánh giá từ người thuê trước</h2>
                  <div className="detail-reviews-summary">
                    {reviews.length > 0 ? (
                      <StarRating
                        rating={listingAvgRating}
                        size="md"
                        showValue
                        count={reviews.length}
                      />
                    ) : (
                      <span className="detail-reviews-count">
                        Chưa có đánh giá
                      </span>
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
                  <div className="detail-reviews-empty">
                    Phòng này chưa có đánh giá từ người thuê.
                  </div>
                )}
              </div>
            </div>

            <div className="detail-sidebar">
              <div className="detail-price-card">
                <div className="detail-price">
                  {formatPriceVND(listing.price)}
                  <span className="detail-price-unit">/tháng</span>
                </div>

                <div className="detail-specs">
                  <div className="detail-spec">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 3v18" />
                    </svg>
                    <div>
                      <span className="detail-spec-label">Diện tích</span>
                      <span className="detail-spec-value">
                        {listing.area} m²
                      </span>
                    </div>
                  </div>
                  <div className="detail-spec">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
                    </svg>
                    <div>
                      <span className="detail-spec-label">Đặt cọc</span>
                      <span className="detail-spec-value">
                        {depositMonths % 1 === 0
                          ? depositMonths
                          : depositMonths.toFixed(1)}{" "}
                        tháng
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-contact-buttons">
                  <button
                    className="btn-primary btn-full detail-call-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      if (landlord?.phone) {
                        setShowPhoneModal(true);
                      } else {
                        alert("Chủ nhà chưa cập nhật số điện thoại!");
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid var(--brand-600)",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Gọi điện
                  </button>
                  <button
                    className="btn-outline btn-full detail-chat-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      handleChatClick();
                    }}
                    disabled={chatLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid var(--brand-500)",
                      color: "var(--brand-600)",
                      fontWeight: "600",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginRight: "6px" }}
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {chatLoading ? "Đang mở..." : "Chat ngay"}
                  </button>

                  <button
                    className="btn-outline"
                    onClick={handleToggleSave}
                    disabled={saving}
                    style={{
                      width: "52px",
                      height: "52px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    <Heart
                      className={isSaved ? "text-red-500 fill-red-500" : "text-gray-400"}
                    />
                  </button>
                </div>
              </div>

              <div className="detail-landlord-card">
                <h3 className="detail-landlord-title">THÔNG TIN CHỦ NHÀ</h3>
                <Link to={`/user/${listing.landlord_id}`} className="detail-landlord-info-link hover:opacity-80 transition-opacity flex items-center gap-3">
                  <img
                    src={landlord?.avatar_url || DEFAULT_AVATAR}
                    alt={landlord?.full_name || "Chủ nhà"}
                    className="detail-landlord-avatar"
                  />
                  <div>
                    <div className="detail-landlord-name flex items-center gap-1">
                      {landlord?.full_name}
                      {landlord?.is_verified && (
                        <svg
                          className="detail-landlord-verified"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="#1d4ed8"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      )}
                    </div>
                    <div className="detail-landlord-role">Chủ nhà</div>
                  </div>
                </Link>
                <div className="detail-landlord-stats">
                  <div className="detail-landlord-stat">
                    <span className="detail-landlord-stat-value">
                      {responseRate}%
                    </span>
                    <span className="detail-landlord-stat-label">Phản hồi</span>
                  </div>
                  <div className="detail-landlord-stat">
                    <span className="detail-landlord-stat-value">
                      {formatAverageRating(avgRating)}
                    </span>
                    <span className="detail-landlord-stat-label">Đánh giá</span>
                  </div>
                  <div className="detail-landlord-stat">
                    <span className="detail-landlord-stat-value">
                      {formatYearsActive(yearsActive)}
                    </span>
                    <span className="detail-landlord-stat-label">
                      Hoạt động
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-landlord-reviews-card">
                <h3 className="detail-amenities-title">Đánh giá độ uy tín</h3>
                <div className="detail-landlord-reviews-content">
                  <div className="detail-landlord-avg-box">
                    <div className="detail-landlord-avg-score">
                      {formatAverageRating(avgRating)}
                    </div>
                    <StarRating
                      rating={starRatingValue}
                      size="sm"
                      showValue={false}
                    />
                    <div className="detail-landlord-avg-count">
                      {landlordReviewCount} đánh giá
                    </div>
                  </div>

                  <div
                    className="detail-landlord-star-bars"
                    style={{ marginTop: "8px", width: "100%" }}
                  >
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = landlordReviews.filter(
                        (review) => review.rating === star,
                      ).length;
                      const pct = landlordReviewCount
                        ? (count / landlordReviewCount) * 100
                        : 0;
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
                          <span style={{ width: "20px", textAlign: "right" }}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {landlordReviews.filter(
                    (review) => review.rating >= 4 && review.comment,
                  ).length > 0 && (
                    <div
                      className="detail-landlord-featured-comments"
                      style={{
                        marginTop: "12px",
                        borderTop: "1px solid var(--gray-100)",
                        paddingTop: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "var(--gray-800)",
                          marginBottom: "8px",
                        }}
                      >
                        Nhận xét tiêu biểu:
                      </div>
                      {landlordReviews
                        .filter(
                          (review) => review.rating >= 4 && review.comment,
                        )
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
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: "600",
                                  color: "var(--gray-700)",
                                }}
                              >
                                {review.reviewer_name || "Người dùng ẩn danh"}
                              </span>
                              <span style={{ color: "#fbbf24" }}>
                                {"★".repeat(review.rating)}
                              </span>
                            </div>
                            <p style={{ fontStyle: "italic", margin: 0 }}>
                              "{review.comment}"
                            </p>
                          </div>
                        ))}
                    </div>
                  )}

                  <button
                    className="btn-outline btn-full detail-review-btn"
                    style={{ marginTop: "8px" }}
                    onClick={() => setShowReviewModal(true)}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginRight: "6px" }}
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    Viết đánh giá
                  </button>
                </div>
              </div>

              <div className="detail-amenities-card">
                <h3 className="detail-amenities-title">Tiện ích</h3>
                <div className="detail-amenities-grid">
                  {amenities.slice(0, 6).map((amenity) => {
                    const Icon = getIcon(amenity.icon);

                    return <div key={amenity.id} className="detail-amenity">
                        <span className="detail-amenity-icon">
                          <Icon size={18} />
                        </span>
                      <span className="detail-amenity-name">
                        {amenity.name}
                      </span>
                    </div>
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPhoneModal && landlord?.phone && (
        <div
          className="phone-modal-overlay"
          onClick={() => setShowPhoneModal(false)}
        >
          <div
            className="phone-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="phone-modal-header">
              <h3>Thông tin liên hệ</h3>
              <button
                className="phone-modal-close"
                onClick={() => setShowPhoneModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="phone-modal-body">
              <div className="phone-modal-avatar">
                <img
                  src={landlord.avatar_url || DEFAULT_AVATAR}
                  alt={landlord.full_name || "Chủ nhà"}
                />
              </div>
              <div className="phone-modal-name">{landlord.full_name}</div>
              <div className="phone-modal-number">{landlord.phone}</div>
              <a
                href={`tel:${landlord.phone}`}
                className="btn-primary btn-full phone-modal-call-btn"
              >
                Gọi ngay
              </a>
            </div>
          </div>
        </div>
      )}

      {landlord && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={handleReviewSubmitted}
          revieweeId={landlord.id}
          listingId={listing.id}
        />
      )}
    </>
  );
}
