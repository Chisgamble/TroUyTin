import type { Review } from "../types";
import StarRating from "./StarRating";

type ReviewCardProps = {
  review: Review;
};

export default function ReviewCard({ review }: ReviewCardProps) {
  const date = new Date(review.created_at);
  const monthYear = `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;

  return (
    <div className="review-card">
      <div className="review-card-header">
        <img
          src={review.reviewer?.avatar_url || "https://i.pravatar.cc/150?img=0"}
          alt={review.reviewer?.full_name}
          className="review-card-avatar"
        />
        <div className="review-card-info">
          <div className="review-card-name">{review.reviewer?.full_name}</div>
          <div className="review-card-date">{monthYear}</div>
        </div>
      </div>
      <StarRating rating={review.rating} size="sm" />
      <p className="review-card-comment">"{review.comment}"</p>
    </div>
  );
}
