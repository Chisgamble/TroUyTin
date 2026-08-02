import test from "node:test";
import assert from "node:assert/strict";
import { filterListings, paginateListings } from "./searchListings.ts";

const listings = [
  { id: 1, status: "AVAILABLE", title: "A", description: "", address_detail: "", district_name: "Quận 1", province_id: 1, district_id: 10, room_type: "PHONG_TRO", price: 2_000_000, area: 20 },
  { id: 2, status: "AVAILABLE", title: "B", description: "", address_detail: "", district_name: "Ninh Kiều", province_id: 2, district_id: 20, room_type: "KTX", price: 3_000_000, area: 25 },
];

const allFilters = {
  query: "",
  provinceId: 0,
  districtId: 0,
  roomType: "",
  price: { min: 0, max: Infinity },
  area: { min: 0, max: Infinity },
};

test("filters by province before an optional district", () => {
  assert.deepEqual(filterListings(listings, { ...allFilters, provinceId: 1 }).map(({ id }) => id), [1]);
  assert.deepEqual(filterListings(listings, { ...allFilters, provinceId: 2, districtId: 20 }).map(({ id }) => id), [2]);
});

test("paginates nine items and clamps an invalid page", () => {
  const result = paginateListings(Array.from({ length: 20 }, (_, id) => id + 1), 99, 9);
  assert.equal(result.totalPages, 3);
  assert.equal(result.currentPage, 3);
  assert.deepEqual(result.items, [19, 20]);
});
