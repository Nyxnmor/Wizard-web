/**
 * Backend API Example for Spotify Authentication
 * This is an example implementation using Node.js and Express
 * Replace the backend URL in spotify-auth.js with your actual backend URL
 */

const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Spotify API Configuration
const SPOTIFY_CONFIG = {
    clientId: 'e90e80ecde3145a3beb5e02980f1bad6',
    clientSecret: 'edd6cee9fe3b433d99b18590a2d0d3b3', // Keep this secret!
    redirectUri: 'https://wizardspell.netlify.app/spotify/callback'
};

// In-memory storage for demo (use a proper database in production)
const userTokens = new Map();
const stateStorage = new Map();

/**
 * POST /api/spotify/auth
 * Exchange authorization code for access tokens
 */
app.post('/api/spotify/auth', async (req, res) => {
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
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(
                    SPOTIFY_CONFIG.clientId + ':' + SPOTIFY_CONFIG.clientSecret
                ).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirect_uri || SPOTIFY_CONFIG.redirectUri
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            return res.status(400).json({
                success: false,
                error: `Spotify API error: ${errorData.error_description || errorData.error}`
            });
        }

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            return res.status(400).json({
                success: false,
                error: 'Failed to obtain access token'
            });
        }

        // Get user ID from Spotify API
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': 'Bearer ' + tokens.access_token
            }
        });

        if (!userResponse.ok) {
            return res.status(400).json({
                success: false,
                error: 'Failed to get user information'
            });
        }

        const userInfo = await userResponse.json();
        const userId = userInfo.id;

        // Store tokens securely (encrypt in production)
        userTokens.set(userId, {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + (tokens.expires_in * 1000),
            user_info: userInfo
        });

        // Clean up state
        stateStorage.delete(state);

        res.json({
            success: true,
            user_id: userId,
            message: 'Spotify account connected successfully'
        });

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/spotify/status
 * Check if user is authenticated
 */
app.get('/api/spotify/status', (req, res) => {
    // In a real implementation, you'd get the user ID from session/JWT
    const userId = req.headers['x-user-id']; // Example header
    
    if (!userId) {
        return res.json({ authenticated: false });
    }

    const tokens = userTokens.get(userId);
    
    if (!tokens) {
        return res.json({ authenticated: false });
    }

    // Check if token is expired
    if (Date.now() > tokens.expires_at) {
        // Token expired, try to refresh
        refreshUserToken(userId).then(success => {
            res.json({ authenticated: success });
        }).catch(() => {
            res.json({ authenticated: false });
        });
    } else {
        res.json({ 
            authenticated: true,
            user_info: tokens.user_info
        });
    }
});

/**
 * GET /api/spotify/profile
 * Get user's Spotify profile
 */
app.get('/api/spotify/profile', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const tokens = userTokens.get(userId);
        
        if (!tokens) {
            return res.status(401).json({ error: 'No Spotify tokens found' });
        }

        // Check if token needs refresh
        if (Date.now() > tokens.expires_at) {
            const refreshed = await refreshUserToken(userId);
            if (!refreshed) {
                return res.status(401).json({ error: 'Token refresh failed' });
            }
        }

        const currentTokens = userTokens.get(userId);
        
        const profileResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': 'Bearer ' + currentTokens.access_token
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
 * POST /api/spotify/disconnect
 * Disconnect user's Spotify account
 */
app.post('/api/spotify/disconnect', (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Remove tokens
        userTokens.delete(userId);

        res.json({ 
            success: true, 
            message: 'Spotify account disconnected successfully' 
        });

    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Refresh user's access token
 */
async function refreshUserToken(userId) {
    try {
        const tokens = userTokens.get(userId);
        
        if (!tokens || !tokens.refresh_token) {
            return false;
        }

        const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(
                    SPOTIFY_CONFIG.clientId + ':' + SPOTIFY_CONFIG.clientSecret
                ).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: tokens.refresh_token
            })
        });

        if (!refreshResponse.ok) {
            return false;
        }

        const newTokens = await refreshResponse.json();

        // Update stored tokens
        userTokens.set(userId, {
            ...tokens,
            access_token: newTokens.access_token,
            expires_at: Date.now() + (newTokens.expires_in * 1000),
            refresh_token: newTokens.refresh_token || tokens.refresh_token
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

// Clean up expired states periodically
setInterval(() => {
    const now = Date.now();
    for (const [state, data] of stateStorage.entries()) {
        if (now > data.expires) {
            stateStorage.delete(state);
        }
    }
}, 5 * 60 * 1000); // Every 5 minutes

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Spotify Auth API running on port ${PORT}`);
});

module.exports = app;
