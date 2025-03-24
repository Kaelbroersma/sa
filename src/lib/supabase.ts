// Function to make requests to Netlify Functions
async function callNetlifyFunction(action: string, payload?: any) {
  try {
    console.log('Calling Netlify function:', {
      timestamp: new Date().toISOString(),
      action,
      payload
    });

    const response = await fetch('/.netlify/functions/supabase-client', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, payload })
    });

    // Log response status
    console.log('Netlify function response:', {
      timestamp: new Date().toISOString(),
      action,
      status: response.status,
      ok: response.ok
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP error response:', {
        timestamp: new Date().toISOString(),
        status: response.status,
        text: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get response text first
    const text = await response.text();
    
    // Log raw response for debugging
    console.log('Raw response:', {
      timestamp: new Date().toISOString(),
      action,
      text
    });
    
    // Only try to parse if we have content
    if (text) {
      try {
        const data = JSON.parse(text);
        
        // Special handling for category not found
        if (action === 'getProducts' && data.error?.code === 'PGRST116') {
          return {
            data: [],
            error: {
              message: `No products found for category: ${payload?.categorySlug}`,
              details: 'Category exists but has no products'
            }
          };
        }
        
        return data;
      } catch (e) {
        console.error('Failed to parse JSON response:', {
          timestamp: new Date().toISOString(),
          error: e,
          text
        });
        throw new Error('Invalid JSON response');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error calling Netlify function:', {
      timestamp: new Date().toISOString(),
      action,
      error
    });
    throw error;
  }
}

export { callNetlifyFunction };