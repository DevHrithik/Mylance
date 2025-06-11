

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."content_status" AS ENUM (
    'draft',
    'used',
    'archived'
);


ALTER TYPE "public"."content_status" OWNER TO "postgres";


CREATE TYPE "public"."content_type" AS ENUM (
    'post',
    'article',
    'carousel',
    'video_script',
    'poll'
);


ALTER TYPE "public"."content_type" OWNER TO "postgres";


CREATE TYPE "public"."plan_type" AS ENUM (
    'free',
    'starter',
    'professional',
    'enterprise'
);


ALTER TYPE "public"."plan_type" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'active',
    'canceled',
    'past_due',
    'paused'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."tone" AS ENUM (
    'professional',
    'casual',
    'authoritative',
    'conversational',
    'inspirational',
    'educational'
);


ALTER TYPE "public"."tone" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_usage_limit"("user_uuid" "uuid", "feature" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  current_usage integer;
  usage_limit integer;
  current_period_start timestamp with time zone;
  current_period_end timestamp with time zone;
begin
  -- Check if the requesting user is accessing their own data
  if auth.uid() != user_uuid then
    raise exception 'Access denied';
  end if;

  -- Get current period dates
  current_period_start := date_trunc('month', current_timestamp);
  current_period_end := date_trunc('month', current_timestamp) + interval '1 month' - interval '1 second';

  -- Get or create usage tracking record
  select usage_count, limit_amount into current_usage, usage_limit
  from public.usage_tracking
  where user_id = user_uuid
  and feature_type = feature
  and period_start = current_period_start
  and period_end = current_period_end;

  -- If no record exists, create one based on user's subscription
  if not found then
    -- Get user's plan limit (simplified for this example)
    select 
      case 
        when s.plan_type = 'free' then 10
        when s.plan_type = 'starter' then 100
        when s.plan_type = 'professional' then 500
        else 1000
      end into usage_limit
    from public.subscriptions s
    where s.user_id = user_uuid;

    -- Create new usage tracking record
    insert into public.usage_tracking (user_id, feature_type, usage_count, limit_amount, period_start, period_end)
    values (user_uuid, feature, 0, coalesce(usage_limit, 10), current_period_start, current_period_end);
    
    current_usage := 0;
  end if;

  -- Return true if under limit
  return current_usage < usage_limit;
end;
$$;


ALTER FUNCTION "public"."check_usage_limit"("user_uuid" "uuid", "feature" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_analytics"("user_uuid" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  result json;
begin
  -- Check if the requesting user is accessing their own data
  if auth.uid() != user_uuid then
    raise exception 'Access denied';
  end if;

  select json_build_object(
    'total_posts', count(p.id),
    'total_impressions', coalesce(sum(pp.impressions), 0),
    'total_engagement', coalesce(sum(pp.likes + pp.comments + pp.shares + pp.clicks), 0),
    'avg_engagement_rate', coalesce(avg(pp.engagement_rate), 0),
    'posts_by_status', json_object_agg(p.status, status_counts.count),
    'posts_by_type', json_object_agg(p.content_type, type_counts.count),
    'last_30_days_performance', (
      select json_object_agg(date_bucket, daily_stats)
      from (
        select 
          date_trunc('day', pp.recorded_at) as date_bucket,
          json_build_object(
            'impressions', sum(pp.impressions),
            'engagement', sum(pp.likes + pp.comments + pp.shares + pp.clicks)
          ) as daily_stats
        from public.post_performance pp
        join public.posts p on p.id = pp.post_id
        where p.user_id = user_uuid
        and pp.recorded_at >= current_date - interval '30 days'
        group by date_trunc('day', pp.recorded_at)
        order by date_bucket desc
      ) as daily_data
    )
  ) into result
  from public.posts p
  left join public.post_performance pp on pp.post_id = p.id
  left join lateral (
    select p2.status, count(*) as count
    from public.posts p2
    where p2.user_id = user_uuid
    group by p2.status
  ) as status_counts on true
  left join lateral (
    select p3.content_type, count(*) as count
    from public.posts p3
    where p3.user_id = user_uuid
    group by p3.content_type
  ) as type_counts on true
  where p.user_id = user_uuid;

  return result;
end;
$$;


ALTER FUNCTION "public"."get_user_analytics"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create default subscription record
  insert into public.subscriptions (user_id, plan_type, status)
  values (new.id, 'free', 'active');
  
  -- Initialize usage tracking for current month
  insert into public.usage_tracking (user_id, feature_type, usage_count, limit_amount, period_start, period_end)
  values (
    new.id,
    'content_generation',
    0,
    10, -- free tier limit
    date_trunc('month', current_timestamp),
    date_trunc('month', current_timestamp) + interval '1 month' - interval '1 second'
  );
  
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_usage"("user_uuid" "uuid", "feature" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  current_period_start timestamp with time zone;
  current_period_end timestamp with time zone;
begin
  -- Check if the requesting user is accessing their own data
  if auth.uid() != user_uuid then
    raise exception 'Access denied';
  end if;

  -- Get current period dates
  current_period_start := date_trunc('month', current_timestamp);
  current_period_end := date_trunc('month', current_timestamp) + interval '1 month' - interval '1 second';

  -- Increment usage count
  update public.usage_tracking
  set usage_count = usage_count + 1
  where user_id = user_uuid
  and feature_type = feature
  and period_start = current_period_start
  and period_end = current_period_end;
end;
$$;


ALTER FUNCTION "public"."increment_usage"("user_uuid" "uuid", "feature" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_insights" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "insight_type" "text" NOT NULL,
    "insight_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "confidence_score" numeric(3,2),
    "performance_impact" numeric(5,2),
    "recommendations" "text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "ai_insights_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric)))
);


