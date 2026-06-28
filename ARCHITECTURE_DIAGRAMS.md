# 🏗️ ARCHITECTURE DIAGRAMS - Roommate Features

---

## 📐 SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER (User's Computer)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              FRONTEND (React + Vite)                     │  │
│  │                   PORT 5173                              │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  RoommateOnboarding.tsx  ──┐                            │  │
│  │  RoommateMatching.tsx     ├─→ App.tsx (Router)         │  │
│  │  SavedRoommates.tsx       ├─→ pages/index.ts           │  │
│  │  RoommatePostCreate.tsx   ├─→ (5 pages total)          │  │
│  │  RoommatePostList.tsx     ──┘                            │  │
│  │                                                          │  │
│  │  ↓ (imports)                                             │  │
│  │  services/roommates.ts                                   │  │
│  │  ├─ roommateService (8 methods)                          │  │
│  │  └─ roommatePostService (8 methods)                      │  │
│  │                                                          │  │
│  │  axios (HTTP client with auth interceptor)              │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓ HTTP/JSON                             │
│                    (Bearer Token in header)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
         ┌──────────▼──────────┐  ┌─────────▼────────┐
         │  Supabase Auth      │  │  Backend Server  │
         │  (JWT verification)│  │  (Express.js)    │
         │  Port: N/A          │  │  Port: 3000      │
         └─────────────────────┘  └─────────┬────────┘
                                           │
                ┌──────────────────────────┴──────────────────────┐
                │                                                 │
         ┌──────▼──────────────────────────────────────────────┐  │
         │         EXPRESS ROUTES (16 endpoints)              │  │
         ├──────────────────────────────────────────────────┬──┘  │
         │                                                  │      │
         │  /api/roommates/profiles          [GET, POST]   │      │
         │  /api/roommates/profiles/discover [GET]         │      │
         │  /api/roommates/matches           [GET, POST]   │      │
         │  /api/roommates/saved             [GET, POST]   │      │
         │  /api/roommate-posts              [GET, POST]   │      │
         │  /api/roommate-posts/:id          [GET, PATCH]  │      │
         │  /api/roommate-posts/:id/images   [POST, DELETE]│      │
         │                                                  │      │
         └─────────────────────────────────────┬────────────┘      │
                                               │                   │
                      ┌────────────────────────┴──────────────────┐│
                      │                                           ││
                 ┌────▼─────────────────────────────────┐         ││
                 │  MIDDLEWARE: auth.ts                │         ││
                 │  - JWT verification                │         ││
                 │  - Extract userId from token.sub   │         ││
                 │  - Set req.userId                  │         ││
                 └────┬─────────────────────────────────┘         ││
                      │                                           ││
          ┌───────────┴──────────────┐                            ││
          │                          │                            ││
     ┌────▼──────────────────┐  ┌────▼──────────────────┐         ││
     │  roommate.routes.ts   │  │  roommatePost.routes.ts         ││
     │  (Controllers)        │  │  (Controllers)         ││
     │                       │  │                        ││
     │  8 Endpoints:         │  │  8 Endpoints:          ││
     │  - Profile CRUD       │  │  - Post CRUD           ││
     │  - Match Create       │  │  - Image Management    ││
     │  - Discover Query     │  │  - Filtering           ││
     │  - Saved CRUD         │  │  - Status tracking     ││
     │                       │  │                        ││
     └────┬──────────────────┘  └────┬──────────────────┘│
          │                          │                   │
          └──────────────┬───────────┘                   │
                        │                               │
            ┌───────────▼────────────┐                  │
            │  SERVICES             │                  │
            │  roommateCompatibility.ts                │
            │  - profileToVector()   │                  │
            │  - cosineSimilarity()  │                  │
            │  - calculateCompatibility()              │
            └───────────┬────────────┘                  │
                        │                               │
            ┌───────────▼────────────┐                  │
            │  Drizzle ORM           │                  │
            │  - db.select()         │                  │
            │  - db.insert()         │                  │
            │  - db.update()         │                  │
            │  - db.delete()         │                  │
            └───────────┬────────────┘                  │
                        │                               │
                        └───────────┬───────────────────┘
                                    │
                        ┌───────────▼───────────┐
                        │  PostgreSQL Database  │
                        │  (Supabase)          │
                        ├──────────────────────┤
                        │ Tables:              │
                        │ - profiles           │
                        │ - roommate_profiles  │
                        │ - roommate_matches   │
                        │ - saved_roommates    │
                        │ - roommate_posts     │
                        │ - roommate_post_imgs │
                        │ - wards, districts   │
                        │ - ...others          │
                        └──────────────────────┘
