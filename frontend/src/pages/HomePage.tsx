import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { ROOM_LISTINGS, SAVED_LISTINGS } from '../data/mockData';

export default function HomePage() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState('');
  const [savedIds, setSavedIds] = useState<number[]>(SAVED_LISTINGS.map((s) => s.listing_id));

  const featuredListings = ROOM_LISTINGS.filter((l) => l.status === 'AVAILABLE' && l.is_verified).slice(0, 4);

  const toggleSave = (id: number) => {
    setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/tim-kiem?q=${encodeURIComponent(heroQuery.trim())}`);
  };

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <h1 className="hero-title">
            Tìm phòng trọ <span className="hero-accent">uy tín</span>
          </h1>
          <p className="hero-sub">Nền tảng tìm phòng trọ minh bạch, xác thực chủ nhà, đánh giá thực tế</p>

          <form className="hero-search" onSubmit={handleSearch}>
            <div className="hero-search-box">
              <svg className="hero-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="hero-search-input"
                placeholder="Tìm theo khu vực, đường, quận..."
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
              />
              <button type="submit" className="hero-search-btn">Tìm kiếm</button>
            </div>
          </form>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">1,200+</span>
              <span className="hero-stat-label">Phòng trọ</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">500+</span>
              <span className="hero-stat-label">Chủ nhà xác thực</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">4.8</span>
              <span className="hero-stat-label">Đánh giá TB</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="home-featured">
        <div className="home-featured-header">
          <h2>Phòng trọ nổi bật</h2>
          <button className="home-see-all" onClick={() => navigate('/tim-kiem')}>
            Xem tất cả
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>
        <div className="home-grid">
          {featuredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              saved={savedIds.includes(listing.id)}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
