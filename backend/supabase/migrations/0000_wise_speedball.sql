ALTER TABLE "profiles" RENAME TO "users";
--> statement-breakpoint
CREATE TYPE "public"."admin_action_type" AS ENUM('BAN_USER', 'UNBAN_USER', 'HIDE_LISTING', 'DELETE_LISTING', 'RESOLVE_REPORT');--> statement-breakpoint
CREATE TYPE "public"."cleaning_freq" AS ENUM('DAILY', 'WEEKLY', 'BIWEEKLY');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('TEXT', 'IMAGE', 'LOCATION');--> statement-breakpoint
CREATE TYPE "public"."cooking_freq" AS ENUM('NEVER', 'SOMETIMES', 'OFTEN', 'DAILY');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('YES', 'NO', 'OCCASIONALLY');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('AVAILABLE', 'RENTED', 'PENDING', 'HIDDEN');--> statement-breakpoint
CREATE TYPE "public"."match_action" AS ENUM('LIKE', 'PASS', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('PENDING', 'MATCHED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('NEW_MESSAGE', 'MATCH', 'LISTING_UPDATE', 'REPORT', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."otp_purpose" AS ENUM('REGISTER', 'LOGIN', 'PHONE_VERIFY', 'PASSWORD_RESET', 'EMAIL_VERIFY');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('FRAUD', 'SPAM', 'INAPPROPRIATE', 'WRONG_INFO', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('TENANT', 'LANDLORD', 'ROOMMATE_SEEKER', 'BROKER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('PHONG_TRO', 'CAN_HO_MINI', 'KTX', 'NGUYEN_CAN');--> statement-breakpoint
CREATE TYPE "public"."sleep_schedule" AS ENUM('EARLY', 'LATE', 'FLEXIBLE');--> statement-breakpoint
CREATE TYPE "public"."tidiness" AS ENUM('VERY_TIDY', 'MODERATE', 'MESSY');--> statement-breakpoint
CREATE TABLE "admin_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" uuid NOT NULL,
	"action_type" "admin_action_type" NOT NULL,
	"target_user_id" uuid,
	"target_listing_id" integer,
	"target_report_id" integer,
	"reason" text,
	"performed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"last_message_at" timestamp DEFAULT now() NOT NULL
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
	"amenity_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" uuid NOT NULL,
	"content_type" "content_type" DEFAULT 'TEXT',
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"action_url" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"phone" text,
	"otp_code" text NOT NULL,
	"purpose" "otp_purpose" NOT NULL,
	"attempts" integer DEFAULT 0,
	"is_used" boolean DEFAULT false,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"bio" text,
	"role" "role" DEFAULT 'TENANT',
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reported_user_id" uuid,
	"reported_listing_id" integer,
	"reason" "report_reason" NOT NULL,
	"description" text,
	"status" "report_status" DEFAULT 'PENDING',
	"resolved_by_id" uuid,
	"resolution_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewee_id" uuid NOT NULL,
	"listing_id" integer,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"landlord_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" numeric NOT NULL,
	"deposit" numeric,
	"area" real NOT NULL,
	"room_type" "room_type" NOT NULL,
	"ward_id" integer,
	"address_detail" text,
	"latitude" real,
	"longitude" real,
	"status" "listing_status" DEFAULT 'PENDING',
	"is_verified" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
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
	"status" "match_status" DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"matched_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "roommate_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"gender" "gender",
	"age" integer,
	"hometown" text,
	"school_or_job" text,
	"budget_min" numeric,
	"budget_max" numeric,
	"preferred_district_id" integer,
	"smoking" "frequency",
	"drinking" "frequency",
	"sleep_schedule" "sleep_schedule",
	"tidiness" "tidiness",
	"cleaning_freq" "cleaning_freq",
	"has_pet" boolean DEFAULT false,
	"allow_overnight_guest" boolean DEFAULT false,
	"cooking_freq" "cooking_freq",
	"has_room" boolean DEFAULT false,
	"vector_embedding" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"listing_id" integer NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"raw_query" text NOT NULL,
	"parsed_entities" text,
	"search_type" text,
	"result_count" integer,
	"searched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
--> statement-breakpoint
CREATE TABLE "wards" (
	"id" serial PRIMARY KEY NOT NULL,
	"district_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_listing_id_room_listings_id_fk" FOREIGN KEY ("target_listing_id") REFERENCES "public"."room_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_report_id_reports_id_fk" FOREIGN KEY ("target_report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_participant_1_id_users_id_fk" FOREIGN KEY ("participant_1_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_participant_2_id_users_id_fk" FOREIGN KEY ("participant_2_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_listing_id_room_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."room_listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_roommate_match_id_roommate_matches_id_fk" FOREIGN KEY ("roommate_match_id") REFERENCES "public"."roommate_matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_amenities" ADD CONSTRAINT "listing_amenities_listing_id_room_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."room_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_amenities" ADD CONSTRAINT "listing_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_room_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."room_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_listing_id_room_listings_id_fk" FOREIGN KEY ("reported_listing_id") REFERENCES "public"."room_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_users_id_fk" FOREIGN KEY ("reviewee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_room_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."room_listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_listings" ADD CONSTRAINT "room_listings_landlord_id_users_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_listings" ADD CONSTRAINT "room_listings_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roommate_matches" ADD CONSTRAINT "roommate_matches_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roommate_matches" ADD CONSTRAINT "roommate_matches_target_id_users_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roommate_profiles" ADD CONSTRAINT "roommate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roommate_profiles" ADD CONSTRAINT "roommate_profiles_preferred_district_id_districts_id_fk" FOREIGN KEY ("preferred_district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listing_id_room_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."room_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wards" ADD CONSTRAINT "wards_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE cascade ON UPDATE no action;