# Homepage UI Rollback Design

## Goal

Restore the original homepage presentation from `main` and add only one new listing section below the existing featured section.

## Scope

- Restore the original typography, spacing, header, four-column grid, and card presentation for `Phòng trọ nổi bật`.
- Restore the original featured-listing behavior: preserve the API's newest-first order, select available verified listings, and show the first four.
- Remove the visible `Xem chi tiết` row from homepage cards; the full card remains a link to `/phong/:id` as before.
- Hide the `Đã xác minh` badge on homepage cards in both sections while keeping each card and its verification data unchanged.
- Add `Phòng trọ từ chủ nhà xác thực` immediately below the original featured section.
- Reuse the original section header, `Xem tất cả` control, grid, card typography, and responsive behavior without introducing a second visual language.
- The new section shows the four newest available listings whose landlord profile is verified, matching the original four-column grid exactly.
- Keep the additional landlord projection needed to identify verified landlords.
- Do not change search-results or listing-detail behavior.

## Data Flow

The homepage keeps its single newest-first room query. The original featured section derives its four items with the legacy `AVAILABLE && is_verified` rule. The new section independently filters the same result set by `landlord.is_verified` and takes four items, so overlap between the two sections remains valid.

## Error and Loading States

The existing homepage request, loading state, and error handling remain shared by both sections. Each section displays its own empty-state copy only when the request succeeds but no matching listings exist.

## Testing

- Add a regression test proving featured listings keep input order and stop at four.
- Keep tests proving verified-landlord listings are selected independently and stop at four.
- Run the complete frontend test command after implementation.
- Compare the homepage markup and CSS with `main` to ensure its original typography and card layout are restored.
