const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'https://wizardspell.netlify.app',
    credentials: true
}));

// Discord API Configuration
const DISCORD_CONFIG = {
    clientId: '897289331075612693',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || 'YOUR_DISCORD_CLIENT_SECRET_HERE',
    redirectUri: 'https://wizardspell.netlify.app/'
};

/**
 * POST /api/discord/exchange
 * Exchange authorization code for user data
 */
app.post('/api/discord/exchange', async (req, res) => {
    try {
        const { code, state, redirect_uri } = req.body;

        console.log('Received OAuth exchange request');

        // Validate required parameters
        if (!code || !state) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: code and state'
            });
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: DISCORD_CONFIG.clientId,
                client_secret: DISCORD_CONFIG.clientSecret,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirect_uri || DISCORD_CONFIG.redirectUri
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('Token exchange failed:', errorData);
            return res.status(400).json({
                success: false,
                error: `Discord API error: ${errorData.error_description || errorData.error}`
            });
        }

        const tokens = await tokenResponse.json();
        console.log('Token exchange successful');

        // Get user information from Discord API
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`
            }
        });

        if (!userResponse.ok) {
            console.error('User info fetch failed:', userResponse.status);
            return res.status(400).json({
                success: false,
                error: 'Failed to get user information'
            });
        }

        const userInfo = await userResponse.json();
        console.log('User info retrieved:', userInfo.username);

        // Get user's guilds (servers)
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`
            }
        });

        let guilds = [];
        if (guildsResponse.ok) {
            const allGuilds = await guildsResponse.json();
            // Filter guilds where the bot is present
            guilds = allGuilds.filter(guild => guild.permissions & 0x8); // Administrator permission
            console.log('Guilds retrieved:', guilds.length);
        }

        res.json({
            success: true,
            user: userInfo,
            guilds: guilds,
            message: 'Discord account connected successfully'
        });

    } catch (error) {
        console.error('Discord authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Discord OAuth proxy is running',
        clientId: DISCORD_CONFIG.clientId
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Discord OAuth proxy running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Make sure to set DISCORD_CLIENT_SECRET environment variable!`);
});

module.exports = app;