```

---

## 🔄 REQUEST FLOW: Discover Roommates

```
┌──────────────────────────────────────────────────────────────────┐
│ User Action: Click "Tìm bạn ở ghép" on /roommate-matching       │
└──────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────▼───────────────┐
                │ Frontend calls:               │
                │ roommateService.getDiscover()│
                └───────────────┬───────────────┘
                                │
                ┌───────────────▼───────────────┐
                │ GET /api/roommates/           │
                │     profiles/discover         │
                │ Header: Authorization: Bearer │
                │ {token}                       │
                └───────────────┬───────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        │ ┌─────────────────────────────────────────┐  │
        │ │ 1. Middleware: auth()                  │  │
        │ │    Extract userId from JWT token       │  │
        │ │    Set req.userId                      │  │
        │ └──────────────────┬──────────────────────┘  │
        │                    │                         │
        │ ┌──────────────────▼──────────────────────┐  │
        │ │ 2. Controller (roommate.routes.ts)      │  │
        │ │                                        │  │
        │ │    a) Load user's profile              │  │
        │ │       SELECT * FROM roommate_profiles  │  │
        │ │       WHERE user_id = req.userId       │  │
        │ │                                        │  │
        │ │    b) Get already matched users        │  │
        │ │       SELECT targetId FROM             │  │
        │ │         roommate_matches               │  │
        │ │       WHERE requesterId = req.userId   │  │
        │ │                                        │  │
        │ │    c) Exclude self + matched           │  │
        │ │       WHERE userId NOT IN              │  │
        │ │         [req.userId, ...matchedIds]    │  │
        │ └──────────────────┬──────────────────────┘  │
        │                    │                         │
        │ ┌──────────────────▼──────────────────────┐  │
        │ │ 3. For EACH candidate profile:          │  │
        │ │                                        │  │
        │ │    Call Service:                       │  │
        │ │    calculateCompatibility(             │  │
        │ │      userProfile,                      │  │
        │ │      candidateProfile                  │  │
        │ │    )                                   │  │
        │ │                                        │  │
        │ │    Service does:                       │  │
        │ │    ├─ profileToVector(user)            │  │
        │ │    ├─ profileToVector(candidate)       │  │
        │ │    ├─ cosineSimilarity() [60% weight]  │  │
        │ │    ├─ budgetCompatibility() [20%]      │  │
        │ │    ├─ genderScore [10%]                │  │
        │ │    ├─ ageScore [10%]                   │  │
        │ │    └─ return 0-100%                    │  │
        │ └──────────────────┬──────────────────────┘  │
        │                    │                         │
        │ ┌──────────────────▼──────────────────────┐  │
        │ │ 4. Collect results:                    │  │
        │ │    [                                   │  │
        │ │      { userId, name, compatibilityPct }  │  │
        │ │      { userId, name, compatibilityPct }  │  │
        │ │      ...                               │  │
        │ │    ]                                   │  │
        │ │                                        │  │
        │ │    Sort by compatibilityPct DESC       │  │
        │ │    Limit to 20 results                 │  │
        │ └──────────────────┬──────────────────────┘  │
        │                    │                         │
        └────────────────────┼─────────────────────────┘
                             │
                ┌────────────▼─────────────┐
                │ Response 200 OK          │
                │ Content-Type: JSON       │
                │ Body: [...]              │
                └────────────┬─────────────┘
                             │
                ┌────────────▼─────────────┐
                │ Frontend receives JSON   │
                │ Render grid of cards     │
                │ Show % match per card    │
                │ Display 3 action buttons │
                │ (Pass, Save, Like)       │
                └──────────────────────────┘
