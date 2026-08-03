import express from "express";
import { db } from "../db";
import {
  roommateProfiles,
  roommateMatches,
  savedRoommates,
  profiles,
  roommatePosts,
  wards,
  districts,
  provinces,
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
          updatedAt: new Date(),
        })
        .where(eq(roommateProfiles.userId, req.userId))
        .returning();
      await db
        .update(profiles)
        .set({ isLookingForRoommate: true, updatedAt: new Date() })
        .where(eq(profiles.id, req.userId));
      return res.status(200).json(updated[0]);
    } else {
      const created = await db
        .insert(roommateProfiles)
        .values({
          userId: req.userId,
          gender, age, hometown, schoolOrJob, budgetMin, budgetMax,
          preferredDistrictId, smoking, drinking, sleepSchedule,
          tidiness, cleaningFreq, hasPet, allowOvernightGuest, cookingFreq, hasRoom,
        })
        .returning();
      await db
        .update(profiles)
        .set({ isLookingForRoommate: true, updatedAt: new Date() })
        .where(eq(profiles.id, req.userId));
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
    // 1. Lấy hồ sơ roommate của chính người dùng hiện tại
    const userProfile = await db
      .select()
      .from(roommateProfiles)
      .where(eq(roommateProfiles.userId, req.userId))
      .limit(1);

    if (!userProfile[0]) {
      return res.status(400).json({ message: "Bạn chưa thiết lập hồ sơ roommate" });
    }

    // 2. Lấy danh sách ID những người đã quẹt (LIKE/PASS) để loại trừ
    const matchedIds = await db
      .select({ targetId: roommateMatches.targetId })
      .from(roommateMatches)
      .where(eq(roommateMatches.requesterId, req.userId));

    // Đưa tất cả ID cần loại trừ vào một Set để xử lý cho sạch
    const excludeUserIds = matchedIds.map((m) => m.targetId).filter(Boolean);
    excludeUserIds.push(req.userId); // Loại trừ chính bản thân mình

    // 3. Query thông minh: Join bảng roommate_profiles với profiles để check điều kiện
    const candidates = await db
      .select({
        profile: roommateProfiles,
        user: profiles,
      })
      .from(roommateProfiles)
      .innerJoin(profiles, eq(roommateProfiles.userId, profiles.id)) // Khớp nối 2 bảng qua userId
      .where(
        and(
          // Tránh lỗi null/rỗng của inArray bằng cách check độ dài mảng loại trừ
          excludeUserIds.length > 0 ? not(inArray(roommateProfiles.userId, excludeUserIds)) : undefined,
          // ĐÚNG THỰC TẾ: Check trạng thái tìm kiếm nằm ở bảng profiles chung
          eq(profiles.isLookingForRoommate, true) 
        )
      );

    if (candidates.length === 0) {
      return res.json([]);
    }

    const candidateUserIds = candidates.map(({ profile }) => profile.userId);
    const roomPosts = candidateUserIds.length > 0
      ? await db
          .select({
            id: roommatePosts.id,
            userId: roommatePosts.userId,
            addressDetail: roommatePosts.addressDetail,
            wardName: wards.name,
            districtName: districts.name,
            provinceName: provinces.name,
            createdAt: roommatePosts.createdAt,
          })
          .from(roommatePosts)
          .leftJoin(wards, eq(roommatePosts.wardId, wards.id))
          .leftJoin(districts, eq(wards.districtId, districts.id))
          .leftJoin(provinces, eq(districts.provinceId, provinces.id))
          .where(inArray(roommatePosts.userId, candidateUserIds))
      : [];

    const latestRoomPostsByUser = new Map<string, (typeof roomPosts)[number]>();
    roomPosts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach((post) => {
        if (!latestRoomPostsByUser.has(post.userId)) {
          latestRoomPostsByUser.set(post.userId, post);
        }
      });

    // 4. Tính toán độ tương thích (Compatibility Score) và format dữ liệu trả về Frontend
    const candidatesWithScore = candidates.map(({ profile, user }) => {
      const compatibilityScore = calculateCompatibility(userProfile[0], profile);
      const roomPost = latestRoomPostsByUser.get(profile.userId);
      const roomAddress = roomPost
        ? [roomPost.addressDetail, roomPost.wardName, roomPost.districtName, roomPost.provinceName]
            .filter(Boolean)
            .join(", ")
        : undefined;

      return {
        id: profile.id,
        userId: profile.userId,
        fullName: user.fullName,    // Lấy trực tiếp từ dữ liệu đã JOIN cực nhanh
        avatarUrl: user.avatarUrl,  // Lấy trực tiếp từ dữ liệu đã JOIN cực nhanh
        gender: profile.gender,
        age: profile.age,
        hometown: profile.hometown,
        schoolOrJob: profile.schoolOrJob,
        compatibilityPct: compatibilityScore,
        hasPet: profile.hasPet,
        sleepSchedule: profile.sleepSchedule,
        hasRoom: profile.hasRoom || Boolean(roomPost),
        roomId: roomPost?.id,
        roomAddress,
      };
    });

    // 5. Sắp xếp điểm tương thích từ cao xuống thấp và giới hạn 20 người
    candidatesWithScore.sort((a, b) => b.compatibilityPct - a.compatibilityPct);
    return res.json(candidatesWithScore.slice(0, 20));

  } catch (err) {
    console.error("LỖI TẠI DISCOVER ROUTE:", err);
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

// 5.1 DELETE /api/roommates/matches/pass - Xóa các lượt PASS để tải lại danh sách ứng viên
router.delete("/matches/pass", auth, async (req, res) => {
  try {
    const deleted = await db
      .delete(roommateMatches)
      .where(
        and(
          eq(roommateMatches.requesterId, req.userId),
          eq(roommateMatches.requesterAction, "PASS")
        )
      )
      .returning({ id: roommateMatches.id });

    return res.json({
      message: "Đã làm mới danh sách ứng viên",
      removedCount: deleted.length,
    });
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
    const savedRoommateIds = await db
      .select({ savedRoommateId: savedRoommates.savedRoommateId })
      .from(savedRoommates)
      .where(eq(savedRoommates.userId, req.userId));

    const ids = savedRoommateIds.map((item) => item.savedRoommateId).filter(Boolean);

    if (ids.length === 0) {
      return res.json([]);
    }

    const roomPosts = await db
      .select({
        id: roommatePosts.id,
        userId: roommatePosts.userId,
        addressDetail: roommatePosts.addressDetail,
        wardName: wards.name,
        districtName: districts.name,
        provinceName: provinces.name,
        createdAt: roommatePosts.createdAt,
      })
      .from(roommatePosts)
      .leftJoin(wards, eq(roommatePosts.wardId, wards.id))
      .leftJoin(districts, eq(wards.districtId, districts.id))
      .leftJoin(provinces, eq(districts.provinceId, provinces.id))
      .where(inArray(roommatePosts.userId, ids));

    const latestRoomPostsByUser = new Map<string, (typeof roomPosts)[number]>();
    roomPosts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach((post) => {
        if (!latestRoomPostsByUser.has(post.userId)) {
          latestRoomPostsByUser.set(post.userId, post);
        }
      });

    const saved = await db
      .select({
        id: savedRoommates.id,
        userId: profiles.id,
        fullName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
        bio: profiles.bio,
        gender: roommateProfiles.gender,
        age: roommateProfiles.age,
        hometown: roommateProfiles.hometown,
        schoolOrJob: roommateProfiles.schoolOrJob,
        hasPet: roommateProfiles.hasPet,
        sleepSchedule: roommateProfiles.sleepSchedule,
        hasRoom: roommateProfiles.hasRoom,
        savedAt: savedRoommates.createdAt,
        roomId: roommatePosts.id,
        roomAddress: roommatePosts.addressDetail,
        roomWard: wards.name,
        roomDistrict: districts.name,
        roomProvince: provinces.name,
      })
      .from(savedRoommates)
      .leftJoin(roommateProfiles, eq(savedRoommates.savedRoommateId, roommateProfiles.userId))
      .leftJoin(profiles, eq(savedRoommates.savedRoommateId, profiles.id))
      .leftJoin(roommatePosts, eq(roommatePosts.userId, savedRoommates.savedRoommateId))
      .leftJoin(wards, eq(roommatePosts.wardId, wards.id))
      .leftJoin(districts, eq(wards.districtId, districts.id))
      .leftJoin(provinces, eq(districts.provinceId, provinces.id))
      .where(eq(savedRoommates.userId, req.userId));

    const savedWithRoomData = saved.map((item) => {
      const roommateUserId = String(item.userId);
      const roomPost = latestRoomPostsByUser.get(roommateUserId);
      return {
        ...item,
        hasRoom: item.hasRoom || Boolean(roomPost),
        roomId: roomPost?.id ?? item.roomId,
        roomAddress: roomPost
          ? [roomPost.addressDetail, roomPost.wardName, roomPost.districtName, roomPost.provinceName]
              .filter(Boolean)
              .join(", ")
          : [item.roomAddress, item.roomWard, item.roomDistrict, item.roomProvince]
              .filter(Boolean)
              .join(", ") || undefined,
      };
    });

    return res.json(savedWithRoomData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 7.1 GET /api/roommates/saved/count - Đếm hồ sơ đã lưu trong database
router.get("/saved/count", auth, async (req, res) => {
  try {
    const countResult = await db
      .select({ id: savedRoommates.id })
      .from(savedRoommates)
      .where(eq(savedRoommates.userId, req.userId));

    return res.json({ count: countResult.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 8. DELETE /api/roommates/saved/:roommateId - Gỡ một người ra khỏi danh sách lưu
router.delete("/saved/:roommateId", auth, async (req, res) => {
  try {
    const roommateId = String(req.params.roommateId ?? "");

    // 1. Kiểm tra tính hợp lệ của UUID phòng hờ lỗi "invalid input syntax for type uuid"
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roommateId)) {
      return res.status(400).json({ message: "Định dạng ID người được lưu không hợp lệ" });
    }

    // 2. Thực hiện xóa và yêu cầu DB trả về bản ghi vừa xóa (.returning())
    const deletedRecords = await db
      .delete(savedRoommates)
      .where(
        and(
          eq(savedRoommates.userId, req.userId),         // Đúng chủ sở hữu session
          eq(savedRoommates.savedRoommateId, roommateId) // Đúng ID người cần gỡ bỏ
        )
      )
      .returning(); // Trả về mảng các hàng đã bị xóa thực tế

    // 3. Nếu mảng trả về rỗng, chứng tỏ bản ghi này không tồn tại
    if (deletedRecords.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bản ghi cần xóa trong danh sách lưu" });
    }

    // 4. Phản hồi thành công thực sự về cho Frontend
    return res.json({ message: "Đã xóa khỏi danh sách lưu thành công" });

  } catch (err) {
    console.error("LỖI TẠI DELETE /SAVED:", err);
    return res.status(500).json({ message: "Lỗi server khi hủy lưu ứng viên" });
  }
});

export default router;