# 📋 Database Migration Guide - Roommate Matching Feature

**Người thực hiện:** Database Team  
**Ngày:** 2026-06-28  
**Feature:** Tìm người ở ghép + Danh sách lưu người ở ghép + Tuyển người ở ghép

---

## 🗂️ LAYERED ARCHITECTURE

```
Layered Backend Structure:
┌─ Frontend (React) ──────────────┐
│ └─ src/services/roommates.ts    │ (API Client)
└────────────┬────────────────────┘
             │ HTTP Requests
┌────────────┴────────────────────┐
│ Express Routes                  │
│ └─ src/routes/roommate.routes   │
│ └─ src/routes/roommatePost.routes
└────────────┬────────────────────┘
             │
┌────────────┴────────────────────┐
│ Middleware (auth)               │
│ └─ src/middlewares/auth.ts      │ (JWT verification)
└────────────┬────────────────────┘
             │
┌────────────┴────────────────────┐
│ Controllers (Routes)            │
│ └─ Direct in route files        │
└────────────┬────────────────────┘
             │
┌────────────┴────────────────────┐
│ Services (Business Logic)       │
│ └─ src/services/                │
│    └─ roommateCompatibility.ts  │ (Cosine Similarity)
└────────────┬────────────────────┘
             │ Drizzle ORM
┌────────────┴────────────────────┐
│ PostgreSQL Database             │
│ (Hosted on Supabase)            │
└─────────────────────────────────┘
```

---

## ✅ PRE-MIGRATION CHECKLIST

- [x] Backend code tương thích (Drizzle ORM)
- [x] Schema.ts định nghĩa tất cả tables
- [x] Routes + Controllers tạo xong
- [x] Services (Cosine Similarity algorithm) tạo xong
- [x] Auth middleware cấu hình Supabase JWT
- [ ] **Database migrations cần chạy (VIỆC CỦA BẠN)**

---

## 📊 DATABASE TABLES CẦN MIGRATION

### 1️⃣ **roommateProfiles** (Hồ sơ lối sống)
```sql
TABLE: roommate_profiles
├─ id (serial, primary key)
├─ user_id (uuid, FK → profiles.id)
├─ gender (text)
├─ age (integer)
├─ hometown (text)
├─ school_or_job (text)
├─ budget_min (numeric)
├─ budget_max (numeric)
├─ smoking (text: NO/SOMETIMES/YES)
├─ drinking (text: NO/SOMETIMES/YES)
├─ sleep_schedule (text: 8PM-5AM/10PM-6AM/12AM-8AM)
├─ tidiness (text: LOW/MEDIUM/HIGH)
├─ cleaning_freq (text: NEVER/RARELY/SOMETIMES/OFTEN/ALWAYS)
├─ has_pet (boolean, default false)
├─ allow_overnight_guest (boolean, default false)
├─ cooking_freq (text: NEVER/RARELY/SOMETIMES/OFTEN/ALWAYS)
├─ has_room (boolean, default false)
├─ vector_embedding (text, for ML)
├─ created_at (timestamp)
├─ updated_at (timestamp)
└─ UNIQUE constraint: user_id

Mapping: 1 user = 1 roommate profile
```

### 2️⃣ **roommateMatches** (Lượng tương thích - Like/Pass)
```sql
TABLE: roommate_matches
├─ id (serial, primary key)
├─ requester_id (uuid, FK → profiles.id)
├─ target_id (uuid, FK → profiles.id)
├─ compatibility_pct (real: 0-100%)
├─ requester_action (enum: PENDING/LIKE/PASS)
├─ target_action (enum: PENDING/LIKE/PASS, default PENDING)
├─ status (enum: PENDING/MATCHED/REJECTED)
├─ created_at (timestamp)
├─ matched_at (timestamp, nullable)
└─ UNIQUE constraint: requester_id + target_id

Usage: User A likes/passes User B
```

### 3️⃣ **savedRoommates** (Danh sách lưu - Like YouTube's "Watch Later")
```sql
TABLE: saved_roommates
├─ id (serial, primary key)
├─ user_id (uuid, FK → profiles.id)
├─ saved_roommate_id (uuid, FK → profiles.id)
├─ created_at (timestamp)
└─ UNIQUE constraint: user_id + saved_roommate_id

Usage: User bookmarks person for later contact
```

### 4️⃣ **roommatePosts** (Bài tuyển người ở ghép)
```sql
TABLE: roommate_posts
├─ id (serial, primary key)
├─ user_id (uuid, FK → profiles.id) [người có phòng]
├─ title (text, required)
├─ description (text)
├─ area (real: m²)
├─ price_per_month (numeric)
├─ room_type (enum: PHONG_TRO/CAN_HO_MINI/KTX/NGUYEN_CAN)
├─ ward_id (integer, FK → wards.id)
├─ address_detail (text)
├─ latitude (real)
├─ longitude (real)
├─ available_from (timestamp)
├─ amenities (text: JSON array)
├─ rules (text: house rules)
├─ status (enum: PENDING/APPROVED/REJECTED/RENTED)
├─ view_count (integer, default 0)
├─ created_at (timestamp)
├─ updated_at (timestamp)

Usage: Person with room recruits roommate
```

### 5️⃣ **roommatePostImages** (Ảnh bài tuyển)
```sql
TABLE: roommate_post_images
├─ id (serial, primary key)
├─ post_id (integer, FK → roommate_posts.id, ON DELETE CASCADE)
├─ image_url (text)
├─ display_order (integer)
├─ uploaded_at (timestamp)

Usage: Max 20 images per post
```

---

## 🚀 MIGRATION STEPS (Chạy trong Backend Terminal)

