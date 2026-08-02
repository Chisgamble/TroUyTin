import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveDistrictOptions,
  deriveProvinceOptions,
  filterListings,
  paginateListings,
  selectLocationOptions,
} from "./searchListings.ts";

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

const locationListings = [
  { province_id: 2, province_name: "Cần Thơ", district_id: 21, district_name: "Cái Răng" },
  { province_id: 1, province_name: "Hồ Chí Minh", district_id: 12, district_name: "Quận 7" },
  { province_id: 1, province_name: "Hồ Chí Minh", district_id: 11, district_name: "Bình Thạnh" },
  { province_id: 1, province_name: "Hồ Chí Minh", district_id: 11, district_name: "Bình Thạnh" },
  { province_id: null, province_name: "Thiếu mã", district_id: null, district_name: "" },
  { province_id: 3, province_name: " ", district_id: 31, district_name: "Không hợp lệ" },
];

test("derives unique provinces in Vietnamese name order from usable listing locations", () => {
  const result = deriveProvinceOptions(locationListings);

  assert.deepEqual(result, [
    { id: 2, name: "Cần Thơ" },
    { id: 1, name: "Hồ Chí Minh" },
  ]);
});

test("derives only the selected province's unique districts in Vietnamese name order", () => {
  const result = deriveDistrictOptions(locationListings, 1);

  assert.deepEqual(result, [
    { id: 11, provinceId: 1, name: "Bình Thạnh" },
    { id: 12, provinceId: 1, name: "Quận 7" },
  ]);
});

test("uses room-derived location options only when the fulfilled catalog is empty", () => {
  const catalog = [{ id: 1, name: "Hồ Chí Minh" }];
  const roomDerived = [{ id: 2, name: "Cần Thơ" }];

  assert.deepEqual(selectLocationOptions(catalog, roomDerived), catalog);
  assert.deepEqual(selectLocationOptions([], roomDerived), roomDerived);
});
