const axios = require('axios');

exports.handler = async (event, context) => {
  const CLIENT_ID = process.env.PAYPAL_CLIENT_ID; // 環境変数から取得
  const SECRET = process.env.PAYPAL_SECRET; // 環境変数から取得
  const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // サンドボックス環境のURL

  try {
    // 1. PayPal APIでアクセストークンを取得
    const authResponse = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64')}`,
      },
      params: { grant_type: 'client_credentials' },
    });
    const accessToken = authResponse.data.access_token;

    // 2. 決済URLを生成
    const orderResponse = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: '10.00',
            },
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const approvalUrl = orderResponse.data.links.find(link => link.rel === 'approve').href;

    // 3. リダイレクト
    return {
      statusCode: 302,
      headers: {
        Location: approvalUrl,
      },
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create PayPal order' }),
    };
  }
};

  