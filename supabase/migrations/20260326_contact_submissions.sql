-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow anonymous inserts (public contact form)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

-- Only service role can read (admin API)
CREATE POLICY "Service role can read all submissions"
  ON contact_submissions FOR SELECT
  USING (auth.role() = 'service_role');

-- Index for admin queries
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions (created_at DESC);