ALTER TABLE "public"."ai_insights" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_insights" IS 'AI-generated insights and recommendations based on content performance patterns';



ALTER TABLE "public"."ai_insights" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."ai_insights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."generation_history" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "prompt_input" "text" NOT NULL,
    "generated_content" "text" NOT NULL,
    "content_type" "public"."content_type" NOT NULL,
    "ai_model" "text" NOT NULL,
    "tokens_used" integer,
    "generation_time_ms" integer,
    "quality_rating" integer,
    "user_feedback" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "generation_history_quality_rating_check" CHECK ((("quality_rating" >= 1) AND ("quality_rating" <= 5)))
);


ALTER TABLE "public"."generation_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."generation_history" IS 'History of AI content generation for quality tracking and improvement';



ALTER TABLE "public"."generation_history" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."generation_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."post_performance" (
    "id" bigint NOT NULL,
    "post_id" bigint NOT NULL,
    "impressions" integer NOT NULL,
    "likes" integer DEFAULT 0 NOT NULL,
    "comments" integer DEFAULT 0 NOT NULL,
    "shares" integer DEFAULT 0 NOT NULL,
    "clicks" integer DEFAULT 0 NOT NULL,
    "engagement_rate" numeric(5,2) GENERATED ALWAYS AS (
CASE
    WHEN ("impressions" > 0) THEN "round"((((((("likes" + "comments") + "shares") + "clicks"))::numeric / ("impressions")::numeric) * (100)::numeric), 2)
    ELSE (0)::numeric
END) STORED,
    "performance_notes" "text",
    "recorded_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "post_performance_clicks_check" CHECK (("clicks" >= 0)),
    CONSTRAINT "post_performance_comments_check" CHECK (("comments" >= 0)),
    CONSTRAINT "post_performance_impressions_check" CHECK (("impressions" >= 0)),
    CONSTRAINT "post_performance_likes_check" CHECK (("likes" >= 0)),
    CONSTRAINT "post_performance_shares_check" CHECK (("shares" >= 0))
);


ALTER TABLE "public"."post_performance" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_performance" IS 'Performance metrics for LinkedIn posts to enable AI learning and optimization';



ALTER TABLE "public"."post_performance" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."post_performance_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "content" "text" NOT NULL,
    "content_type" "public"."content_type" DEFAULT 'post'::"public"."content_type" NOT NULL,
    "status" "public"."content_status" DEFAULT 'draft'::"public"."content_status" NOT NULL,
    "tone" "public"."tone" DEFAULT 'professional'::"public"."tone" NOT NULL,
    "topics" "text"[],
    "hashtags" "text"[],
    "linkedin_url" "text",
    "posted_at" timestamp with time zone,
    "ai_prompt_used" "text",
    "generation_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."posts" IS 'AI-generated LinkedIn content posts with metadata for tracking and learning';



