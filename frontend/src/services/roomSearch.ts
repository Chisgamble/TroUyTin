import { supabase } from "./supabase";
import type { RoomListing } from "../data/mockData";

export type RoomSearchFilter = {
  district_name: string | null;
  room_type: "PHONG_TRO" | "CAN_HO_MINI" | "KTX" | "NGUYEN_CAN" | null;
  price_min: number | null;
  price_max: number | null;
  area_min: number | null;
  area_max: number | null;
  keywords: string | null;
};

type DbRoomRow = {
  id: number;
  landlord_id: string;
  title: string;
  description: string | null;
  price: string;
  deposit: string | null;
  area: number;
  room_type: RoomListing["room_type"];
  ward_id: number | null;
  address_detail: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  is_verified: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  listing_images: { image_url: string; display_order: number }[] | null;
  wards: { name: string; districts: { name: string } | null } | null;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function parseSearchQueryWithLLM(
  query: string,
): Promise<RoomSearchFilter> {
  const res = await fetch(`${API_URL}/api/search/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Không thể phân tích câu tìm kiếm");
  }

  const data = await res.json();
  return data.filters as RoomSearchFilter;
}

async function resolveWardIdsByDistrict(
  districtName: string,
): Promise<number[]> {
  const { data: districts, error } = await supabase
    .from("districts")
    .select("id, name")
    .ilike("name", `%${districtName}%`);

  if (error || !districts?.length) return [];

  const districtIds = districts.map((d) => d.id);
  const { data: wards } = await supabase
    .from("wards")
    .select("id")
    .in("district_id", districtIds);

  return wards?.map((w) => w.id) ?? [];
}

function mapRowToListing(row: DbRoomRow): RoomListing {
  const images = (row.listing_images ?? [])
    .sort((a, b) => a.display_order - b.display_order)
    .map((img) => img.image_url);

  return {
    id: row.id,
    landlord_id: row.landlord_id,
    title: row.title,
    description: row.description ?? "",
    price: Number(row.price),
    deposit: row.deposit ? Number(row.deposit) : 0,
    area: row.area,
    room_type: row.room_type,
    ward_id: row.ward_id ?? 0,
    address_detail: row.address_detail ?? "",
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    status:
      row.status === "APPROVED"
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

export async function searchRoomsWithFilter(
  filters: RoomSearchFilter,
): Promise<RoomListing[]> {
  let query = supabase
    .from("room_listings")
    .select(
      `
      *,
      listing_images ( image_url, display_order ),
      wards ( name, districts ( name ) )
    `,
    )
    .eq("status", "AVAILABLE");

  if (filters.room_type) {
    query = query.eq("room_type", filters.room_type);
  }
  if (filters.price_min != null) {
    query = query.gte("price", filters.price_min);
  }
  if (filters.price_max != null) {
    query = query.lte("price", filters.price_max);
  }
  if (filters.area_min != null) {
    query = query.gte("area", filters.area_min);
  }
  if (filters.area_max != null) {
    query = query.lte("area", filters.area_max);
  }

  if (filters.district_name) {
    const wardIds = await resolveWardIdsByDistrict(filters.district_name);
    if (wardIds.length > 0) {
      query = query.in("ward_id", wardIds);
    } else {
      query = query.ilike("address_detail", `%${filters.district_name}%`);
    }
  }

  if (filters.keywords) {
    const kw = filters.keywords.trim();
    query = query.or(
      `title.ilike.%${kw}%,description.ilike.%${kw}%,address_detail.ilike.%${kw}%`,
    );
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbRoomRow[]).map(mapRowToListing);
}