```

---

## 💾 DATA MODEL RELATIONSHIPS

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐                                                    │
│  │  profiles   │ (existing)                                         │
│  ├─────────────┤                                                    │
│  │ id (uuid)   │◄──────┐                                            │
│  │ email       │       │ (1 to 1)                                   │
│  │ fullName    │       │                                            │
│  │ ...         │       │                                            │
│  └─────────────┘       │                                            │
│         ▲              │                                            │
│         │              │                                            │
│    (N to 1)           │                                            │
│         │              │                                            │
│         │         ┌────┴──────────────┐                             │
│         │         │                   │                             │
│    ┌────┴─────────▼──────┐    ┌──────┴─────────┐                   │
│    │ roommate_profiles   │    │ roommate_posts │                   │
│    ├─────────────────────┤    ├────────────────┤                   │
│    │ id                  │    │ id             │                   │
│    │ user_id (FK→prof)   │    │ user_id (FK)   │                   │
│    │ gender              │    │ title          │                   │
│    │ age                 │    │ description    │                   │
│    │ hometown            │    │ area           │                   │
│    │ budget_min/max      │    │ price_per_mo   │                   │
│    │ smoking/drinking    │    │ room_type      │                   │
│    │ sleep_schedule      │    │ ward_id (FK)   │                   │
│    │ tidiness            │    │ status         │                   │
│    │ ...                 │    │ ...            │                   │
│    └────┬──────────────┬─┘    └────┬───────────┘                   │
│         │              │            │                              │
│    (1 to N)        (1 to N)    (1 to N)                             │
│         │              │            │                              │
│         │              │            └──────────────┐                │
│         │              │                           │                │
│    ┌────▼──────────────▼────────────┐  ┌──────────▼────────────┐   │
│    │  roommate_matches              │  │ roommate_post_images │   │
│    ├────────────────────────────────┤  ├─────────────────────┤    │
│    │ id                             │  │ id                  │    │
│    │ requester_id (FK→prof)         │  │ post_id (FK→post)   │    │
│    │ target_id (FK→prof)            │  │ image_url           │    │
│    │ compatibility_pct              │  │ display_order       │    │
│    │ requester_action (LIKE/PASS)   │  └─────────────────────┘    │
│    │ target_action (LIKE/PASS)      │                             │
│    │ status (PENDING/MATCHED/REJECT)│                             │
│    └────────────────────────────────┘                              │
│         ▲          ▲                                                │
│         │          │                                                │
│  ┌──────┴──────┬───┘                                                │
│  │ UNIQUE      │                                                   │
│  │ (req_id,   │                                                   │
│  │  target_id)│                                                   │
│  └─────────────┘                                                   │
│                                                                    │
│    ┌──────────────────────────────────┐                            │
│    │  saved_roommates                 │                            │
│    ├──────────────────────────────────┤                            │
│    │ id                               │                            │
│    │ user_id (FK→profiles)            │                            │
│    │ saved_roommate_id (FK→profiles)  │                            │
│    │ created_at                       │                            │
│    └──────────────────────────────────┘                            │
│         ▲                                                          │
│         │                                                          │
│    UNIQUE (user_id, saved_roommate_id)                            │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘

Legend:
─── Direct relationship (Foreign Key)
FK  Foreign Key reference
N   Multiple records
1   Single record
```

---

## 📊 COMPATIBILITY CALCULATION FLOW

