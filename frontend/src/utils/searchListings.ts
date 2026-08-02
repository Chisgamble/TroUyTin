export type NumericRange = { min: number; max: number };

export type SearchFilters = {
  query: string;
  provinceId: number;
  districtId: number;
  roomType: string;
  price: NumericRange;
  area: NumericRange;
};

type LocationListingCandidate = {
  province_id?: number | null;
  province_name?: string;
  district_id?: number | null;
  district_name?: string;
};

type SearchListingCandidate = LocationListingCandidate & {
  status: string;
  title?: string;
  description?: string;
  address_detail?: string;
  room_type: string;
  price: number;
  area: number;
};

export type ProvinceOption = { id: number; name: string };
export type DistrictOption = { id: number; provinceId: number; name: string };

export type Pagination<T> = {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
};

export function deriveProvinceOptions(
  listings: readonly LocationListingCandidate[],
): ProvinceOption[] {
  const provinces = new Map<number, ProvinceOption>();

  for (const listing of listings) {
    const id = listing.province_id;
    const name = listing.province_name?.trim();
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0 || !name) continue;
    if (!provinces.has(id)) provinces.set(id, { id, name });
  }

  return [...provinces.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "vi-VN"),
  );
}

export function deriveDistrictOptions(
  listings: readonly LocationListingCandidate[],
  provinceId: number,
): DistrictOption[] {
  const districts = new Map<number, DistrictOption>();

  for (const listing of listings) {
    if (listing.province_id !== provinceId) continue;
    const id = listing.district_id;
    const name = listing.district_name?.trim();
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0 || !name) continue;
    if (!districts.has(id)) districts.set(id, { id, provinceId, name });
  }

  return [...districts.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "vi-VN"),
  );
}

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
