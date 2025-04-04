-- Add admin policies for service role access
DO $$ 
BEGIN
  -- Drop existing admin policies if they exist
  DROP POLICY IF EXISTS "Service role can access all users" ON users;
  DROP POLICY IF EXISTS "Service role can access all orders" ON orders;
  DROP POLICY IF EXISTS "Service role can access all products" ON products;
  DROP POLICY IF EXISTS "Service role can access all categories" ON categories;
  DROP POLICY IF EXISTS "Service role can access all blog posts" ON blog_posts;

  -- Create new admin policies
  CREATE POLICY "Service role can access all users" ON users
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

  CREATE POLICY "Service role can access all orders" ON orders
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

  CREATE POLICY "Service role can access all products" ON products
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

  CREATE POLICY "Service role can access all categories" ON categories
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

  CREATE POLICY "Service role can access all blog posts" ON blog_posts
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION 
  WHEN others THEN NULL;
END $$; 