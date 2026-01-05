// api/webhook.js
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET request untuk test endpoint
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      message: 'BagiBagi.co Webhook Endpoint is running! 🚀',
      endpoints: {
        test: 'GET /api/webhook',
        webhook: 'POST /api/webhook'
      }
    });
  }

  // POST request untuk webhook
  if (req.method === 'POST') {
    try {
      const data = req.body;

      console.log('📨 Webhook received:', data);

      // Validasi data
      if (!data.supporter_name || !data.support_amount) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['supporter_name', 'support_amount'],
          received: Object.keys(data)
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

      // Get environment variables
      const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
      const UNIVERSE_ID = process.env.UNIVERSE_ID;

      // Check if configured
      if (!ROBLOX_API_KEY || !UNIVERSE_ID) {
        console.warn('⚠️ Roblox credentials not configured');
        return res.status(200).json({
          success: false,
          message: 'Webhook received but Roblox not configured',
          data: notificationData
        });
      }

      // Send to Roblox (only if configured)
      const axios = (await import('axios')).default;
      
      const robloxUrl = `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/BagiBagiDonation`;
      
      await axios.post(
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

      console.log('✅ Forwarded to Roblox successfully');

      return res.status(200).json({ 
        success: true,
        message: 'Donation forwarded to Roblox',
        donor: notificationData.donorName,
        amount: notificationData.amount
      });

    } catch (error) {
      console.error('❌ Error:', error.message);
      
      return res.status(500).json({ 
        error: 'Failed to process webhook',
        details: error.message
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
