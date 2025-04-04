-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_dashboard_stats();

-- Create a function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stats json;
    user_count integer;
    order_count integer;
    product_count integer;
    blog_count integer;
BEGIN
    -- Get counts individually for debugging
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO order_count FROM orders;
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(*) INTO blog_count FROM blogs;
    
    -- Log the counts
    RAISE LOG 'Dashboard stats counts - Users: %, Orders: %, Products: %, Blog Posts: %',
        user_count, order_count, product_count, blog_count;
    
    -- Build the stats object
    SELECT json_build_object(
        'totalUsers', user_count,
        'totalOrders', order_count,
        'totalProducts', product_count,
        'totalBlogPosts', blog_count
    ) INTO stats;
    
    RETURN stats;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        RAISE LOG 'Error in get_dashboard_stats: %', SQLERRM;
        -- Return a default object with zeros
        RETURN json_build_object(
            'totalUsers', 0,
            'totalOrders', 0,
            'totalProducts', 0,
            'totalBlogPosts', 0
        );
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO service_role;

-- Create blog_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_name text,
    site_description text,
    posts_per_page integer DEFAULT 10,
    enable_comments boolean DEFAULT true,
    enable_related_posts boolean DEFAULT true,
    enable_social_sharing boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default settings if none exist
INSERT INTO blog_settings (id, site_name, site_description)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'My Blog',
    'Welcome to my blog'
WHERE NOT EXISTS (
    SELECT 1 FROM blog_settings
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow service role to count users" ON users;
DROP POLICY IF EXISTS "Allow service role to count orders" ON orders;
DROP POLICY IF EXISTS "Allow service role to count products" ON products;
DROP POLICY IF EXISTS "Allow service role to count blogs" ON blogs;
DROP POLICY IF EXISTS "Allow service role to read blogs" ON blogs;
DROP POLICY IF EXISTS "Allow service role to manage blog settings" ON blog_settings;

-- Add RLS policies to allow service role to count rows
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role to count rows
CREATE POLICY "Allow service role to count users" ON users
    FOR SELECT TO service_role
    USING (true);

CREATE POLICY "Allow service role to count orders" ON orders
    FOR SELECT TO service_role
    USING (true);

CREATE POLICY "Allow service role to count products" ON products
    FOR SELECT TO service_role
    USING (true);

CREATE POLICY "Allow service role to count blogs" ON blogs
    FOR SELECT TO service_role
    USING (true);

-- Create policy to allow service role to read blogs
CREATE POLICY "Allow service role to read blogs" ON blogs
    FOR SELECT TO service_role
    USING (true);

-- Create policy to allow service role to manage blog settings
CREATE POLICY "Allow service role to manage blog settings" ON blog_settings
    FOR ALL TO service_role
    USING (true); 