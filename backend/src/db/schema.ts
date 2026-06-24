import {
  pgTable,
  text,
  timestamp,
  uuid,
  serial,
  boolean,
  integer,
  decimal,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";

// ENUMS
export const roleEnum = pgEnum("role", ["TENANT", "LANDLORD", "ROOMMATE_SEEKER", "BROKER", "ADMIN"]);
export const otpPurposeEnum = pgEnum("otp_purpose", ["REGISTER", "LOGIN", "PHONE_VERIFY", "PASSWORD_RESET", "EMAIL_VERIFY"]);
export const roomTypeEnum = pgEnum("room_type", ["PHONG_TRO", "CAN_HO_MINI", "KTX", "NGUYEN_CAN"]);
export const listingStatusEnum = pgEnum("listing_status", ["AVAILABLE", "RENTED", "PENDING", "HIDDEN"]);
export const genderEnum = pgEnum("gender", ["MALE", "FEMALE", "OTHER"]);
export const frequencyEnum = pgEnum("frequency", ["YES", "NO", "OCCASIONALLY"]);
export const sleepScheduleEnum = pgEnum("sleep_schedule", ["EARLY", "LATE", "FLEXIBLE"]);
export const tidinessEnum = pgEnum("tidiness", ["VERY_TIDY", "MODERATE", "MESSY"]);
export const cleaningFreqEnum = pgEnum("cleaning_freq", ["DAILY", "WEEKLY", "BIWEEKLY"]);
export const cookingFreqEnum = pgEnum("cooking_freq", ["NEVER", "SOMETIMES", "OFTEN", "DAILY"]);
export const matchActionEnum = pgEnum("match_action", ["LIKE", "PASS", "PENDING"]);
export const matchStatusEnum = pgEnum("match_status", ["PENDING", "MATCHED", "REJECTED"]);
export const contentTypeEnum = pgEnum("content_type", ["TEXT", "IMAGE", "LOCATION"]);
export const reportReasonEnum = pgEnum("report_reason", ["FRAUD", "SPAM", "INAPPROPRIATE", "WRONG_INFO", "OTHER"]);
export const reportStatusEnum = pgEnum("report_status", ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]);
export const notificationTypeEnum = pgEnum("notification_type", ["NEW_MESSAGE", "MATCH", "LISTING_UPDATE", "REPORT", "SYSTEM"]);
export const adminActionTypeEnum = pgEnum("admin_action_type", ["BAN_USER", "UNBAN_USER", "HIDE_LISTING", "DELETE_LISTING", "RESOLVE_REPORT"]);

// 1. Users & Authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // links to auth.users.id
  username: text("username").unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  email: text("email"),
  phone: text("phone"),
  bio: text("bio"),
  role: roleEnum("role").default("TENANT"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
  phone: text("phone"),
  otpCode: text("otp_code").notNull(),
  purpose: otpPurposeEnum("purpose").notNull(),
  attempts: integer("attempts").default(0),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Geography
export const provinces = pgTable("provinces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const districts = pgTable("districts", {
  id: serial("id").primaryKey(),
  provinceId: integer("province_id").references(() => provinces.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
});

export const wards = pgTable("wards", {
  id: serial("id").primaryKey(),
  districtId: integer("district_id").references(() => districts.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
});

// 3. Room Listings
export const roomListings = pgTable("room_listings", {
  id: serial("id").primaryKey(),
  landlordId: uuid("landlord_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price").notNull(),
  deposit: decimal("deposit"),
  area: real("area").notNull(),
  roomType: roomTypeEnum("room_type").notNull(),
  wardId: integer("ward_id").references(() => wards.id),
  addressDetail: text("address_detail"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  status: listingStatusEnum("status").default("PENDING"),
  isVerified: boolean("is_verified").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const listingImages = pgTable("listing_images", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => roomListings.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").default(0),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
});

export const listingAmenities = pgTable("listing_amenities", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => roomListings.id, { onDelete: 'cascade' }).notNull(),
  amenityId: integer("amenity_id").references(() => amenities.id, { onDelete: 'cascade' }).notNull(),
});

export const savedListings = pgTable("saved_listings", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  listingId: integer("listing_id").references(() => roomListings.id, { onDelete: 'cascade' }).notNull(),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

// 4. Roommate Matching
export const roommateProfiles = pgTable("roommate_profiles", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gender: genderEnum("gender"),
  age: integer("age"),
  hometown: text("hometown"),
  schoolOrJob: text("school_or_job"),
  budgetMin: decimal("budget_min"),
  budgetMax: decimal("budget_max"),
  preferredDistrictId: integer("preferred_district_id").references(() => districts.id),
  smoking: frequencyEnum("smoking"),
  drinking: frequencyEnum("drinking"),
  sleepSchedule: sleepScheduleEnum("sleep_schedule"),
  tidiness: tidinessEnum("tidiness"),
  cleaningFreq: cleaningFreqEnum("cleaning_freq"),
  hasPet: boolean("has_pet").default(false),
  allowOvernightGuest: boolean("allow_overnight_guest").default(false),
  cookingFreq: cookingFreqEnum("cooking_freq"),
  hasRoom: boolean("has_room").default(false),
  vectorEmbedding: text("vector_embedding"), // For MVP as text/json, later pgvector
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roommateMatches = pgTable("roommate_matches", {
  id: serial("id").primaryKey(),
  requesterId: uuid("requester_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  targetId: uuid("target_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  compatibilityPct: real("compatibility_pct"),
  requesterAction: matchActionEnum("requester_action"),
  targetAction: matchActionEnum("target_action").default("PENDING"),
  status: matchStatusEnum("status").default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  matchedAt: timestamp("matched_at"),
});

// 5. Reviews & Chat
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  revieweeId: uuid("reviewee_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  listingId: integer("listing_id").references(() => roomListings.id, { onDelete: 'set null' }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  participant1Id: uuid("participant_1_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  participant2Id: uuid("participant_2_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  listingId: integer("listing_id").references(() => roomListings.id, { onDelete: 'set null' }),
  roommateMatchId: integer("roommate_match_id").references(() => roommateMatches.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => chatConversations.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  contentType: contentTypeEnum("content_type").default("TEXT"),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// 6. System & Admin
export const searchLogs = pgTable("search_logs", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
  rawQuery: text("raw_query").notNull(),
  parsedEntities: text("parsed_entities"), // JSON string
  searchType: text("search_type"), // NLP or FILTER
  resultCount: integer("result_count"),
  searchedAt: timestamp("searched_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reportedUserId: uuid("reported_user_id").references(() => users.id, { onDelete: 'cascade' }),
  reportedListingId: integer("reported_listing_id").references(() => roomListings.id, { onDelete: 'cascade' }),
  reason: reportReasonEnum("reason").notNull(),
  description: text("description"),
  status: reportStatusEnum("status").default("PENDING"),
  resolvedById: uuid("resolved_by_id").references(() => users.id, { onDelete: 'set null' }),
  resolutionNote: text("resolution_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  actionUrl: text("action_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: uuid("admin_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actionType: adminActionTypeEnum("action_type").notNull(),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: 'cascade' }),
  targetListingId: integer("target_listing_id").references(() => roomListings.id, { onDelete: 'cascade' }),
  targetReportId: integer("target_report_id").references(() => reports.id, { onDelete: 'cascade' }),
  reason: text("reason"),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
});