import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import { Sparkles } from "lucide-react";
import { supabase } from "../services/supabase";
import type { RoomListing, RoomListingDbRow } from "../types";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState("");
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [rooms, setRooms] = useState<RoomListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function mapRowToListing(row: RoomListingDbRow): RoomListing {
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
      amenity_ids: [],
      district_name: row.wards?.districts?.name ?? "",
      ward_name: row.wards?.name ?? "",
    };
  }

  useEffect(() => {
    async function loadRooms() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from<RoomListingDbRow>("room_listings")
        .select(
          "*, listing_images(image_url, display_order), wards(name, districts(name))",
        )
        .eq("status", "AVAILABLE")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setRooms((data ?? []).map(mapRowToListing));
      setLoading(false);
    }

    loadRooms();
  }, []);

  const featuredListings = rooms
    .filter((l) => l.status === "AVAILABLE" && l.is_verified)
    .slice(0, 4);

  const toggleSave = (id: number) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // const handleSearch = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   navigate(`/tim-kiem?q=${encodeURIComponent(heroQuery.trim())}`);
  // };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      navigate(`/tim-kiem-ai?q=${encodeURIComponent(heroQuery.trim())}`);
    }
  };

  return (
    <div className="legacy-page-wrapper">
      <div className="home-page">
        {/* Hero */}
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-content">
            <h1 className="hero-title">
              Tìm phòng trọ <span className="hero-accent">uy tín</span>
            </h1>
            <p className="hero-sub">
              Nền tảng tìm phòng trọ minh bạch, xác thực chủ nhà, đánh giá thực
              tế
            </p>

            <form className="hero-search" onSubmit={handleSearch}>
              <div className="hero-search-box">
                {/* <svg
                  className="hero-search-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg> */}
                <Sparkles className="hero-search-icon" size={20} />
                <input
                  type="text"
                  className="hero-search-input"
                  placeholder="Tìm phòng bằng AI..."
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                />

                <button type="submit" className="hero-search-btn">
                  Tìm kiếm
                </button>
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
            <button
              className="home-see-all"
              onClick={() => navigate("/tim-kiem")}
            >
              Xem tất cả
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
    </div>
  );
}
