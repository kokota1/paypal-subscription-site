const express = require('express');				
const axios = require('axios');				
require('dotenv').config();				
				
const app = express();				
const PORT = process.env.PORT || 3000;				
				
// 環境変数の設定				
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;				
const SECRET = process.env.PAYPAL_SECRET;				
const PLAN_ID = process.env.PAYPAL_PLAN_ID;				
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT; // 'sandbox' または 'live'				
const RETURN_URL = process.env.RETURN_URL;				
				
// PayPal APIのベースURL				
const PAYPAL_API_BASE_URL = PAYPAL_ENVIRONMENT === 'sandbox' 				
    ? 'https://api-m.sandbox.paypal.com' 				
    : 'https://api-m.paypal.com';				
				
// エラーハンドリング付きのアクセストークン取得処理				
async function getAccessToken() {				
    try {				
        const response = await axios.post(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, null, {				
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },				
            auth: { username: CLIENT_ID, password: SECRET },				
            params: { grant_type: 'client_credentials' }				
        });				
        return response.data.access_token;				
    } catch (error) {				
        console.error('アクセストークンの取得に失敗しました:', error.response?.data || error.message);				
        throw new Error('PayPalのアクセストークン取得エラー');				
    }				
}				
				
// エラーハンドリング付きのサブスクリプションURL生成処理				
async function createSubscriptionURL(accessToken) {				
    try {				
        const response = await axios.post(`${PAYPAL_API_BASE_URL}/v1/billing/subscriptions`, {				
            plan_id: PLAN_ID,				
            application_context: { return_url: RETURN_URL }				
        }, {				
            headers: {				
                'Authorization': `Bearer ${accessToken}`,				
                'Content-Type': 'application/json'				
            }				
        });				
        return response.data.links.find(link => link.rel === 'approve').href;				
    } catch (error) {				
        console.error('サブスクリプションURLの生成に失敗しました:', error.response?.data || error.message);				
        throw new Error('PayPalのサブスクリプションURL生成エラー');				
    }				
}				
				
// メインルートでリダイレクト処理				
app.get('/', async (req, res) => {				
    try {				
        const accessToken = await getAccessToken();				
        const subscriptionURL = await createSubscriptionURL(accessToken);				
        res.redirect(subscriptionURL);				
    } catch (error) {				
        res.status(500).send('エラーが発生しました: ' + error.message);				
    }				
});				
				
app.listen(PORT, () => {				
    console.log(`サーバーがポート ${PORT} で起動しました`);				
});				