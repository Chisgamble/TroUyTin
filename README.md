# TroUyTin

TroUyTin là hệ thống tìm phòng trọ và tìm người ở ghép. Ứng dụng cung cấp
giao diện web cho người thuê/chủ trọ, xác thực bằng Supabase, dữ liệu chính
trên PostgreSQL và một API Express cho các nghiệp vụ phòng, đánh giá, ghép
người ở cùng và bài đăng tuyển người ở ghép.

## Tính năng chính

- Xem, tìm kiếm và xem chi tiết phòng trọ.
- Đăng, cập nhật và quản lý tin phòng.
- Lưu tin phòng, xem hồ sơ người đăng và gửi đánh giá.
- Đăng nhập/đăng ký bằng email-mật khẩu; hỗ trợ Google OAuth nếu bật trong
  Supabase.
- Tìm người ở ghép theo hồ sơ lối sống, ngân sách và mức tương thích; Like,
  Pass, Match và lưu hồ sơ.
- Tạo và quản lý bài đăng tuyển người ở ghép, kèm ảnh.
- Tìm phòng bằng câu tự nhiên. Backend dùng Gemini khi có API key và trả về
  bộ lọc chuẩn hóa.
- Chat 1-1 và cập nhật tin nhắn Realtime qua Supabase.

## Kiến trúc và cấu trúc thư mục

```text
trouytin/
├─ backend/                 # Express + TypeScript + Drizzle ORM
│  ├─ src/server.ts         # Điểm khởi động API
│  ├─ src/app.ts            # CORS, JSON parser và khai báo route
│  ├─ src/routes/           # Các nhóm API
│  ├─ src/db/schema.ts      # Schema PostgreSQL
│  └─ supabase/             # Migration, seed và script chat/RLS
├─ frontend/                # React + Vite + TypeScript
│  ├─ src/pages/            # Các màn hình ứng dụng
│  ├─ src/components/       # Component giao diện
│  ├─ src/services/         # Supabase client và API client
│  └─ src/lib/axios.ts      # Axios client cho backend
└─ README.md
```

Luồng dữ liệu có hai nhánh:

```text
Frontend ── Axios ──> Backend Express ── Drizzle ──> PostgreSQL/Supabase
Frontend ───────────────── Supabase JS ────────────> Auth, Database, Storage, Realtime
```

## Yêu cầu môi trường

- Node.js LTS, khuyến nghị Node.js 20 trở lên.
- npm.
- Một project Supabase có PostgreSQL, Auth, Storage và Realtime.
- Google Gemini API key nếu muốn dùng tìm kiếm bằng câu tự nhiên.

## Cài đặt nhanh

### 1. Cài dependency

Từ thư mục gốc của project:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Project hiện không có script chạy chung ở thư mục gốc; backend và frontend
được khởi động bằng hai terminal riêng.

### 2. Tạo và cấu hình Supabase

Trong Supabase Dashboard:

1. Tạo project PostgreSQL mới.
2. Lấy Project URL, Publishable/Anon key và connection string PostgreSQL.
3. Bật Email provider trong Authentication để dùng đăng ký/đăng nhập bằng
   email. Có thể bật thêm Google provider để dùng nút “Đăng nhập với Google”.
4. Trong Storage, tạo các bucket `listing-images` và `avatars`. Bucket
   `listing-images` cần cho chức năng tải ảnh tin phòng; `avatars` cần cho ảnh
   đại diện.
5. Nếu sử dụng chat, chạy hai script sau trong SQL Editor theo thứ tự:

   ```text
   backend/supabase/chat_trigger_setup.sql
   backend/supabase/chat_rls_setup.sql
   ```

   Các script này tạo trigger cập nhật thời gian hội thoại, bật RLS cho chat
   và thêm bảng `messages` vào Supabase Realtime.

### 3. Tạo file biến môi trường

Tạo `backend/.env`:

```env
# Supabase PostgreSQL connection string
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>

# Dùng để lấy JWKS xác thực JWT Supabase
SUPABASE_URL=https://<project-id>.supabase.co

# Chỉ backend được phép biết key này; dùng khi xóa ảnh khỏi Storage
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Bắt buộc cho /api/search/parse
TROUYTIN_API_KEY=<google-gemini-api-key>

# Không bắt buộc, mặc định là 3000
PORT=3000
NODE_ENV=development
```

Tạo `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

`VITE_API_URL` phải là origin của backend, không thêm `/api`. Các service của
frontend đã tự nối các đường dẫn như `/api/rooms` và `/api/roommates/...`.

Không đưa `SUPABASE_SERVICE_ROLE_KEY` hoặc `DATABASE_URL` vào
`frontend/.env`, không commit các file `.env` lên Git.

### 4. Khởi tạo database

Các migration Drizzle đã có trong `backend/supabase/migrations`. Chạy:

```bash
cd backend
npx drizzle-kit migrate
```

Nếu cần tạo migration mới sau khi sửa `backend/src/db/schema.ts`:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Có thể nạp dữ liệu mẫu bằng `backend/supabase/seed_test_data.sql` trong
Supabase SQL Editor. Dữ liệu mẫu hiện tạo một tin có trạng thái `RENTED`, vì
vậy tin này không xuất hiện trong các màn hình chỉ lọc tin `AVAILABLE`; đổi
trạng thái nếu cần dùng để demo tìm phòng.

## Chạy ứng dụng

Mở hai terminal.

Terminal 1 — backend:

```bash
cd backend
npm run dev
```

API chạy mặc định tại `http://localhost:3000`.

Terminal 2 — frontend:

```bash
cd frontend
npm run dev
```

