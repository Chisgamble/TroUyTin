import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import type { RoomListing } from "../types";
import { getRoomTypeLabel } from "../utils/formatters";
import "./SearchResultsPage.css";

const ROOM_TYPES = ["PHONG_TRO", "CAN_HO_MINI", "KTX", "NGUYEN_CAN"] as const;
const PRICE_RANGES = [
  { label: "Tất cả mức giá", min: 0, max: Infinity },
  { label: "Dưới 2 triệu", min: 0, max: 2000000 },
  { label: "2 – 4 triệu", min: 2000000, max: 4000000 },
  { label: "4 – 6 triệu", min: 4000000, max: 6000000 },
  { label: "Trên 6 triệu", min: 6000000, max: Infinity },
];
const AREA_RANGES = [
  { label: "Tất cả diện tích", min: 0, max: Infinity },
  { label: "Dưới 20 m²", min: 0, max: 20 },
  { label: "20 – 30 m²", min: 20, max: 30 },
  { label: "30 – 50 m²", min: 30, max: 50 },
  { label: "Trên 50 m²", min: 50, max: Infinity },
];

const DISTRICTS = [
  { id: 1, province_id: 1, name: "Quận 1" },
  { id: 2, province_id: 1, name: "Quận 3" },
  { id: 3, province_id: 1, name: "Quận 7" },
  { id: 4, province_id: 1, name: "Quận Bình Thạnh" },
  { id: 5, province_id: 1, name: "Quận Phú Nhuận" },
  { id: 6, province_id: 1, name: "Quận Tân Bình" },
  { id: 7, province_id: 1, name: "Quận Gò Vấp" },
  { id: 8, province_id: 1, name: "TP. Thủ Đức" },
];

async function fetchRooms(): Promise<RoomListing[]> {
  const res = await fetch("http://localhost:3000/api/rooms", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch rooms");
  }

  return res.json();
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [districtId, setDistrictId] = useState(0);
  const [roomType, setRoomType] = useState("");
  const [priceIdx, setPriceIdx] = useState(0);
  const [areaIdx, setAreaIdx] = useState(0);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const {
    data: rooms = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    staleTime: 60_000,
  });

  const results = rooms.filter((l) => {
    if (l.status !== "AVAILABLE") return false;
    // Text search
    const q = query.toLowerCase();
    if (
      q &&
      !(
        (l.title || "").toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q) ||
        (l.address_detail || "").toLowerCase().includes(q) ||
        (l.district_name || "").toLowerCase().includes(q)
      )
    )
      return false;
    // District
    if (districtId > 0) {
      const d = DISTRICTS.find((d) => d.id === districtId);
      if (d && l.district_name !== d.name) return false;
    }
    // Room type
    if (roomType && l.room_type !== roomType) return false;
    // Price
    const pr = PRICE_RANGES[priceIdx];
    if (l.price < pr.min || l.price >= pr.max) return false;
    // Area
    const ar = AREA_RANGES[areaIdx];
    if (l.area < ar.min || l.area >= ar.max) return false;
    return true;
  });

  const toggleSave = (id: number) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  };

  const clearFilters = () => {
    setDistrictId(0);
    setRoomType("");
    setPriceIdx(0);
    setAreaIdx(0);
  };

  const hasFilters =
    districtId > 0 || roomType !== "" || priceIdx > 0 || areaIdx > 0;

  return (
    <>
      <div className="search-page">
        <div className="search-layout">
          {/* Sidebar Filters */}
          <aside className="search-sidebar">
            <div className="search-sidebar-header">
              <h3>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="14" y2="12" />
                  <line x1="4" y1="18" x2="10" y2="18" />
                </svg>
                Bộ lọc
              </h3>
              {hasFilters && (
                <button className="search-clear-btn" onClick={clearFilters}>
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Search within filters */}
            <form className="search-filter-search" onSubmit={handleSearch}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm theo từ khóa..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>

            {/* District */}
            <div className="search-filter-group">
              <label className="search-filter-label">Khu vực</label>
              <select
                className="search-filter-select"
                value={districtId}
                onChange={(e) => setDistrictId(Number(e.target.value))}
              >
                <option value={0}>Tất cả khu vực</option>
                {DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Type */}
            <div className="search-filter-group">
              <label className="search-filter-label">Loại phòng</label>
              <div className="search-filter-chips">
                <button
                  className={`search-chip ${roomType === "" ? "active" : ""}`}
                  onClick={() => setRoomType("")}
                >
                  Tất cả
                </button>
                {ROOM_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`search-chip ${roomType === t ? "active" : ""}`}
                    onClick={() => setRoomType(roomType === t ? "" : t)}
                  >
                    {getRoomTypeLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="search-filter-group">
              <label className="search-filter-label">Mức giá</label>
              <div className="search-filter-radios">
                {PRICE_RANGES.map((r, i) => (
                  <label key={i} className="search-radio">
                    <input
                      type="radio"
                      name="price"
                      checked={priceIdx === i}
                      onChange={() => setPriceIdx(i)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Area Range */}
            <div className="search-filter-group">
              <label className="search-filter-label">Diện tích</label>
              <div className="search-filter-radios">
                {AREA_RANGES.map((r, i) => (
                  <label key={i} className="search-radio">
                    <input
                      type="radio"
                      name="area"
                      checked={areaIdx === i}
                      onChange={() => setAreaIdx(i)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="search-results">
            <div className="search-results-header">
              <h1>{query ? `Kết quả: "${query}"` : "Tất cả phòng trọ"}</h1>
              <span className="search-results-count">
                {results.length} phòng
              </span>
            </div>

            {isLoading ? (
              <div className="search-empty">
                <h3>Đang tải danh sách phòng</h3>
              </div>
            ) : isError ? (
              <div className="search-empty">
                <h3>Không thể tải danh sách phòng</h3>
              </div>
            ) : results.length > 0 ? (
              <div className="search-grid">
                {results.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    saved={savedIds.includes(listing.id)}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            ) : (
              <div className="search-empty">
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <h3>Không tìm thấy kết quả</h3>
                <p>Thử thay đổi từ khóa hoặc bộ lọc</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
