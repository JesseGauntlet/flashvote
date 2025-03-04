-- 0. Ensure TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

--------------------------------------------------------------------------------
-- 1. Make 'votes' a hypertable (if not already)
--------------------------------------------------------------------------------
-- Note: We need to do this outside a transaction since materialized views with 
-- timescaledb.continuous can't be created inside a transaction block

-- Drop the primary key constraint
ALTER TABLE votes DROP CONSTRAINT votes_pkey;

-- Now convert to a hypertable
SELECT create_hypertable('votes', 'created_at', migrate_data => true);

-- Add a new primary key that includes the partitioning column
ALTER TABLE votes ADD PRIMARY KEY (id, created_at);

--------------------------------------------------------------------------------
-- 2. Weekly aggregates (NEW)
--------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW weekly_votes AS
SELECT
    time_bucket('1 week', created_at) AS bucket,  -- aligns by Monday in Timescale
    subject_id,
    location_id,
    count(*) AS total_votes,
    count(*) FILTER (WHERE choice = true)  AS positive_votes,
    count(*) FILTER (WHERE choice = false) AS negative_votes
FROM votes
GROUP BY bucket, subject_id, location_id;

--------------------------------------------------------------------------------
-- 3. Indexes on the aggregates
--------------------------------------------------------------------------------

-- Weekly indexes
CREATE INDEX IF NOT EXISTS idx_weekly_votes_subject_bucket
  ON weekly_votes(subject_id, bucket DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_votes_location
  ON weekly_votes(location_id) WHERE location_id IS NOT NULL;

--------------------------------------------------------------------------------
-- 4. Refresh the materialized view
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
    'refresh_weekly_votes',          -- Unique job name
    '0 1 * * 1',                     -- Runs at 1 AM every Monday
    $$ REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_votes $$  -- Refresh statement
);
