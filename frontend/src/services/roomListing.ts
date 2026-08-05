import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoomType =
  | "PHONG_TRO"
  | "CAN_HO_MINI"
  | "CAN_HO"
  | "NGUYEN_CAN"
  | "KTX";
export type ListingStatus = "PENDING" | "AVAILABLE" | "RENTED" | "HIDDEN";

export type Amenity = {
  id: number;
  name: string;
  icon: string | null;
};

export type Province = {
  id: number;
  name: string;
};

export type District = {
  id: number;
  provinceId: number;
  name: string;
};

export type Ward = {
  id: number;
  districtId: number;
  name: string;
};

// Phường/xã kèm tên quận-huyện và tỉnh-thành, dùng cho danh sách gợi ý.
export type WardSuggestion = {
  id: number;
  name: string;
  districtName: string;
  provinceName: string;
};

type WardProvinceRelation = { name: string | null };

type WardDistrictRelation = {
  name: string | null;
  provinces: WardProvinceRelation | WardProvinceRelation[] | null;
};

export type RoomListing = {
  id: number;
  landlordId: string;
  title: string;
  description: string | null;
  price: number;
  deposit: number | null;
  area: number;
  roomType: RoomType;
  wardId: number | null;
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ListingStatus;
  isVerified: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  wardName?: string;
  districtId?: number;
  districtName?: string;
  provinceId?: number;
  amenities?: Amenity[];
  imageUrls?: string[];
  imagePath?: string[];
};

export type CreateListingPayload = {
  landlordId: string;
  title: string;
  description?: string;
  price: number;
  deposit?: number | null;
  area: number;
  roomType: RoomType;
  wardId?: number | null;
  addressDetail?: string;
  amenityIds?: number[];
  imageUrls?: string[];
  imagePaths?: string[];
};

export type ListingSearchParams = {
  query?: string;
  districtId?: number;
  roomType?: RoomType;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
};

// ─── Amenities ────────────────────────────────────────────────────────────────
export async function getAmenities(): Promise<Amenity[]> {
  const { data, error } = await supabase
    .from("amenities")
    .select("*")
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
  }));
}

// ─── Geo ──────────────────────────────────────────────────────────────────────

export async function getProvinces(): Promise<Province[]> {
  const { data, error } = await supabase
    .from("provinces")
    .select("*")
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

export async function getDistricts(provinceId: number): Promise<District[]> {
  const { data, error } = await supabase
    .from("districts")
    .select("*")
    .eq("province_id", provinceId)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    provinceId: row.province_id,
    name: row.name,
  }));
}

export async function getWards(districtId: number): Promise<Ward[]> {
  const { data, error } = await supabase
    .from("wards")
    .select("*")
    .eq("district_id", districtId)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    districtId: row.district_id,
    name: row.name,
  }));
}

// Tìm phường/xã theo tên hoặc theo mã (id). Dùng cho ô gợi ý khi đăng tin.
export async function searchWards(
  keyword: string,
  limit = 20,
): Promise<WardSuggestion[]> {
  const term = keyword.trim();
  if (!term) return [];

  let query = supabase
    .from('wards')
    .select('id, name, districts(name, provinces(name))');

  // Nếu người dùng nhập số thì tra theo mã phường, ngược lại tìm theo tên.
  if (/^\d+$/.test(term)) {
    query = query.eq('id', Number(term));
  } else {
    query = query.ilike('name', `%${term}%`).order('name');
  }

  const { data, error } = await query.limit(limit);

  if (error) throw error;

  // PostgREST có thể trả quan hệ lồng dưới dạng object hoặc mảng, nên chuẩn hoá cả hai.
  const firstOf = <T,>(value: T | T[] | null | undefined): T | null => {
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };

  return (data ?? []).map((row) => {
    const district = firstOf(row.districts as WardDistrictRelation | WardDistrictRelation[] | null);
    const province = firstOf(district?.provinces);

    return {
      id: row.id as number,
      name: row.name as string,
      districtName: district?.name ?? '',
      provinceName: province?.name ?? '',
    };
  });
}

// ─── Listings ─────────────────────────────────────────────────────────────────

