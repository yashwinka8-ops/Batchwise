-- SQL Schema for Supabase Mock Test Platform

-- 1. Create Mock Tests Table
CREATE TABLE IF NOT EXISTS mock_tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT CHECK (category IN ('pyq', 'mocks')),
    date TEXT,
    questions_count INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 180,
    level TEXT,
    is_sample BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT FALSE,
    created_at BIGINT,
    syllabus TEXT,
    is_external_html BOOLEAN DEFAULT FALSE,
    external_html_url TEXT
);

-- 2. Create Mock Questions Table
CREATE TABLE IF NOT EXISTS mock_questions (
    id TEXT PRIMARY KEY,
    test_id TEXT REFERENCES mock_tests(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('MCQ', 'NUMERICAL')),
    subject TEXT,
    text TEXT,
    options JSONB, -- Array of strings
    correct_option_index INTEGER,
    correct_numeric_answer TEXT,
    solution TEXT,
    image_url TEXT,
    "order" INTEGER DEFAULT 0,
    difficulty TEXT,
    is_top_pyq BOOLEAN DEFAULT FALSE
);

-- 3. Create Test Attempts Table
CREATE TABLE IF NOT EXISTS test_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    test_id TEXT REFERENCES mock_tests(id) ON DELETE CASCADE,
    responses JSONB,
    score JSONB,
    submitted_at BIGINT
);

-- 4. Enable Row Level Security
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Development: Allow Public Read, Authenticated Write)

-- Mock Tests
DROP POLICY IF EXISTS "Allow public read for mock_tests" ON mock_tests;
CREATE POLICY "Allow public read for mock_tests" ON mock_tests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert for mock_tests" ON mock_tests;
CREATE POLICY "Allow authenticated insert for mock_tests" ON mock_tests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update for mock_tests" ON mock_tests;
CREATE POLICY "Allow authenticated update for mock_tests" ON mock_tests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete for mock_tests" ON mock_tests;
CREATE POLICY "Allow authenticated delete for mock_tests" ON mock_tests FOR DELETE USING (true);

-- Mock Questions
DROP POLICY IF EXISTS "Allow public read for mock_questions" ON mock_questions;
CREATE POLICY "Allow public read for mock_questions" ON mock_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert for mock_questions" ON mock_questions;
CREATE POLICY "Allow authenticated insert for mock_questions" ON mock_questions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update for mock_questions" ON mock_questions;
CREATE POLICY "Allow authenticated update for mock_questions" ON mock_questions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete for mock_questions" ON mock_questions;
CREATE POLICY "Allow authenticated delete for mock_questions" ON mock_questions FOR DELETE USING (true);

-- Test Attempts
DROP POLICY IF EXISTS "Allow individuals to see their own attempts" ON test_attempts;
CREATE POLICY "Allow individuals to see their own attempts" ON test_attempts FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow individuals to insert their own attempts" ON test_attempts;
CREATE POLICY "Allow individuals to insert their own attempts" ON test_attempts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow individuals to update their own attempts" ON test_attempts;
CREATE POLICY "Allow individuals to update their own attempts" ON test_attempts FOR UPDATE USING (auth.uid()::text = user_id OR user_id IS NULL);

-- Note: You will need to create a storage bucket named 'test-assets' 
-- and set it to PUBLIC access for images and html files to work.
