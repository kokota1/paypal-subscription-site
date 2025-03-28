const axios = require('axios');
require('dotenv').config();

exports.handler = async (event, context) => {
    const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const SECRET = process.env.PAYPAL_SECRET;
    const PLAN_ID = process.env.PAYPAL_PLAN_ID;
    const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT; // 'sandbox' または 'live'
    const RETURN_URL = process.env.RETURN_URL;

    const PAYPAL_API_BASE_URL = PAYPAL_ENVIRONMENT === 'sandbox' 
        ? 'https://api-m.sandbox.paypal.com' 
        : 'https://api-m.paypal.com';

    try {
        const tokenResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, null, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            auth: { username: CLIENT_ID, password: SECRET },
            params: { grant_type: 'client_credentials' }
        });

        const accessToken = tokenResponse.data.access_token;

        const subscriptionResponse = await axios.post(`${PAYPAL_API_BASE_URL}/v1/billing/subscriptions`, {
            plan_id: PLAN_ID,
            application_context: { return_url: RETURN_URL }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const subscriptionURL = subscriptionResponse.data.links.find(link => link.rel === 'approve').href;

        return {
            statusCode: 302,
            headers: { Location: subscriptionURL },
            body: JSON.stringify({ message: 'Redirecting to PayPal Subscription Page.' })
        };
    } catch (error) {
        console.error('Error occurred:', error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' })
        };
    }
};
