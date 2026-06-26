import { Router } from "express";
import { auth } from "../middlewares/auth";
import { db } from "../db";
import { transactions, reviews } from "../db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

const router = Router();

// POST /api/reviews
router.post("/", auth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { transactionId, revieweeId, rating, comment } = req.body;

    if (!transactionId || !revieweeId || !rating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // 1. Check if the user has a completed transaction with the specified revieweeId and transactionId
    const transactionRecord = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, transactionId),
        eq(transactions.tenantId, userId),
        eq(transactions.landlordId, revieweeId),
        isNotNull(transactions.completedAt)
      ),
    });

    if (!transactionRecord) {
      return res.status(403).json({ 
        error: "Forbidden: You do not have a completed transaction with this user." 
      });
    }

    // 2. Check if a review already exists for this transaction by this user
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.reviewerId, userId),
        eq(reviews.transactionId, transactionId)
      ),
    });

    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this transaction." });
    }

    // 3. Insert the review
    const newReview = await db.insert(reviews).values({
      reviewerId: userId,
      revieweeId: revieweeId,
      transactionId: transactionId,
      listingId: transactionRecord.listingId,
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