function sanitizeSearchKeyword(keyword: string): string {
  return keyword
    .replace(/[,()\.;:<>\[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchListings(
  params: ListingSearchParams,
): Promise<RoomListing[]> {
  let query = supabase
    .from("room_listings")
    .select(
      `
      *,
      wards (
        id,
        name,
        district_id,
        districts (
          id,
          name,
          province_id
        )
      ),
      listing_amenities (
        amenities (
          id,
          name,
          icon
        )
      ),
      listing_images (
        image_url,
        display_order
      )
    `,
    )
    .eq("status", "AVAILABLE");

  if (params.roomType) {
    query = query.eq("room_type", params.roomType);
  }

  if (params.districtId) {
    query = query.eq("wards.district_id", params.districtId);
  }

  if (params.minPrice != null) query = query.gte("price", params.minPrice);

  if (params.maxPrice != null && params.maxPrice !== Infinity)
    query = query.lt("price", params.maxPrice);

  if (params.minArea != null) query = query.gte("area", params.minArea);

  if (params.maxArea != null && params.maxArea !== Infinity)
    query = query.lt("area", params.maxArea);

  if (params.query?.trim()) {
    const safeQuery = sanitizeSearchKeyword(params.query);
    if (safeQuery) {
      const likePattern = `%${safeQuery}%`;
      query = query.or(
        `title.ilike.${likePattern},description.ilike.${likePattern},address_detail.ilike.${likePattern}`,
      );
    }
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) throw error;

  return (data ?? []).map(mapListingWithRelations);
}

export async function createListing(
  payload: CreateListingPayload,
): Promise<RoomListing> {
  // 1. Insert the listing row
  const { data: listing, error: listingError } = await supabase
    .from("room_listings")
    .insert({
      landlord_id: payload.landlordId,
      title: payload.title,
      description: payload.description ?? null,
      price: payload.price,
      deposit: payload.deposit ?? null,
      area: payload.area,
      room_type: payload.roomType,
      ward_id: payload.wardId ?? null,
      address_detail: payload.addressDetail ?? null,
      status: "AVAILABLE",
    })
    .select()
    .single();

  if (listingError) throw listingError;

  const listingId: number = listing.id;

  // 2. Insert amenities (listing_amenities junction)
  if (payload.amenityIds && payload.amenityIds.length > 0) {
    const { error: amenityError } = await supabase
      .from("listing_amenities")
      .insert(
        payload.amenityIds.map((amenityId) => ({
          listing_id: listingId,
          amenity_id: amenityId,
        })),
      );

    if (amenityError) throw amenityError;
  }

  // 3. Insert images (listing_images)
  if (payload.imageUrls && payload.imageUrls.length > 0) {
    const { error: imageError } = await supabase.from("listing_images").insert(
      payload.imageUrls.map((url, index) => ({
        listing_id: listingId,
        image_url: url,
        image_path: payload.imagePaths?.[index] ?? null,
        display_order: index,
      })),
    );

    if (imageError) throw imageError;
  }

  return mapListing(listing);
}

export async function updateListing(
  listingId: number,
  payload: Partial<CreateListingPayload>,
): Promise<RoomListing> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.description !== undefined)
    updateData.description = payload.description ?? null;
  if (payload.price !== undefined) updateData.price = payload.price;
  if (payload.deposit !== undefined)
    updateData.deposit = payload.deposit ?? null;
  if (payload.area !== undefined) updateData.area = payload.area;
  if (payload.roomType !== undefined) updateData.room_type = payload.roomType;
  if (payload.wardId !== undefined) updateData.ward_id = payload.wardId ?? null;
  if (payload.addressDetail !== undefined)
    updateData.address_detail = payload.addressDetail ?? null;

  const { data: listing, error: listingError } = await supabase
    .from("room_listings")
    .update(updateData)
    .eq("id", listingId)
    .select()
    .single();

  if (listingError) throw listingError;

  if (payload.amenityIds !== undefined) {
    await supabase
      .from("listing_amenities")
      .delete()
      .eq("listing_id", listingId);
    if (payload.amenityIds.length > 0) {
      const { error: amenityError } = await supabase
        .from("listing_amenities")
        .insert(
          payload.amenityIds.map((amenityId) => ({
            listing_id: listingId,
            amenity_id: amenityId,
          })),
        );
      if (amenityError) throw amenityError;
    }
  }

  if (payload.imageUrls !== undefined) {
    await supabase.from("listing_images").delete().eq("listing_id", listingId);
    if (payload.imageUrls.length > 0) {
      const { error: imageError } = await supabase
        .from("listing_images")
        .insert(
          payload.imageUrls.map((url, index) => ({
            listing_id: listingId,
            image_url: url,
            image_path: payload.imagePaths?.[index] ?? null,
            display_order: index,
          })),
        );
      if (imageError) throw imageError;
    }
  }

  return mapListing(listing);
}

export async function updateListingStatus(
  listingId: number,
  status: ListingStatus,
): Promise<void> {
  const { error } = await supabase
    .from("room_listings")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) throw error;
}

export async function getListing(
  listingId: number,
): Promise<RoomListing | null> {
  const { data, error } = await supabase
    .from("room_listings")
    .select(
      `
      *,
      wards (
        id,
        name,
        district_id,
        districts (
          id,
          name,
          province_id
        )
      ),
      listing_amenities ( amenity_id, amenities ( id, name, icon ) ),
      listing_images ( image_url, display_order )
    `,
    )
    .eq("id", listingId)
    .single();

  if (error) throw error;
  if (!data) return null;

  return mapListingWithRelations(data);
}

export async function getListingsByLandlord(
  landlordId: string,
): Promise<RoomListing[]> {
  const { data, error } = await supabase
    .from("room_listings")
    .select(
      `
      *,
      wards (
        id,
        name,
        district_id,
        districts (
          id,
          name,
          province_id
        )
      ),
      listing_amenities ( amenity_id, amenities ( id, name, icon ) ),
      listing_images ( image_url, display_order )
    `,
    )
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapListingWithRelations);
}

