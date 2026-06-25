import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/axios";

type Room = {
  id?: string;
  title?: string;
  description?: string;
  price?: number;
  district?: string;
  ward?: string;
  amenities?: string[];
  image?: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
  matchScore?: number;
  matchReason?: string;
};

declare global {
  interface Window {
    L?: any;
  }
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | number | null>(
    null,
  );

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const markersRef = useRef<Record<string | number, any>>({});

  const navigate = useNavigate();

  const mapCenter = useMemo(() => [10.7769, 106.70098] as [number, number], []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    mapInstanceRef.current = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: 12,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    markerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerGroupRef.current = null;
      }
    };
  }, [mapCenter]);

  useEffect(() => {
    // Initialize map here if Leaflet loaded late
    const L = window.L;
    if (!mapInstanceRef.current && mapContainerRef.current && L) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: mapCenter,
        zoom: 12,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      markerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    if (!mapInstanceRef.current || !markerGroupRef.current) return;

    // Cleanup existing markers
    markerGroupRef.current.clearLayers();
    markersRef.current = {};

    const bounds: [number, number][] = [];

    rooms.forEach((room, index) => {
      const lat = room.latitude;
      const lng = room.longitude;
      const roomKey = room.id ?? index;

      if (typeof lat !== "number" || typeof lng !== "number") return;

      const marker = L.marker([lat, lng]);
      const priceText =
        typeof room.price === "number"
          ? room.price.toLocaleString("vi-VN") + " đ"
          : "Giá chưa rõ";

      marker
        .bindPopup(
          `<div class="popup-card"><strong>${room.title || "Phòng trọ"}</strong><br/>${priceText}</div>`,
        )
        .addTo(markerGroupRef.current);

      marker.on("click", () => setActiveRoomId(roomKey));

      markersRef.current[roomKey] = marker;
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      try {
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
        });
      } catch (err) {
        const first = bounds[0];
        if (first && mapInstanceRef.current.flyTo) {
          mapInstanceRef.current.flyTo(first, 13, {
            animate: true,
            duration: 1,
          });
        }
      }
    }

    if (
      mapInstanceRef.current &&
      typeof mapInstanceRef.current.invalidateSize === "function"
    ) {
      setTimeout(() => mapInstanceRef.current.invalidateSize(), 200);
    }
  }, [rooms]);

  useEffect(() => {
    if (activeRoomId === null || !mapInstanceRef.current) return;
    const marker = markersRef.current[activeRoomId];
    if (!marker) return;

    mapInstanceRef.current.flyTo(marker.getLatLng(), 15, {
      animate: true,
      duration: 0.8,
    });
    marker.openPopup();
  }, [activeRoomId]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) {
      setError("Vui lòng nhập truy vấn tìm kiếm.");
      return;
    }

    setLoading(true);
    setError(null);
    setRooms([]);
    setActiveRoomId(null);

    try {
      const res = await api.post("/api/rooms/ai-search", { query: trimmed });
      if (!res.data?.success || !Array.isArray(res.data.data)) {
        throw new Error("Dữ liệu trả về không hợp lệ.");
      }
      setRooms(res.data.data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể kết nối tới dịch vụ tìm kiếm.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: unknown) => {
    if (typeof price === "number") {
      return price.toLocaleString("vi-VN") + " đ";
    }
    return String(price ?? "Giá liên hệ");
  };

  const handleRoomClick = (room: Room, index: number) => {
    const roomKey = room.id ?? index;
    setActiveRoomId(roomKey);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input
              className="flex-1 min-w-0 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-base shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Tìm phòng theo khu vực, giá, tiện ích..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "AI đang tìm..." : "Tìm kiếm"}
            </button>
          </form>
          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-500">
              Nhập câu hỏi như "Tìm phòng Bình Thạnh dưới 3 triệu có ban công".
            </div>
          )}
        </div>

        <div className="grid min-h-[calc(100vh-220px)] gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-100 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Kết quả tìm kiếm</p>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {rooms.length} phòng được tìm thấy
                  </h2>
                </div>
                <div className="rounded-2xl bg-blue-50 px-4 py-2 text-sm text-blue-700">
                  {loading ? "Đang tải..." : "Cập nhật theo truy vấn"}
                </div>
              </div>
            </div>
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-5">
              {rooms.length === 0 && !loading ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center text-slate-500">
                  Chưa có kết quả. Hãy tìm kiếm một khu vực hoặc tiện ích.
                </div>
              ) : null}
              {rooms.map((room, index) => {
                const roomKey = room.id ?? index;
                const isActive = activeRoomId === roomKey;
                return (
                  <button
                    key={roomKey}
                    type="button"
                    onClick={() => handleRoomClick(room, index)}
                    className={`mb-4 w-full rounded-[1.75rem] border p-4 text-left shadow-sm transition ${
                      isActive
                        ? "border-blue-500 bg-blue-50 shadow-blue-100/80"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                      <div className="h-28 overflow-hidden rounded-3xl bg-slate-100">
                        <img
                          src={
                            room.image ||
                            room.photo ||
                            "https://via.placeholder.com/320x224?text=Room"
                          }
                          alt={room.title || "Phòng trọ"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                            {room.ward ? `${room.ward}, ` : ""}
                            {room.district || ""}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900">
                            {room.title || room.description || "Phòng trọ"}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(room.amenities || []).slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                          <span>{formatPrice(room.price)}</span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {room.matchReason || "Phù hợp"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {room.latitude && room.longitude
                            ? "Đã có vị trí trên bản đồ"
                            : "Chưa có vị trí trên bản đồ"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
            style={{ minHeight: "calc(100vh - 220px)" }}
          >
            <div className="border-b border-slate-200 bg-slate-100 px-5 py-4">
              <h2 className="text-xl font-semibold text-slate-900">Bản đồ</h2>
            </div>
            <div
              ref={mapContainerRef}
              style={{ height: "calc(100vh - 220px)", width: "100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
