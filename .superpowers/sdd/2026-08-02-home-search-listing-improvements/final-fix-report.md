# Final review fix wave report

Date: 2026-08-03

Base commit: `f43542ae4b5bdc68e91476fddb11e1b8da187736`

Fix commit: this report is included in the commit with subject `fix: address final home search review`; use `git log -1 --oneline` for its immutable hash.

## Implemented findings

1. Added `selectLocationOptions` and routed both province and district option selection through it. A non-empty catalog remains preferred; a fulfilled empty catalog now falls back to valid room-derived options. Existing catalog-error messaging, district request-id race protection, dependent province/district filtering, and filter/page resets remain unchanged.
2. Moved the shared home room-load error above both listing sections. On an error, the two listing sections (and therefore both grids) are not rendered, so the message appears once.
3. Expanded the home Supabase projection to request all declared `Profile` fields and the declared district/province fields. The mapper now maps `district_id`, `province_id`, and `province_name`, and converts a nullable `Profile` relation to `undefined` without casting. `RoomListingDbRow.landlord_info` is now declared as `Profile | null`.
4. Removed `aria-hidden` from the visible `Xem chi tiết` action and applied it only to the decorative arrow SVG.
5. Added a seven-item verified-landlord fixture proving that the verified-landlord section returns only the five newest listings.

## TDD evidence

### RED

Command (from `frontend`):

```text
node --test src/utils/searchListings.test.ts
```

Exit code: `1`. The test module failed because `./searchListings.ts` did not export the newly required `selectLocationOptions`; this was the expected missing-behavior failure before production code was changed.

### GREEN

Command (from `frontend`):

```text
node --test src/utils/searchListings.test.ts
```

Exit code: `0`; `5` tests passed, including `uses room-derived location options only when the fulfilled catalog is empty`.

The new regression test also checks that a non-empty catalog remains preferred, so mutating the selector to always use either source breaks coverage.

## Verification

### Frontend utility tests

```text
npm.cmd test
```

Exit code: `0`; `10/10` tests passed (`2` date/time, `3` home-listing, `5` search-listing tests), with no failures, skips, or warnings.

### Focused ESLint

```text
.\node_modules\.bin\eslint.cmd src/pages/SearchResultsPage.tsx src/utils/searchListings.ts src/utils/searchListings.test.ts src/pages/HomePage.tsx src/types/index.ts src/components/ListingCard.tsx src/utils/homeListings.test.ts
```

Exit code: `1` with one baseline-only finding: `frontend/src/pages/HomePage.tsx:73`, `react-hooks/set-state-in-effect`, for the existing `setSavedIds([])` call. `git show HEAD:frontend/src/pages/HomePage.tsx` and `git blame HEAD -L 68,76 -- frontend/src/pages/HomePage.tsx` confirm this line predates the fix wave (commit `79802864`). The zero-context diff does not touch it.

Running focused ESLint on the other six changed TS/TSX files exits `0`. No lint finding points to a changed line.

### Diff check

```text
git diff --check
```

Exit code: `0`; no whitespace errors.

### Frontend build

```text
npm.cmd run build
```

Exit code: `1` during `tsc -b`, before Vite. TypeScript reported `25` baseline errors in unrelated files (`InboxList.tsx`, `Navbar.tsx`, `Profile.tsx`, `PublicProfilePage.tsx`, roommate pages, saved-listing pages, and `services/listingDetails.ts`). None of the diagnostics reference a changed fix-wave file, so the expanded home query, row type, mapper, search selector, and tests introduce no changed-file build diagnostics.

## Self-review

- Behavior: empty fulfilled catalogs fall back; non-empty catalogs win; rejected empty catalogs still show the existing error after room loading; request race and reset behavior are intact.
- Scope: only the seven review-targeted frontend files plus this report are changed relative to the base commit.
- Types: the home query, `RoomListingDbRow`, and `RoomListing` mapping agree on the complete profile and nested district/province shape; the unsafe landlord cast is gone.
- Accessibility: the action text remains in the accessibility tree while the arrow is decorative.
- Tests: the empty-catalog regression proves both source-selection branches, and verified-landlord truncation is covered with more than five candidates.

## Concerns

- Repository-baseline lint and TypeScript build failures remain outside this fix wave, as detailed above.
- The build cannot reach the Vite bundling stage until those pre-existing TypeScript errors are resolved.
