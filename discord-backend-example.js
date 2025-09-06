/**
 * Backend API Example for Discord OAuth Authentication
 * This is an example implementation using Node.js and Express
 * Replace the backend URL in the frontend files with your actual backend URL
 */

const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Discord API Configuration
const DISCORD_CONFIG = {
    clientId: '897289331075612693',
    clientSecret: 'your_discord_client_secret_here', // Keep this secret!
    redirectUri: 'https://wizardspell.netlify.app/'
};

// In-memory storage for demo (use a proper database in production)
const userSessions = new Map();
const stateStorage = new Map();

/**
 * POST /api/discord/auth
 * Exchange authorization code for access tokens and user info
 */
app.post('/api/discord/auth', async (req, res) => {
    try {
        const { code, state, redirect_uri } = req.body;

        // Validate required parameters
        if (!code || !state) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: code and state'
            });
        }

        // Validate state parameter (security check)
        if (!validateState(state)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid state parameter'
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
            return res.status(400).json({
                success: false,
                error: `Discord API error: ${errorData.error_description || errorData.error}`
            });
        }

        const tokens = await tokenResponse.json();

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
            return res.status(400).json({
                success: false,
                error: 'Failed to get user information'
            });
        }

        const userInfo = await userResponse.json();

        // Get user's guilds (servers) where the bot is present
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
        }

        // Store session data
        const sessionId = generateSessionId();
        userSessions.set(sessionId, {
            user: userInfo,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + (tokens.expires_in * 1000),
            guilds: guilds
        });

        // Clean up state
        stateStorage.delete(state);

        // Set session cookie
        res.cookie('discord_session', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

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
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/discord/status
 * Check if user is authenticated
 */
app.get('/api/discord/status', (req, res) => {
    const sessionId = req.cookies.discord_session;
    
    if (!sessionId) {
        return res.json({ authenticated: false });
    }

    const session = userSessions.get(sessionId);
    
    if (!session) {
        return res.json({ authenticated: false });
    }

    // Check if token is expired
    if (Date.now() > session.expires_at) {
        // Token expired, try to refresh
        refreshUserToken(sessionId).then(success => {
            if (success) {
                const updatedSession = userSessions.get(sessionId);
                res.json({ 
                    authenticated: true,
                    user: updatedSession.user
                });
            } else {
                res.json({ authenticated: false });
            }
        }).catch(() => {
            res.json({ authenticated: false });
        });
    } else {
        res.json({ 
            authenticated: true,
            user: session.user
        });
    }
});

/**
 * GET /api/discord/profile
 * Get user's Discord profile
 */
app.get('/api/discord/profile', async (req, res) => {
    try {
        const sessionId = req.cookies.discord_session;
        
        if (!sessionId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const session = userSessions.get(sessionId);
        
        if (!session) {
            return res.status(401).json({ error: 'No session found' });
        }

        // Check if token needs refresh
        if (Date.now() > session.expires_at) {
            const refreshed = await refreshUserToken(sessionId);
            if (!refreshed) {
                return res.status(401).json({ error: 'Token refresh failed' });
            }
        }

        const currentSession = userSessions.get(sessionId);
        
        const profileResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${currentSession.access_token}`
            }
        });

        if (!profileResponse.ok) {
            return res.status(400).json({ error: 'Failed to fetch profile' });
        }

        const profile = await profileResponse.json();
        res.json({ success: true, profile });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/discord/guilds
 * Get user's guilds where bot is present
 */
app.get('/api/discord/guilds', async (req, res) => {
    try {
        const sessionId = req.cookies.discord_session;
        
        if (!sessionId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const session = userSessions.get(sessionId);
        
        if (!session) {
            return res.status(401).json({ error: 'No session found' });
        }

        // Check if token needs refresh
        if (Date.now() > session.expires_at) {
            const refreshed = await refreshUserToken(sessionId);
            if (!refreshed) {
                return res.status(401).json({ error: 'Token refresh failed' });
            }
        }

        const currentSession = userSessions.get(sessionId);
        
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
                'Authorization': `Bearer ${currentSession.access_token}`
            }
        });

        if (!guildsResponse.ok) {
            return res.status(400).json({ error: 'Failed to fetch guilds' });
        }

        const guilds = await guildsResponse.json();
        
        // Filter guilds where the bot is present
        const botGuilds = guilds.filter(guild => guild.permissions & 0x8); // Administrator permission
        
        res.json({ success: true, guilds: botGuilds });

    } catch (error) {
        console.error('Guilds fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/discord/logout
 * Logout user
 */
app.post('/api/discord/logout', (req, res) => {
    try {
        const sessionId = req.cookies.discord_session;
        
        if (sessionId) {
            userSessions.delete(sessionId);
        }

        res.clearCookie('discord_session');
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Refresh user's access token
 */
async function refreshUserToken(sessionId) {
    try {
        const session = userSessions.get(sessionId);
        
        if (!session || !session.refresh_token) {
            return false;
        }

        const refreshResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: DISCORD_CONFIG.clientId,
                client_secret: DISCORD_CONFIG.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: session.refresh_token
            })
        });

        if (!refreshResponse.ok) {
            return false;
        }

        const newTokens = await refreshResponse.json();

        // Update stored session
        userSessions.set(sessionId, {
            ...session,
            access_token: newTokens.access_token,
            expires_at: Date.now() + (newTokens.expires_in * 1000),
            refresh_token: newTokens.refresh_token || session.refresh_token
        });

        return true;

    } catch (error) {
        console.error('Token refresh error:', error);
        return false;
    }
}

/**
 * Validate state parameter
 */
function validateState(state) {
    // In a real implementation, you'd store states in a database
    // with expiration times and validate against them
    return stateStorage.has(state);
}

/**
 * Generate and store state parameter
 */
function generateState() {
    const state = crypto.randomBytes(16).toString('hex');
    stateStorage.set(state, {
        created: Date.now(),
        expires: Date.now() + (10 * 60 * 1000) // 10 minutes
    });
    return state;
}

/**
 * Generate session ID
 */
function generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
}

// Clean up expired states and sessions periodically
setInterval(() => {
    const now = Date.now();
    
    // Clean up expired states
    for (const [state, data] of stateStorage.entries()) {
        if (now > data.expires) {
            stateStorage.delete(state);
        }
    }
    
    // Clean up expired sessions
    for (const [sessionId, session] of userSessions.entries()) {
        if (now > session.expires_at + (24 * 60 * 60 * 1000)) { // 24 hours after expiry
            userSessions.delete(sessionId);
        }
    }
}, 5 * 60 * 1000); // Every 5 minutes

// CORS configuration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://wizardspell.netlify.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Discord Auth API running on port ${PORT}`);
});

module.exports = app;
