# ⚡ QUICK START CHECKLIST - Roommate Features

**Created:** 2026-06-28  
**Status:** ✅ Implementation Complete - Awaiting Migration

---

## 🎯 Features Implemented

### Feature 1: Tìm Người Ở Ghép (Matching)
```
✅ Backend: 8 endpoints
✅ Frontend: 2 pages (Onboarding + Matching)
✅ Algorithm: Cosine Similarity (60% lifestyle, 20% budget, 10% gender, 10% age)
✅ UI: Responsive grid (1/2/3 cols)
✅ Actions: Pass / Save / Like
```

### Feature 2: Danh Sách Lưu (Saved Roommates)
```
✅ Backend: 3 endpoints (save, list, delete)
✅ Frontend: 1 page (SavedRoommates)
✅ UI: Bookmark grid with Chat + Delete
✅ DB: unique constraint on (user_id, saved_roommate_id)
```

### Feature 3: Tuyển Người Ở Ghép (Posts)
```
✅ Backend: 8 endpoints (CRUD + images)
✅ Frontend: 2 pages (Create + List)
✅ Features: Multi-section form, image upload (max 20), filtering
✅ Status: PENDING/APPROVED/RENTED tracking
```

---

## 📋 PRE-MIGRATION CHECKLIST (Backend Team)

- [x] **Code Review**
  - [x] schema.ts has 5 new tables
  - [x] roommate.routes.ts complete (8 endpoints)
  - [x] roommatePost.routes.ts complete (8 endpoints)
  - [x] roommateCompatibility.ts has algorithm
  - [x] auth middleware working
  - [x] app.ts registered routes
  - [x] Error handling present

- [x] **Frontend Code Review**
  - [x] 5 pages created
  - [x] roommates.ts service ready
  - [x] App.tsx routes added
  - [x] pages/index.ts exports added

- [ ] **Database Migration (DATABASE TEAM)**
  ```bash
  cd backend
  npx drizzle-kit generate
  npx drizzle-kit migrate
  ```

---

## 📖 DOCUMENTATION AVAILABLE

| File | Purpose | Read Time |
|------|---------|-----------|
| **DATABASE_MIGRATION_GUIDE.md** | Step-by-step for DB team | 10 min |
| **BACKEND_ARCHITECTURE_VERIFICATION.md** | Architecture proof | 15 min |
| **FEATURE_IMPLEMENTATION_SUMMARY.md** | Complete overview | 20 min |
| **QUICK_START_CHECKLIST.md** | This file | 2 min |

---

## 🚀 WHO DOES WHAT

### Database Team
1. Read: `DATABASE_MIGRATION_GUIDE.md`
2. Run: `npx drizzle-kit generate && migrate`
3. Verify: Check all 5 tables exist in PostgreSQL
4. Confirm: Let backend team know ✅

### Backend Team
1. After migration: `npm run dev`
2. Test endpoints with Postman/curl
3. Verify responses match docs
4. Report any issues

### Frontend Team
1. After backend: `npm run dev`
2. Test all pages
3. Verify API integration
4. Check UI/UX

---

## ⏰ EXECUTION TIMELINE

```
TODAY (2026-06-28):
├─ 📝 Documentation prepared ✅
├─ 💻 All code ready ✅
└─ ⏳ Awaiting DB migration

STEP 1 - Database (1-2 hours):
├─ Generate migrations
├─ Run migrations
└─ Verify tables

STEP 2 - Backend Testing (2-3 hours):
├─ Start server
├─ Test 16 endpoints
└─ Fix any issues

STEP 3 - Frontend Testing (3-4 hours):
├─ Start dev server
├─ Navigate all pages
├─ Test buttons
└─ Verify data flows

STEP 4 - Integration (1-2 hours):
├─ Connect Chat feature
├─ Add Profile nav buttons
└─ End-to-end test
```

---

## 🔍 QUICK VERIFICATION

### After Migration - Run This SQL:

```sql
-- Verify 5 tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'roommate_profiles', 
  'roommate_matches', 
  'saved_roommates', 
  'roommate_posts', 
  'roommate_post_images'
);

-- Expected: 5 rows returned
```

### After Backend Start - Test This Endpoint:

