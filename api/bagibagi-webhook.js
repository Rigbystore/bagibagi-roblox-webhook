// api/bagibagi-webhook.js
// 🎁 BAGIBAGI.CO WEBHOOK WITH TOKEN VERIFICATION

const axios = require('axios');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Bagibagi-Token');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // GET request - Show info
    if (req.method !== 'POST') {
        return res.status(200).json({ 
            status: 'OK',
            message: 'BagiBagi.co webhook ready! 🎁',
            platform: 'BagiBagi Only',
            security: 'Token verification enabled',
            version: '2.0',
            endpoint: '/api/bagibagi-webhook'
        });
    }
    
    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎁 BagiBagi webhook received:', new Date().toISOString());
        console.log('📦 Headers:', JSON.stringify(req.headers, null, 2));
        console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
        
        // ════════════════════════════════════════════════════════════
        // TOKEN VERIFICATION (SECURITY!)
        // ════════════════════════════════════════════════════════════
        
        const BAGIBAGI_TOKEN = process.env.BAGIBAGI_TOKEN;
        
        if (BAGIBAGI_TOKEN) {
            // Check token in multiple places
            const tokenFromHeader = req.headers['x-bagibagi-token'] 
                                 || req.headers['authorization']
                                 || req.headers['x-token'];
            
            const tokenFromBody = req.body.token 
                               || req.body.webhook_token 
                               || req.body.secret;
            
            const receivedToken = tokenFromHeader || tokenFromBody;
            
            console.log('🔐 Token verification:');
            console.log('   Expected:', BAGIBAGI_TOKEN ? 'SET' : 'NOT SET');
            console.log('   Received (header):', tokenFromHeader ? 'YES' : 'NO');
            console.log('   Received (body):', tokenFromBody ? 'YES' : 'NO');
            
            // Verify token
            if (!receivedToken) {
                console.error('❌ No token provided!');
                return res.status(401).json({ 
                    success: false,
                    error: 'Unauthorized - Token missing'
                });
            }
            
            // Remove "Bearer " prefix if exists
            const cleanToken = receivedToken.replace(/^Bearer\s+/i, '');
            const cleanExpectedToken = BAGIBAGI_TOKEN.replace(/^Bearer\s+/i, '');
            
            if (cleanToken !== cleanExpectedToken) {
                console.error('❌ Invalid token!');
                console.error('   Expected:', cleanExpectedToken.substring(0, 10) + '...');
                console.error('   Received:', cleanToken.substring(0, 10) + '...');
                
                return res.status(403).json({ 
                    success: false,
                    error: 'Forbidden - Invalid token'
                });
            }
            
            console.log('✅ Token verified!');
        } else {
            console.warn('⚠️  WARNING: BAGIBAGI_TOKEN not set - Running without verification!');
        }
        
        const donation = req.body;
        
        // ════════════════════════════════════════════════════════════
        // BAGIBAGI FORMAT PARSING
        // ════════════════════════════════════════════════════════════
        
        // Extract donor name (multiple field support)
        const donorName = donation.supporter_name 
                       || donation.name 
                       || donation.donatur_name
                       || donation.donor_name 
                       || "Anonymous";
        
        // Extract amount
        const amount = parseInt(donation.amount) 
                    || parseInt(donation.amount_raw) 
                    || 0;
        
        // Extract message
        const message = donation.support_message 
                     || donation.message 
                     || "";
        
        // Build clean donation data
        const donationData = {
            donor_name: donorName,
            amount: amount,
            message: message,
            timestamp: Date.now(),
            platform: 'bagibagi'
        };
        
        console.log('📤 Sending to Roblox:', JSON.stringify(donationData, null, 2));
        
        // ════════════════════════════════════════════════════════════
        // ROBLOX MESSAGING SERVICE
        // ════════════════════════════════════════════════════════════
        
        const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
        const UNIVERSE_ID = process.env.UNIVERSE_ID;
        
        // Validate environment variables
        if (!ROBLOX_API_KEY || !UNIVERSE_ID) {
            console.error('❌ Missing environment variables!');
            console.error('ROBLOX_API_KEY:', ROBLOX_API_KEY ? 'SET' : 'MISSING');
            console.error('UNIVERSE_ID:', UNIVERSE_ID ? 'SET' : 'MISSING');
            
            return res.status(500).json({ 
                success: false,
                error: 'Server configuration error - Check environment variables'
            });
        }
        
        // Send to Roblox MessagingService
        const robloxResponse = await axios.post(
            `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/BagiBagiDonation`,
            { 
                message: JSON.stringify(donationData)
            },
            {
                headers: {
                    'x-api-key': ROBLOX_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }
        );
        
        console.log('✅ Successfully sent to Roblox!');
        console.log('📊 Roblox response status:', robloxResponse.status);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Success response
        return res.status(200).json({ 
            success: true,
            platform: 'bagibagi',
            donor: donationData.donor_name,
            amount: donationData.amount,
            message: donationData.message || '(no message)',
            verified: !!BAGIBAGI_TOKEN,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERROR:', error.message);
        console.error('Stack trace:', error.stack);
        
        if (error.response) {
            console.error('Roblox API error:', error.response.status);
            console.error('Roblox API data:', error.response.data);
        }
        
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return res.status(500).json({ 
            success: false,
            error: error.message,
            details: error.response?.data || 'No additional details',
            timestamp: new Date().toISOString()
        });
    }
};
