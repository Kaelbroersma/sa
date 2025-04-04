-- Create blog_settings table
CREATE TABLE IF NOT EXISTS blog_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    enable_comments boolean DEFAULT true,
    default_meta_title text,
    default_meta_description text,
    default_meta_keywords text,
    show_author boolean DEFAULT true,
    show_date boolean DEFAULT true,
    show_reading_time boolean DEFAULT true,
    enable_social_sharing boolean DEFAULT true,
    featured_posts_count integer DEFAULT 3,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default settings if none exist
INSERT INTO blog_settings (
    id,
    enable_comments,
    default_meta_title,
    default_meta_description,
    default_meta_keywords,
    show_author,
    show_date,
    show_reading_time,
    enable_social_sharing,
    featured_posts_count
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    true,
    'My Blog',
    'Welcome to my blog',
    'blog, articles, news',
    true,
    true,
    true,
    true,
    3
WHERE NOT EXISTS (
    SELECT 1 FROM blog_settings
);

-- Enable RLS
ALTER TABLE blog_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow service role to manage blog settings" ON blog_settings;

-- Create policy to allow service role to manage blog settings
CREATE POLICY "Allow service role to manage blog settings" ON blog_settings
    FOR ALL TO service_role
    USING (true); 