ALTER TABLE "public"."posts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."posts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "timezone" "text" DEFAULT 'UTC'::"text",
    "onboarding_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "first_name" "text",
    "linkedin_url" "text",
    "business_type" "text",
    "business_size" "text",
    "business_stage" "text",
    "linkedin_importance" "text",
    "investment_willingness" "text",
    "posting_mindset" "text",
    "current_posting_frequency" "text",
    "client_attraction_methods" "text"[],
    "ideal_target_client" "text",
    "client_pain_points" "text",
    "unique_value_proposition" "text",
    "proof_points" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles with personal and professional information for content personalization';



COMMENT ON COLUMN "public"."profiles"."business_type" IS 'Type of business from onboarding step 4';



COMMENT ON COLUMN "public"."profiles"."business_size" IS 'Size of business from onboarding step 5';



COMMENT ON COLUMN "public"."profiles"."business_stage" IS 'Business stage from onboarding step 6';



COMMENT ON COLUMN "public"."profiles"."linkedin_importance" IS 'LinkedIn content importance from onboarding step 7';



COMMENT ON COLUMN "public"."profiles"."investment_willingness" IS 'Marketing investment willingness from onboarding step 8';



COMMENT ON COLUMN "public"."profiles"."posting_mindset" IS 'Current posting mindset from onboarding step 9';



COMMENT ON COLUMN "public"."profiles"."current_posting_frequency" IS 'Current posting frequency from onboarding step 10';



COMMENT ON COLUMN "public"."profiles"."client_attraction_methods" IS 'Client attraction methods from onboarding step 11';



COMMENT ON COLUMN "public"."profiles"."ideal_target_client" IS 'Ideal target client description from onboarding step 12';



COMMENT ON COLUMN "public"."profiles"."client_pain_points" IS 'Client pain points from onboarding step 13';



COMMENT ON COLUMN "public"."profiles"."unique_value_proposition" IS 'Unique value proposition from onboarding step 14';



COMMENT ON COLUMN "public"."profiles"."proof_points" IS 'Proof points from onboarding step 15';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan_type" "public"."plan_type" DEFAULT 'free'::"public"."plan_type" NOT NULL,
    "status" "public"."subscription_status" DEFAULT 'active'::"public"."subscription_status" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscriptions" IS 'User subscription and billing information integrated with Stripe';



ALTER TABLE "public"."subscriptions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."subscriptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."usage_tracking" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feature_type" "text" NOT NULL,
    "usage_count" integer DEFAULT 0 NOT NULL,
    "limit_amount" integer NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "usage_tracking_limit_amount_check" CHECK (("limit_amount" >= 0)),
    CONSTRAINT "usage_tracking_usage_count_check" CHECK (("usage_count" >= 0))
);


ALTER TABLE "public"."usage_tracking" OWNER TO "postgres";


COMMENT ON TABLE "public"."usage_tracking" IS 'Track API usage and enforce subscription limits';



ALTER TABLE "public"."usage_tracking" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."usage_tracking_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "email_notifications" boolean DEFAULT true,
    "content_reminders" boolean DEFAULT true,
    "weekly_insights" boolean DEFAULT true,
    "marketing_emails" boolean DEFAULT false,
    "onboarding_data" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_preferences" IS 'User content strategy preferences and goals for AI personalization';



COMMENT ON COLUMN "public"."user_preferences"."email_notifications" IS 'Email notification preference from onboarding';



COMMENT ON COLUMN "public"."user_preferences"."content_reminders" IS 'Content reminder preference from onboarding';



COMMENT ON COLUMN "public"."user_preferences"."weekly_insights" IS 'Weekly insights preference from onboarding';



COMMENT ON COLUMN "public"."user_preferences"."marketing_emails" IS 'Marketing emails preference from onboarding';



COMMENT ON COLUMN "public"."user_preferences"."onboarding_data" IS 'Additional onboarding data stored as JSON';



ALTER TABLE "public"."user_preferences" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."user_preferences_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generation_history"
    ADD CONSTRAINT "generation_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_performance"
    ADD CONSTRAINT "post_performance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."usage_tracking"
    ADD CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ai_insights_type" ON "public"."ai_insights" USING "btree" ("insight_type");



CREATE INDEX "idx_ai_insights_user_id" ON "public"."ai_insights" USING "btree" ("user_id");



CREATE INDEX "idx_generation_history_created_at" ON "public"."generation_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_generation_history_user_id" ON "public"."generation_history" USING "btree" ("user_id");