Mở `http://localhost:5173`. CORS trong backend hiện chỉ cho phép đúng origin
này. Nếu đổi port frontend, cần cập nhật `origin` trong
`backend/src/app.ts`.

### Chạy bản production cục bộ

```bash
# Backend
cd backend
npm run build
npm start

# Frontend, mở terminal khác
cd frontend
npm run build
npm run preview
```

## Hướng dẫn sử dụng

### Người dùng thuê phòng

1. Mở trang chủ và chọn đăng nhập/đăng ký.
2. Dùng tìm kiếm thường để lọc theo từ khóa, khu vực, loại phòng, giá và
   diện tích.
3. Chọn một tin để xem chi tiết, hình ảnh, tiện nghi, chủ trọ và đánh giá.
4. Đăng nhập để lưu tin, mở hồ sơ công khai, chat hoặc gửi đánh giá.
5. Vào `/profile/saved-rooms` để xem các tin đã lưu.

### Chủ trọ

1. Đăng nhập bằng tài khoản có hồ sơ chủ trọ.
2. Vào `/dang-tin` để tạo tin phòng, chọn khu vực và tải ảnh.
3. Vào `/profile/listings` để xem, sửa hoặc quản lý tin của mình.
4. Khi người thuê mở tin, có thể trao đổi qua chat và đánh giá sau giao dịch.

### Tìm người ở ghép

1. Mở `/roommate-onboarding` và hoàn thiện hồ sơ lối sống, ngân sách và nhu
   cầu.
2. Mở `/roommate-matching` để xem các hồ sơ được đề xuất.
3. Chọn Like hoặc Pass; khi hai phía cùng Like, hệ thống tạo Match.
4. Dùng `/saved-roommates` để xem các hồ sơ đã lưu.
5. Dùng `/roommate-posts` để xem bài đăng tuyển người ở ghép; tạo bài mới tại
   `/roommate-posts/create`.

### Tìm kiếm bằng AI

Mở `/tim-kiem-ai` và nhập câu như `phòng trọ dưới 4 triệu ở Bình Thạnh`. Frontend
gọi `POST /api/search/parse`, backend chuyển câu hỏi thành bộ lọc rồi truy vấn
`room_listings` trên Supabase. Tính năng này yêu cầu `TROUYTIN_API_KEY`.

### Đăng nhập và khôi phục mật khẩu

Frontend dùng Supabase Auth trực tiếp. Trong Supabase Dashboard, thêm các URL
sau vào Authentication → URL Configuration khi chạy local:

```text
http://localhost:5173
http://localhost:5173/reset-password
```

Nút Google dùng redirect về trang chủ; luồng quên mật khẩu redirect về
`/reset-password`.

## Các trang frontend

| URL | Mục đích |
|---|---|
| `/` | Landing page khi chưa đăng nhập, trang chủ khi đã đăng nhập |
| `/login` | Đăng nhập, đăng ký, Google OAuth, quên mật khẩu |
| `/tim-kiem` | Tìm kiếm phòng thường |
| `/tim-kiem-ai` | Tìm kiếm phòng bằng câu tự nhiên |
| `/phong/:id` | Chi tiết phòng |
| `/dang-tin` | Tạo tin phòng |
| `/profile` | Hồ sơ cá nhân |
| `/profile/saved-rooms` | Tin phòng đã lưu |
| `/profile/listings` | Tin phòng của tôi |
| `/roommate-onboarding` | Khai báo hồ sơ ở ghép |
| `/roommate-matching` | Khám phá và ghép người ở cùng |
| `/saved-roommates` | Hồ sơ ở ghép đã lưu |
| `/roommate-posts` | Danh sách bài đăng ở ghép |
| `/roommate-posts/create` | Tạo bài đăng ở ghép |
| `/chat` | Hộp thư và chat |

## API backend

Tất cả API dùng tiền tố `http://localhost:3000/api`.

| Nhóm | Endpoint chính | Xác thực |
|---|---|---|
| Phòng | `GET /rooms`, `GET /rooms/:id`, `DELETE /rooms/:id` | Chỉ thao tác đọc không yêu cầu token |
| Đánh giá | `GET /reviews/listing/:listingId`, `GET /reviews/reviewee/:revieweeId`, `POST /reviews` | POST yêu cầu token |
| Hồ sơ ở ghép | `POST /roommates/profiles`, `GET /roommates/profiles/me`, `GET /roommates/profiles/discover` | Có token |
| Match | `POST /roommates/matches`, `GET /roommates/matches/me`, `DELETE /roommates/matches/pass` | Có token |
| Hồ sơ đã lưu | `POST /roommates/saved`, `GET /roommates/saved`, `GET /roommates/saved/count`, `DELETE /roommates/saved/:roommateId` | Có token |
| Bài đăng ở ghép | `GET /roommate-posts`, `GET /roommate-posts/:postId`, `GET /roommate-posts/user/my-posts` | GET my-posts có token |
| Quản lý bài đăng | `POST /roommate-posts`, `PATCH /roommate-posts/:postId`, `DELETE /roommate-posts/:postId` | Có token |
| Ảnh bài đăng | `POST /roommate-posts/:postId/images`, `DELETE /roommate-posts/:postId/images/:imageId` | Có token |
| Tìm kiếm AI | `POST /search/parse` | Không yêu cầu token, cần Gemini key |

Các route yêu cầu xác thực nhận JWT Supabase ở header:

```http
Authorization: Bearer <supabase-access-token>
```

Ví dụ kiểm tra server và auth middleware:

```bash
curl http://localhost:3000/api/rooms
curl http://localhost:3000/api/roommates/profiles/me
```

Request thứ hai sẽ trả `401 {"error":"No token"}` nếu chưa gửi token; đây là
hành vi đúng.
