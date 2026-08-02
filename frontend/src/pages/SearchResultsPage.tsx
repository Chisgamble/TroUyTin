import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import type { RoomListing } from "../types";
import {
  getDistricts,
  getProvinces,
  type District,
  type Province,
} from "../services/roomListing";
import { getRoomTypeLabel } from "../utils/formatters";
import {
  deriveDistrictOptions,
  deriveProvinceOptions,
  filterListings,
  paginateListings,
} from "../utils/searchListings";
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
  const [provinceId, setProvinceId] = useState(0);
  const [districtId, setDistrictId] = useState(0);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [provinceCatalogFailed, setProvinceCatalogFailed] = useState(false);
  const [districtCatalogFailed, setDistrictCatalogFailed] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [roomType, setRoomType] = useState("");
  const [priceIdx, setPriceIdx] = useState(0);
  const [areaIdx, setAreaIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const districtRequestId = useRef(0);
  const {
    data: rooms = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    staleTime: 60_000,
  });

  useEffect(() => {
    let cancelled = false;

    getProvinces()
      .then((loadedProvinces) => {
        if (!cancelled) setProvinces(loadedProvinces);
      })
      .catch(() => {
        if (!cancelled) setProvinceCatalogFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fallbackProvinces = deriveProvinceOptions(rooms);
  const fallbackDistricts = deriveDistrictOptions(rooms, provinceId);
  const provinceOptions = provinceCatalogFailed ? fallbackProvinces : provinces;
  const districtOptions = districtCatalogFailed ? fallbackDistricts : districts;
  const locationError =
    provinceCatalogFailed && !isLoading && fallbackProvinces.length === 0
      ? "Không thể tải danh sách tỉnh/thành phố."
      : districtCatalogFailed && !isLoading && fallbackDistricts.length === 0
        ? "Không thể tải danh sách quận/huyện."
        : null;

  const results = filterListings(rooms, {
    query,
    provinceId,
    districtId,
    roomType,
    price: PRICE_RANGES[priceIdx],
    area: AREA_RANGES[areaIdx],
  });
  const pagination = paginateListings(results, currentPage, 9);

  const toggleSave = (id: number) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
    setCurrentPage(1);
  };

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setCurrentPage(1);
  };

  const handleProvinceChange = async (nextProvinceId: number) => {
    const requestId = districtRequestId.current + 1;
    districtRequestId.current = requestId;
    setProvinceId(nextProvinceId);
    setDistrictId(0);
    setDistricts([]);
    setDistrictCatalogFailed(false);
    setCurrentPage(1);

    if (nextProvinceId === 0) {
      setLoadingDistricts(false);
      return;
    }

    setLoadingDistricts(true);
    try {
      const loadedDistricts = await getDistricts(nextProvinceId);
      if (districtRequestId.current === requestId) {
        setDistricts(loadedDistricts);
      }
    } catch {
      if (districtRequestId.current === requestId) {
        setDistrictCatalogFailed(true);
      }
    } finally {
      if (districtRequestId.current === requestId) {
        setLoadingDistricts(false);
      }
    }
  };

  const handleDistrictChange = (nextDistrictId: number) => {
    setDistrictId(nextDistrictId);
    setCurrentPage(1);
  };

  const handleRoomTypeChange = (nextRoomType: string) => {
    setRoomType(nextRoomType);
    setCurrentPage(1);
  };

  const handlePriceChange = (nextPriceIdx: number) => {
    setPriceIdx(nextPriceIdx);
    setCurrentPage(1);
  };

  const handleAreaChange = (nextAreaIdx: number) => {
    setAreaIdx(nextAreaIdx);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    districtRequestId.current += 1;
    setProvinceId(0);
    setDistrictId(0);
    setDistricts([]);
    setLoadingDistricts(false);
    setDistrictCatalogFailed(false);
    setRoomType("");
    setPriceIdx(0);
    setAreaIdx(0);
    setCurrentPage(1);
  };

  const hasFilters =
    provinceId > 0 || districtId > 0 || roomType !== "" || priceIdx > 0 || areaIdx > 0;

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
                onChange={(e) => handleQueryChange(e.target.value)}
              />
            </form>

            {/* Location */}
            <div className="search-filter-group">
              <label className="search-filter-label" htmlFor="province-filter">
                Tỉnh/Thành phố
              </label>
              <select
                id="province-filter"
                className="search-filter-select"
                value={provinceId}
                onChange={(e) => handleProvinceChange(Number(e.target.value))}
              >
                <option value={0}>Tất cả tỉnh/thành phố</option>
                {provinceOptions.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-filter-group">
              <label className="search-filter-label" htmlFor="district-filter">
                Quận/Huyện
              </label>
              <select
                id="district-filter"
                className="search-filter-select"
                value={districtId}
                disabled={provinceId === 0 || loadingDistricts}
                onChange={(e) => handleDistrictChange(Number(e.target.value))}
              >
                <option value={0}>
                  {loadingDistricts ? "Đang tải quận/huyện..." : "Tất cả quận/huyện"}
                </option>
                {districtOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {locationError && (
              <p className="search-location-error" role="alert">
                {locationError}
              </p>
            )}

            {/* Room Type */}
            <div className="search-filter-group">
              <label className="search-filter-label">Loại phòng</label>
              <div className="search-filter-chips">
                <button
                  className={`search-chip ${roomType === "" ? "active" : ""}`}
                  onClick={() => handleRoomTypeChange("")}
                >
                  Tất cả
                </button>
                {ROOM_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`search-chip ${roomType === t ? "active" : ""}`}
                    onClick={() => handleRoomTypeChange(roomType === t ? "" : t)}
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
                      onChange={() => handlePriceChange(i)}
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
                      onChange={() => handleAreaChange(i)}
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
                {pagination.items.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    saved={savedIds.includes(listing.id)}
                    onToggleSave={toggleSave}
                    showVerifiedBadge={false}
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

            {pagination.totalPages > 1 && (
              <nav className="search-pagination" aria-label="Phân trang kết quả">
                <button
                  type="button"
                  className="search-pagination-button"
                  disabled={pagination.currentPage === 1}
                  onClick={() => setCurrentPage(pagination.currentPage - 1)}
                >
                  Trước
                </button>
                {Array.from({ length: pagination.totalPages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      type="button"
                      className={`search-pagination-button ${
                        page === pagination.currentPage ? "active" : ""
                      }`}
                      aria-current={page === pagination.currentPage ? "page" : undefined}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="search-pagination-button"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(pagination.currentPage + 1)}
                >
                  Sau
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