### **Step 1: Vào Backend Folder**
```bash
cd d:\HCMUS\HOCTAP\Semesters\25-26HK3\KhoiNghiep\project\code\TroUyTin\backend
```

### **Step 2: Generate Migrations**
```bash
npx drizzle-kit generate
```

**Kết quả dự kiến:**
```
Drizzle Kit was started in 'push' mode
2 migration files have been generated
```

**Files sẽ được tạo tại:** `backend/drizzle` hoặc `backend/migrations`  
**Kiểm tra:** Xem các file `.sql` đã được tạo

### **Step 3: Chạy Migrations**
```bash
npx drizzle-kit migrate
```

**Kết quả dự kiến:**
```
Applying migration_001.sql
Applying migration_002.sql
✅ Migrations applied successfully
```

---

## ⚙️ ENVIRONMENT SETUP

**Đảm bảo `.env` trong backend folder có:**

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]

# Supabase Auth
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# Server
NODE_ENV=development
PORT=3000
```

**Kiểm tra:** `echo $env:DATABASE_URL` (PowerShell)

---

## 🔍 VERIFICATION (Sau khi migration)

### **Verify Tables Exist (PostgreSQL)**
```sql
-- Kiểm tra tất cả bảng đã được tạo
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'roommate_profiles', 
  'roommate_matches', 
  'saved_roommates', 
  'roommate_posts', 
  'roommate_post_images'
);
```

**Kết quả dự kiến:**
```
table_name
────────────────────────
roommate_profiles
roommate_matches
saved_roommates
roommate_posts
roommate_post_images
```

### **Verify Columns**
```sql
-- Kiểm tra columns trong roommate_profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'roommate_profiles';
```

---

## 📝 API ENDPOINTS (Sau Migration)

### **Roommate Matching Endpoints:**

**1. POST /api/roommates/profiles** [Auth]
- Tạo/update hồ sơ lối sống
- Body: `{ gender, age, hometown, smoking, drinking, sleepSchedule, ... }`

**2. GET /api/roommates/profiles/discover** [Auth]
- Lấy danh sách candidates
- Response: `[{ userId, fullName, age, compatibilityPct, hasPet, sleepSchedule }]`

**3. POST /api/roommates/saved** [Auth]
- Lưu người ở ghép
- Body: `{ savedRoommateId }`

**4. GET /api/roommates/saved** [Auth]
- Danh sách người đã lưu
- Response: `[{ userId, fullName, bio, savedAt }]`

**5. DELETE /api/roommates/saved/:roommateId** [Auth]
- Xóa khỏi danh sách lưu

### **Roommate Post Endpoints:**

**1. POST /api/roommate-posts** [Auth]
- Tạo bài tuyển
- Body: `{ title, roomType, pricePerMonth, wardId, ... }`

**2. GET /api/roommate-posts**
- Danh sách bài tuyển (public)
- Query: `?wardId=1&minPrice=1000000&maxPrice=5000000`

**3. GET /api/roommate-posts/:postId**
- Chi tiết bài tuyển

**4. PATCH /api/roommate-posts/:postId** [Auth]
- Sửa bài tuyển (ownership check)

**5. DELETE /api/roommate-posts/:postId** [Auth]
- Xóa bài tuyển

---

## ⚠️ TROUBLESHOOTING

### **Error: "table does not exist"**
```
Nguyên nhân: Migration chưa chạy
Giải pháp: 
  1. Kiểm tra DATABASE_URL
  2. Chạy: npx drizzle-kit migrate
  3. Verify bảng đã tạo (SQL query)
```

### **Error: "Foreign key constraint failed"**
```
Nguyên nhân: Reference table không tồn tại
Giải pháp:
  1. Đảm bảo profiles, wards, districts tables tồn tại
  2. Xem thứ tự migration
```

### **Error: "Connection refused"**
```
Nguyên nhân: PostgreSQL/Supabase không kết nối
Giải pháp:
  1. Kiểm tra DATABASE_URL đúng
  2. Kiểm tra network connection
  3. Kiểm tra Supabase project active
```

---

## 📌 FILES LIÊN QUAN

| File | Mục đích |
|------|---------|
| `backend/src/db/schema.ts` | ✅ Schema định nghĩa (Đã tạo) |
| `backend/src/routes/roommate.routes.ts` | ✅ 8 endpoints (Đã tạo) |
| `backend/src/routes/roommatePost.routes.ts` | ✅ 8 endpoints (Đã tạo) |
| `backend/src/services/roommateCompatibility.ts` | ✅ Cosine Similarity (Đã tạo) |
| `backend/src/middlewares/auth.ts` | ✅ JWT Auth (Đã tạo) |
| `backend/src/app.ts` | ✅ Route registration (Đã cập nhật) |
| `backend/drizzle.config.ts` | ⚠️ Kiểm tra config |
| `backend/.env` | ⚠️ Kiểm tra DATABASE_URL |

---

## 🎯 NEXT STEPS AFTER MIGRATION

1. ✅ **Database:** Run migrations (YOUR JOB)
2. ⏳ **Frontend:** Test API endpoints
3. ⏳ **Frontend:** Update Profile page with navigation buttons
4. ⏳ **Integration:** Connect Chat feature

---

## 📞 CONTACT

- **Backend Dev:** [Tôi đã chuẩn bị tất cả code]
- **Database Dev:** [Chạy migration steps]
- **Frontend Dev:** [Sẽ test APIs]

---

## ✅ SIGN-OFF CHECKLIST

- [ ] Migration chạy thành công
- [ ] Tất cả 5 tables được tạo
- [ ] Verify SQL queries pass
- [ ] Backend team test endpoints
- [ ] APIs response đúng format
- [ ] Ready for Frontend integration
