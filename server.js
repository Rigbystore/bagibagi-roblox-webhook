// server.js
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Ganti dengan Universe ID game kamu
const UNIVERSE_ID = "YOUR_UNIVERSE_ID";
const WEBHOOK_SECRET = "YOUR_SECRET_KEY"; // Buat random string untuk security

// Endpoint untuk BagiBagi.co webhook
app.post('/bagibagi-webhook', async (req, res) => {
  try {
    const data = req.body;
    
    // Validasi data dari BagiBagi.co
    if (!data.supporter_name || !data.support_amount) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    // Format data untuk Roblox
    const notificationData = {
      donorName: data.supporter_name,
      amount: data.support_amount,
      message: data.support_message || "",
      timestamp: Date.now()
    };

    // Kirim ke Roblox MessagingService
    const robloxResponse = await axios.post(
      `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/BagiBagiDonation`,
      {
        message: JSON.stringify(notificationData)
      },
      {
        headers: {
          'x-api-key': process.env.ROBLOX_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Donation forwarded:', notificationData);
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('BagiBagi.co Webhook Forwarder is running! 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
