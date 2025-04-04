import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // 30 day session for improved persistence  
    storageKey: 'carnimore-admin-key',
    flowType: 'pkce' // More secure flow type for token exchange
  }
});

// Create a separate client for auth operations
const authClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // 30 day session for improved persistence
    storageKey: 'carnimore-auth-key',
    flowType: 'pkce' // More secure flow type for token exchange
  }
});

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    if (!event.body) {
      throw new Error('Missing request body');
    }

    const { action, payload } = JSON.parse(event.body);

    if (!action) {
      throw new Error('Missing required action parameter');
    }

    console.log(`Processing action: ${action}`);

    switch (action) {
      case 'signUp':
        try {
          // Validate required fields
          if (!payload.email || !payload.password || !payload.options?.data?.first_name || !payload.options?.data?.last_name) {
            throw new Error('Missing required fields for signup');
          }

          // Create auth user first using authClient
          const { data: signUpData, error: signUpError } = await authClient.auth.admin.createUser({
            email: payload.email,
            password: payload.password,
            email_confirm: true,
            user_metadata: {
              first_name: payload.options.data.first_name,
              last_name: payload.options.data.last_name,
              acceptedTerms: true
            }
          });

          if (signUpError) throw signUpError;
          if (!signUpData.user) throw new Error('Failed to create user');

          // Insert into users table using main client
          const { error: userError } = await supabase
            .from('users')
            .insert([{
              user_id: signUpData.user.id,
              email: payload.email,
              first_name: payload.options.data.first_name,
              last_name: payload.options.data.last_name,
              user_role: 'customer',
              accepted_terms: true,
              marketing_opt_in: payload.options.data.acceptMarketing || false
            }]);

          if (userError) {
            console.error('Error creating user record:', userError);
            await authClient.auth.admin.deleteUser(signUpData.user.id);
            throw userError;
          }

          // Return the user data without signing in
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: signUpData })
          };
        } catch (error: any) {
          console.error('Error in signup process:', error);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: error.message || 'Failed to sign up',
                details: error.details || error.message
              }
            })
          };
        }

      case 'signIn':
        try {
          // Use authClient for sign in
          const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword(payload);
          if (signInError) throw signInError;

          // Update last_login in users table using main client
          if (signInData.user) {
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('user_id', signInData.user.id);
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: signInData })
          };
        } catch (error: any) {
          console.error('Error in signin process:', error);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: error.message || 'Failed to sign in',
                details: error.details || error.message
              }
            })
          };
        }

      case 'signOut':
        try {
          // Use authClient for sign out
          const { error: signOutError } = await authClient.auth.signOut();
          if (signOutError) throw signOutError;
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        } catch (error: any) {
          console.error('Error in signout process:', error);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: error.message || 'Failed to sign out',
                details: error.details || error.message
              }
            })
          };
        }

      case 'checkDatabaseSchema':
        try {
          console.log('Checking database schema...');
          
          // Check users table structure
          const { data: usersColumns, error: usersError } = await supabase
            .rpc('get_table_columns', { table_name: 'users' });
          
          if (usersError) {
            console.error('Error checking users table schema:', {
              error: usersError,
              timestamp: new Date().toISOString()
            });
            
            // Fallback to direct queries if rpc fails
            const { data: debugUsersData, error: debugUsersError } = await supabase
              .from('users')
              .select('*')
              .limit(1);
              
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                message: 'RPC failed but retrieved sample data',
                error: usersError.message,
                sampleData: debugUsersData ? debugUsersData[0] : null,
                sampleKeys: debugUsersData && debugUsersData.length > 0 ? Object.keys(debugUsersData[0]) : []
              })
            };
          }
          
          // Get super admin users directly
          const { data: superAdminUsers, error: superAdminError } = await supabase
            .from('users')
            .select('user_id, email, is_super_admin, super_admin, admin, user_role')
            .eq('is_super_admin', true)
            .limit(5);
            
          // Try another query with a different column name if first one fails
          const { data: backupSuperAdminUsers, error: backupSuperAdminError } = await supabase
            .from('users')
            .select('user_id, email, is_super_admin, super_admin, admin, user_role')
            .eq('super_admin', true)
            .limit(5);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              columns: usersColumns,
              superAdminUsers,
              superAdminError: superAdminError?.message,
              backupSuperAdminUsers,
              backupSuperAdminError: backupSuperAdminError?.message
            })
          };
        } catch (error: any) {
          console.error('Error checking database schema:', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to check database schema',
                details: error.message
              }
            })
          };
        }

      case 'checkAdminStatus':
        try {
          if (!payload || !payload.userId) {
            throw new Error('Missing user ID in payload');
          }

          console.log('Checking admin status for user:', {
            userId: payload.userId,
            timestamp: new Date().toISOString()
          });

          // First do a raw query to see the actual values in the table
          const { data: rawUserData, error: rawUserError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', payload.userId)
            .single();

          if (rawUserError) {
            console.error('Error in raw user data query:', {
              error: rawUserError,
              timestamp: new Date().toISOString()
            });
          } else {
            console.log('Raw user data from database:', {
              rawUserData,
              allKeys: rawUserData ? Object.keys(rawUserData) : [],
              is_super_admin_value: rawUserData?.is_super_admin,
              is_super_admin_type: typeof rawUserData?.is_super_admin,
              timestamp: new Date().toISOString()
            });
          }

          // Try to get the user with all possible super admin column names
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
              user_id,
              email,
              is_super_admin,
              user_role
            `)
            .eq('user_id', payload.userId)
            .single();

          if (userError) {
            console.error('Error fetching user data:', {
              error: userError,
              timestamp: new Date().toISOString()
            });
            throw userError;
          }

          // Log stringified version to see exactly what's in the values
          console.log('User data for admin check (stringified):', {
            userData: JSON.stringify(userData),
            is_super_admin: JSON.stringify(userData?.is_super_admin),
            timestamp: new Date().toISOString()
          });

          const isAdmin = userData?.is_super_admin === true;
          
          console.log('Final admin status determination:', {
            isAdmin,
            rawValue: userData?.is_super_admin,
            equalToTrue: userData?.is_super_admin === true,
            type: typeof userData?.is_super_admin,
            timestamp: new Date().toISOString()
          });

          // Update the user directly to set is_super_admin to true for testing
          if (payload.setAdmin === true) {
            const { data: updateData, error: updateError } = await supabase
              .from('users')
              .update({ is_super_admin: true })
              .eq('user_id', payload.userId)
              .select()
              .single();

            if (updateError) {
              console.error('Error updating super admin status:', {
                error: updateError,
                timestamp: new Date().toISOString()
              });
              throw updateError;
            }

            console.log('Updated super admin status:', {
              updateData,
              is_super_admin: updateData?.is_super_admin,
              timestamp: new Date().toISOString()
            });

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                data: { 
                  before: userData,
                  after: updateData,
                  message: 'Super admin status updated'
                }
              })
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              data: { 
                user: userData,
                isAdmin,
                rawValue: userData?.is_super_admin
              }
            })
          };
        } catch (error: any) {
          console.error('Error checking admin status:', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to check admin status',
                details: error.message
              }
            })
          };
        }

      case 'getSession':
        try {
          // Get session from auth client
          let { data: { session }, error: sessionError } = await authClient.auth.getSession();
          if (sessionError) {
            console.error('Error getting session:', {
              error: sessionError,
              timestamp: new Date().toISOString()
            });
            
            // Return a more graceful error that won't cause immediate logout
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ 
                error: { 
                  message: 'Session retrieval failed temporarily',
                  details: sessionError.message
                },
                data: { sessionStatus: 'error' } 
              })
            };
          }

          // If no session, return null but don't force immediate logout
          if (!session) {
            console.log('No session found:', {
              timestamp: new Date().toISOString()
            });
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                data: { 
                  sessionStatus: 'missing',
                  sessionInfo: null
                } 
              })
            };
          }

          // If session is expired, try to refresh it instead of immediately invalidating
          if (session.expires_at && new Date(session.expires_at) < new Date()) {
            try {
              const { data: refreshData, error: refreshError } = await authClient.auth.refreshSession();
              
              if (!refreshError && refreshData.session) {
                session = refreshData.session;
                console.log('Session successfully refreshed:', {
                  userId: session.user.id,
                  expires_at: session.expires_at,
                  timestamp: new Date().toISOString()
                });
              } else {
                console.warn('Session refresh failed, but continuing with existing session:', {
                  error: refreshError?.message,
                  userId: session.user.id,
                  timestamp: new Date().toISOString()
                });
              }
            } catch (refreshErr) {
              console.warn('Error during session refresh:', {
                error: refreshErr,
                timestamp: new Date().toISOString()
              });
              // Continue with original session anyway
            }
          }

          // Log session details for debugging
          console.log('Session details:', {
            userId: session.user.id,
            expires_at: session.expires_at,
            expiresIn: session.expires_at ? new Date(session.expires_at).getTime() - new Date().getTime() : 'unknown',
            timestamp: new Date().toISOString()
          });

          // Validate session token
          const { data: tokenData, error: tokenError } = await authClient.auth.getUser(session.access_token);
          if (tokenError || !tokenData.user) {
            console.error('Invalid session token:', {
              error: tokenError,
              timestamp: new Date().toISOString()
            });
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ data: { user: null } })
            };
          }

          // Get user data including super admin status using main client
          console.log('Attempting to fetch user data:', {
            userId: session.user.id,
            timestamp: new Date().toISOString()
          });

          // Raw SQL query for debugging
          const { data: debugData, error: debugError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          console.log('Raw debug data from database:', {
            allData: debugData, 
            keys: debugData ? Object.keys(debugData) : [],
            timestamp: new Date().toISOString(),
            error: debugError
          });

          // Now try the normal query
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
              user_id,
              email,
              first_name,
              last_name,
              user_role,
              account_status,
              is_super_admin,
              super_admin,
              admin,
              accepted_terms,
              marketing_opt_in
            `)
            .eq('user_id', session.user.id)
            .single();

          if (userError) {
            console.error('Error getting user data:', {
              error: userError,
              timestamp: new Date().toISOString(),
              userId: session.user.id,
              query: 'SELECT * FROM users WHERE user_id = :userId'
            });
            throw userError;
          }

          // Log the raw user data from database
          console.log('Raw user data from database:', {
            fullUserData: userData,
            userId: session.user.id,
            userIdFromData: userData?.user_id,
            is_super_admin_raw: userData?.is_super_admin,
            super_admin_raw: userData?.super_admin,
            admin_raw: userData?.admin,
            is_super_admin_type: typeof userData?.is_super_admin,
            timestamp: new Date().toISOString()
          });

          if (!userData) {
            console.error('No user data found:', {
              timestamp: new Date().toISOString(),
              userId: session.user.id
            });
            throw new Error('User data not found');
          }

          // Determine if the user is a super admin
          // Make sure we're doing a direct comparison with true to ensure boolean check
          const isSuperAdmin = userData?.is_super_admin === true;

          console.log('Super admin status in getSession:', {
            is_super_admin: userData?.is_super_admin,
            is_super_admin_type: typeof userData?.is_super_admin,
            isSuperAdmin,
            timestamp: new Date().toISOString()
          });

          // Check account status
          if (userData.account_status !== 'active') {
            console.log('Inactive account accessed:', {
              userId: session.user.id,
              status: userData.account_status,
              timestamp: new Date().toISOString()
            });
            
            // Sign out the user
            await authClient.auth.signOut();
            
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ data: { user: null } })
            };
          }

          // Merge user data and ensure is_super_admin is properly set as a boolean
          const enrichedUser = {
            ...session.user,
            user_metadata: {
              first_name: userData.first_name,
              last_name: userData.last_name,
              acceptedTerms: userData.accepted_terms,
              email_verified: session.user.email_confirmed_at ? true : false
            },
            // Explicitly set this as a boolean using strict comparison
            is_super_admin: isSuperAdmin,
            user_role: userData.user_role,
            account_status: userData.account_status,
            email: userData.email || session.user.email
          };

          // Log the enriched user object
          console.log('Enriched user object:', {
            userId: enrichedUser.id,
            is_super_admin: enrichedUser.is_super_admin,
            is_super_admin_type: typeof enrichedUser.is_super_admin,
            userMetadata: enrichedUser.user_metadata,
            userRole: userData.user_role,
            accountStatus: userData.account_status,
            timestamp: new Date().toISOString()
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              data: { 
                user: enrichedUser,
                sessionInfo: {
                  exists: true,
                  expiresAt: session.expires_at,
                  expiresIn: session.expires_at ? new Date(session.expires_at).getTime() - new Date().getTime() : null,
                  currentTime: new Date().toISOString(),
                  token: session.access_token ? '[REDACTED]' : null,
                  refreshToken: session.refresh_token ? '[REDACTED]' : null
                },
                debug: {
                  originalUserData: userData,
                  sessionUser: session.user,
                  isSuperAdminRaw: userData.is_super_admin,
                  isSuperAdminProcessed: enrichedUser.is_super_admin,
                  userMetadata: enrichedUser.user_metadata,
                  userRole: userData.user_role,
                  accountStatus: userData.account_status
                }
              }
            })
          };
        } catch (error: any) {
          console.error('Error in getSession:', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to get session',
                details: error.message
              }
            })
          };
        }

      case 'updateOrder':
        try {
          if (!payload.orderId || !payload.userId) {
            throw new Error('Missing required fields: orderId and userId');
          }

          // Validate UUID format
          if (!uuidRegex.test(payload.orderId)) {
            throw new Error('Invalid order ID format');
          }
          
          if (!uuidRegex.test(payload.userId)) {
            throw new Error('Invalid user ID format');
          }

          console.log('Attempting to update order:', {
            timestamp: new Date().toISOString(),
            orderId: payload.orderId,
            userId: payload.userId
          });

          // First check if order exists
          const { data: existingOrder, error: checkError } = await supabase
            .from('orders')
            .select('order_id, user_id')
            .eq('order_id', payload.orderId)
            .single();

          if (checkError) {
            console.error('Error checking order existence:', {
              timestamp: new Date().toISOString(),
              error: checkError,
              orderId: payload.orderId
            });
            throw checkError;
          }

          if (!existingOrder) {
            console.error('Order not found:', {
              timestamp: new Date().toISOString(),
              orderId: payload.orderId
            });
            throw new Error('Order not found');
          }

          // Update the order with the user ID
          const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({ user_id: payload.userId })
            .eq('order_id', payload.orderId)
            .select();

          if (updateError) {
            console.error('Failed to update order:', {
              timestamp: new Date().toISOString(),
              error: updateError,
              orderId: payload.orderId,
              userId: payload.userId
            });
            throw updateError;
          }

          // Check if rows were found or updated
          if (!updatedOrder || updatedOrder.length === 0) {
            console.error('No rows were updated:', {
              timestamp: new Date().toISOString(),
              orderId: payload.orderId,
              userId: payload.userId
            });
            throw new Error('Order not found or could not be updated');
          }

          console.log('Order successfully updated:', {
            timestamp: new Date().toISOString(),
            orderId: payload.orderId,
            userId: payload.userId,
            order: updatedOrder
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              success: true,
              message: 'Order successfully linked to user account',
              data: updatedOrder
            })
          };
        } catch (error: any) {
          console.error('Error updating order:', {
            timestamp: new Date().toISOString(),
            error: error.message,
            orderId: payload.orderId,
            userId: payload.userId
          });
          
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to update order',
                details: error.message
              }
            })
          };
        }

      case 'getOrders':
        try {
          if (!payload.userId) {
            throw new Error('Missing userId parameter');
          }

          console.log('Fetching orders for user:', {
            timestamp: new Date().toISOString(),
            userId: payload.userId
          });

          // Fetch orders for the specified user
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
              order_id,
              order_status,
              payment_status,
              total_amount,
              shipping_address,
              order_date,
              payment_method,
              tracking_number,
              order_items
            `)
            .eq('user_id', payload.userId)
            .order('order_date', { ascending: false });

          if (ordersError) {
            console.error('Error fetching orders:', {
              timestamp: new Date().toISOString(),
              error: ordersError,
              userId: payload.userId
            });
            throw ordersError;
          }

          console.log('Orders fetched successfully:', {
            timestamp: new Date().toISOString(),
            userId: payload.userId,
            orderCount: orders?.length || 0
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: orders })
          };
        } catch (error: any) {
          console.error('Error in getOrders:', {
            timestamp: new Date().toISOString(),
            error: error.message
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to fetch orders',
                details: error.message
              }
            })
          };
        }

      case 'getProducts':
        try {
          if (!payload.categorySlug) {
            throw new Error('Missing category slug');
          }

          console.log('Fetching products for category:', {
            timestamp: new Date().toISOString(),
            categorySlug: payload.categorySlug
          });

          // First get the category ID for the given slug
          const { data: categories } = await supabase
            .from('categories')
            .select('category_id')
            .eq('slug', payload.categorySlug)
            .single();

          if (!categories) {
            console.error('Category not found:', {
              timestamp: new Date().toISOString(),
              categorySlug: payload.categorySlug
            });
            throw new Error('Category not found');
          }

          // Then get the products for that category
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
              *,
              images:product_images(
                image_id,
                image_url,
                is_main_image,
                image_order
              )
            `)
            .eq('category_id', categories.category_id)
            .eq('product_status', 'available')
            .order('name');

          if (productsError) {
            console.error('Products error:', productsError);
            throw productsError;
          }

          console.log('Products fetched successfully:', {
            timestamp: new Date().toISOString(),
            categorySlug: payload.categorySlug,
            productCount: products?.length || 0
          });

          // Sort images for each product
          const sortedProducts = products.map(product => ({
            ...product,
            images: product.images?.sort((a, b) => a.image_order - b.image_order)
          }));

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: sortedProducts })
          };
        } catch (error: any) {
          console.error('Error in getProducts:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to fetch products',
                details: error.message
              }
            })
          };
        }

      case 'getProduct':
        if (!payload.productSlug) {
          throw new Error('Missing product slug');
        }

        const { data: product, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            images:product_images(
              image_id,
              image_url,
              is_main_image,
              image_order
            )
          `)
          .eq('slug', payload.productSlug)
          .single();

        if (productError) throw productError;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: product })
        };

      case 'getCategories':
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('category_status', 'active')
          .order('name');

        if (categoriesError) throw categoriesError;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: categories })
        };

      case 'getCart':
        if (!payload.userId) {
          throw new Error('Missing user ID');
        }

        console.log('Fetching cart for user:', payload.userId);

        const { data: cart, error: cartError } = await supabase
          .from('shopping_cart')
          .select('items, total_value')
          .eq('user_id', payload.userId)
          .single();

        if (cartError) {
          // Handle "no rows returned" differently than other errors
          if (cartError.code === 'PGRST116') {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                data: {
                  items: [],
                  total_value: 0
                }
              })
            };
          }
          throw cartError;
        }

        console.log('Cart data retrieved:', cart);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            data: {
              items: cart?.items || [],
              total_value: cart?.total_value || 0
            }
          })
        };

      case 'updateCart':
        if (!payload.userId || !Array.isArray(payload.items)) {
          throw new Error('Missing required cart fields');
        }

        console.log('Updating cart:', {
          userId: payload.userId,
          itemCount: payload.items.length,
          items: JSON.stringify(payload.items)
        });

        // Use upsert operation
        const { error: updateError } = await supabase
          .from('shopping_cart')
          .upsert(
          {
            user_id: payload.userId,
            items: payload.items,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (updateError) {
          console.error('Failed to update cart:', updateError);
          throw updateError;
        }

        console.log('Cart updated successfully');
        return { 
          statusCode: 200, 
          headers, 
          body: JSON.stringify({ success: true }) 
        };

      case 'getProductOptions':
        if (!payload.productId) {
          throw new Error('Missing product ID');
        }

        const { data: productOptions, error: productOptionsError } = await supabase
          .from('product_options')
          .select(`
            *,
            option:options (
              *,
              values:option_values (*)
            )
          `)
          .eq('product_id', payload.productId);

        if (productOptionsError) throw productOptionsError;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: productOptions })
        };

      case 'getCategoryOptions':
        if (!payload.categoryId) {
          throw new Error('Missing category ID');
        }

        const { data: categoryOptions, error: categoryOptionsError } = await supabase
          .from('options')
          .select(`
            *,
            values:option_values (*)
          `)
          .eq('category_id', payload.categoryId)
          .eq('is_global', true);

        if (categoryOptionsError) throw categoryOptionsError;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: categoryOptions })
        };

      case 'getOptionValues':
        if (!payload.optionId) {
          throw new Error('Missing option ID');
        }

        const { data: optionValues, error: optionValuesError } = await supabase
          .from('option_values')
          .select('*')
          .eq('option_id', payload.optionId)
          .order('sort_order');

        if (optionValuesError) throw optionValuesError;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: optionValues })
        };

      case 'getOrder':
        if (!payload.orderId) {
          throw new Error('Missing orderId');
        }

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            payment_status,
            payment_processor_response,
            response_message
          `)
          .eq('order_id', payload.orderId)
          .single();

        if (orderError) throw orderError;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: order })
        };

      case 'searchFFLDealers':
        try {
          if (!payload.zipCode) {
            throw new Error('Missing zipCode parameter');
          }

          // Validate ZIP code format
          if (!/^\d{5}$/.test(payload.zipCode)) {
            throw new Error('Invalid ZIP code format');
          }

          console.log('Searching FFL dealers:', {
            timestamp: new Date().toISOString(),
            zipCode: payload.zipCode
          });

          // Query FFL dealers from database
          const { data: dealers, error: dealersError } = await supabase
            .from('ffl_dealers')
            .select('*')
            .eq('premise_zip_code', payload.zipCode)
            .limit(100);

          if (dealersError) {
            console.error('Error fetching FFL dealers:', {
              timestamp: new Date().toISOString(),
              error: dealersError,
              zipCode: payload.zipCode
            });
            throw dealersError;
          }

          // Clean and validate dealer data
          const cleanedDealers = dealers?.map(dealer => {
            // Log raw dealer data for debugging
            console.log('Raw dealer data:', {
              timestamp: new Date().toISOString(),
              dealer
            });

            // Clean and normalize data
            const cleaned = {
              ...dealer,
              business_name: dealer.business_name?.trim() || '',
              license_name: dealer.license_name?.trim() || '',
              premise_street: dealer.premise_street?.trim() || '',
              premise_city: dealer.premise_city?.trim() || '',
              premise_state: dealer.premise_state?.trim() || '',
              premise_zip_code: dealer.premise_zip_code?.trim() || '',
              voice_phone: dealer.voice_phone?.trim() || '',
              lic_seqn: dealer.lic_seqn?.trim() || ''
            };

            // Log cleaned dealer data
            console.log('Cleaned dealer data:', {
              timestamp: new Date().toISOString(),
              cleaned
            });

            return cleaned;
          });

          console.log('FFL dealers found:', {
            timestamp: new Date().toISOString(),
            count: cleanedDealers?.length || 0
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: cleanedDealers })
          };
        } catch (error: any) {
          console.error('Error in searchFFLDealers:', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to search FFL dealers',
                details: error.message
              }
            })
          };
        }

      case 'getCategory':
        try {
          if (!payload.productId) {
            throw new Error('Missing productId parameter');
          }

          console.log('Fetching product category:', {
            timestamp: new Date().toISOString(),
            productId: payload.productId
          });

          // Step 1: Get product and its category_id
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('category_id')
            .eq('product_id', payload.productId)
            .single();

          if (productError) {
            console.error('Error fetching product:', {
              timestamp: new Date().toISOString(),
              error: productError,
              productId: payload.productId
            });
            throw productError;
          }

          if (!product) {
            throw new Error('Product not found');
          }

          // Step 2: Get category details using the category_id from the product
          const { data: category, error: categoryError } = await supabase
            .from('categories')
            .select('category_id, name, description, category_status, ffl_required')
            .eq('category_id', product.category_id)
            .single();

          if (categoryError) {
            console.error('Error fetching category:', {
              timestamp: new Date().toISOString(),
              error: categoryError,
              categoryId: product.category_id
            });
            throw categoryError;
          }

          if (!category) {
            throw new Error('Category not found');
          }

          console.log('Category fetched:', {
            timestamp: new Date().toISOString(),
            categoryId: product.category_id,
            category: category
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: category })
          };
        } catch (error: any) {
          console.error('Error in getCategory:', {
            timestamp: new Date().toISOString(),
            error: error.message
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to fetch category',
                details: error.message
              }
            })
          };
        }

      case 'adminUsers':
        try {
          console.log('Fetching admin users...');
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select(`
              user_id,
              email,
              phone_number,
              first_name,
              last_name,
              user_role,
              account_status,
              is_super_admin,
              last_login,
              account_created_date,
              marketing_opt_in
            `)
            .order('account_created_date', { ascending: false });

          console.log('Admin users response:', { 
            users, 
            usersError,
            timestamp: new Date().toISOString(),
            table: 'users',
            query: 'adminUsers'
          });

          if (usersError) {
            console.error('Error fetching users:', {
              error: usersError,
              timestamp: new Date().toISOString()
            });
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ 
                error: { 
                  message: 'Failed to fetch users',
                  details: usersError.message
                }
              })
            };
          }

          if (!users) {
            console.error('No users found:', {
              timestamp: new Date().toISOString()
            });
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ 
                error: { 
                  message: 'No users found',
                  details: 'The users table appears to be empty'
                }
              })
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: users })
          };
        } catch (error: any) {
          console.error('Error in adminUsers:', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to fetch users',
                details: error.message
              }
            })
          };
        }

      case 'adminOrders':
        try {
          console.log('Fetching admin orders...');
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
              order_id,
              user_id,
              phone_number,
              order_status,
              payment_status,
              total_amount,
              shipping_address,
              billing_address,
              order_date,
              payment_method,
              tracking_number,
              order_items,
              requires_ffl,
              ffl_dealer_info,
              created_at,
              user:users (
                user_id,
                email,
                first_name,
                last_name,
                phone_number
              )
            `)
            .order('order_date', { ascending: false });

          console.log('Admin orders response:', { 
            orders, 
            ordersError,
            timestamp: new Date().toISOString(),
            table: 'orders',
            query: 'adminOrders'
          });

          if (ordersError) {
            console.error('Error fetching orders:', {
              error: ordersError,
              timestamp: new Date().toISOString()
            });
            throw ordersError;
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: orders })
          };
        } catch (error: any) {
          console.error('Error in adminOrders:', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to fetch orders',
                details: error.message
              }
            })
          };
        }

      case 'adminProducts':
        try {
          console.log('Fetching admin products...');
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
              *,
              category:categories (
                category_id,
                name,
                slug
              ),
              images:product_images (
                image_id,
                image_url,
                is_main_image,
                image_order
              )
            `)
            .order('name');

          console.log('Admin products response:', { products, productsError });

          if (productsError) throw productsError;
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: products })
          };
        } catch (error: any) {
          console.error('Error in adminProducts:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to fetch products',
                details: error.message
              }
            })
          };
        }

      case 'adminCategories':
        try {
          console.log('Fetching admin categories...');
          const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select(`
              *,
              products:products (
                product_id,
                name,
                slug,
                product_status
              )
            `)
            .order('name');

          console.log('Admin categories response:', { categories, categoriesError });

          if (categoriesError) throw categoriesError;
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: categories })
          };
        } catch (error: any) {
          console.error('Error in adminCategories:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to fetch categories',
                details: error.message
              }
            })
          };
        }

      case 'adminBlogPosts':
        try {
          console.log('Fetching admin blog posts...');
          const { data: posts, error: postsError } = await supabase
            .from('blogs')
            .select('*')
            .order('updated_at', { ascending: false });

          console.log('Admin blog posts response:', { 
            posts, 
            postsError,
            timestamp: new Date().toISOString(),
            table: 'blogs',
            query: 'adminBlogPosts'
          });

          if (postsError) {
            console.error('Error fetching blog posts:', {
              error: postsError,
              timestamp: new Date().toISOString()
            });
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ 
                error: { 
                  message: 'Failed to fetch blog posts',
                  details: postsError.message
                }
              })
            };
          }

          if (!posts) {
            console.error('No posts data received:', {
              timestamp: new Date().toISOString()
            });
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ 
                error: { 
                  message: 'No blog posts found',
                  details: 'The blog posts query returned no data'
                }
              })
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: posts })
          };
        } catch (error: any) {
          console.error('Error in adminBlogPosts:', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to fetch blog posts',
                details: error.message
              }
            })
          };
        }

      case 'adminDashboardStats':
        try {
          console.log('Fetching dashboard statistics...');
          
          // Get all counts in a single query using PostgreSQL's COUNT
          const { data: stats, error: statsError } = await supabase
            .rpc('get_dashboard_stats')
            .single();

          console.log('RPC response:', { stats, statsError });

          if (statsError) {
            console.error('Error fetching dashboard stats:', {
              error: statsError,
              timestamp: new Date().toISOString()
            });
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ 
                error: { 
                  message: 'Failed to fetch dashboard statistics',
                  details: statsError.message
                }
              })
            };
          }

          if (!stats) {
            console.error('No stats data received:', {
              timestamp: new Date().toISOString()
            });
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ 
                error: { 
                  message: 'No statistics found',
                  details: 'The dashboard statistics function returned no data'
                }
              })
            };
          }

          console.log('Dashboard statistics response:', { 
            stats,
            timestamp: new Date().toISOString()
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: stats })
          };
        } catch (error: any) {
          console.error('Error in adminDashboardStats:', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to fetch dashboard statistics',
                details: error.message
              }
            })
          };
        }

      case 'adminBlogSettings':
        try {
          console.log('Processing blog settings action:', {
            timestamp: new Date().toISOString(),
            payload: payload
          });

          if (!payload.action) {
            throw new Error('Missing action in blog settings payload');
          }

          switch (payload.action) {
            case 'get':
              const { data: settings, error: getError } = await supabase
                .from('blog_settings')
                .select('*')
                .single();

              if (getError) {
                // If no settings exist, return default settings
                if (getError.code === 'PGRST116') {
                  return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                      data: {
                        enable_comments: true,
                        default_meta_title: 'My Blog',
                        default_meta_description: 'Welcome to my blog',
                        default_meta_keywords: 'blog, articles, news',
                        show_author: true,
                        show_date: true,
                        show_reading_time: true,
                        enable_social_sharing: true,
                        featured_posts_count: 3
                      }
                    })
                  };
                }

                console.error('Error fetching blog settings:', {
                  error: getError,
                  timestamp: new Date().toISOString()
                });
                return {
                  statusCode: 500,
                  headers,
                  body: JSON.stringify({ 
                    error: { 
                      message: 'Failed to fetch blog settings',
                      details: getError.message
                    }
                  })
                };
              }

              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ data: settings || {} })
              };

            case 'update':
              if (!payload.settings) {
                throw new Error('Missing settings in update payload');
              }

              // Ensure we have an ID for the settings
              const settingsToUpdate = {
                ...payload.settings,
                id: payload.settings.id || '00000000-0000-0000-0000-000000000000',
                updated_at: new Date().toISOString()
              };

              const { data: updatedSettings, error: updateError } = await supabase
                .from('blog_settings')
                .upsert(settingsToUpdate)
                .select()
                .single();

              if (updateError) {
                console.error('Error updating blog settings:', {
                  error: updateError,
                  timestamp: new Date().toISOString()
                });
                return {
                  statusCode: 500,
                  headers,
                  body: JSON.stringify({ 
                    error: { 
                      message: 'Failed to update blog settings',
                      details: updateError.message
                    }
                  })
                };
              }

              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ data: updatedSettings })
              };

            default:
              throw new Error(`Invalid blog settings action: ${payload.action}`);
          }
        } catch (error: any) {
          console.error('Error in adminBlogSettings:', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: { 
                message: 'Failed to process blog settings',
                details: error.message
              }
            })
          };
        }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error: any) {
    console.error('Error in Supabase client:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: { 
          message: error.message || 'Internal server error',
          details: error.details || error.message
        }
      })
    };
  }
};