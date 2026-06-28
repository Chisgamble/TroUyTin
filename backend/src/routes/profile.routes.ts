import express from "express";
import { db } from "../db";
import { profiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../middlewares/auth";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, req.userId))
      .limit(1);

    if (existing[0]) {
      return res.status(409).json({
        message: "Hồ sơ đã tồn tại",
      });
    }

    const profile = await db
      .insert(profiles)
      .values({
        id: req.userId,
        username: req.body.username,
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
      })
      .returning();

    return res.status(201).json(profile[0]);
  } catch (err) {
    return res.status(500).json({
      message: "Lỗi server khi tạo hồ sơ",
    });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, req.userId))
      .limit(1);

    if (!profile[0]) {
      return res.status(404).json({
        message: "Không tìm thấy hồ sơ người dùng",
      });
    }

    return res.json(profile[0]);
  } catch (err) {
    return res.status(500).json({
      message: "Lỗi server khi lấy thông tin hồ sơ",
    });
  }
});

router.patch("/me", auth, async (req, res) => {
  try {
    const updated = await db
      .update(profiles)
      .set({
        username: req.body.username,
        fullName: req.body.fullName,
        avatarUrl: req.body.avatarUrl,
        bio: req.body.bio,
        phone: req.body.phone,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, req.userId))
      .returning();

    if (!updated[0]) {
      return res.status(404).json({
        message: "Không tìm thấy hồ sơ để cập nhật",
      });
    }

    return res.json(updated[0]);
  } catch (err) {
    return res.status(500).json({
      message: "Lỗi server khi cập nhật hồ sơ",
    });
  }
});

router.delete("/me", auth, async (req, res) => {
  try {
    await db
      .update(profiles)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, req.userId));

    return res.sendStatus(204);
  } catch (err) {
    return res.status(500).json({
      message: "Lỗi server khi xóa tài khoản",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, req.params.id))
      .limit(1);

    if (!profile[0]) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    const { email, phone, ...safeProfile } = profile[0];

    return res.json(safeProfile);
  } catch (err) {
    return res.status(500).json({
      message: "Lỗi server khi lấy thông tin người dùng",
    });
  }
});

export default router;