```
Input User Profile:        Input Candidate Profile:
┌──────────────────┐      ┌──────────────────┐
│ gender: FEMALE   │      │ gender: MALE     │
│ age: 22          │      │ age: 24          │
│ smoking: NO      │      │ smoking: NO      │
│ sleep: 10PM-6AM  │      │ sleep: 10PM-6AM  │
│ tidiness: MEDIUM │      │ tidiness: HIGH   │
│ budget_min: 2M   │      │ budget_min: 3M   │
│ budget_max: 4M   │      │ budget_max: 5M   │
│ ...              │      │ ...              │
└─────────┬────────┘      └──────────┬───────┘
          │                          │
          └──────────┬───────────────┘
                     │
        ┌────────────▼────────────┐
        │ profileToVector()       │
        ├────────────────────────┤
        │ User Vector:           │ Candidate Vector:
        │ [5, 3, 3, 5, 5, 3, 5]  │ [5, 5, 4, 5, 5, 4, 5]
        │  ▲  ▲  ▲  ▲  ▲  ▲  ▲   │  ▲  ▲  ▲  ▲  ▲  ▲  ▲
        │  │  │  │  │  │  │  │   │  │  │  │  │  │  │  │
        │  1  2  3  4  5  6  7   │  1  2  3  4  5  6  7
        │                        │
        │ 1=sleep  2=tidiness    │
        │ 3=cleaning 4=smoking   │
        │ 5=drinking 6=cooking   │
        │ 7=pet_pref             │
        └────────────┬───────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    │        ┌───────▼──────┐         │
    │        │ Cosine        │         │
    │        │ Similarity    │         │
    │        │ (60% weight)  │         │
    │        │               │         │
    │        │ (A·B)/(||A||  │         │
    │        │  ×||B||)      │         │
    │        │               │         │
    │        │ Calculation:  │         │
    │        │ A·B = 5×5 +   │         │
    │        │       3×5 +   │         │
    │        │       3×4 +   │         │
    │        │       5×5 +   │         │
    │        │       5×5 +   │         │
    │        │       3×4 +   │         │
    │        │       5×5     │         │
    │        │ = 25+15+12+   │         │
    │        │   25+25+12+25 │         │
    │        │ = 139         │         │
    │        │               │         │
    │        │ ||A|| = sqrt  │         │
    │        │ (5²+3²+3²+...) │         │
    │        │ ≈ 12.69       │         │
    │        │               │         │
    │        │ ||B|| ≈ 13.64 │         │
    │        │               │         │
    │        │ cos = 139/    │         │
    │        │ (12.69×13.64) │         │
    │        │ = 0.80        │         │
    │        │               │         │
    │        │ Result: 80%   │         │
    │        └───────┬──────┘         │
    │                │                │
    │                │                │
    │      ┌─────────▼──────┐         │
    │      │ Budget Overlap  │         │
    │      │ (20% weight)    │         │
    │      │                 │         │
    │      │ User: 2M-4M     │         │
    │      │ Candidate: 3M-5M         │
    │      │ Overlap: 3M-4M  │         │
    │      │ = 1M range      │         │
    │      │                 │         │
    │      │ Avg range =     │         │
    │      │ (2M+4M+3M+5M)/2 │         │
    │      │ = 3.5M          │         │
    │      │                 │         │
    │      │ Score = 1M/3.5M │         │
    │      │ = 0.29 (29%)    │         │
    │      │                 │         │
    │      │ Result: 29%     │         │
    │      └────────┬────────┘         │
    │               │                  │
    │               │   ┌──────────────▼────────┐
    │               │   │ Gender Score          │
    │               │   │ (10% weight)          │
    │               │   │                       │
    │               │   │ Female vs Male        │
    │               │   │ = Opposite            │
    │               │   │ Score = 100%          │
    │               │   └──────────────┬────────┘
    │               │                  │
    │               │   ┌──────────────▼────────┐
    │               │   │ Age Score             │
    │               │   │ (10% weight)          │
    │               │   │                       │
    │               │   │ 22 vs 24 = 2 years    │
    │               │   │ Within 5 years        │
    │               │   │ Score = 1 - 2/10 = 80%
    │               │   └──────────────┬────────┘
    │               │                  │
    │               └──────────┬───────┘
    │                          │
    └──────────────────┬───────┘
                       │
            ┌──────────▼──────────┐
            │ FINAL CALCULATION   │
            ├─────────────────────┤
            │ Score = (           │
            │  0.80 × 0.60 +      │
            │  0.29 × 0.20 +      │
            │  1.00 × 0.10 +      │
            │  0.80 × 0.10        │
            │ ) × 100             │
            │                     │
            │ = (0.48 + 0.058 +  │
            │    0.10 + 0.08) × 100
            │                     │
            │ = 0.718 × 100       │
            │                     │
            │ = 71.8%             │
            │ ≈ 72%               │
            │                     │
            │ DISPLAY: 72% Match! │
            └─────────────────────┘
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION FLOW

```
┌────────────────────────────────────────────────────┐
│ 1. User Login via Supabase                         │
│    ├─ Frontend calls: supabase.auth.signIn()      │
│    ├─ Supabase returns JWT token                  │
│    └─ Frontend stores token in localStorage        │
└────────────────────────────┬──────────────────────┘
                             │
