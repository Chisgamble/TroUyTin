import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  uuid,
  boolean,
  real,
  numeric,
  timestamp,
  index,
  unique
} from "drizzle-orm/pg-core";


export const roleEnum = pgEnum("role", [
  "TENANT",
  "LANDLORD",
  "ADMIN",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RENTED",
]);

export const roomTypeEnum = pgEnum("room_type", [
  "PHONG_TRO",
  "CAN_HO_MINI",
  "KTX",
  "NGUYEN_CAN"
]);

export const contentTypeEnum = pgEnum("content_type", [
  "TEXT",
  "IMAGE",
  "FILE",
]);

export const matchActionEnum = pgEnum("match_action", [
  "PENDING",
  "LIKE",
  "PASS",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "PENDING",
  "MATCHED",
  "REJECTED",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),

  email: text("email"),
  phone: text("phone"),

  username: text("username").unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),

  bio: text("bio"),

  isLookingForRoommate: boolean("is_looking_for_roommate")
    .default(false)
    .notNull(),

  role: roleEnum("role").default("TENANT"),

  isVerified: boolean("is_verified")
    .default(false)
    .notNull(),

  isActive: boolean("is_active")
    .default(true)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export const provinces = pgTable("provinces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const districts = pgTable("districts", {
  id: serial("id").primaryKey(),

  provinceId: integer("province_id")
    .notNull()
    .references(() => provinces.id),

  name: text("name").notNull(),
});

export const wards = pgTable("wards", {
  id: serial("id").primaryKey(),

  districtId: integer("district_id")
    .notNull()
    .references(() => districts.id),

  name: text("name").notNull(),
});

export const amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
},);

