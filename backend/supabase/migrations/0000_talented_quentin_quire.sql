CREATE TYPE "public"."content_type" AS ENUM('TEXT', 'IMAGE', 'FILE');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'RENTED');--> statement-breakpoint
CREATE TYPE "public"."match_action" AS ENUM('PENDING', 'LIKE', 'PASS');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('PENDING', 'MATCHED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('TENANT', 'LANDLORD', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('PHONG_TRO', 'CAN_HO_MINI', 'KTX', 'NGUYEN_CAN');--> statement-breakpoint
CREATE TYPE "public"."target_type" AS ENUM('LISTING', 'ROOMMATE');--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_1_id" uuid NOT NULL,
	"participant_2_id" uuid NOT NULL,
	"listing_id" integer,
	"roommate_match_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_conversation_listing_unique" UNIQUE("participant_1_id","participant_2_id","listing_id"),
	CONSTRAINT "chat_conversation_match_unique" UNIQUE("participant_1_id","participant_2_id","roommate_match_id")
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"province_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"amenity_id" integer NOT NULL,
	CONSTRAINT "listing_amenities_listing_amenity_unique" UNIQUE("listing_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" uuid NOT NULL,
	"content_type" "content_type" DEFAULT 'TEXT',
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"action_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"username" text,
	"full_name" text,
	"avatar_url" text,
	"bio" text,
	"is_looking_for_roommate" boolean DEFAULT false NOT NULL,
	"role" "role" DEFAULT 'TENANT',
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewee_id" uuid NOT NULL,
	"listing_id" integer,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_reviewer_reviewee_listing_unique" UNIQUE("reviewer_id","reviewee_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "room_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"landlord_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"deposit" numeric,
	"area" real NOT NULL,
	"room_type" "room_type" NOT NULL,
	"ward_id" integer,
	"address_detail" text,
	"latitude" real,
	"longitude" real,
	"status" "listing_status" DEFAULT 'PENDING' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roommate_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"compatibility_pct" real,
	"requester_action" "match_action",
	"target_action" "match_action" DEFAULT 'PENDING',
	"status" "match_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"matched_at" timestamp,
	CONSTRAINT "roommate_matches_requester_target_unique" UNIQUE("requester_id","target_id")
);
--> statement-breakpoint
CREATE TABLE "roommate_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"gender" text,
	"age" integer,
	"hometown" text,
	"school_or_job" text,
	"budget_min" numeric,
	"budget_max" numeric,
	"preferred_district_id" integer,
	"smoking" text,
	"drinking" text,
	"sleep_schedule" text,
	"tidiness" text,
	"cleaning_freq" text,
	"has_pet" boolean DEFAULT false NOT NULL,
	"allow_overnight_guest" boolean DEFAULT false NOT NULL,
	"cooking_freq" text,
	"has_room" boolean DEFAULT false NOT NULL,
	"vector_embedding" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roommate_profiles_user_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "saved_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"listing_id" integer NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_listings_user_listing_unique" UNIQUE("user_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "wards" (
	"id" serial PRIMARY KEY NOT NULL,
	"district_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" "target_type" NOT NULL,
	"target_listing_id" integer,
	"target_roommate_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "watchlists_user_listing_unique" UNIQUE("user_id","target_listing_id"),
	CONSTRAINT "watchlists_user_roommate_unique" UNIQUE("user_id","target_roommate_id")
);
--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_participant_1_id_profiles_id_fk" FOREIGN KEY ("participant_1_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_participant_2_id_profiles_id_fk" FOREIGN KEY ("participant_2_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_listing_id_room_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."room_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_roommate_match_id_roommate_matches_id_fk" FOREIGN KEY ("roommate_match_id") REFERENCES "public"."roommate_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_amenities" ADD CONSTRAINT "listing_amenities_listing_id_room_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."room_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_amenities" ADD CONSTRAINT "listing_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_room_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."room_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_profiles_id_fk" FOREIGN KEY ("reviewee_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_room_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."room_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_listings" ADD CONSTRAINT "room_listings_landlord_id_profiles_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_listings" ADD CONSTRAINT "room_listings_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roommate_matches" ADD CONSTRAINT "roommate_matches_requester_id_profiles_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roommate_matches" ADD CONSTRAINT "roommate_matches_target_id_profiles_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roommate_profiles" ADD CONSTRAINT "roommate_profiles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roommate_profiles" ADD CONSTRAINT "roommate_profiles_preferred_district_id_districts_id_fk" FOREIGN KEY ("preferred_district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listing_id_room_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."room_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wards" ADD CONSTRAINT "wards_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_target_listing_id_room_listings_id_fk" FOREIGN KEY ("target_listing_id") REFERENCES "public"."room_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_target_roommate_id_profiles_id_fk" FOREIGN KEY ("target_roommate_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;