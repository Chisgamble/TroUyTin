# Listing Card Relative Updated Time Design

## Goal

Show when each room listing was last updated on cards displayed on the homepage and search results page. The timestamp should be easy to scan, written in Vietnamese, and stay reasonably current while the page remains open.

## Scope

- Add one relative-time line immediately below the monthly price in the shared `ListingCard` component.
- Apply the presentation to every existing `ListingCard` usage, including both homepage listing sections and search results.
- Reuse the listing's existing `updated_at` field. Do not add API calls or change backend contracts.
- Do not change listing ordering, filtering, pagination, save behavior, badges, or detail-page timestamp presentation.

## Presentation

The card displays muted secondary text under the price using the prefix `Cập nhật`, for example:

- `Cập nhật vừa xong`
- `Cập nhật 5 phút trước`
- `Cập nhật 2 giờ trước`
- `Cập nhật 3 ngày trước`
- `Cập nhật: Không rõ` when the timestamp is missing or invalid

The line uses a small gray style so the price remains the strongest element. It must not introduce a nested interactive element or alter the card link and save-button behavior.

## Relative-Time Rules

Relative time is calculated from the current clock to `updated_at`:

- Less than 1 minute: `vừa xong`
- Less than 60 minutes: whole elapsed minutes
- Less than 24 hours: whole elapsed hours
- 24 hours or more: whole elapsed days
- Future timestamps: clamp to `vừa xong`
- Missing or invalid timestamps: `Không rõ`

The formatter accepts an explicit current time for deterministic tests. Production callers may omit it and use the current clock.

## Refresh Behavior

`ListingCard` refreshes its displayed relative value once per minute without refetching listing data. The interval is created when the card mounts and cleared when it unmounts. The implementation should share the refresh mechanism at the lowest practical level and avoid changing any server state.

## Components and Data Flow

1. Homepage and search loaders continue mapping API `updated_at` into `RoomListing`.
2. Each page passes the unchanged listing object to `ListingCard`.
3. `ListingCard` passes `listing.updated_at` and the current clock to the relative-time formatter.
4. A minute tick causes the displayed text to be recalculated locally.

## Error Handling

The UI must remain stable when `updated_at` is absent, empty, malformed, or unexpectedly in the future. These cases produce the documented fallback instead of throwing or hiding the card.

## Testing

Unit tests cover:

- less than one minute;
- elapsed minutes;
- elapsed hours;
- elapsed days;
- exact unit boundaries;
- future timestamps;
- missing and invalid values.

Existing listing-selection, search-pagination, and exact date-time formatter tests must continue to pass. A frontend build is also attempted, with any unrelated pre-existing TypeScript failures reported separately.

## Success Criteria

- Homepage cards show relative update time below the price.
- Search-result cards show the same presentation and behavior.
- The displayed relative time advances without a page reload.
- No additional dependency or backend request is introduced.
- Invalid timestamps do not break rendering.
