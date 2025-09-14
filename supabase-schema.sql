-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel VARCHAR(50) NOT NULL,
  chat_id VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  password VARCHAR(8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_channel ON posts(channel);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access to posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to posts" ON posts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to posts" ON posts FOR DELETE USING (true);

CREATE POLICY "Allow public insert access to feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access to feedback" ON feedback FOR SELECT USING (true);