CREATE INDEX "idx_post_performance_engagement_rate" ON "public"."post_performance" USING "btree" ("engagement_rate" DESC);



CREATE INDEX "idx_post_performance_post_id" ON "public"."post_performance" USING "btree" ("post_id");



CREATE INDEX "idx_posts_content_type" ON "public"."posts" USING "btree" ("content_type");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_status" ON "public"."posts" USING "btree" ("status");



CREATE INDEX "idx_posts_user_id" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_subscriptions_stripe_customer" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_usage_tracking_user_period" ON "public"."usage_tracking" USING "btree" ("user_id", "period_start", "period_end");



CREATE OR REPLACE TRIGGER "handle_updated_at_ai_insights" BEFORE UPDATE ON "public"."ai_insights" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_post_performance" BEFORE UPDATE ON "public"."post_performance" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_posts" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_subscriptions" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_usage_tracking" BEFORE UPDATE ON "public"."usage_tracking" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_user_preferences" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generation_history"
    ADD CONSTRAINT "generation_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_performance"
    ADD CONSTRAINT "post_performance_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_tracking"
    ADD CONSTRAINT "usage_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete performance for their own posts" ON "public"."post_performance" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."posts"
  WHERE (("posts"."id" = "post_performance"."post_id") AND ("posts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can delete their own ai insights" ON "public"."ai_insights" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own generation history" ON "public"."generation_history" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own posts" ON "public"."posts" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own preferences" ON "public"."user_preferences" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own profile" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can delete their own subscription" ON "public"."subscriptions" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own usage tracking" ON "public"."usage_tracking" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert performance for their own posts" ON "public"."post_performance" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."posts"
  WHERE (("posts"."id" = "post_performance"."post_id") AND ("posts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can insert their own ai insights" ON "public"."ai_insights" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own generation history" ON "public"."generation_history" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own posts" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own preferences" ON "public"."user_preferences" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can insert their own subscription" ON "public"."subscriptions" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own usage tracking" ON "public"."usage_tracking" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update performance for their own posts" ON "public"."post_performance" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."posts"
  WHERE (("posts"."id" = "post_performance"."post_id") AND ("posts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."posts"
  WHERE (("posts"."id" = "post_performance"."post_id") AND ("posts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update their own ai insights" ON "public"."ai_insights" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own generation history" ON "public"."generation_history" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own posts" ON "public"."posts" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own preferences" ON "public"."user_preferences" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update their own subscription" ON "public"."subscriptions" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own usage tracking" ON "public"."usage_tracking" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view performance for their own posts" ON "public"."post_performance" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."posts"
  WHERE (("posts"."id" = "post_performance"."post_id") AND ("posts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view their own ai insights" ON "public"."ai_insights" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own generation history" ON "public"."generation_history" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own posts" ON "public"."posts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own preferences" ON "public"."user_preferences" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can view their own subscription" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own usage tracking" ON "public"."usage_tracking" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."ai_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generation_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_performance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."check_usage_limit"("user_uuid" "uuid", "feature" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_usage_limit"("user_uuid" "uuid", "feature" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_usage_limit"("user_uuid" "uuid", "feature" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_analytics"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_analytics"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_analytics"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_usage"("user_uuid" "uuid", "feature" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_usage"("user_uuid" "uuid", "feature" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_usage"("user_uuid" "uuid", "feature" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."ai_insights" TO "anon";
GRANT ALL ON TABLE "public"."ai_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_insights" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_insights_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_insights_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_insights_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."generation_history" TO "anon";
GRANT ALL ON TABLE "public"."generation_history" TO "authenticated";
GRANT ALL ON TABLE "public"."generation_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."generation_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."generation_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."generation_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."post_performance" TO "anon";
GRANT ALL ON TABLE "public"."post_performance" TO "authenticated";
GRANT ALL ON TABLE "public"."post_performance" TO "service_role";



GRANT ALL ON SEQUENCE "public"."post_performance_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."post_performance_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."post_performance_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."usage_tracking" TO "anon";
GRANT ALL ON TABLE "public"."usage_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_tracking" TO "service_role";



GRANT ALL ON SEQUENCE "public"."usage_tracking_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."usage_tracking_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."usage_tracking_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_preferences_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_preferences_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_preferences_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
