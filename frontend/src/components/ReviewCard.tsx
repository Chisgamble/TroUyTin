import type { Review } from "../types";
import StarRating from "./StarRating";

type ReviewCardProps = {
  review: Review;
};

export default function ReviewCard({ review }: ReviewCardProps) {
  const date = new Date(review.created_at);
  const monthYear = `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
  const reviewerName = review.reviewer?.full_name || "Người dùng ẩn danh";
  const reviewerAvatar = review.reviewer?.avatar_url?.trim();
  const reviewerInitials = reviewerName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="review-card">
      <div className="review-card-header">
        {reviewerAvatar ? (
          <img
            src={reviewerAvatar}
            alt={reviewerName}
            className="review-card-avatar"
          />
        ) : (
          <div className="review-card-avatar review-card-avatar-fallback">
            {reviewerInitials || "?"}
          </div>
        )}
        <div className="review-card-info">
          <div className="review-card-name">{reviewerName}</div>
          <div className="review-card-date">{monthYear}</div>
        </div>
      </div>
      <StarRating rating={review.rating} size="sm" />
      {review.comment && (
        <p className="review-card-comment">"{review.comment}"</p>
      )}
    </div>
  );
}
