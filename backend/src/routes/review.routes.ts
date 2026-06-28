import { Router } from "express";
import { auth } from "../middlewares/auth";
import { db } from "../db";
import { reviews } from "../db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

const router = Router();

// POST /api/reviews
router.post("/", auth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { revieweeId, rating, comment } = req.body;

    if (!revieweeId || !rating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // 1. Check if a review already exists for this reviewee by this user (only 1 review allowed per user pair)
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.reviewerId, userId),
        eq(reviews.revieweeId, revieweeId)
      ),
    });

    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this user." });
    }

    // 2. Insert the review
    const newReview = await db.insert(reviews).values({
      reviewerId: userId,
      revieweeId: revieweeId,
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