┌────────────────────────────▼──────────────────────┐
│ 2. User makes API Request                         │
│    GET /api/roommates/profiles/discover           │
│    Header:                                        │
│      Authorization: Bearer eyJhbGc...             │
└────────────────────────────┬──────────────────────┘
                             │
┌────────────────────────────▼──────────────────────┐
│ 3. Backend Receives Request                       │
│                                                   │
│    Middleware: auth() checks                      │
│    ├─ Extract token from header                   │
│    ├─ Decode JWT (no verification needed,        │
│    │   Supabase validates signature)              │
│    ├─ Extract decoded.sub (userId)                │
│    └─ Set req.userId = userId                     │
└────────────────────────────┬──────────────────────┘
                             │
┌────────────────────────────▼──────────────────────┐
│ 4. Controller Uses req.userId                     │
│                                                   │
│    SELECT * FROM roommate_profiles                │
│    WHERE user_id = req.userId                     │
│                                                   │
│    → Only returns data for authenticated user     │
└────────────────────────────┬──────────────────────┘
                             │
┌────────────────────────────▼──────────────────────┐
│ 5. AUTHORIZATION CHECKS                           │
│                                                   │
│    If trying to edit own post:                    │
│    POST /api/roommate-posts/:id                   │
│                                                   │
│    Check: post.user_id == req.userId              │
│    ├─ YES: Allow edit ✅                          │
│    └─ NO: Return 403 Forbidden ❌                │
└────────────────────────────┬──────────────────────┘
                             │
