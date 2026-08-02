# Homepage UI Rollback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the original homepage listing presentation and add only one visually identical verified-landlord section below it.

**Architecture:** Keep the current single Supabase room query because the new section needs the joined landlord verification flag. Make the selection helper preserve the query's newest-first order while applying the legacy four-item featured rule and the new five-item verified-landlord rule independently. Restore the original homepage selectors and card typography, with one small modifier that adds bottom spacing to the second section.

**Tech Stack:** React 19, TypeScript, React Router, Supabase, CSS, Node test runner

## Global Constraints

- The original `Phòng trọ nổi bật` typography, spacing, four-column grid, and card presentation must match `main`.
- The existing featured section shows four available verified listings in API order.
- The new verified-landlord section shows five available listings in API order and may wrap its fifth card under the original four-column grid.
- Homepage cards remain fully clickable links and do not show a separate `Xem chi tiết` text row.
- Search-results and listing-detail behavior must remain unchanged.

---

### Task 1: Restore legacy featured selection

**Files:**
- Modify: `frontend/src/utils/homeListings.test.ts`
- Modify: `frontend/src/utils/homeListings.ts`

**Interfaces:**
- Consumes: newest-first listing candidates containing `status`, `is_verified`, and optional `landlord.is_verified`.
- Produces: `selectHomeListings(listings)` returning `{ featured: T[]; verifiedLandlords: T[] }`.

- [ ] **Step 1: Write the failing regression test**

Update the candidate fixture to include `status: "AVAILABLE"` and replace the first test with an input-order regression:

```ts
test("keeps the legacy four featured listings in API order", () => {
  const listings = [
    candidate(3, true, false),
    candidate(1, true, false),
    candidate(7, true, false),
    candidate(2, true, false),
    candidate(6, true, false),
  ];

  assert.deepEqual(
    selectHomeListings(listings).featured.map(({ id }) => id),
    [3, 1, 7, 2],
  );
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
Set-Location frontend
node --test src/utils/homeListings.test.ts
```

Expected: the new regression fails because the current helper sorts by `created_at` and takes five featured items.

- [ ] **Step 3: Implement the minimal selection change**

Change the helper contract and selection logic to preserve input order and use fixed section limits:

```ts
type HomeListingCandidate = {
  status: string;
  is_verified: boolean;
  landlord?: { is_verified: boolean };
};

export function selectHomeListings<T extends HomeListingCandidate>(
  listings: readonly T[],
) {
  return {
    featured: listings
      .filter((listing) => listing.status === "AVAILABLE" && listing.is_verified)
      .slice(0, 4),
    verifiedLandlords: listings
      .filter(
        (listing) =>
          listing.status === "AVAILABLE" && listing.landlord?.is_verified,
      )
      .slice(0, 5),
  };
}
```

- [ ] **Step 4: Run the helper tests and verify GREEN**

Run:

```powershell
Set-Location frontend
node --test src/utils/homeListings.test.ts
```

Expected: all homepage selection tests pass, including independent overlap and the five-item verified-landlord cap.

---

### Task 2: Restore the original homepage presentation

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/pages/HomePage.css`
- Modify: `frontend/src/components/ListingCard.tsx`
- Modify: `frontend/src/components/ListingCard.css`

**Interfaces:**
- Consumes: `featuredListings` and `verifiedLandlords` from Task 1.
- Produces: the original `home-featured`, `home-featured-header`, `home-grid`, and card presentation plus a second identical section.

- [ ] **Step 1: Restore the original section markup**

Use the original selector names for both sections and render cards without a details-action prop:

```tsx
<section className="home-featured">
  <div className="home-featured-header">
    <h2>Phòng trọ nổi bật</h2>
    <button className="home-see-all" onClick={() => navigate("/tim-kiem")}>
      Xem tất cả
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="9,18 15,12 9,6" />
      </svg>
    </button>
  </div>
  {loading ? (
    <p>Đang tải phòng trọ...</p>
  ) : error ? (
    <p>{error}</p>
  ) : featuredListings.length === 0 ? (
    <p>Chưa có phòng trọ nổi bật.</p>
  ) : (
    <div className="home-grid">
      {featuredListings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          saved={savedIds.includes(listing.id)}
          onToggleSave={toggleSave}
        />
      ))}
    </div>
  )}