```bash
# Test auth middleware (should return error)
curl http://localhost:3000/api/roommates/profiles/me

# Expected response:
{"error":"No token"}

# OR with token:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/roommates/profiles/me
```

---

## 📊 16 Endpoints Summary

### Roommate Matching Endpoints (8)

| # | Method | Path | Purpose | Auth |
|---|--------|------|---------|------|
| 1 | POST | `/roommates/profiles` | Create/update profile | ✅ |
| 2 | GET | `/roommates/profiles/me` | Get my profile | ✅ |
| 3 | GET | `/roommates/profiles/discover` | Get candidates | ✅ |
| 4 | POST | `/roommates/matches` | Like/Pass | ✅ |
| 5 | GET | `/roommates/matches/me` | Get my matches | ✅ |
| 6 | POST | `/roommates/saved` | Save person | ✅ |
| 7 | GET | `/roommates/saved` | Get saved list | ✅ |
| 8 | DELETE | `/roommates/saved/:id` | Remove saved | ✅ |

### Roommate Post Endpoints (8)

| # | Method | Path | Purpose | Auth |
|---|--------|------|---------|------|
| 1 | POST | `/roommate-posts` | Create post | ✅ |
| 2 | GET | `/roommate-posts` | List posts | ❌ |
| 3 | GET | `/roommate-posts/:id` | Get detail | ❌ |
| 4 | PATCH | `/roommate-posts/:id` | Update post | ✅ |
| 5 | DELETE | `/roommate-posts/:id` | Delete post | ✅ |
| 6 | POST | `/roommate-posts/:id/images` | Upload image | ✅ |
| 7 | DELETE | `/roommate-posts/:id/images/:imgId` | Delete image | ✅ |
| 8 | GET | `/roommate-posts/user/my-posts` | My posts | ✅ |

---

## 🎨 Frontend Pages (5)

| Page | URL | Purpose | Status |
|------|-----|---------|--------|
| RoommateOnboarding | `/roommate-onboarding` | Setup profile | ✅ |
| RoommateMatching | `/roommate-matching` | Discovery grid | ✅ |
| SavedRoommates | `/saved-roommates` | Bookmarks | ✅ |
| RoommatePostCreate | `/roommate-posts/create` | Create post | ✅ |
| RoommatePostList | `/roommate-posts` | Manage posts | ✅ |

---

## 🔧 Environment Setup

### Backend `.env`
```
DATABASE_URL=postgresql://user:pass@host/db
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
NODE_ENV=development
PORT=3000
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:3000/api
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "table does not exist" | Migration not run | `npx drizzle-kit migrate` |
| "No token" on /api routes | Missing Bearer token | Add auth token to header |
| "Invalid token" | Supabase JWT invalid | Check token format & Supabase config |
| "Not found" | Wrong user_id | Verify profile exists first |
| CORS error | Frontend/backend mismatch | Check `http://localhost:5173` in CORS |
| Image upload fails | URL format wrong | Check URL accessibility |

---

## 📞 QUESTIONS?

Each documentation file has detailed explanations:
- **DATABASE_MIGRATION_GUIDE.md** - For DB migration questions
- **BACKEND_ARCHITECTURE_VERIFICATION.md** - For architecture questions
- **FEATURE_IMPLEMENTATION_SUMMARY.md** - For feature details

---

## ✅ SIGN-OFF CHECKLIST

### Database Team
- [ ] Read DATABASE_MIGRATION_GUIDE.md
- [ ] Run migrations successfully
- [ ] Verify all 5 tables created
- [ ] Database ready for backend

### Backend Team
- [ ] Migrations complete
- [ ] Start server: `npm run dev`
- [ ] Test all 16 endpoints
- [ ] Verify responses correct
- [ ] Backend ready for frontend

### Frontend Team
- [ ] Backend server running
- [ ] Start dev: `npm run dev`
- [ ] Test all 5 pages
- [ ] Verify data flow
- [ ] Frontend ready for integration

### DevOps Team
- [ ] Review all code
- [ ] Plan deployment
- [ ] Prepare production environment

---

## 🎉 READY TO START

**Current Status:** ✅ All code ready, awaiting database migration

**Next Action:** Database team runs:
```bash
cd backend
npx drizzle-kit generate
npx drizzle-kit migrate
```

**Estimated Time to Full Integration:** 6-8 hours total

Let's go! 🚀
