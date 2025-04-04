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
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Create a separate client for auth operations that doesn't persist sessions
const authClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
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

      case 'getSession':
        try {
          // Get session from auth client
          const { data: { session }, error: sessionError } = await authClient.auth.getSession();
          if (sessionError) {
            console.error('Error getting session:', {
              error: sessionError,
              timestamp: new Date().toISOString()
            });
            throw sessionError;
          }

          if (session?.user) {
            console.log('Session found:', {
              userId: session.user.id,
              timestamp: new Date().toISOString()
            });

            // Get user data including super admin status using main client
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('is_super_admin, first_name, last_name, user_role, account_status')
              .eq('user_id', session.user.id)
              .single();

            if (userError) {
              console.error('Error fetching user data:', {
                error: userError,
                userId: session.user.id,
                timestamp: new Date().toISOString()
              });
              throw userError;
            }

            if (!userData) {
              console.error('User data not found:', {
                userId: session.user.id,
                timestamp: new Date().toISOString()
              });
              throw new Error('User data not found');
            }

            // Check if account is active
            if (userData.account_status !== 'active') {
              console.log('Account not active:', {
                userId: session.user.id,
                status: userData.account_status,
                timestamp: new Date().toISOString()
              });
              
              // Sign out the user if account is not active
              await authClient.auth.signOut();
              
              return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ 
                  error: { 
                    message: 'Account is not active',
                    details: `Account status: ${userData.account_status}`
                  }
                })
              };
            }

            // Merge user data with session
            const enrichedUser = {
              ...session.user,
              is_super_admin: userData.is_super_admin || false,
              user_role: userData.user_role || 'customer',
              user_metadata: {
                ...session.user.user_metadata,
                first_name: userData.first_name || session.user.user_metadata?.first_name,
                last_name: userData.last_name || session.user.user_metadata?.last_name
              }
            };

            console.log('Enriched user data:', {
              userId: enrichedUser.id,
              isSuperAdmin: enrichedUser.is_super_admin,
              userRole: enrichedUser.user_role,
              timestamp: new Date().toISOString()
            });

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                data: {
                  ...session,
                  user: enrichedUser
                }
              })
            };
          }

          console.log('No session found:', {
            timestamp: new Date().toISOString()
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: null })
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