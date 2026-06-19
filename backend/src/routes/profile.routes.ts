import express from "express";
import { db } from "../db";
import { profiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../middlewares/auth";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  const profile = await db
    .insert(profiles)
    .values({
      id: req.userId,
      username: req.body.username,
      fullName: req.body.fullName,
    })
    .returning();

  res.json(profile[0]);
});

router.get("/me", auth, async (req, res) => {
  const [profile] = await db
  .select()
  .from(profiles)
  .where(eq(profiles.id, req.userId));

  res.json(profile);
});

router.patch("/me", auth, async (req, res) => {
  const profile = await db
    .update(profiles)
    .set({
      username: req.body.username,
      fullName: req.body.fullName,
      avatarUrl: req.body.avatarUrl,
    })
    .where(eq(profiles.id, req.userId))
    .returning();

  res.json(profile[0]);
});

router.delete("/me", auth, async (req, res) => {
  await db
    .delete(profiles)
    .where(eq(profiles.id, req.userId));

  res.sendStatus(204);
});

export default router;