</section>

{!error && (
  <section className="home-featured home-featured--last">
    <div className="home-featured-header">
      <h2>Phòng trọ từ chủ nhà xác thực</h2>
      <button className="home-see-all" onClick={() => navigate("/tim-kiem")}>
        Xem tất cả
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9,18 15,12 9,6" />
        </svg>
      </button>
    </div>
    {loading ? (
      <p>Đang tải phòng trọ...</p>
    ) : verifiedLandlords.length === 0 ? (
      <p>Chưa có phòng trọ từ chủ nhà xác thực.</p>
    ) : (
      <div className="home-grid">
        {verifiedLandlords.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            saved={savedIds.includes(listing.id)}
            onToggleSave={toggleSave}
          />
        ))}
      </div>
    )}
  </section>
)}
```

- [ ] **Step 2: Restore the original homepage CSS selectors and typography**

Restore the `main` definitions and add only the final-section spacing modifier:

```css
.home-featured {
  max-width: 1200px;
  margin: 0 auto;
  padding: 36px 24px 0;
}

.home-featured--last {
  padding-bottom: 36px;
}

.home-featured-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
}

.home-featured-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--gray-800);
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
```

- [ ] **Step 3: Remove the new visible card copy**

Remove `showDetailsAction` from `ListingCardProps`, its default parameter, its JSX block, and `.listing-card-details-action` CSS. Keep `showVerifiedBadge` because search-results cards depend on it, and keep the separate save button because it avoids nested interactive elements.

- [ ] **Step 4: Run tests and focused lint**

Run:

```powershell
Set-Location frontend
npm.cmd test
npx.cmd eslint src/pages/HomePage.tsx src/components/ListingCard.tsx src/utils/homeListings.ts src/utils/homeListings.test.ts
```

Expected: all 10 frontend tests pass. Focused lint may continue to report only the unchanged baseline `setSavedIds([])` effect warning in `HomePage.tsx`; no new lint finding is acceptable.

- [ ] **Step 5: Commit the implementation**

```powershell
git add frontend/src/pages/HomePage.tsx frontend/src/pages/HomePage.css frontend/src/components/ListingCard.tsx frontend/src/components/ListingCard.css frontend/src/utils/homeListings.ts frontend/src/utils/homeListings.test.ts
git commit -m "fix: restore homepage listing presentation"
```

---

### Task 3: Verify the visual rollback and branch state

**Files:**
- Verify: `frontend/src/pages/HomePage.tsx`
- Verify: `frontend/src/pages/HomePage.css`
- Verify: `frontend/src/components/ListingCard.tsx`
- Verify: `frontend/src/components/ListingCard.css`

**Interfaces:**
- Consumes: the completed homepage implementation.
- Produces: verification evidence only; no new production interface.

- [ ] **Step 1: Compare the restored UI with `main`**

Run:

```powershell
git diff main...HEAD -- frontend/src/pages/HomePage.tsx frontend/src/pages/HomePage.css frontend/src/components/ListingCard.tsx frontend/src/components/ListingCard.css
```

Confirm the remaining homepage differences are limited to the landlord data projection, the new verified-landlord section, its bottom-spacing modifier, and cross-page `ListingCard` behavior required by search/accessibility.

- [ ] **Step 2: Run browser QA**

Open the homepage at desktop width and confirm:

- `Phòng trọ nổi bật` uses the original 22px heading and four-column grid.
- Cards contain no visible `Xem chi tiết` row.
- `Phòng trọ từ chủ nhà xác thực` appears immediately below with identical typography and card styling.
- The fifth verified-landlord card wraps naturally.
- At widths below 1024px the grid uses two columns, and below 768px it uses one column.

- [ ] **Step 3: Run final verification**

Run:

```powershell
Set-Location frontend
npm.cmd test
Set-Location ..
git diff --check main...HEAD
git status --short --branch
```

Expected: 10 tests pass, `git diff --check` returns no output, and the feature branch is clean.
