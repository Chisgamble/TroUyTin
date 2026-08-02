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