┌────────────────────────────▼──────────────────────┐
│ 6. UNIQUE CONSTRAINTS (DB Level)                  │
│                                                   │
│    Try: INSERT INTO saved_roommates (             │
│      user_id, saved_roommate_id                   │
│    ) VALUES ('user-a', 'user-b')                  │
│                                                   │
│    If duplicate attempt:                          │
│    UNIQUE constraint violation (code 23505)       │
│    ├─ Catch error in route                        │
│    ├─ Return 409 Conflict                         │
│    └─ Message: "Already saved"                    │
└─────────────────────────────────────────────────┘
```

---

## 🔄 COMPLETE USER JOURNEY

```
START: User visits application
  │
  ├─→ [Login] - Authenticate with Supabase
  │   │
  │   └─→ JWT Token stored in localStorage
  │
  ├─→ [Home] - Browse features
  │   │
  │   └─→ Click: "👥 Tìm bạn ở ghép"
  │
  └─→ [1] PROFILE SETUP
      │
      ├─→ Navigate to /roommate-onboarding
      │   │
      │   ├─→ Fill multi-section form:
      │   │   ├─ Basic Info (gender, age, hometown)
      │   │   ├─ Financial (budget_min, budget_max)
      │   │   └─ Lifestyle (smoking, sleep, etc.)
      │   │
      │   └─→ POST /api/roommates/profiles
      │       └─→ Backend creates roommateProfile record
      │
      └─→ [2] ROOMMATE MATCHING
          │
          ├─→ Navigate to /roommate-matching
          │   │
          │   └─→ GET /api/roommates/profiles/discover
          │       ├─ Backend loads user's profile
          │       ├─ Fetches all other users
          │       ├─ For each: calculateCompatibility()
          │       ├─ Sorts by % DESC
          │       └─ Returns top 20
          │
          ├─→ Grid displays with % badges
          │
          ├─→ User sees 3 action buttons per card:
          │
          ├─→ [ACTION: Pass] ❌
          │   │
          │   └─→ POST /api/roommates/matches
          │       ├─ { targetId, action: "PASS" }
          │       └─ Creates roommateMatch record
          │
          ├─→ [ACTION: Save] ❤️
          │   │
          │   └─→ POST /api/roommates/saved
          │       ├─ { savedRoommateId }
          │       ├─ Inserts into saved_roommates
          │       └─ Unique constraint prevents duplicate
          │
          ├─→ [ACTION: Like] 👍
          │   │
          │   └─→ POST /api/roommates/matches
          │       ├─ { targetId, action: "LIKE" }
          │       └─ Creates match with status PENDING
          │
          └─→ [3] SAVED ROOMMATES
              │
              ├─→ Navigate to /saved-roommates
              │
              ├─→ GET /api/roommates/saved
              │   ├─ Backend returns all saved people
              │   └─ Joined with profile info
              │
              ├─→ Grid displays saved people
              │
              ├─→ [ACTION: Chat] 💬
              │   │
              │   └─→ Navigate to /chat?userId=...
              │       └─→ Open conversation with person
              │
              ├─→ [ACTION: Delete] 🗑️
              │   │
              │   └─→ DELETE /api/roommates/saved/:id
              │       └─→ Removes from saved_roommates
              │
              └─→ [4] RECRUITMENT POST CREATION
                  │
                  ├─→ (If user has room)
                  │   │
                  │   ├─→ Navigate to /roommate-posts/create
                  │   │
                  │   ├─→ Fill multi-section form:
                  │   │   ├─ Title, Room Type, Price
                  │   │   ├─ Location (Ward, Address)
                  │   │   ├─ Amenities checkboxes
                  │   │   └─ Rules + Images (max 20)
                  │   │
                  │   ├─→ POST /api/roommate-posts
                  │   │   └─ Creates post with status PENDING
                  │   │
                  │   ├─→ For each image:
                  │   │   └─ POST /api/roommate-posts/:id/images
                  │   │
                  │   ├─→ Navigate to /roommate-posts
                  │   │
                  │   ├─→ GET /api/roommate-posts/user/my-posts
                  │   │   └─ Gets user's posts
                  │   │
                  │   ├─→ See posts with status badges
                  │   │
                  │   ├─→ [ACTION: Edit]
                  │   │   └─ PATCH /api/roommate-posts/:id
                  │   │
                  │   └─→ [ACTION: Delete]
                  │       └─ DELETE /api/roommate-posts/:id
                  │           └─ Cascade deletes images
                  │
                  └─→ [5] BROWSE POSTS
                      │
                      ├─→ (Any user, no auth)
                      │
                      ├─→ Navigate to /roommate-posts
                      │
                      └─→ GET /api/roommate-posts?wardId=...
                          ├─ Filters & pagination
                          └─ Displays approved posts
                              └─→ Click → GET /api/roommate-posts/:id
                                  └─ Increment viewCount + show detail
```

---

**End of Architecture Diagrams**
