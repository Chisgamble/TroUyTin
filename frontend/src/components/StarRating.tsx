type StarRatingProps = {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  count?: number;
};

export default function StarRating({ rating, size = 'md', showValue = false, count }: StarRatingProps) {
  const sizes = { sm: 14, md: 18, lg: 22 };
  const s = sizes[size];

  return (
    <div className="star-rating" style={{ gap: size === 'sm' ? 1 : 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill={star <= Math.round(rating) ? '#f59e0b' : 'none'}
          stroke="#f59e0b"
          strokeWidth="2"
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      {showValue && <span className="star-rating-value">{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="star-rating-count">({count} đánh giá)</span>}
    </div>
  );
}
