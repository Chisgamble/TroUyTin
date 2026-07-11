import { Router } from "express";
import { auth } from "../middlewares/auth";
import { db } from "../db";
import { profiles, reviews } from "../db/schema";
import { and, desc, eq } from "drizzle-orm";

const router = Router();

const reviewSelect = {
  id: reviews.id,
  reviewer_id: reviews.reviewerId,
  reviewee_id: reviews.revieweeId,
  listing_id: reviews.listingId,
  rating: reviews.rating,
  comment: reviews.comment,
  created_at: reviews.createdAt,
  reviewer: {
    id: profiles.id,
    full_name: profiles.fullName,
    avatar_url: profiles.avatarUrl,
  },
};

// GET /api/reviews/listing/:listingId
router.get("/listing/:listingId", async (req, res) => {
  try {
    const listingId = Number(req.params.listingId);

    if (!Number.isInteger(listingId)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }

    const listingReviews = await db
      .select(reviewSelect)
      .from(reviews)
      .leftJoin(profiles, eq(reviews.reviewerId, profiles.id))
      .where(eq(reviews.listingId, listingId))
      .orderBy(desc(reviews.createdAt));

    return res.json(listingReviews);
  } catch (error) {
    console.error("Error fetching listing reviews:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reviews/reviewee/:revieweeId
router.get("/reviewee/:revieweeId", async (req, res) => {
  try {
    const { revieweeId } = req.params;

    const revieweeReviews = await db
      .select(reviewSelect)
      .from(reviews)
      .leftJoin(profiles, eq(reviews.reviewerId, profiles.id))
      .where(eq(reviews.revieweeId, revieweeId))
      .orderBy(desc(reviews.createdAt));

    return res.json(revieweeReviews);
  } catch (error) {
    console.error("Error fetching reviewee reviews:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reviews
router.post("/", auth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { revieweeId, listingId, rating, comment } = req.body;

    if (!revieweeId || !listingId || !rating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // 1. Check if a review already exists for this reviewee and listing by this user
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.reviewerId, userId),
        eq(reviews.revieweeId, revieweeId),
        eq(reviews.listingId, listingId)
      ),
    });

    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this listing." });
    }

    // 2. Insert the review
    const newReview = await db.insert(reviews).values({
      reviewerId: userId,
      revieweeId: revieweeId,
      listingId: listingId,
      rating: rating,
      comment: comment,
    }).returning();

    return res.status(201).json(newReview[0]);
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
