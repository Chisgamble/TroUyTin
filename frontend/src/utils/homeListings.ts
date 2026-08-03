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
      .slice(0, 4),
  };
}
