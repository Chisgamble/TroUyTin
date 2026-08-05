import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import OpenMapView from "../components/OpenMapView";
import type { RoomListing } from "../types";
import {
  parseSearchQueryWithLLM,
  searchRoomsWithFilter,
  type RoomSearchFilter,
} from "../services/roomSearch";

type SearchState = "idle" | "parsing" | "fetching" | "done" | "error";

const PAGE_SIZE = 6;
const EMPTY_FILTERS: RoomSearchFilter = {
  district_name: null,
  room_type: null,
  price_min: null,
  price_max: null,
  area_min: null,
  area_max: null,
  keywords: null,
  landmark: null,
  target_lat: null,
  target_lng: null,
};

export default function RoomSearchLLM() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(queryParam);
  const [filters, setFilters] = useState<RoomSearchFilter | null>(null);
  const [rooms, setRooms] = useState<RoomListing[]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // HÀM MỚI: Chỉ chuyên gọi Supabase dựa trên Filter có sẵn
  const fetchRoomsForPage = async (
    currentFilters: RoomSearchFilter,
    targetPage: number,
  ) => {
    setState("fetching");
    setError(null);

    try {
      setIsFallback(false);
      const result = await searchRoomsWithFilter(currentFilters, {
        page: targetPage,
        pageSize: PAGE_SIZE,
      });

      // Chỉ hiển thị fallback nếu ở trang 1 mà không có kết quả
      if (result.totalCount === 0 && targetPage === 1) {
        const fallbackResult = await searchRoomsWithFilter(EMPTY_FILTERS, {
          page: 1,
          pageSize: 5,
        });

        setRooms(fallbackResult.rooms);
        setTotalCount(0);
        setTotalPages(1);
        setPage(1);
        setIsFallback(true);
      } else {
        setRooms(result.rooms);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        setPage(result.page);
      }

      setState("done");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi truy vấn dữ liệu",
      );
      setState("error");
    }
  };

  // HÀM ĐÃ SỬA: Chỉ gọi AI khi có câu tìm kiếm mới
  const runSearch = useCallback(async (searchText: string) => {
    if (!searchText.trim()) {
      setFilters(null);
      setRooms([]);
      setTotalCount(0);
      setTotalPages(1);
      setPage(1);
      setState("idle");
      return;
    }

    setState("parsing");
    setError(null);

    try {
      const parsedFilters = await parseSearchQueryWithLLM(searchText);
      setFilters(parsedFilters);

      // Sau khi AI parse xong, gọi Supabase lấy trang 1
      await fetchRoomsForPage(parsedFilters, 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi phân tích bằng AI",
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    setQuery(queryParam);
    if (queryParam) {
      setPage(1);
      runSearch(queryParam);
    }
  }, [queryParam, runSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    setPage(1);
    setSearchParams(trimmed ? { q: trimmed } : {});
  };

  // HÀM ĐÃ SỬA: Lấy JSON đã lưu trong state gọi thẳng Supabase, bỏ qua AI
  const handlePageChange = (nextPage: number) => {
    if (!filters) return;
    setPage(nextPage);
    fetchRoomsForPage(filters, nextPage);
  };

  const toggleSave = (id: number | string) => {
    const numId = Number(id);
    setSavedIds((prev) =>
      prev.includes(numId) ? prev.filter((x) => x !== numId) : [...prev, numId],
    );
  };

  const isLoading = state === "parsing" || state === "fetching";

  return (
    <div className="legacy-page-wrapper" style={{ paddingTop: "80px" }}>
      <div className="search-page room-search-llm">
        <form className="room-search-llm-bar" onSubmit={handleSubmit}>
          <svg
            width="20"
            height="20"
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
            placeholder="Tìm kiếm phòng bằng ngôn ngữ tự nhiên..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="room-search-llm-input"
          />
          <button
            type="submit"
            className="room-search-llm-btn"
            disabled={isLoading}
          >
            {isLoading ? "Đang tìm..." : "Tìm kiếm AI"}
          </button>
        </form>

        {filters && state === "done" && (
          <div className="room-search-llm-filters">
            <span className="room-search-llm-filters-label">Bộ lọc AI:</span>
            {filters.landmark && (
              <span
                className="search-chip active"
                style={{
                  backgroundColor: "#dbeafe",
                  color: "#1d4ed8",
                  borderColor: "#bfdbfe",
                }}
              >
                📍 Gần: {filters.landmark}
              </span>
            )}
            {filters.district_name && (
              <span className="search-chip active">
                {filters.district_name}
              </span>
            )}
            {filters.room_type && (
              <span className="search-chip active">{filters.room_type}</span>
            )}
            {(filters.price_min != null || filters.price_max != null) && (
              <span className="search-chip active">
                {filters.price_min != null
                  ? `${(filters.price_min / 1e6).toFixed(1)}tr`
                  : "0"}
                {" – "}
                {filters.price_max != null
                  ? `${(filters.price_max / 1e6).toFixed(1)}tr`
                  : "∞"}
              </span>
            )}
            {(filters.area_min != null || filters.area_max != null) && (
              <span className="search-chip active">
                {filters.area_min ?? 0}–{filters.area_max ?? "∞"} m²
              </span>
            )}
            {filters.keywords && (
              <span className="search-chip active">{filters.keywords}</span>
            )}
          </div>
        )}

        {error && <div className="room-search-llm-error">{error}</div>}

        <div className="room-search-llm-layout">
          <div className="room-search-llm-results">
            <div className="search-results-header">
              <h1>Kết quả tìm kiếm AI</h1>
              {state === "done" && (
                <span className="search-results-count">
                  {isFallback ? rooms.length : totalCount} phòng
                </span>
              )}
            </div>

            {isLoading && (
              <div className="search-empty">
                <p>
                  {state === "parsing"
                    ? "AI đang phân tích câu tìm kiếm..."
                    : "Đang truy vấn Supabase..."}
                </p>
              </div>
            )}

            {!isLoading && state === "done" && isFallback && (
              <div
                className="search-empty"
                style={{
                  marginBottom: "24px",
                  padding: "24px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                }}
              >
                <h3 style={{ color: "#dc2626" }}>
                  Không tìm thấy phòng phù hợp chính xác
                </h3>
                <p>
                  Thử mô tả khác, ví dụ: "phòng trọ quận 1 dưới 4 triệu có điều
                  hòa"
                </p>
                <p style={{ marginTop: "12px", fontWeight: "bold" }}>
                  👇 Dưới đây là 5 phòng gợi ý dành cho bạn:
                </p>
              </div>
            )}

            {!isLoading && rooms.length > 0 && (
              <div className="search-grid room-search-llm-grid">
                {rooms.map((listing) => (
                  <div
                    key={listing.id}
                    className={
                      selectedId === listing.id
                        ? "room-search-llm-card--selected"
                        : ""
                    }
                    onMouseEnter={() => setSelectedId(listing.id)}
                  >
                    <ListingCard
                      listing={listing}
                      saved={savedIds.includes(Number(listing.id))}
                      onToggleSave={(id) => toggleSave(id)}
                    />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && totalPages > 1 && !isFallback && (
              <div
                className="search-pagination"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "24px",
                }}
              >
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #dbe2ea",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    opacity: page === 1 ? 0.5 : 1,
                  }}
                >
                  ←
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      style={{
                        minWidth: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        border:
                          p === page
                            ? "1px solid #2563eb"
                            : "1px solid #dbe2ea",
                        backgroundColor: p === page ? "#2563eb" : "#fff",
                        color: p === page ? "#fff" : "#1f2937",
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, page + 1))
                  }
                  disabled={page === totalPages}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #dbe2ea",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    opacity: page === totalPages ? 0.5 : 1,
                  }}
                >
                  →
                </button>
              </div>
            )}
          </div>

          <aside className="room-search-llm-map-panel">
            <h3 className="room-search-llm-map-title">Bản đồ</h3>
            <OpenMapView
              rooms={rooms}
              selectedId={selectedId}
              onSelectRoom={setSelectedId}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
