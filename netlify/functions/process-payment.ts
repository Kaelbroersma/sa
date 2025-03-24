import { Handler } from '@netlify/functions';
import https from 'https';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const EPN_ACCOUNT = process.env.EPN_ACCOUNT_NUMBER;
const EPN_RESTRICT_KEY = process.env.EPN_X_TRAN;
const EPN_API_URL = 'https://www.eprocessingnetwork.com/cgi-bin/epn/secure/tdbe/transact.pl';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    if (!event.body) {
      throw new Error('Missing request body');
    }
    
    const paymentData = JSON.parse(event.body);
    const { 
      orderId, 
      cardNumber, 
      expiryMonth, 
      expiryYear, 
      cvv, 
      amount, 
      shippingAddress,
      billingAddress,
      items,
      email,
      phone,
      fflDealerInfo // New field for FFL dealer info
    } = paymentData;

    // Get user ID from auth context if available
    const userId = event.headers.authorization?.split('Bearer ')[1] || null;

    // Check if order requires FFL
    const requiresFFL = items.some((item: any) => 
      item.id.startsWith('CM') || // Carnimore Models
      item.id.startsWith('BA')    // Barreled Actions
    );

    // Validate FFL dealer info if required
    if (requiresFFL && !fflDealerInfo) {
      throw new Error('FFL dealer information required for firearm purchases');
    }

    // Format addresses for database
    const formattedShippingAddress = requiresFFL ? 
      // Use FFL address for firearm-only orders
      [
        fflDealerInfo.PREMISE_STREET,
        fflDealerInfo.PREMISE_CITY,
        fflDealerInfo.PREMISE_STATE,
        fflDealerInfo.PREMISE_ZIP_CODE
      ].filter(Boolean).join(', ') :
      // Use provided shipping address for non-firearm orders
      [
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.zipCode
      ].filter(Boolean).join(', ');

    const formattedBillingAddress = billingAddress ? [
      billingAddress.address,
      billingAddress.city,
      billingAddress.state,
      billingAddress.zipCode
    ].filter(Boolean).join(', ') : formattedShippingAddress;

    // Validate environment variables
    if (!EPN_ACCOUNT || !EPN_RESTRICT_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Validate required fields
    if (!cardNumber?.trim() || !expiryMonth?.trim() || !expiryYear?.trim() || 
        !cvv?.trim() || !amount || !orderId || 
        !shippingAddress?.address?.trim() || !shippingAddress?.zipCode?.trim() ||
        !email?.trim() || !phone?.trim()) {
      throw new Error('Missing required fields');
    }

    // Format order items for JSONB storage
    const formattedOrderItems = await Promise.all(items.map(async (item) => {
      // Get product details from database
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('product_id', item.id)
        .single();

      return {
        product_id: item.id,
        name: product?.name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        options: item.options || {}
      };
    }));

    // Create initial order record in Supabase
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        order_id: orderId,
        user_id: userId,
        payment_status: 'pending',
        total_amount: amount,
        shipping_address: formattedShippingAddress,
        billing_address: formattedBillingAddress,
        order_date: new Date().toISOString(),
        payment_method: 'credit_card',
        shipping_method: 'standard',
        order_status: 'pending',
        created_at: new Date().toISOString(),
        order_items: formattedOrderItems,
        phone_number: phone,
        email: email,
        requires_ffl: requiresFFL,
        ffl_dealer_info: requiresFFL ? fflDealerInfo : null
      })
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', {
        timestamp: new Date().toISOString(),
        error: orderError,
        orderId,
        userId
      });
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Build payment processor request payload
    const params = new URLSearchParams({
      ePNAccount: EPN_ACCOUNT,
      RestrictKey: EPN_RESTRICT_KEY,
      RequestType: 'transaction',
      TranType: 'Sale',
      IndustryType: 'E',
      Total: amount,
      Address: (billingAddress?.address || shippingAddress.address || '').trim(),
      City: (billingAddress?.city || shippingAddress.city || '').trim(),
      State: (billingAddress?.state || shippingAddress.state || '').trim(),
      Zip: (billingAddress?.zipCode || shippingAddress.zipCode || '').trim(),
      CardNo: cardNumber.replace(/\s+/g, ''),
      ExpMonth: expiryMonth.padStart(2, '0'),
      ExpYear: expiryYear.slice(-2),
      CVV2Type: '1',
      CVV2: cvv,
      'Postback.OrderID': orderId,
      'Postback.Description': `Order ${orderId}`,
      'Postback.Total': amount,
      'Postback.RestrictKey': EPN_RESTRICT_KEY,
      PostbackID: orderId,
      COMBINE_PB_RESPONSE: '1',
      NOMAIL_CARDHOLDER: '1',
      NOMAIL_MERCHANT: '1'
    });

    // Create HTTPS request with proper TLS settings
    const makeRequest = async () => {
      const response = await fetch(EPN_API_URL, {
        method: 'POST',
        agent: new https.Agent({
          minVersion: 'TLSv1.2'
        }),
        body: params.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*', 
          'User-Agent': 'Carnimore/1.0'
        }
      });

      return response;
    };

    // Send the request
    const response = await makeRequest();
    
    // Handle processor response
    if (response.ok) {
      const responseText = await response.text();

      // Parse response based on content type
      let processorResponse;
      try {
        // Check if response is HTML error message
        if (responseText.includes('<html>')) {
          // Extract error message from HTML
          const errorMatch = responseText.match(/"([^"]+)"/);
          const errorMessage = errorMatch ? errorMatch[1] : 'Unknown error';

          // Update order with error status
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              payment_processor_response: {
                error: errorMessage,
                raw_response: responseText
              }
            })
            .eq('order_id', orderId);

          if (updateError) {
            console.error('Failed to update order with error status:', {
              timestamp: new Date().toISOString(),
              orderId,
              error: updateError
            });
          }

          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: errorMessage,
              orderId
            })
          };
        }

        // Try parsing as JSON first
        try {
          processorResponse = JSON.parse(responseText);
        } catch {
          // If not JSON, try parsing as key-value pairs
          const separator = responseText.includes(';') ? ';' : ',';
          
          processorResponse = Object.fromEntries(
            responseText.split(separator).map(pair => {
              const [key, value] = pair.split('=').map(s => decodeURIComponent(s.trim()));
              return [key, value];
            })
          );
        }

        // Validate response
        if (processorResponse['Postback.OrderID'] !== orderId) {
          throw new Error('Order ID mismatch in processor response');
        }

        // Update order with processor response
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_processor_response: processorResponse,
            payment_status: processorResponse.Success === 'Y' ? 'paid' : 'failed'
          })
          .eq('order_id', orderId);

        if (updateError) {
          console.error('Failed to update order with processor response:', {
            timestamp: new Date().toISOString(),
            orderId,
            error: updateError,
            response: processorResponse
          });
        }
      } catch (error) {
        throw new Error('Invalid processor response format');
      }
    }

    // Return success response immediately
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orderId,
        message: 'Payment processing initiated'
      })
    };

  } catch (error: any) {
    console.error('Payment processing error:', {
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: error.message || 'Failed to process payment'
      })
    };
  }
};