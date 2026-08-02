# Home, Search, and Listing Detail Improvements Design

## Goal

Enrich the home page with two distinct five-item listing sections, improve listing freshness information, and make search filtering and pagination easier to use without changing the existing public routes.

## Scope

- Show at most five newest verified available listings in the home-page featured section.
- Add a second home-page section containing at most five newest available listings owned by verified landlords.
- Keep the two sections independent. A listing may appear in both sections when it satisfies both criteria.
- Add an explicit `Xem chi tiết` action to every card in both home-page sections. The action and the card itself navigate to `/phong/:id`.
- Keep each section-level `Xem tất cả` action and route it to `/tim-kiem`.
- Show the listing's last update time on `/phong/:id` as `Cập nhật lần cuối: HH:mm, dd/MM/yyyy` in the `Asia/Ho_Chi_Minh` time zone.
- Add client-side pagination to `/tim-kiem`, with nine listings per page.
- Remove the `Đã xác minh` badge only from listing cards rendered on `/tim-kiem`. The badge remains available on the home page and listing detail page.
- Replace the hard-coded district-only search filter with database-backed province and dependent district selects.
- Give the desktop filter sidebar its own vertical scroll area while keeping it sticky beside the independently scrolling results list.

## Architecture

The implementation follows the project's current hybrid data access pattern. The home page continues to query Supabase directly and includes the listing owner's verification status in the nested selection. The search page continues to fetch rooms from the Express `/api/rooms` endpoint, while location select options use the existing Supabase-backed `getProvinces` and `getDistricts` service functions.

The room API response gains location identifiers so the frontend can filter by stable database IDs instead of comparing display names. Pagination stays on the client because the current endpoint already returns the complete room collection and all existing filters run locally; this avoids introducing a second filtering contract solely for this issue.

## Components and Responsibilities

### Home page

`HomePage.tsx` maps the nested landlord verification value into each listing and derives two sorted collections from available listings:

1. `featuredListings`: `is_verified === true`, newest first, limited to five.
2. `verifiedLandlordListings`: `landlord.is_verified === true`, newest first, limited to five.

Both sections reuse `ListingCard`. Empty, loading, and error states remain visible and do not render misleading sample data.

### Listing card

`ListingCard.tsx` receives presentation options rather than inspecting the current URL:

- A verified-badge option controls whether `Đã xác minh` is rendered.
- A detail-action option controls whether an explicit `Xem chi tiết` action is rendered.

Defaults preserve existing behavior for callers not changed by this feature. The search page disables the badge. Both home-page sections enable the detail action.

### Listing detail

A small date-formatting utility accepts an ISO timestamp and returns the agreed Vietnamese display value in the `Asia/Ho_Chi_Minh` time zone. The detail page renders this value near the primary listing metadata. Invalid or missing timestamps render `Không rõ` instead of throwing.

### Search filters and pagination

The search page loads provinces on mount. Selecting a province clears the current district and loads only districts belonging to that province. The district select stays disabled until a province is selected.

The complete filtered result count remains visible. The page slices the filtered collection into nine-item pages and renders previous, numbered, and next controls. Changing the query, province, district, room type, price range, or area range returns pagination to page one. If filtering reduces the page count, the active page is clamped to the last valid page.

On desktop, the sidebar remains sticky below the application header and uses `max-height` plus `overflow-y: auto`; scrolling inside it reveals all controls without requiring the results list to reach its end. At the existing tablet breakpoint, it returns to normal document flow without an internal scrollbar.

## API and Types

The `GET /api/rooms` query joins `provinces` through `districts` and returns these additional snake-case fields for each listing:

- `district_id: number | null`
- `province_id: number | null`
- `province_name: string`

The shared frontend `RoomListing` type gains compatible location fields. Existing fields and routes remain unchanged.

The home-page Supabase row type gains an optional nested landlord projection containing `is_verified`. No database migration is required.

## Error Handling

- A home-page data error is shown once and applies to both listing sections.
- Failure to load provinces or districts leaves the affected select empty and shows a concise filter error while the room results remain usable.
- Selecting a new province immediately clears a stale district selection before the new district request completes.
- Search pagination is not rendered when there is zero or one page of results.
- Date formatting handles invalid input without breaking the detail page.

## Testing and Verification

Pure helpers will cover behavior without coupling tests to markup:

- Home listing classification, newest-first ordering, five-item limits, and independent overlap.
- Province and district filtering by stable IDs.
- Nine-item pagination, page-count calculation, and page clamping.
- Last-updated formatting and invalid timestamp fallback.

UI integration is verified by TypeScript compilation and the production build. Lint runs for the frontend, and the backend TypeScript build verifies the extended API response query. Manual visual checks cover desktop sidebar scrolling, responsive layout, both home sections, card actions, search badge removal, and pagination navigation.

## Out of Scope

- Server-side search filtering or server-side pagination.
- Database schema changes.
- Changes to AI search behavior.
- Removing verification indicators from pages other than `/tim-kiem`.
