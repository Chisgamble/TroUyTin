export type ProfileRole =
  | "TENANT"
  | "LANDLORD"
  | "ROOMMATE_SEEKER"
  | "BROKER"
  | "ADMIN";

export type RoomType = "PHONG_TRO" | "CAN_HO_MINI" | "KTX" | "NGUYEN_CAN";

export type RoomStatus = "AVAILABLE" | "RENTED" | "PENDING" | "HIDDEN";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: ProfileRole;
  is_verified: boolean;
  is_active?: boolean;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ListingImage {
  id: number;
  listing_id: number;
  image_url: string;
  display_order: number;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string;
}

export interface ListingAmenity {
  id: number;
  listing_id: number;
  amenity_id: number;
}

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface District {
  id: number;
  province_id: number;
  name: string;
}

export interface Ward {
  id: number;
  district_id: number;
  name: string;
}

export interface RoomListing {
  id: number;
  landlord_id: string;
  title: string;
  description: string;
  price: number;
  deposit: number;
  area: number;
  room_type: RoomType;
  ward_id: number;
  address_detail: string;
  latitude: number;
  longitude: number;
  status: RoomStatus;
  is_verified: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  images: string[];
  amenities?: Amenity[];
  amenity_ids: number[];
  district_name: string;
  ward_name: string;
  landlord?: Profile;
}

export interface Review {
  id: number;
  reviewer_id: string;
  reviewee_id: string;
  listing_id: number | null;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: Profile;
}

export interface RoomListingDbRow {
  id: number;
  landlord_id: string;
  title: string;
  description: string | null;
  price: number | string;
  deposit: number | string | null;
  area: number;
  room_type: RoomType;
  ward_id: number | null;
  address_detail: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  is_verified: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  listing_images: ListingImage[] | null;
  wards: {
    name: string;
    districts: { name: string } | null;
  } | null;
}
