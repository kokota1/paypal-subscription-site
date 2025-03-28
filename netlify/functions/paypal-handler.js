const axios = require('axios');

exports.handler = async (event, context) => {
  const CLIENT_ID = process.env.PAYPAL_CLIENT_ID; // PayPalのクライアントID
  const SECRET = process.env.PAYPAL_SECRET;      // PayPalのシークレットキー
  const PLAN_ID = process.env.PLAN_ID;          // 環境変数からプランIDを取得
  const RETURN_URL = process.env.RETURN_URL;    // 環境変数からReturn URLを取得
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

    // 2. 環境変数で指定されたプランIDを元にプラン情報を取得
    const planResponse = await axios.get(`${PAYPAL_API}/v1/billing/plans/${PLAN_ID}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const planDetails = planResponse.data;

    // プラン価格を取得（例: 日本円）
    const planPrice = planDetails.billing_cycles[0].pricing_scheme.fixed_price.value;

    // 3. 決済URLを生成
    const orderResponse = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'JPY', // 日本円に変更
              value: planPrice, // プラン価格を使用
            },
          },
        ],
        application_context: {
          return_url: RETURN_URL, // 成功時のリダイレクトURL
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const approvalUrl = orderResponse.data.links.find(link => link.rel === 'approve').href;

    // 4. ユーザーを決済ページにリダイレクト
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
