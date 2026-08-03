# Listing Card Relative Updated Time Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a Vietnamese relative “last updated” label below the price on every homepage and search-result listing card, refreshing once per minute without refetching data.

**Architecture:** Extend the existing date-time utility with a deterministic pure formatter that accepts an optional clock for tests. The shared `ListingCard` owns a lightweight one-minute clock tick and renders the formatter output, so all current homepage and search usages inherit the behavior without page-level changes.

**Tech Stack:** React 19, TypeScript 6, Vite 8, CSS, Node.js built-in test runner

## Global Constraints

- Reuse the existing `RoomListing.updated_at` field; do not change backend contracts or add API calls.
- Do not add dependencies.
- Render the label immediately below the monthly price in muted secondary text.
- Use Vietnamese relative units and `Cập nhật: Không rõ` for missing or invalid timestamps.
- Refresh locally once per minute without changing listing ordering, filtering, pagination, save behavior, badges, or detail-page presentation.

---

## File Structure

- `frontend/src/utils/dateTime.ts`: Owns exact and relative listing timestamp formatting as pure functions.
- `frontend/src/utils/dateTime.test.ts`: Verifies relative-time boundaries and fallback behavior with a fixed clock.
- `frontend/src/components/ListingCard.tsx`: Owns the card-local minute tick and renders the shared relative label.
- `frontend/src/components/ListingCard.css`: Styles the new label below the price.

### Task 1: Relative listing-time formatter

**Files:**
- Modify: `frontend/src/utils/dateTime.ts:1-30`
- Test: `frontend/src/utils/dateTime.test.ts:1-17`

**Interfaces:**
- Consumes: Listing timestamps as `string | null | undefined` and an optional `Date` clock.
- Produces: `formatListingUpdatedAgo(value?: string | null, now?: Date): string` for `ListingCard`.

- [ ] **Step 1: Add failing formatter tests**

Update the import and append deterministic cases using one fixed current time:

```ts
import {
  formatListingUpdatedAgo,
  formatListingUpdatedAt,
} from "./dateTime.ts";

const NOW = new Date("2026-08-03T12:00:00.000Z");

test("formats a listing updated less than one minute ago", () => {
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T11:59:30.000Z", NOW),
    "Cập nhật vừa xong",
  );
});

test("formats listing updates in elapsed minutes, hours, and days", () => {
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T11:55:00.000Z", NOW),
    "Cập nhật 5 phút trước",
  );
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T10:00:00.000Z", NOW),
    "Cập nhật 2 giờ trước",
  );
  assert.equal(
    formatListingUpdatedAgo("2026-07-31T12:00:00.000Z", NOW),
    "Cập nhật 3 ngày trước",
  );
});

test("uses the next relative unit at exact boundaries", () => {
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T11:59:00.000Z", NOW),
    "Cập nhật 1 phút trước",
  );
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T11:00:00.000Z", NOW),
    "Cập nhật 1 giờ trước",
  );
  assert.equal(
    formatListingUpdatedAgo("2026-08-02T12:00:00.000Z", NOW),
    "Cập nhật 1 ngày trước",
  );
});

test("clamps future listing timestamps to just now", () => {
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T12:05:00.000Z", NOW),
    "Cập nhật vừa xong",
  );
});

test("falls back for missing or invalid relative timestamps", () => {
  assert.equal(formatListingUpdatedAgo(undefined, NOW), "Cập nhật: Không rõ");
  assert.equal(formatListingUpdatedAgo("invalid", NOW), "Cập nhật: Không rõ");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
node --test src/utils/dateTime.test.ts
```

Working directory: `frontend`

Expected: FAIL because `formatListingUpdatedAgo` is not exported.

- [ ] **Step 3: Implement the minimal pure formatter**

Append this implementation to `frontend/src/utils/dateTime.ts`:

