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
  assert.deepEqual(
    selectHomeListings(listings).featured.map(({ id }) => id),
    [7, 6, 5, 4, 3],
  );
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

test("caps verified-landlord listings at the five newest", () => {
  const listings = Array.from({ length: 7 }, (_, index) =>
    candidate(index + 1, false, true),
  );

  assert.deepEqual(
    selectHomeListings(listings).verifiedLandlords.map(({ id }) => id),
    [7, 6, 5, 4, 3],
  );
});
