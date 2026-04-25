-- Goal Tracker schema
-- Run this in your Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Logs
CREATE TABLE IF NOT EXISTS gt_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  category      TEXT NOT NULL,
  duration      INTEGER NOT NULL DEFAULT 0,
  note          TEXT NOT NULL DEFAULT '',
  xp_earned     INTEGER NOT NULL DEFAULT 0,
  timestamp     BIGINT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS gt_goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL,
  target_count  INTEGER NOT NULL DEFAULT 1,
  current_count INTEGER NOT NULL DEFAULT 0,
  period        TEXT NOT NULL,
  xp_reward     INTEGER NOT NULL DEFAULT 100,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    BIGINT NOT NULL,
  completed_at  BIGINT,
  last_reset_at BIGINT
);

-- Rewards
CREATE TABLE IF NOT EXISTS gt_rewards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cost        INTEGER NOT NULL DEFAULT 100,
  icon        TEXT NOT NULL DEFAULT '🎁',
  redeemed    BOOLEAN NOT NULL DEFAULT FALSE,
  redeemed_at BIGINT,
  created_at  BIGINT NOT NULL
);

-- Unlocked achievements
CREATE TABLE IF NOT EXISTS gt_achievements (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at    BIGINT NOT NULL,
  PRIMARY KEY (user_id, achievement_id)
);

-- User profile (display name, pomodoro count)
CREATE TABLE IF NOT EXISTS gt_profile (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name         TEXT NOT NULL DEFAULT '',
  pomodoros_completed  INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE gt_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE gt_goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gt_rewards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gt_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gt_profile      ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "own logs"         ON gt_logs         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own goals"        ON gt_goals        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own rewards"      ON gt_rewards      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own achievements" ON gt_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own profile"      ON gt_profile      FOR ALL USING (auth.uid() = user_id);
