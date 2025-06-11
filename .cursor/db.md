# Users Table

```sql
CREATE TABLE users (
  user_id VARCHAR(50) PRIMARY KEY, -- Using the format from JSON (recJaCnmV5ph9cPFy)
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  subscription_started_date TIMESTAMP WITH TIME ZONE,
  sub_started_month VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

# User Profiles Table

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
  icp TEXT, -- Ideal Customer Profile
  icp_pain_points TEXT,
  value_proposition TEXT,
  proof_points TEXT,
  energizing_topics TEXT,
  decision_makers TEXT,
  content_strategy TEXT,
  content_strategy_updated_at TIMESTAMP WITH TIME ZONE,
  content_pillars TEXT,
  content_pillars_updated_at TIMESTAMP WITH TIME ZONE,
  prompts_doc_link VARCHAR(500),
  google_drive_folder VARCHAR(500),
  document_name VARCHAR(500),
  customer_feedback TEXT,
  customer_feedback_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

# Content Generation Flags

```sql
CREATE TABLE user_generation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
  generate_strategy BOOLEAN DEFAULT FALSE,
  generate_pillars BOOLEAN DEFAULT FALSE,
  generate_prompts BOOLEAN DEFAULT FALSE,
  update_new_prompts BOOLEAN DEFAULT FALSE,
  added_new_prompts BOOLEAN DEFAULT FALSE,
  generate_strategy_timestamp TIMESTAMP WITH TIME ZONE,
  gen_pillars_timestamp TIMESTAMP WITH TIME ZONE,
  gen_prompts_timestamp TIMESTAMP WITH TIME ZONE,
  update_prompts_timestamp TIMESTAMP WITH TIME ZONE,
  new_prompts_last_modified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

# Posts Table

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT NOT NULL,
  content_type VARCHAR(50), -- story, insight, tip, etc.
  pillar_category INTEGER, -- 1, 2, or 3 based on content pillars
  status VARCHAR(50) DEFAULT 'draft', -- draft, used, archived
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Manual LinkedIn Performance Tracking
  posted_manually BOOLEAN DEFAULT FALSE,
  posted_date TIMESTAMP WITH TIME ZONE,
  linkedin_url VARCHAR(500), -- User can add the LinkedIn post URL

  -- Performance Metrics (manually entered by user)
  impressions INTEGER,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,

  -- Engagement Rate Calculations
  engagement_rate DECIMAL(5,2), -- Auto-calculated: (likes + comments + shares) / impressions * 100

  -- Tracking when metrics were last updated
  metrics_updated_at TIMESTAMP WITH TIME ZONE,
  metrics_updated_by_user BOOLEAN DEFAULT FALSE
);
```

# Post Performance History Table (for tracking metrics over time)

```sql
CREATE TABLE post_metrics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  impressions INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  clicks INTEGER,
  engagement_rate DECIMAL(5,2),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT -- User can add notes about why they think it performed well/poorly
);
```

# AI Learning Data Table (for optimization)

```sql
CREATE TABLE ai_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,

  -- Content characteristics
  content_type VARCHAR(50),
  pillar_category INTEGER,
  content_length INTEGER,
  hashtag_count INTEGER,
  question_included BOOLEAN,
  call_to_action BOOLEAN,
  personal_story BOOLEAN,

  -- Performance metrics
  impressions INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  engagement_rate DECIMAL(5,2),

  -- Classification
  performance_tier VARCHAR(20), -- high, medium, low (based on user's avg)

  -- AI Analysis
  ai_analysis_sent BOOLEAN DEFAULT FALSE,
  ai_insights TEXT, -- Insights from OpenAI about why it performed well/poorly

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

# Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100) UNIQUE,
  status VARCHAR(50) NOT NULL, -- active, canceled, past_due, etc.
  plan_name VARCHAR(100) NOT NULL,
  plan_price DECIMAL(10,2),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

# Database Functions for Automatic Calculations

```sql
-- Function to calculate engagement rate
CREATE OR REPLACE FUNCTION calculate_engagement_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.impressions > 0 THEN
    NEW.engagement_rate = ROUND(
      ((COALESCE(NEW.likes, 0) + COALESCE(NEW.comments, 0) + COALESCE(NEW.shares, 0))::DECIMAL / NEW.impressions * 100),
      2
    );
  ELSE
    NEW.engagement_rate = 0;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate engagement rate
CREATE TRIGGER posts_engagement_rate_trigger
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_engagement_rate();
```
