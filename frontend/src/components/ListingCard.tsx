import { Link } from 'react-router-dom';
import type { RoomListing } from '../data/mockData';
import { formatPriceVND, getRoomTypeLabel } from '../data/mockData';
import './ListingCard.css';

type ListingCardProps = {
  listing: RoomListing;
  saved?: boolean;
  onToggleSave?: (id: number) => void;
};

export default function ListingCard({ listing, saved = false, onToggleSave }: ListingCardProps) {
  return (
    <div className="legacy-page-wrapper">
      <Link to={`/phong/${listing.id}`} className="listing-card" id={`listing-card-${listing.id}`}>
        <div className="listing-card-image-wrapper">
          <img src={listing.images[0]} alt={listing.title} className="listing-card-image" loading="lazy" />
          {listing.is_verified && <span className="listing-card-verified">Đã xác minh</span>}
          <span className="listing-card-type">{getRoomTypeLabel(listing.room_type)}</span>
          {onToggleSave && (
            <button
              className={`listing-card-save ${saved ? 'saved' : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(listing.id); }}
              aria-label={saved ? 'Bỏ lưu' : 'Lưu phòng'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          )}
        </div>
        <div className="listing-card-content">
          <h3 className="listing-card-title">{listing.title}</h3>
          <div className="listing-card-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{listing.address_detail}, {listing.district_name}</span>
          </div>
          <div className="listing-card-details">
            <span>{listing.area} m²</span>
            <span className="listing-card-dot">·</span>
            <span>{listing.view_count} lượt xem</span>
          </div>
          <div className="listing-card-price">{formatPriceVND(listing.price)}<span>/tháng</span></div>
        </div>
      </Link>
    </div>
  );
}
