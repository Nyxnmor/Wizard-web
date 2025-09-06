/**
 * Simple Discord OAuth Backend for Testing
 * Run this locally to test the Discord OAuth flow
 */

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
    clientSecret: 'YOUR_DISCORD_CLIENT_SECRET_HERE', // Replace with your actual client secret
    redirectUri: 'https://wizardspell.netlify.app/'
};

/**
 * POST /api/discord/auth
 * Exchange authorization code for access tokens and user info
 */
app.post('/api/discord/auth', async (req, res) => {
    try {
        const { code, state, redirect_uri } = req.body;

        console.log('Received OAuth request:', { code: code ? 'present' : 'missing', state, redirect_uri });

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

        if (!tokens.access_token) {
            return res.status(400).json({
                success: false,
                error: 'Failed to obtain access token'
            });
        }

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
            // Filter guilds where the bot is present (you'd need to check bot permissions)
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

/**
 * GET /api/discord/status
 * Check if user is authenticated (mock implementation)
 */
app.get('/api/discord/status', (req, res) => {
    res.json({ authenticated: false });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Discord OAuth backend is running' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Discord OAuth backend running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Make sure to set your Discord client secret in the code!`);
});

module.exports = app;
