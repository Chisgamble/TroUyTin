import { api } from "../lib/axios";

export interface Review {
  id: number;
  reviewer_id: string;
  reviewee_id: string;
  listing_id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export const getRevieweeReviews = async (
  revieweeId: string
): Promise<Review[]> => {
  const { data } = await api.get(`/api/reviews/reviewee/${revieweeId}`);
  return data;
};