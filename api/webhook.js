// api/webhook.js
import axios from 'axios';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    // Log untuk debugging
    console.log('📨 Webhook received:', {
      supporter: data.supporter_name,
      amount: data.support_amount
    });

    // Validasi data
    if (!data.supporter_name || !data.support_amount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: data 
      });
    }

    // Format untuk Roblox
    const notificationData = {
      donorName: data.supporter_name,
      amount: data.support_amount,
      message: data.support_message || "",
      timestamp: Date.now(),
      source: "bagibagi"
    };

    // Get env variables
    const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
    const UNIVERSE_ID = process.env.UNIVERSE_ID || "YOUR_UNIVERSE_ID"; // Set ini juga!

    if (!ROBLOX_API_KEY) {
      console.error('❌ ROBLOX_API_KEY not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Send to Roblox
    const robloxUrl = `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/BagiBagiDonation`;
    
    console.log('🚀 Sending to Roblox:', robloxUrl);

    const robloxResponse = await axios.post(
      robloxUrl,
      { message: JSON.stringify(notificationData) },
      {
        headers: {
          'x-api-key': ROBLOX_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Success! Roblox response:', robloxResponse.status);

    return res.status(200).json({ 
      success: true,
      message: 'Donation forwarded to Roblox',
      donor: notificationData.donorName,
      amount: notificationData.amount
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.response) {
      console.error('Roblox API error:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    return res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error.message
    });
  }
}
