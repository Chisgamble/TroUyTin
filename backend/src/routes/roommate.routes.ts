import express from "express";
import { db } from "../db";
import {
  roommateProfiles,
  roommateMatches,
  savedRoommates,
  profiles,
} from "../db/schema";
import { eq, and, not, inArray } from "drizzle-orm";
import { auth } from "../middlewares/auth";
import { calculateCompatibility } from "../services/roommateCompatibility";

const router = express.Router();

// 1. POST /api/roommates/profiles - Tạo/Cập nhật hồ sơ lối sống
router.post("/profiles", auth, async (req, res) => {
  try {
    const {
      gender, age, hometown, schoolOrJob, budgetMin, budgetMax,
      preferredDistrictId, smoking, drinking, sleepSchedule,
      tidiness, cleaningFreq, hasPet, allowOvernightGuest, cookingFreq, hasRoom
    } = req.body;

    const existing = await db
      .select()
      .from(roommateProfiles)
      .where(eq(roommateProfiles.userId, req.userId))
      .limit(1);

    if (existing[0]) {
      const updated = await db
        .update(roommateProfiles)
        .set({
          gender, age, hometown, schoolOrJob, budgetMin, budgetMax,
          preferredDistrictId, smoking, drinking, sleepSchedule,
          tidiness, cleaningFreq, hasPet, allowOvernightGuest, cookingFreq, hasRoom,
          isLookingForRoommate: true,
          updatedAt: new Date(),
        })
        .where(eq(roommateProfiles.userId, req.userId))
        .returning();
      return res.status(200).json(updated[0]);
    } else {
      const created = await db
        .insert(roommateProfiles)
        .values({
          userId: req.userId,
          gender, age, hometown, schoolOrJob, budgetMin, budgetMax,
          preferredDistrictId, smoking, drinking, sleepSchedule,
          tidiness, cleaningFreq, hasPet, allowOvernightGuest, cookingFreq, hasRoom,
          isLookingForRoommate: true
        })
        .returning();
      return res.status(201).json(created[0]);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 2. GET /api/roommates/profiles/me - Lấy hồ sơ của user hiện tại
router.get("/profiles/me", auth, async (req, res) => {
  try {
    const profile = await db
      .select()
      .from(roommateProfiles)
      .where(eq(roommateProfiles.userId, req.userId))
      .limit(1);

    if (!profile[0]) {
      return res.status(404).json({ message: "Chưa có hồ sơ roommate" });
    }
    return res.json(profile[0]);
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 3. GET /api/roommates/profiles/discover - Lấy danh sách ứng viên (Swipe)
router.get("/profiles/discover", auth, async (req, res) => {
  try {
    const userProfile = await db
      .select()
      .from(roommateProfiles)
      .where(eq(roommateProfiles.userId, req.userId))
      .limit(1);

    if (!userProfile[0]) {
      return res.status(400).json({ message: "Bạn chưa thiết lập hồ sơ roommate" });
    }

    const matchedIds = await db
      .select({ targetId: roommateMatches.targetId })
      .from(roommateMatches)
      .where(eq(roommateMatches.requesterId, req.userId));

    const excludeUserIds = matchedIds.map((m) => m.targetId);
    excludeUserIds.push(req.userId); 

    // Chỉ tìm những người dùng đang bật trạng thái "isLookingForRoommate = true"
    const candidateProfiles = await db
      .select()
      .from(roommateProfiles)
      .where(
        and(
          not(inArray(roommateProfiles.userId, excludeUserIds)),
          eq(roommateProfiles.isLookingForRoommate, true)
        )
      );

    if (candidateProfiles.length === 0) {
      return res.json([]);
    }

    const candidateUserIds = candidateProfiles.map((p) => p.userId);
    const candidateUsers = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.id, candidateUserIds));

    const candidatesWithScore = candidateProfiles.map((profile) => {
      const user = candidateUsers.find((u) => u.id === profile.userId);
      const compatibilityScore = calculateCompatibility(userProfile[0], profile);

      return {
        id: profile.id,
        userId: profile.userId,
        fullName: user?.fullName,
        avatarUrl: user?.avatarUrl,
        gender: profile.gender,
        age: profile.age,
        hometown: profile.hometown,
        schoolOrJob: profile.schoolOrJob,
        compatibilityPct: compatibilityScore,
        hasPet: profile.hasPet,
        sleepSchedule: profile.sleepSchedule,
      };
    });

    candidatesWithScore.sort((a, b) => b.compatibilityPct - a.compatibilityPct);
    return res.json(candidatesWithScore.slice(0, 20));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 4. POST /api/roommates/matches - Tương tác Like/Pass và kích hoạt Match 2 chiều
router.post("/matches", auth, async (req, res) => {
  try {
    const { targetId, action } = req.body; 

    if (action !== "LIKE" && action !== "PASS") {
      return res.status(400).json({ message: "Action không hợp lệ" });
    }

    const existing = await db
      .select()
      .from(roommateMatches)
      .where(and(eq(roommateMatches.requesterId, req.userId), eq(roommateMatches.targetId, targetId)))
      .limit(1);

    if (existing[0]) {
      return res.status(409).json({ message: "Đã tương tác với người này" });
    }

    // Kiểm tra xem đối phương có từng LIKE mình trong quá khứ không
    const oppositeInteraction = await db
      .select()
      .from(roommateMatches)
      .where(and(eq(roommateMatches.requesterId, targetId), eq(roommateMatches.targetId, req.userId)))
      .limit(1);

    if (oppositeInteraction[0] && action === "LIKE" && oppositeInteraction[0].requesterAction === "LIKE") {
      // Cả hai đều LIKE nhau -> Kích hoạt trạng thái MATCHED thành công
      const updatedMatch = await db
        .update(roommateMatches)
        .set({ status: "MATCHED", targetAction: "LIKE", matchedAt: new Date() })
        .where(eq(roommateMatches.id, oppositeInteraction[0].id))
        .returning();

      return res.status(200).json({ match: updatedMatch[0], status: "MATCHED" });
    }

    // Nếu chưa có tương tác ngược chiều, tạo bản ghi mới bình thường
    const created = await db
      .insert(roommateMatches)
      .values({
        requesterId: req.userId,
        targetId,
        requesterAction: action,
        status: action === "LIKE" ? "PENDING" : "REJECTED",
      })
      .returning();

    return res.status(201).json({ match: created[0], status: action === "LIKE" ? "PENDING" : "REJECTED" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 5. GET /api/roommates/matches/me - Lấy danh sách kết nối của tôi
router.get("/matches/me", auth, async (req, res) => {
  try {
    const matches = await db
      .select({
        id: roommateMatches.id,
        targetId: roommateMatches.targetId,
        targetName: profiles.fullName,
        targetAvatar: profiles.avatarUrl,
        compatibilityPct: roommateMatches.compatibilityPct,
        status: roommateMatches.status,
        createdAt: roommateMatches.createdAt,
      })
      .from(roommateMatches)
      .leftJoin(profiles, eq(roommateMatches.targetId, profiles.id))
      .where(eq(roommateMatches.requesterId, req.userId));

    return res.json(matches);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 6. POST /api/roommates/saved - Lưu hồ sơ người ở ghép
router.post("/saved", auth, async (req, res) => {
  try {
    const { savedRoommateId } = req.body;

    const created = await db
      .insert(savedRoommates)
      .values({
        userId: req.userId,
        savedRoommateId,
      })
      .returning();

    return res.status(201).json(created[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Người này đã được lưu từ trước" });
    }
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 7. GET /api/roommates/saved - Lấy danh sách hồ sơ ở ghép đã lưu
router.get("/saved", auth, async (req, res) => {
  try {
    const saved = await db
      .select({
        id: savedRoommates.id,
        userId: profiles.id,
        fullName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
        bio: profiles.bio,
        savedAt: savedRoommates.createdAt,
      })
      .from(savedRoommates)
      .leftJoin(profiles, eq(savedRoommates.savedRoommateId, profiles.id))
      .where(eq(savedRoommates.userId, req.userId));

    return res.json(saved);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 8. DELETE /api/roommates/saved/:roommateId - Gỡ một người ra khỏi danh sách lưu
router.delete("/saved/:roommateId", auth, async (req, res) => {
  try {
    const { roommateId } = req.params;

    await db
      .delete(savedRoommates)
      .where(
        and(
          eq(savedRoommates.userId, req.userId),
          eq(savedRoommates.savedRoommateId, roommateId)
        )
      );

    return res.json({ message: "Đã xóa khỏi danh sách lưu thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;