export const roomListings = pgTable("room_listings", {
  id: serial("id").primaryKey(),

  landlordId: uuid("landlord_id")
    .notNull()
    .references(() => profiles.id),

  title: text("title").notNull(),

  description: text("description"),

  price: numeric("price", {
    precision: 12,
    scale: 2,
    mode: "string",
  }).notNull(),

  deposit: numeric("deposit"),

  area: real("area").notNull(),

  roomType: roomTypeEnum("room_type").notNull(),

  wardId: integer("ward_id").references(() => wards.id),

  addressDetail: text("address_detail"),

  latitude: real("latitude"),
  longitude: real("longitude"),

  status: listingStatusEnum("status")
    .default("PENDING")
    .notNull(),

  isVerified: boolean("is_verified")
    .default(false)
    .notNull(),

  viewCount: integer("view_count")
    .default(0)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export const listingImages = pgTable("listing_images", {
  id: serial("id").primaryKey(),

  listingId: integer("listing_id")
    .notNull()
    .references(() => roomListings.id),

  imageUrl: text("image_url").notNull(),

  displayOrder: integer("display_order")
    .default(0)
    .notNull(),

  uploadedAt: timestamp("uploaded_at")
    .defaultNow()
    .notNull(),
});

export const listingAmenities = pgTable(
  "listing_amenities",
  {
    id: serial("id").primaryKey(),

    listingId: integer("listing_id")
      .notNull()
      .references(() => roomListings.id),

    amenityId: integer("amenity_id")
      .notNull()
      .references(() => amenities.id),
  },
  (table) => [
    unique("listing_amenities_listing_amenity_unique").on(
      table.listingId,
      table.amenityId
    ),
  ]
);

export const roommateProfiles = pgTable(
  "roommate_profiles", 
  {
  id: serial("id").primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id),

  gender: text("gender"),

  age: integer("age"),

  hometown: text("hometown"),

  schoolOrJob: text("school_or_job"),

  budgetMin: numeric("budget_min"),

  budgetMax: numeric("budget_max"),

  preferredDistrictId: integer("preferred_district_id")
    .references(() => districts.id),

  smoking: text("smoking"),

  drinking: text("drinking"),

  sleepSchedule: text("sleep_schedule"),

  tidiness: text("tidiness"),

  cleaningFreq: text("cleaning_freq"),

  hasPet: boolean("has_pet")
    .default(false)
    .notNull(),

  allowOvernightGuest: boolean("allow_overnight_guest")
    .default(false)
    .notNull(),

  cookingFreq: text("cooking_freq"),

  hasRoom: boolean("has_room")
    .default(false)
    .notNull(),

  vectorEmbedding: text("vector_embedding"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
  },
  (table) => [
      unique("roommate_profiles_user_unique").on(table.userId),
  ]
);

export const roommateMatches = pgTable("roommate_matches", {
  id: serial("id").primaryKey(),

  requesterId: uuid("requester_id")
    .notNull()
    .references(() => profiles.id),

  targetId: uuid("target_id")
    .notNull()
    .references(() => profiles.id),

  compatibilityPct: real("compatibility_pct"),

  requesterAction: matchActionEnum("requester_action"),

  targetAction: matchActionEnum("target_action")
    .default("PENDING"),

  status: matchStatusEnum("status")
    .default("PENDING")
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  matchedAt: timestamp("matched_at"),
  },
  (table) => [
    unique(
      "roommate_matches_requester_target_unique"
    ).on(table.requesterId, table.targetId),
  ]
);

export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),

  participant1Id: uuid("participant_1_id")
    .notNull()
    .references(() => profiles.id),

  participant2Id: uuid("participant_2_id")
    .notNull()
    .references(() => profiles.id),

  listingId: integer("listing_id")
    .references(() => roomListings.id),

  roommateMatchId: integer("roommate_match_id")
    .references(() => roommateMatches.id),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  lastMessageAt: timestamp("last_message_at")
    .defaultNow()
    .notNull(),
  },
  (table) => [
    unique("chat_conversation_listing_unique").on(
      table.participant1Id,
      table.participant2Id,
      table.listingId
    ),

    unique("chat_conversation_match_unique").on(
      table.participant1Id,
      table.participant2Id,
      table.roommateMatchId
    ),
  ]
);

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),

  conversationId: integer("conversation_id")
    .notNull()
    .references(() => chatConversations.id),

  senderId: uuid("sender_id")
    .notNull()
    .references(() => profiles.id),

  contentType: contentTypeEnum("content_type")
    .default("TEXT"),

  content: text("content").notNull(),

  isRead: boolean("is_read")
    .default(false)
    .notNull(),

  sentAt: timestamp("sent_at")
    .defaultNow()
    .notNull(),
});

export const savedListings = pgTable("saved_listings", {
  id: serial("id").primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id),

  listingId: integer("listing_id")
    .notNull()
    .references(() => roomListings.id),

  savedAt: timestamp("saved_at")
    .defaultNow()
    .notNull(),
  },

    (table) => ({
    savedListingsUnique: unique("saved_listings_user_listing_unique").on(
      table.userId,
      table.listingId
    ),
  }));


export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),

  reviewerId: uuid("reviewer_id")
    .notNull()
    .references(() => profiles.id),

  revieweeId: uuid("reviewee_id")
    .notNull()
    .references(() => profiles.id),

  listingId: integer("listing_id")
    .references(() => roomListings.id),

  rating: integer("rating").notNull(),

  comment: text("comment"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
  },
  (table) => [
    unique("reviews_reviewer_reviewee_listing_unique").on(
      table.reviewerId,
      table.revieweeId,
      table.listingId
    ),
  ]
);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id),

  type: text("type").notNull(),

  title: text("title").notNull(),

  body: text("body"),

  actionUrl: text("action_url"),

  isRead: boolean("is_read")
    .default(false)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export const savedRoommates = pgTable(
  "saved_roommates",
  {
    id: serial("id").primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id),

    roommateProfileId: integer("roommate_profile_id")
      .notNull()
      .references(() => roommateProfiles.id),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("saved_roommates_user_profile_unique").on(
      table.userId,
      table.roommateProfileId
    ),
  ]
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type RoomListing = typeof roomListings.$inferSelect;
export type NewRoomListing = typeof roomListings.$inferInsert;