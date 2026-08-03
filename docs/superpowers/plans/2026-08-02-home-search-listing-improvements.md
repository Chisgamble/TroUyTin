# Home, Search, and Listing Detail Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two five-item home listing sections, listing freshness information, dependent location filters, independent filter scrolling, and nine-item search pagination.

**Architecture:** Keep the current hybrid data flow: the home and location catalogs use Supabase, while search room data continues through `GET /api/rooms`. Extract deterministic selection, filtering, pagination, and date formatting into focused utilities so behavior is covered with Node's built-in test runner before React components consume it.

**Tech Stack:** React 19, TypeScript 6, React Router 7, TanStack Query 5, Supabase JS, Express 5, Drizzle ORM, Node 22 test runner, CSS.

## Global Constraints

- Use branch `feat/home-search-listing-improvements`.
- Do not add a database migration or new third-party dependency.
- Keep public routes `/`, `/tim-kiem`, and `/phong/:id` unchanged.
- Use exactly five listings per home section and nine listings per search page.
- Treat the two home sections independently, allowing the same listing in both.
- Hide `Đã xác minh` only on search-result cards.
- Format update timestamps in `Asia/Ho_Chi_Minh` as `HH:mm, dd/MM/yyyy`.

---

## File Structure

- `frontend/src/utils/homeListings.ts`: newest-first home section selection.
- `frontend/src/utils/homeListings.test.ts`: verified-listing and verified-landlord selection tests.
- `frontend/src/utils/searchListings.ts`: deterministic local filtering and pagination.
- `frontend/src/utils/searchListings.test.ts`: location filtering and pagination tests.
- `frontend/src/utils/dateTime.ts`: safe Vietnam-time listing timestamp formatting.
- `frontend/src/utils/dateTime.test.ts`: valid and invalid timestamp tests.
- `frontend/src/types/index.ts`: shared listing location and landlord projection fields.
- `backend/src/routes/room.routes.ts`: include stable province and district identifiers in room responses.
- `frontend/src/pages/HomePage.tsx`: load landlord verification and render both sections.
- `frontend/src/components/ListingCard.tsx`: opt-in detail action and opt-out verification badge.
- `frontend/src/components/ListingCard.css`: detail-action styling.
- `frontend/src/pages/HomePage.css`: two-section spacing and five-column desktop layout.
- `frontend/src/pages/SearchResultsPage.tsx`: database-backed dependent location filters and pagination controls.
- `frontend/src/pages/SearchResultsPage.css`: independent sidebar scrolling and pagination styling.
- `frontend/src/pages/ListingDetailPage.tsx`: render formatted last-updated information.
- `frontend/src/pages/ListingDetailPage.css`: timestamp styling.
- `frontend/package.json`: repeatable built-in Node test command.

### Task 1: Home Listing Selection

**Files:**
- Create: `frontend/src/utils/homeListings.test.ts`
- Create: `frontend/src/utils/homeListings.ts`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: candidates with `created_at`, `is_verified`, and optional `landlord.is_verified`.
- Produces: `selectHomeListings<T>(listings: readonly T[], limit?: number): { featured: T[]; verifiedLandlords: T[] }`.

- [ ] **Step 1: Write the failing selection tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { selectHomeListings } from "./homeListings.ts";

type Candidate = {
  id: number;
  created_at: string;
  is_verified: boolean;
  landlord?: { is_verified: boolean };
};

const candidate = (
  id: number,
  isVerified: boolean,
  landlordVerified: boolean,
): Candidate => ({
  id,
  is_verified: isVerified,
  landlord: { is_verified: landlordVerified },
  created_at: `2026-08-${String(id).padStart(2, "0")}T00:00:00.000Z`,
});

test("selects the five newest verified listings", () => {
  const listings = Array.from({ length: 7 }, (_, index) =>
    candidate(index + 1, true, false),
  );
  assert.deepEqual(selectHomeListings(listings).featured.map(({ id }) => id), [7, 6, 5, 4, 3]);
});

