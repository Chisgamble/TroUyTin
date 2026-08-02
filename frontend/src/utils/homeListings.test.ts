import test from "node:test";
import assert from "node:assert/strict";
import { selectHomeListings } from "./homeListings.ts";

type Candidate = {
  id: number;
  status: "AVAILABLE";
  is_verified: boolean;
  landlord?: { is_verified: boolean };
};

const candidate = (
  id: number,
  isVerified: boolean,
  landlordVerified: boolean,
): Candidate => ({
  id,
  status: "AVAILABLE",
  is_verified: isVerified,
  landlord: { is_verified: landlordVerified },
});

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

test("selects verified-landlord listings independently", () => {
  const shared = candidate(3, true, true);
  const result = selectHomeListings([
    candidate(1, true, false),
    candidate(2, false, true),
    shared,
  ]);
  assert.deepEqual(result.featured.map(({ id }) => id), [1, 3]);
  assert.deepEqual(result.verifiedLandlords.map(({ id }) => id), [2, 3]);
});

test("caps verified-landlord listings at four in API order", () => {
  const listings = Array.from({ length: 7 }, (_, index) =>
    candidate(index + 1, false, true),
  ).reverse();

  assert.deepEqual(
    selectHomeListings(listings).verifiedLandlords.map(({ id }) => id),
    [7, 6, 5, 4],
  );
});
