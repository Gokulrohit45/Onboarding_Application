-- Create default_cc_emails table
CREATE TABLE IF NOT EXISTS default_cc_emails (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed the initial default email
INSERT INTO default_cc_emails (email) 
VALUES ('gokulnath96880@gmail.com') 
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE default_cc_emails ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service_role (the backend) to perform all actions
-- Note: Supabase's service_role automatically bypasses RLS, but we can declare it explicitly:
CREATE POLICY "Allow service_role full access" ON default_cc_emails
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create user_password_resets table
CREATE TABLE IF NOT EXISTS user_password_resets (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_password_resets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service_role (the backend) to perform all actions
CREATE POLICY "Allow service_role full access" ON user_password_resets
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

