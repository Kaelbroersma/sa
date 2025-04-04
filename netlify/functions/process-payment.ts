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
      billingAddress,
      email,
      phone,
      items,
      shippingAddress,
      fflDealerInfo,
      userId
    } = paymentData;

    // Only validate billing info
    if (!cardNumber?.trim() || !expiryMonth?.trim() || !expiryYear?.trim() || !cvv?.trim()) {
      throw new Error('Invalid payment information');
    }

    if (!billingAddress?.address?.trim() || !billingAddress?.city?.trim() || 
        !billingAddress?.state?.trim() || !billingAddress?.zipCode?.trim()) {
      throw new Error('Invalid billing address');
    }

    // Format billing address for database
    const formattedBillingAddress = [
      billingAddress.address,
      billingAddress.city,
      billingAddress.state,
      billingAddress.zipCode
    ].filter(Boolean).join(', ');

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

    // Create order record
    const { error: orderError } = await supabase.from('orders').insert({
      order_id: orderId,
      user_id: userId || null,
      payment_status: 'pending',
      total_amount: amount,
      shipping_address: shippingAddress ? [
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.zipCode
      ].filter(Boolean).join(', ') : null,
      billing_address: formattedBillingAddress,
      order_date: new Date().toISOString(),
      payment_method: 'credit_card',
      shipping_method: 'standard',
      order_status: 'pending',
      created_at: new Date().toISOString(),
      order_items: formattedOrderItems,
      phone_number: phone,
      email: email,
      requires_ffl: !!fflDealerInfo,
      ffl_dealer_info: fflDealerInfo || null
    });

    if (orderError) {
      console.error('Failed to create order:', {
        timestamp: new Date().toISOString(),
        error: orderError,
        orderId,
        userId: event.headers.authorization?.split('Bearer ')[1] || null
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
    
    // Only check if the request was sent successfully
    if (!response.ok) {
      throw new Error('Failed to send payment request to processor');
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