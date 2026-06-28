import express from "express";
import { db } from "../db";
import {
  roommatePosts,
  roommatePostImages,
  profiles,
  wards,
  districts,
  provinces,
} from "../db/schema";
import { eq, and, not, inArray, gte, lte } from "drizzle-orm";
import { auth } from "../middlewares/auth";

const router = express.Router();

// 1. POST /roommate-posts - Tạo bài đăng tuyển người ở ghép
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      area,
      pricePerMonth,
      roomType,
      wardId,
      addressDetail,
      latitude,
      longitude,
      availableFrom,
      amenities,
      rules,
    } = req.body;

    if (!title || !roomType || !pricePerMonth) {
      return res.status(400).json({
        message: "Thiếu thông tin bắt buộc: title, roomType, pricePerMonth",
      });
    }

    const post = await db
      .insert(roommatePosts)
      .values({
        userId: req.userId,
        title,
        description,
        area: area ? parseFloat(area) : null,
        pricePerMonth,
        roomType,
        wardId: wardId ? parseInt(wardId) : null,
        addressDetail,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        amenities: amenities ? JSON.stringify(amenities) : null,
        rules,
      })
      .returning();

    return res.status(201).json(post[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server khi tạo bài đăng" });
  }
});

// 🔥 ĐÃ ĐỔI VỊ TRÍ: Đưa Route tĩnh này lên TRƯỚC Route động /:postId để tránh bị bắt nhầm tham số trùng lặp
// 2. GET /roommate-posts/user/my-posts - Lấy bài đăng của user hiện tại
router.get("/user/my-posts", auth, async (req, res) => {
  try {
    const posts = await db
      .select()
      .from(roommatePosts)
      .where(eq(roommatePosts.userId, req.userId))
      .orderBy(roommatePosts.createdAt);

    return res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 🔥 ĐÃ HOÀN THIỆN: Logic filter khoảng giá (minPrice, maxPrice) và diện tích (minArea, maxArea)
// 3. GET /roommate-posts - Lấy danh sách bài đăng (có filter)
router.get("/", async (req, res) => {
  try {
    const {
      wardId,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      roomType,
      status,
      limit = 20,
      offset = 0,
    } = req.query;

    let query = db.select().from(roommatePosts);
    const filters = [];

    if (wardId) filters.push(eq(roommatePosts.wardId, parseInt(wardId as string)));
    if (status) filters.push(eq(roommatePosts.status, status as string));
    if (roomType) filters.push(eq(roommatePosts.roomType, roomType as string));

    // Bộ lọc khoảng giá (Sử dụng gte và lte của Drizzle)
    if (minPrice) filters.push(gte(roommatePosts.pricePerMonth, minPrice as string));
    if (maxPrice) filters.push(lte(roommatePosts.pricePerMonth, maxPrice as string));

    // Bộ lọc khoảng diện tích
    if (minArea) filters.push(gte(roommatePosts.area, parseFloat(minArea as string)));
    if (maxArea) filters.push(lte(roommatePosts.area, parseFloat(maxArea as string)));

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    const posts = await query
      .orderBy(roommatePosts.createdAt)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    return res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 4. GET /roommate-posts/:postId - Lấy chi tiết bài đăng
router.get("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    if (isNaN(parseInt(postId))) {
      return res.status(400).json({ message: "Mã bài đăng không hợp lệ" });
    }

    const post = await db
      .select({
        id: roommatePosts.id,
        userId: roommatePosts.userId,
        userName: profiles.fullName,
        userAvatar: profiles.avatarUrl,
        userPhone: profiles.phone,
        title: roommatePosts.title,
        description: roommatePosts.description,
        area: roommatePosts.area,
        pricePerMonth: roommatePosts.pricePerMonth,
        roomType: roommatePosts.roomType,
        wardId: roommatePosts.wardId,
        wardName: wards.name,
        districtName: districts.name,
        provinceName: provinces.name,
        addressDetail: roommatePosts.addressDetail,
        latitude: roommatePosts.latitude,
        longitude: roommatePosts.longitude,
        availableFrom: roommatePosts.availableFrom,
        amenities: roommatePosts.amenities,
        rules: roommatePosts.rules,
        status: roommatePosts.status,
        viewCount: roommatePosts.viewCount,
        createdAt: roommatePosts.createdAt,
      })
      .from(roommatePosts)
      .leftJoin(profiles, eq(roommatePosts.userId, profiles.id))
      .leftJoin(wards, eq(roommatePosts.wardId, wards.id))
      .leftJoin(districts, eq(wards.districtId, districts.id))
      .leftJoin(provinces, eq(districts.provinceId, provinces.id))
      .where(eq(roommatePosts.id, parseInt(postId)))
      .limit(1);

    if (!post[0]) {
      return res.status(404).json({ message: "Bài đăng không tồn tại" });
    }

    const images = await db
      .select()
      .from(roommatePostImages)
      .where(eq(roommatePostImages.postId, parseInt(postId)))
      .orderBy(roommatePostImages.displayOrder);

    await db
      .update(roommatePosts)
      .set({ viewCount: (post[0].viewCount ?? 0) + 1 })
      .where(eq(roommatePosts.id, parseInt(postId)));

    return res.json({
      ...post[0],
      images,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 5. PATCH /roommate-posts/:postId - Cập nhật bài đăng
router.patch("/:postId", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const {
      title,
      description,
      area,
      pricePerMonth,
      roomType,
      addressDetail,
      latitude,
      longitude,
      availableFrom,
      amenities,
      rules,
      status,
    } = req.body;

    const post = await db
      .select()
      .from(roommatePosts)
      .where(eq(roommatePosts.id, parseInt(postId)))
      .limit(1);

    if (!post[0]) {
      return res.status(404).json({ message: "Bài đăng không tồn tại" });
    }

    if (post[0].userId !== req.userId) {
      return res.status(403).json({ message: "Không có quyền chỉnh sửa" });
    }

    const updated = await db
      .update(roommatePosts)
      .set({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(area !== undefined && { area: area ? parseFloat(area) : null }),
        ...(pricePerMonth && { pricePerMonth }),
        ...(roomType && { roomType }),
        ...(addressDetail && { addressDetail }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(availableFrom && { availableFrom: new Date(availableFrom) }),
        ...(amenities && { amenities: JSON.stringify(amenities) }),
        ...(rules && { rules }),
        ...(status && { status }),
        updatedAt: new Date(),
      })
      .where(eq(roommatePosts.id, parseInt(postId)))
      .returning();

    return res.json(updated[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 6. DELETE /roommate-posts/:postId - Xóa bài đăng
router.delete("/:postId", auth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await db
      .select()
      .from(roommatePosts)
      .where(eq(roommatePosts.id, parseInt(postId)))
      .limit(1);

    if (!post[0]) {
      return res.status(404).json({ message: "Bài đăng không tồn tại" });
    }

    if (post[0].userId !== req.userId) {
      return res.status(403).json({ message: "Không có quyền xóa" });
    }

    await db
      .delete(roommatePostImages)
      .where(eq(roommatePostImages.postId, parseInt(postId)));

    await db
      .delete(roommatePosts)
      .where(eq(roommatePosts.id, parseInt(postId)));

    return res.json({ message: "Bài đăng đã được xóa" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 7. POST /roommate-posts/:postId/images - Upload ảnh
router.post("/:postId/images", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { imageUrl, displayOrder = 0 } = req.body;

    const post = await db
      .select()
      .from(roommatePosts)
      .where(eq(roommatePosts.id, parseInt(postId)))
      .limit(1);

    if (!post[0]) {
      return res.status(404).json({ message: "Bài đăng không tồn tại" });
    }

    if (post[0].userId !== req.userId) {
      return res.status(403).json({ message: "Không có quyền thêm ảnh" });
    }

    const image = await db
      .insert(roommatePostImages)
      .values({
        postId: parseInt(postId),
        imageUrl,
        displayOrder: parseInt(displayOrder),
      })
      .returning();

    return res.status(201).json(image[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// 8. DELETE /roommate-posts/:postId/images/:imageId - Xóa ảnh
router.delete("/:postId/images/:imageId", auth, async (req, res) => {
  try {
    const { postId, imageId } = req.params;

    const post = await db
      .select()
      .from(roommatePosts)
      .where(eq(roommatePosts.id, parseInt(postId)))
      .limit(1);

    if (!post[0]) {
      return res.status(404).json({ message: "Bài đăng không tồn tại" });
    }

    if (post[0].userId !== req.userId) {
      return res.status(403).json({ message: "Không có quyền xóa ảnh" });
    }

    await db
      .delete(roommatePostImages)
      .where(eq(roommatePostImages.id, parseInt(imageId)));

    return res.json({ message: "Ảnh đã được xóa" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;