export async function uploadListingImage(file: File): Promise<{
  publicUrl: string;
  path: string;
}> {
  const ext = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${ext}`;
  const path = `listings/${fileName}`;

  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("listing-images").getPublicUrl(path);

  return {
    publicUrl: data.publicUrl,
    path,
  };
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapListing(row: Record<string, unknown>): RoomListing {
  return {
    id: row.id as number,
    landlordId: row.landlord_id as string,
    title: row.title as string,
    description: row.description as string | null,
    price: row.price as number,
    deposit: row.deposit as number | null,
    area: row.area as number,
    roomType: row.room_type as RoomType,
    wardId: row.ward_id as number | null,
    addressDetail: row.address_detail as string | null,
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    status: row.status as ListingStatus,
    isVerified: row.is_verified as boolean,
    viewCount: row.view_count as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapListingWithRelations(row: Record<string, unknown>): RoomListing {
  const base = mapListing(row);

  const amenityRows =
    (row.listing_amenities as
      | { amenities: { id: number; name: string; icon: string | null } }[]
      | null) ?? [];
  const imageRows =
    (row.listing_images as
      | { image_url: string; display_order: number }[]
      | null) ?? [];

  return {
    ...base,
    wardName: (row.wards as any)?.name,
    districtId: (row.wards as any)?.district_id,
    districtName: (row.wards as any)?.districts?.name,
    provinceId: (row.wards as any)?.districts?.province_id,
    amenities: amenityRows
      .filter((r) => r.amenities)
      .map((r) => ({
        id: r.amenities.id,
        name: r.amenities.name,
        icon: r.amenities.icon,
      })),
    imageUrls: imageRows
      .sort((a, b) => a.display_order - b.display_order)
      .map((r) => r.image_url),
  };
}

export async function isListingSaved(userId: string, listingId: number) {
  const { data, error } = await supabase
    .from("saved_listings")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (error) throw error;

  return !!data;
}

// save
export async function saveListing(userId: string, listingId: number) {
  const { error } = await supabase.from("saved_listings").insert({
    user_id: userId,
    listing_id: listingId,
  });

  if (error) throw error;
}

// unsave
export async function unsaveListing(userId: string, listingId: number) {
  const { error } = await supabase
    .from("saved_listings")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  if (error) throw error;
}

export async function getSavedListingIds(userId: string): Promise<number[]> {
  const { data, error } = await supabase
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).map((row) => row.listing_id);
}

export async function getSavedListings(userId: string): Promise<RoomListing[]> {
  const { data, error } = await supabase
    .from("saved_listings")
    .select(
      `
      listing_id,
      room_listings (
        *,
        listing_amenities (
          amenities (
            id,
            name,
            icon
          )
        ),
        listing_images (
          image_url,
          display_order
        )
      )
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? [])
    .map((row: any) => row.room_listings)
    .filter(Boolean)
    .map(mapListingWithRelations);
}
