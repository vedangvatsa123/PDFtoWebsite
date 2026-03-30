-- Remote jobs cache table for the /jobs feed
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Source tracking
  source TEXT NOT NULL,           -- 'remotive', 'greenhouse', 'ashby', 'himalayas', 'jobicy', 'foorilla'
  external_id TEXT NOT NULL UNIQUE,  -- source-specific ID e.g. 'remotive_12345'

  -- Cross-source dedup
  dedup_hash TEXT NOT NULL UNIQUE,   -- md5(lower(company) + '|' + lower(trim(title)))

  -- Job data
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  location TEXT,
  job_type TEXT,                   -- 'full_time', 'contract', 'part_time', 'internship', 'freelance'
  salary TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',        -- extracted skills/tech keywords
  apply_url TEXT NOT NULL,
  category TEXT,

  -- Analytics
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,

  -- Timestamps
  published_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GIN index for fast skill matching (tags overlap with user skills)
CREATE INDEX idx_jobs_tags ON jobs USING GIN (tags);

-- Index for listing/sorting
CREATE INDEX idx_jobs_synced_at ON jobs (synced_at DESC);
CREATE INDEX idx_jobs_published_at ON jobs (published_at DESC NULLS LAST);

-- Index for dedup lookups
CREATE INDEX idx_jobs_dedup_hash ON jobs (dedup_hash);

-- RLS: anyone can read jobs (public feed)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read jobs"
  ON jobs FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (sync script)
CREATE POLICY "Service role can manage jobs"
  ON jobs FOR ALL
  USING (auth.role() = 'service_role');

-- Allow anonymous counter increments (views/clicks only)
CREATE POLICY "Anyone can update job counters"
  ON jobs FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Atomic batch increment function for views/clicks
CREATE OR REPLACE FUNCTION batch_increment_jobs(job_ids UUID[], col_name TEXT)
RETURNS void AS $$
BEGIN
  IF col_name = 'views' THEN
    UPDATE jobs SET views = COALESCE(views, 0) + 1 WHERE id = ANY(job_ids);
  ELSIF col_name = 'clicks' THEN
    UPDATE jobs SET clicks = COALESCE(clicks, 0) + 1 WHERE id = ANY(job_ids);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
