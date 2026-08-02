export type NumericRange = { min: number; max: number };

export type SearchFilters = {
  query: string;
  provinceId: number;
  districtId: number;
  roomType: string;
  price: NumericRange;
  area: NumericRange;
};

type SearchListingCandidate = {
  status: string;
  title?: string;
  description?: string;
  address_detail?: string;
  district_name?: string;
  province_id?: number | null;
  district_id?: number | null;
  room_type: string;
  price: number;
  area: number;
};

export type Pagination<T> = {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
};

export function filterListings<T extends SearchListingCandidate>(
  listings: readonly T[],
  filters: SearchFilters,
): T[] {
  const query = filters.query.trim().toLocaleLowerCase("vi-VN");
  return listings.filter((listing) => {
    if (listing.status !== "AVAILABLE") return false;
    if (query && ![listing.title, listing.description, listing.address_detail, listing.district_name]
      .some((value) => value?.toLocaleLowerCase("vi-VN").includes(query))) return false;
    if (filters.provinceId > 0 && listing.province_id !== filters.provinceId) return false;
    if (filters.districtId > 0 && listing.district_id !== filters.districtId) return false;
    if (filters.roomType && listing.room_type !== filters.roomType) return false;
    if (listing.price < filters.price.min || listing.price >= filters.price.max) return false;
    if (listing.area < filters.area.min || listing.area >= filters.area.max) return false;
    return true;
  });
}

export function paginateListings<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize = 9,
): Pagination<T> {
  const totalPages = Math.ceil(items.length / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(Math.max(requestedPage, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), currentPage, totalPages, totalItems: items.length };
}
