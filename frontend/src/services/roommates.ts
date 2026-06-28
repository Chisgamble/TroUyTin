import { api } from "../lib/axios";

// Định nghĩa các Interface để Frontend gợi ý nhắc lệnh (Intellisense) chuẩn chỉnh
export interface ProfileData {
  gender: string;
  age: number | string;
  hometown: string;
  schoolOrJob: string;
  budgetMin: number | string;
  budgetMax: number | string;
  smoking: string;
  drinking: string;
  sleepSchedule: string;
  tidiness: string;
  hasPet: boolean;
  allowOvernightGuest: boolean;
  hasRoom: boolean;
}

export interface PostData {
  title: string;
  description?: string;
  area?: number | string | null;
  pricePerMonth: number | string;
  roomType: string;
  wardId?: number | string | null;
  addressDetail?: string;
  availableFrom?: string | null;
  amenities?: string[];
  rules?: string;
}


export const roommateService = {
  // Profile
  createOrUpdateProfile: (data: any) =>
    api.post("/api/roommates/profiles", data), // 🔥 Đã thêm /api

  getMyProfile: () =>
    api.get("/api/roommates/profiles/me"), // 🔥 Đã thêm /api

  getDiscover: () =>
    api.get("/api/roommates/profiles/discover"), // 🔥 Đã thêm /api

  // Matches
  createMatch: (targetId: string, action: "LIKE" | "PASS") =>
    api.post("/api/roommates/matches", { targetId, action }), // 🔥 Đã thêm /api

  getMyMatches: () =>
    api.get("/api/roommates/matches/me"), // 🔥 Đã thêm /api

  // Saved Roommates
  saveRoommate: (roommateId: string) =>
    api.post("/api/roommates/saved", { savedRoommateId: roommateId }), // 🔥 Đã thêm /api

  getSavedRoommates: () =>
    api.get("/api/roommates/saved"), // 🔥 Đã thêm /api (Sửa lỗi trang SavedRoommates)

  removeSavedRoommate: (roommateId: string) =>
    api.delete(`/api/roommates/saved/${roommateId}`), // 🔥 Đã thêm /api
};

export const roommatePostService = {
  // Posts
  createPost: (data: any) =>
    api.post("/api/roommate-posts", data), // 🔥 Đã thêm /api

  getPosts: (filters?: any) =>
    api.get("/api/roommate-posts", { params: filters }), // 🔥 Đã thêm /api

  getPostDetail: (postId: number) =>
    api.get(`/api/roommate-posts/${postId}`), // 🔥 Đã thêm /api

  updatePost: (postId: number, data: any) =>
    api.patch(`/api/roommate-posts/${postId}`, data), // 🔥 Đã thêm /api

  deletePost: (postId: number) =>
    api.delete(`/api/roommate-posts/${postId}`), // 🔥 Đã thêm /api

  // Images
  uploadImage: (postId: number, imageUrl: string, displayOrder?: number) =>
    api.post(`/api/roommate-posts/${postId}/images`, {
      imageUrl,
      displayOrder: displayOrder ?? 0,
    }), // 🔥 Đã thêm /api

  deleteImage: (postId: number, imageId: number) =>
    api.delete(`/api/roommate-posts/${postId}/images/${imageId}`), // 🔥 Đã thêm /api

  // User's posts
  getMyPosts: () =>
    api.get("/api/roommate-posts/user/my-posts"), // 🔥 Đã thêm /api
};