```ts
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const UNKNOWN_RELATIVE_UPDATED_AT = "Cập nhật: Không rõ";

export function formatListingUpdatedAgo(
  value?: string | null,
  now: Date = new Date(),
): string {
  const updatedAtMs = value ? Date.parse(value) : Number.NaN;
  const nowMs = now.getTime();

  if (Number.isNaN(updatedAtMs) || Number.isNaN(nowMs)) {
    return UNKNOWN_RELATIVE_UPDATED_AT;
  }

  const elapsedMs = Math.max(0, nowMs - updatedAtMs);

  if (elapsedMs < MINUTE_MS) {
    return "Cập nhật vừa xong";
  }

  if (elapsedMs < HOUR_MS) {
    return `Cập nhật ${Math.floor(elapsedMs / MINUTE_MS)} phút trước`;
  }

  if (elapsedMs < DAY_MS) {
    return `Cập nhật ${Math.floor(elapsedMs / HOUR_MS)} giờ trước`;
  }

  return `Cập nhật ${Math.floor(elapsedMs / DAY_MS)} ngày trước`;
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```powershell
node --test src/utils/dateTime.test.ts
```

Expected: all exact and relative date-time tests PASS.

- [ ] **Step 5: Run all frontend utility tests**

Run:

```powershell
npm test
```

Working directory: `frontend`

Expected: all home-listing, search-listing, exact timestamp, and relative timestamp tests PASS.

- [ ] **Step 6: Commit the formatter**

```powershell
git add frontend/src/utils/dateTime.ts frontend/src/utils/dateTime.test.ts
git commit -m "feat: format relative listing update time"
```

### Task 2: Listing-card clock and presentation

**Files:**
- Modify: `frontend/src/components/ListingCard.tsx:1-72`
- Modify: `frontend/src/components/ListingCard.css:135-145`

**Interfaces:**
- Consumes: `formatListingUpdatedAgo(value?: string | null, now?: Date): string` from Task 1 and `listing.updated_at` from `RoomListing`.
- Produces: A `.listing-card-updated` line that refreshes once every 60,000 milliseconds for all existing `ListingCard` consumers.

- [ ] **Step 1: Add the card-local clock and formatter import**

Change the imports at the top of `ListingCard.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { RoomListing } from "../types";
import { formatListingUpdatedAgo } from "../utils/dateTime";
import { formatPriceVND, getRoomTypeLabel } from "../utils/formatters";
```

Inside `ListingCard`, before the `return`, add:

```tsx
const [relativeClock, setRelativeClock] = useState(() => new Date());

useEffect(() => {
  const intervalId = window.setInterval(() => {
    setRelativeClock(new Date());
  }, 60_000);

  return () => window.clearInterval(intervalId);
}, []);
```

- [ ] **Step 2: Render the relative label below the price**

Immediately after `.listing-card-price`, add:

```tsx
<p className="listing-card-updated">
  {formatListingUpdatedAgo(listing.updated_at, relativeClock)}
</p>
```

Do not add props or page-specific branches; homepage and search already share this component.

- [ ] **Step 3: Add muted secondary styling**

Append to `ListingCard.css`:

```css
.listing-card-updated {
  margin-top: 5px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--gray-400);
}
```

- [ ] **Step 4: Run focused lint on changed source files**

Run:

```powershell
npx eslint src/components/ListingCard.tsx src/utils/dateTime.ts src/utils/dateTime.test.ts
```

Working directory: `frontend`

Expected: PASS with no errors in the changed files.

- [ ] **Step 5: Run all utility tests again**

Run:

```powershell
npm test
```

Working directory: `frontend`

Expected: all tests PASS.

- [ ] **Step 6: Attempt the full frontend build and classify failures**

Run:

```powershell
npm run build
```

Working directory: `frontend`

Expected for this repository baseline: the command may still report pre-existing TypeScript failures in unrelated files such as `Profile.tsx`, `PublicProfilePage.tsx`, and `RoommateMatching.tsx`. Confirm it introduces no error in `ListingCard.tsx` or `dateTime.ts`; report baseline failures without expanding this feature's scope.

- [ ] **Step 7: Verify homepage and search visually**

Start the existing dev servers if they are not already running:

```powershell
# backend
npm run dev

# frontend, in a second terminal
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173/` and the search results page. Verify:

- every populated card shows `Cập nhật …` immediately below the price;
- homepage featured and verified-landlord sections use identical styling;
- search cards use identical styling;
- save buttons and card links remain independently clickable;
- no card layout clips the new line at desktop and narrow viewport widths.

- [ ] **Step 8: Commit the card integration**

```powershell
git add frontend/src/components/ListingCard.tsx frontend/src/components/ListingCard.css
git commit -m "feat: show relative update time on listing cards"
```

- [ ] **Step 9: Record final verification state**

Run:

```powershell
git status --short --branch
git log -3 --oneline
```

Expected: working tree is clean and the two feature commits appear after the implementation-plan commit.
