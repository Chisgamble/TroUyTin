import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { useAuth } from "../contexts/AuthContext";
import type { RoomListing } from "../services/roomListing";
import {
  getSavedListingIds,
  getListingsByLandlord,
  saveListing,
  unsaveListing,
} from "../services/roomListing";
import { supabase } from "../services/supabase";
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [heroQuery, setHeroQuery] = useState('');
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [rooms, setRooms] = useState<RoomListing[]>([]);

  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      return;
    }

    async function fetchSaved() {
      try {
        const ids = await getSavedListingIds(user.id);
        setSavedIds(ids);
      } catch (err) {
        console.error(err);
      }

        setSavedIds(data.map(x => x.listing_id));
    }

    fetchSaved();
  }, [user]);

  useEffect(() => {
    fetch('http://localhost:3000/api/rooms')
      .then(res => res.json())
      .then(data => setRooms(data))
      .catch(err => console.error('Failed to fetch rooms:', err));
  }, []);

  const featuredListings = rooms.filter((l) => l.status === 'AVAILABLE' && l.is_verified).slice(0, 4);

  const toggleSave = async (id: number) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      if (savedIds.includes(id)) {
        await unsaveListing(user.id, id);
        setSavedIds(prev => prev.filter(x => x !== id));
      } else {
        await saveListing(user.id, id);
        setSavedIds(prev => [...prev, id]);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/tim-kiem?q=${encodeURIComponent(heroQuery.trim())}`);
  };

  return (
    <>
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
    </>
  );
}
