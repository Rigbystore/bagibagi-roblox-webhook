// api/webhook.js
import axios from 'axios';

// Konfigurasi
const UNIVERSE_ID = "YOUR_UNIVERSE_ID"; // Ganti dengan Universe ID game kamu
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || ""; // Optional: untuk validasi

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    // Validasi data dari BagiBagi.co
    if (!data.supporter_name || !data.support_amount) {
      console.error('❌ Invalid data received:', data);
      return res.status(400).json({ 
        error: 'Invalid data',
        received: data 
      });
    }

    // Optional: Validasi webhook secret
    if (WEBHOOK_SECRET && req.headers['x-webhook-secret'] !== WEBHOOK_SECRET) {
      console.error('❌ Invalid webhook secret');
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Format data untuk Roblox
    const notificationData = {
      donorName: data.supporter_name,
      amount: data.support_amount,
      message: data.support_message || "",
      timestamp: Date.now(),
      source: "bagibagi"
    };

    console.log('📨 Donation received:', {
      donor: notificationData.donorName,
      amount: notificationData.amount,
      message: notificationData.message
    });

    // Kirim ke Roblox MessagingService
    const robloxApiKey = process.env.ROBLOX_API_KEY;
    
    if (!robloxApiKey) {
      throw new Error('ROBLOX_API_KEY not configured');
    }

    const robloxResponse = await axios.post(
      `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/BagiBagiDonation`,
      {
        message: JSON.stringify(notificationData)
      },
      {
        headers: {
          'x-api-key': robloxApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 second timeout
      }
    );

    console.log('✅ Forwarded to Roblox successfully');

    return res.status(200).json({ 
      success: true,
      message: 'Donation notification sent',
      data: {
        donor: notificationData.donorName,
        amount: notificationData.amount
      }
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error.message);
    
    // Detailed error response
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: error.response?.data || null
    });
  }
}
