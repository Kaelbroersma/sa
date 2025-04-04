-- Create blog_settings table
CREATE TABLE blog_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    posts_per_page INTEGER NOT NULL DEFAULT 10,
    enable_comments BOOLEAN NOT NULL DEFAULT true,
    default_meta_title TEXT,
    default_meta_description TEXT,
    default_meta_keywords TEXT,
    show_author BOOLEAN NOT NULL DEFAULT true,
    show_date BOOLEAN NOT NULL DEFAULT true,
    show_reading_time BOOLEAN NOT NULL DEFAULT true,
    enable_social_sharing BOOLEAN NOT NULL DEFAULT true,
    featured_posts_count INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_blog_settings_updated_at
    BEFORE UPDATE ON blog_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO blog_settings (
    posts_per_page,
    enable_comments,
    default_meta_title,
    default_meta_description,
    default_meta_keywords,
    show_author,
    show_date,
    show_reading_time,
    enable_social_sharing,
    featured_posts_count
) VALUES (
    10,
    true,
    'Carnimore Blog',
    'Read the latest updates and insights from Carnimore',
    'firearms, FFL, guns, accessories',
    true,
    true,
    true,
    true,
    3
);

-- Enable Row Level Security
ALTER TABLE blog_settings ENABLE ROW LEVEL SECURITY;

-- Create read policy for all authenticated users
CREATE POLICY blog_settings_read_policy
    ON blog_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Create update policy for super admins only
CREATE POLICY blog_settings_update_policy
    ON blog_settings
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id
            FROM users
            WHERE is_super_admin = true
        )
    ); 