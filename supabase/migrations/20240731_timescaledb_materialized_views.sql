-- 0. Ensure TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

--------------------------------------------------------------------------------
-- 1. Make 'votes' a hypertable (if not already)
--------------------------------------------------------------------------------
-- Note: We need to do this outside a transaction since materialized views with 
-- timescaledb.continuous can't be created inside a transaction block

-- Remove existing vote data
TRUNCATE votes CASCADE;

-- Drop the primary key constraint
ALTER TABLE votes DROP CONSTRAINT votes_pkey;

-- Now convert to a hypertable
SELECT create_hypertable('votes', 'created_at', if_not_exists => TRUE);

-- Add a new primary key that includes the partitioning column
ALTER TABLE votes ADD PRIMARY KEY (id, created_at);

--------------------------------------------------------------------------------
-- 2. Hourly aggregates
--------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW hourly_votes
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', created_at) AS bucket,
    subject_id,
    location_id,
    count(*) AS total_votes,
    count(*) FILTER (WHERE choice = true) AS positive_votes,
    count(*) FILTER (WHERE choice = false) AS negative_votes
FROM votes
GROUP BY bucket, subject_id, location_id;

-- Refresh policy: recalculates from 1 day ago up to 3 minutes ago, every 15 min
SELECT add_continuous_aggregate_policy('hourly_votes',
    start_offset => INTERVAL '1 day',      -- go back 24h
    end_offset   => INTERVAL '3 minutes', -- 3-min buffer for delayed arrivals
    schedule_interval => INTERVAL '15 minutes'
);

--------------------------------------------------------------------------------
-- 3. Daily aggregates
--------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW daily_votes
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', created_at) AS bucket,
    subject_id,
    location_id,
    count(*) AS total_votes,
    count(*) FILTER (WHERE choice = true) AS positive_votes,
    count(*) FILTER (WHERE choice = false) AS negative_votes
FROM votes
GROUP BY bucket, subject_id, location_id;

-- Refresh policy: recalculates from 7 days ago up to 1 hour ago, every hour
SELECT add_continuous_aggregate_policy('daily_votes',
    start_offset => INTERVAL '7 days',
    end_offset   => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);

--------------------------------------------------------------------------------
-- 4. Weekly aggregates (NEW)
--------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW weekly_votes
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 week', created_at) AS bucket,  -- aligns by Monday in Timescale
    subject_id,
    location_id,
    count(*) AS total_votes,
    count(*) FILTER (WHERE choice = true)  AS positive_votes,
    count(*) FILTER (WHERE choice = false) AS negative_votes
FROM votes
GROUP BY bucket, subject_id, location_id;

-- Refresh policy: recalc from 180 days ago up to 1 day ago, every day
SELECT add_continuous_aggregate_policy('weekly_votes',
    start_offset => INTERVAL '180 days',
    end_offset   => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day'
);

--------------------------------------------------------------------------------
-- 5. 7-day rolling average (includes the current day)
--------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW rolling_7d_votes
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', created_at) AS bucket,
    subject_id,
    location_id,
    /*
      Use a window function that looks back 6 days from the current bucket
      *through* the current bucket (CURRENT ROW). 
      This ensures the 7-day period includes "today."
    */
    AVG(COUNT(*)) OVER (
        PARTITION BY subject_id, location_id
        ORDER BY time_bucket('1 day', created_at)
        RANGE BETWEEN '6 days'::interval PRECEDING AND CURRENT ROW
    )::numeric(10,2) AS avg_votes_7d,

    AVG(COUNT(*) FILTER (WHERE choice = true)) OVER (
        PARTITION BY subject_id, location_id
        ORDER BY time_bucket('1 day', created_at)
        RANGE BETWEEN '6 days'::interval PRECEDING AND CURRENT ROW
    )::numeric(10,2) AS avg_positive_7d,

    AVG(COUNT(*) FILTER (WHERE choice = false)) OVER (
        PARTITION BY subject_id, location_id
        ORDER BY time_bucket('1 day', created_at)
        RANGE BETWEEN '6 days'::interval PRECEDING AND CURRENT ROW
    )::numeric(10,2) AS avg_negative_7d
FROM votes
GROUP BY bucket, subject_id, location_id;

-- Refresh policy: recalc from 14 days ago (to ensure window coverage), 
-- up to 1 hour ago, every hour
SELECT add_continuous_aggregate_policy('rolling_7d_votes',
    start_offset => INTERVAL '14 days',
    end_offset   => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);

--------------------------------------------------------------------------------
-- 6. Indexes on the aggregates
--------------------------------------------------------------------------------

-- Hourly indexes
CREATE INDEX IF NOT EXISTS idx_hourly_votes_subject_bucket
  ON hourly_votes(subject_id, bucket DESC);

CREATE INDEX IF NOT EXISTS idx_hourly_votes_location
  ON hourly_votes(location_id) WHERE location_id IS NOT NULL;

-- Daily indexes
CREATE INDEX IF NOT EXISTS idx_daily_votes_subject_bucket
  ON daily_votes(subject_id, bucket DESC);

CREATE INDEX IF NOT EXISTS idx_daily_votes_location
  ON daily_votes(location_id) WHERE location_id IS NOT NULL;

-- Weekly indexes
CREATE INDEX IF NOT EXISTS idx_weekly_votes_subject_bucket
  ON weekly_votes(subject_id, bucket DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_votes_location
  ON weekly_votes(location_id) WHERE location_id IS NOT NULL;

-- Rolling 7-day indexes
CREATE INDEX IF NOT EXISTS idx_rolling_7d_votes_subject_bucket
  ON rolling_7d_votes(subject_id, bucket DESC);

CREATE INDEX IF NOT EXISTS idx_rolling_7d_votes_location
  ON rolling_7d_votes(location_id) WHERE location_id IS NOT NULL;
