import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import type { RoomListing } from '../data/mockData';
import {
  getReviewsByListingId,
  getAmenitiesByIds,
  formatPriceVND,
  USERS,
  REVIEWS,
} from '../data/mockData';
import './ListingDetailPage.css';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<RoomListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`http://localhost:3000/api/rooms/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Room not found');
          return res.json();
        })
        .then(data => setListing(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="detail-page"><div className="detail-layout"><h2>Đang tải thông tin phòng...</h2></div></div>;
  }

  if (!listing) {
    return (
      <div className="not-found-page">
        <h2>Không tìm thấy phòng</h2>
        <a href="/" className="btn-primary">Về trang chủ</a>
      </div>
    );
  }

  const reviews = getReviewsByListingId(listing.id);
  const listingAvgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const amenities = getAmenitiesByIds(listing.amenity_ids);
  const landlord = listing.landlord || USERS.find((u) => u.id === listing.landlord_id);

  const landlordReviews = REVIEWS.filter((r) => r.reviewee_id === listing.landlord_id);
  const avgRating = landlordReviews.length
    ? landlordReviews.reduce((s, r) => s + r.rating, 0) / landlordReviews.length
    : 0;
  const responseRate = 98;
  const yearsActive = landlord
    ? Math.max(1, Math.floor((Date.now() - new Date(landlord.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
    : 1;

  const depositMonths = listing.deposit / listing.price;

  // Only show first 4 thumbnails, last one gets "+N" overlay
  const thumbsToShow = listing.images.slice(0, 4);
  const remainingCount = listing.images.length - 4;

  return (
    <>
      <div className="detail-page">
        <div className="detail-layout">
          {/* Left Column */}
          <div className="detail-main">
            {/* Image Gallery */}
            <div className="detail-gallery">
              <div className="detail-gallery-main">
                <img
                  src={listing.images[activeImage]}
                  alt={listing.title}
                  className="detail-gallery-hero"
                />
                {listing.is_verified && (
                  <span className="detail-verified-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Đã xác minh
                  </span>
                )}
              </div>

              {/* Thumbnails + Title overlay area */}
              <div className="detail-thumbs-overlay">
                <div className="detail-gallery-thumbs">
                  {thumbsToShow.map((img, i) => (
                    <button
                      key={i}
                      className={`detail-thumb ${activeImage === i ? 'active' : ''}`}
                      onClick={() => setActiveImage(i)}
                    >
                      <img src={img} alt={`Ảnh ${i + 1}`} />
                      {i === 3 && remainingCount > 0 && (
                        <span className="detail-thumb-more">+{remainingCount}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Title & Address overlay */}
                <div className="detail-title-overlay">
                  <h1 className="detail-title">{listing.title}</h1>
                  <div className="detail-address">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{listing.address_detail}, {listing.ward_name}, {listing.district_name}, TP.HCM</span>
                    <a href="#" className="detail-map-link">Xem bản đồ</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="detail-description">
              <p>{listing.description}</p>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="detail-reviews">
                <div className="detail-reviews-header">
                  <h2>Đánh giá từ người thuê trước</h2>
                  <div className="detail-reviews-summary">
                    <StarRating rating={listingAvgRating} size="md" showValue count={reviews.length} />
                  </div>
                </div>
                <div className="detail-reviews-grid">
                  {reviews.slice(0, 3).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="detail-sidebar">
            {/* Price Card */}
            <div className="detail-price-card">
              <div className="detail-price">
                {formatPriceVND(listing.price)}
                <span className="detail-price-unit">/tháng</span>
              </div>

              <div className="detail-specs">
                <div className="detail-spec">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 3v18" />
                  </svg>
                  <div>
                    <span className="detail-spec-label">Diện tích</span>
                    <span className="detail-spec-value">{listing.area} m²</span>
                  </div>
                </div>
                <div className="detail-spec">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
                  </svg>
                  <div>
                    <span className="detail-spec-label">Đặt cọc</span>
                    <span className="detail-spec-value">{depositMonths % 1 === 0 ? depositMonths : depositMonths.toFixed(1)} tháng</span>
                  </div>
                </div>
                <div className="detail-spec">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  <div>
                    <span className="detail-spec-label">Điện</span>
                    <span className="detail-spec-value">3.5k/kWh</span>
                  </div>
                </div>
                <div className="detail-spec">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                  <div>
                    <span className="detail-spec-label">Nước</span>
                    <span className="detail-spec-value">100k/người</span>
                  </div>
                </div>
              </div>

              <button className="btn-primary btn-full detail-call-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Gọi điện
              </button>
              <button className="btn-outline btn-full detail-chat-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Chat ngay
              </button>
            </div>

            {/* Landlord Card */}
            <div className="detail-landlord-card">
              <h3 className="detail-landlord-title">THÔNG TIN CHỦ NHÀ</h3>
              <div className="detail-landlord-info">
                <img
                  src={landlord?.avatar_url}
                  alt={landlord?.full_name}
                  className="detail-landlord-avatar"
                />
                <div>
                  <div className="detail-landlord-name">
                    {landlord?.full_name}
                    {landlord?.is_verified && (
                      <svg className="detail-landlord-verified" width="18" height="18" viewBox="0 0 24 24" fill="#1d4ed8">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </div>
                  <div className="detail-landlord-role">Chủ nhà</div>
                </div>
              </div>
              <div className="detail-landlord-stats">
                <div className="detail-landlord-stat">
                  <span className="detail-landlord-stat-value">{responseRate}%</span>
                  <span className="detail-landlord-stat-label">Phản hồi</span>
                </div>
                <div className="detail-landlord-stat">
                  <span className="detail-landlord-stat-value">{avgRating.toFixed(1)}</span>
                  <span className="detail-landlord-stat-label">Đánh giá</span>
                </div>
                <div className="detail-landlord-stat">
                  <span className="detail-landlord-stat-value">{yearsActive} năm</span>
                  <span className="detail-landlord-stat-label">Hoạt động</span>
                </div>
              </div>
            </div>

            {/* Amenities Card */}
            <div className="detail-amenities-card">
              <h3 className="detail-amenities-title">Tiện ích</h3>
              <div className="detail-amenities-grid">
                {amenities.slice(0, 6).map((amenity) => (
                  <div key={amenity.id} className="detail-amenity">
                    <span className="detail-amenity-icon">{amenity.icon}</span>
                    <span className="detail-amenity-name">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
          </div>
    </>
  );
}