test("selects verified-landlord listings independently", () => {
  const shared = candidate(3, true, true);
  const result = selectHomeListings([
    candidate(1, true, false),
    candidate(2, false, true),
    shared,
  ]);
  assert.deepEqual(result.featured.map(({ id }) => id), [3, 1]);
  assert.deepEqual(result.verifiedLandlords.map(({ id }) => id), [3, 2]);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run from `frontend`: `node --test src/utils/homeListings.test.ts`

Expected: FAIL because `./homeListings.ts` does not exist.

- [ ] **Step 3: Implement the minimal selector**

```ts
type HomeListingCandidate = {
  created_at: string;
  is_verified: boolean;
  landlord?: { is_verified: boolean };
};

export function selectHomeListings<T extends HomeListingCandidate>(
  listings: readonly T[],
  limit = 5,
) {
  const newestFirst = [...listings].sort(
    (left, right) => Date.parse(right.created_at) - Date.parse(left.created_at),
  );

  return {
    featured: newestFirst.filter((listing) => listing.is_verified).slice(0, limit),
    verifiedLandlords: newestFirst
      .filter((listing) => listing.landlord?.is_verified)
      .slice(0, limit),
  };
}
```

- [ ] **Step 4: Add the repeatable test script and verify GREEN**

Add to `frontend/package.json`:

```json
"test": "node --test src/utils/homeListings.test.ts src/utils/searchListings.test.ts src/utils/dateTime.test.ts"
```

Run from `frontend`: `node --test src/utils/homeListings.test.ts`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the selector**

```bash
git add frontend/package.json frontend/src/utils/homeListings.ts frontend/src/utils/homeListings.test.ts
git commit -m "test: cover home listing selection"
```

### Task 2: Search Filtering and Pagination Utilities

**Files:**
- Create: `frontend/src/utils/searchListings.test.ts`
- Create: `frontend/src/utils/searchListings.ts`

**Interfaces:**
- Consumes: `SearchFilters` containing query, province ID, district ID, room type, and numeric price/area bounds.
- Produces: `filterListings<T>(listings: readonly T[], filters: SearchFilters): T[]` and `paginateListings<T>(items: readonly T[], requestedPage: number, pageSize?: number): Pagination<T>`.

- [ ] **Step 1: Write failing filter and pagination tests**

```ts
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
```

- [ ] **Step 2: Run the test and verify RED**

Run from `frontend`: `node --test src/utils/searchListings.test.ts`

Expected: FAIL because `./searchListings.ts` does not exist.

- [ ] **Step 3: Implement minimal pure filtering and pagination**

```ts
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
) {
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

export function paginateListings<T>(items: readonly T[], requestedPage: number, pageSize = 9): Pagination<T> {
  const totalPages = Math.ceil(items.length / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(Math.max(requestedPage, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), currentPage, totalPages, totalItems: items.length };
}
```

- [ ] **Step 4: Run the utility tests and verify GREEN**

Run from `frontend`: `node --test src/utils/searchListings.test.ts`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the utilities**

```bash
git add frontend/src/utils/searchListings.ts frontend/src/utils/searchListings.test.ts
git commit -m "test: cover search filters and pagination"
```

### Task 3: Stable Location Data Contract

**Files:**
- Modify: `backend/src/routes/room.routes.ts:4-88`
- Modify: `frontend/src/types/index.ts:66-130`

**Interfaces:**
- Consumes: Drizzle `wards -> districts -> provinces` relationship.
- Produces: `district_id`, `province_id`, and `province_name` in every `GET /api/rooms` item, plus compatible frontend fields.

- [ ] **Step 1: Extend the frontend listing types**

Add these fields to `RoomListing`:

```ts
district_id?: number | null;
province_id?: number | null;
province_name?: string;
```

Add this projection to `RoomListingDbRow`:

```ts
landlord_info?: Pick<Profile, "is_verified"> | null;
```

Replace its nested district shape with:

```ts
districts: {
  id: number;
  name: string;
  province_id: number;
  provinces: { name: string } | null;
} | null;
```

- [ ] **Step 2: Extend the room API query**

Import `provinces`, select `districtId`, `provinceId`, and `provinceName`, join provinces with `eq(districts.provinceId, provinces.id)`, and return snake-case fields in the formatted response.

- [ ] **Step 3: Verify the contract compiles**

Run from `backend`: `npm.cmd run build`

Expected: TypeScript build exits 0.

Run from `frontend`: `npm.cmd run build`

Expected: TypeScript/Vite build exits 0 before consumers are changed.

- [ ] **Step 4: Commit the contract**

```bash
git add backend/src/routes/room.routes.ts frontend/src/types/index.ts
git commit -m "feat: expose listing location identifiers"
```

### Task 4: Home Sections and Card Actions

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx:14-225`
- Modify: `frontend/src/pages/HomePage.css:117-168`
- Modify: `frontend/src/components/ListingCard.tsx:5-91`
- Modify: `frontend/src/components/ListingCard.css`

**Interfaces:**
- Consumes: `selectHomeListings`, nested `landlord_info.is_verified`, `showVerifiedBadge`, and `showDetailsAction`.
- Produces: two independent five-item sections and explicit detail actions.

- [ ] **Step 1: Add presentation options to `ListingCard`**

Add props with preserving defaults:

```ts
showVerifiedBadge?: boolean;
showDetailsAction?: boolean;
```

Default `showVerifiedBadge` to `true` and `showDetailsAction` to `false`. Render the verification badge only when both the option and listing flag are true. Render a visually button-like `Xem chi tiết` affordance inside the existing card link when enabled, avoiding nested interactive elements.

- [ ] **Step 2: Enrich and classify home data**

Extend the Supabase select with `landlord_info:profiles(is_verified)`, map it to `listing.landlord`, call `selectHomeListings(rooms)`, and render both `featured` and `verifiedLandlords`. Pass `showDetailsAction` to all home cards.

- [ ] **Step 3: Style the expanded home content**

Use shared section styles, bottom padding for the second section, a five-column desktop grid, and existing responsive breakpoints for smaller screens. Add visible hover/focus styling to the detail action.

- [ ] **Step 4: Verify selector regression and frontend compilation**

Run from `frontend`: `node --test src/utils/homeListings.test.ts`

Expected: 2 tests pass.

Run from `frontend`: `npm.cmd run build`

Expected: build exits 0.

- [ ] **Step 5: Commit the home UI**

```bash
git add frontend/src/pages/HomePage.tsx frontend/src/pages/HomePage.css frontend/src/components/ListingCard.tsx frontend/src/components/ListingCard.css
git commit -m "feat: expand verified home listings"
```

### Task 5: Dependent Location Filters and Search Pagination

**Files:**
- Modify: `frontend/src/pages/SearchResultsPage.tsx:1-281`
- Modify: `frontend/src/pages/SearchResultsPage.css:1-232`

**Interfaces:**
- Consumes: `getProvinces`, `getDistricts`, `filterListings`, and `paginateListings`.
- Produces: province-first filtering, dependent district options, nine-card pages, and a search-only hidden verification badge.

- [ ] **Step 1: Load database-backed locations**

Replace `DISTRICTS` with `Province[]` and `District[]` state. Load provinces once, clear district state immediately on province change, then load only that province's districts. Keep the district select disabled when `provinceId === 0` or while loading districts. Render a concise location error without hiding room results.

```ts
const [provinceId, setProvinceId] = useState(0);
const [districtId, setDistrictId] = useState(0);
const [provinces, setProvinces] = useState<Province[]>([]);
const [districts, setDistricts] = useState<District[]>([]);
const [locationError, setLocationError] = useState<string | null>(null);
const [loadingDistricts, setLoadingDistricts] = useState(false);

useEffect(() => {
  getProvinces()
    .then(setProvinces)
    .catch(() => setLocationError("Không thể tải danh sách tỉnh/thành phố."));
}, []);

const handleProvinceChange = async (nextProvinceId: number) => {
  setProvinceId(nextProvinceId);
  setDistrictId(0);
  setDistricts([]);
  setLocationError(null);
  if (nextProvinceId === 0) return;
  setLoadingDistricts(true);
  try {
    setDistricts(await getDistricts(nextProvinceId));
  } catch {
    setLocationError("Không thể tải danh sách quận/huyện.");
  } finally {
    setLoadingDistricts(false);
  }
};
```

- [ ] **Step 2: Use pure filtering and pagination**

Build `SearchFilters` from current controls, call `filterListings`, then `paginateListings(results, currentPage, 9)`. Reset the page to 1 whenever query or any filter changes. Render only `pagination.items`.

```ts
const results = filterListings(rooms, {
  query,
  provinceId,
  districtId,
  roomType,
  price: PRICE_RANGES[priceIdx],
  area: AREA_RANGES[areaIdx],
});
const pagination = paginateListings(results, currentPage, 9);

useEffect(() => {
  setCurrentPage(1);
}, [query, provinceId, districtId, roomType, priceIdx, areaIdx]);
```

- [ ] **Step 3: Render accessible pagination and search-card options**

Render previous, numbered, and next buttons only when `totalPages > 1`, with `aria-current="page"` on the active page and disabled boundary controls. Pass `showVerifiedBadge={false}` to search `ListingCard` instances.

- [ ] **Step 4: Make the filter independently scrollable**

At desktop width, use `max-height: calc(100vh - 112px)`, `overflow-y: auto`, and `overscroll-behavior: contain` on `.search-sidebar`. At the existing 1024px breakpoint, restore `max-height: none` and `overflow: visible`. Add pagination layout, hover, focus, active, and disabled states.

- [ ] **Step 5: Verify utility tests and build**

Run from `frontend`: `node --test src/utils/searchListings.test.ts`

Expected: 2 tests pass.

Run from `frontend`: `npm.cmd run build`

Expected: build exits 0.

- [ ] **Step 6: Commit search improvements**

```bash
git add frontend/src/pages/SearchResultsPage.tsx frontend/src/pages/SearchResultsPage.css
git commit -m "feat: improve room search filters and pagination"
```

### Task 6: Listing Last-Updated Information

**Files:**
- Create: `frontend/src/utils/dateTime.test.ts`
- Create: `frontend/src/utils/dateTime.ts`
- Modify: `frontend/src/pages/ListingDetailPage.tsx:1-425`
- Modify: `frontend/src/pages/ListingDetailPage.css`

**Interfaces:**
- Consumes: ISO `listing.updated_at`.
- Produces: `formatListingUpdatedAt(value?: string | null): string` and visible `Cập nhật lần cuối` metadata.

- [ ] **Step 1: Write failing date-format tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { formatListingUpdatedAt } from "./dateTime.ts";

test("formats listing updates in Vietnam time", () => {
  assert.equal(formatListingUpdatedAt("2026-08-02T10:30:00.000Z"), "17:30, 02/08/2026");
});

test("falls back for missing or invalid timestamps", () => {
  assert.equal(formatListingUpdatedAt(undefined), "Không rõ");
  assert.equal(formatListingUpdatedAt("invalid"), "Không rõ");
});
```

- [ ] **Step 2: Run the test and verify RED**

Run from `frontend`: `node --test src/utils/dateTime.test.ts`

Expected: FAIL because `./dateTime.ts` does not exist.

- [ ] **Step 3: Implement deterministic formatting**

Validate the timestamp with `Date.parse`, then use `Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric", hour12: false })`. Use `formatToParts` to construct the exact `HH:mm, dd/MM/yyyy` order and return `Không rõ` for invalid input.

- [ ] **Step 4: Render and style the metadata**

Import the utility in `ListingDetailPage.tsx` and render `Cập nhật lần cuối: {formatListingUpdatedAt(listing.updated_at)}` above the description. Style it as muted secondary metadata with sufficient contrast.

- [ ] **Step 5: Verify date tests and build**

Run from `frontend`: `node --test src/utils/dateTime.test.ts`

Expected: 2 tests pass.

Run from `frontend`: `npm.cmd run build`

Expected: build exits 0.

- [ ] **Step 6: Commit listing freshness information**

```bash
git add frontend/src/utils/dateTime.ts frontend/src/utils/dateTime.test.ts frontend/src/pages/ListingDetailPage.tsx frontend/src/pages/ListingDetailPage.css
git commit -m "feat: show listing update time"
```

### Task 7: Full Verification and Focused Cleanup

**Files:**
- Modify only files already in scope if verification finds a regression.

**Interfaces:**
- Consumes: all deliverables from Tasks 1-6.
- Produces: a clean branch with passing tests and builds.

- [ ] **Step 1: Run all frontend utility tests**

Run from `frontend`: `npm.cmd test`

Expected: all six tests pass.

- [ ] **Step 2: Run static verification**

Run from `frontend`: `npm.cmd run lint`

Expected: no new errors introduced by in-scope files. Record unrelated pre-existing failures separately if the repository baseline is not clean.

Run from `frontend`: `npm.cmd run build`

Expected: TypeScript and Vite build exit 0.

Run from `backend`: `npm.cmd run build`

Expected: TypeScript build exits 0.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff --check` and `git diff main...HEAD --stat`.

Expected: no whitespace errors and only spec, plan, tests, and files named in this plan are changed.

- [ ] **Step 4: Perform manual visual checks when runtime configuration is available**

Verify desktop and mobile layouts, five-item home limits, both detail actions, `/phong/:id` update time, province-to-district dependency, independent filter scrolling, search badge removal, and pagination boundary behavior.

- [ ] **Step 5: Commit any verification-only cleanup**

If verification required edits, stage only the complete in-scope set; unchanged paths are ignored by Git:

```bash
git add backend/src/routes/room.routes.ts frontend/package.json frontend/src/types/index.ts frontend/src/utils/homeListings.ts frontend/src/utils/homeListings.test.ts frontend/src/utils/searchListings.ts frontend/src/utils/searchListings.test.ts frontend/src/utils/dateTime.ts frontend/src/utils/dateTime.test.ts frontend/src/pages/HomePage.tsx frontend/src/pages/HomePage.css frontend/src/components/ListingCard.tsx frontend/src/components/ListingCard.css frontend/src/pages/SearchResultsPage.tsx frontend/src/pages/SearchResultsPage.css frontend/src/pages/ListingDetailPage.tsx frontend/src/pages/ListingDetailPage.css
git commit -m "fix: polish listing discovery improvements"
```
