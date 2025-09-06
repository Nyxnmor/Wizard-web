const express = require('express');
const axios = require('axios');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Discord OAuth2 Configuration
const CLIENT_ID = '897289331075612693';
const CLIENT_SECRET = 'iQJiQJ2a25PxPA93sQFJR3JtsMuM39fg';
const REDIRECT_URI = 'http://localhost:3001/auth/callback';
const DISCORD_API_URL = 'https://discord.com/api/v10';
const SCOPES = 'identify email guilds';

// Session configuration
app.use(session({
    secret: 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Test route to verify server is working
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Discord OAuth2 login route
app.get('/auth/login', (req, res) => {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}`;
    res.redirect(authUrl);
});

// Discord OAuth2 callback route
app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        return res.redirect('/?error=no_code');
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
                scope: SCOPES
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token } = tokenResponse.data;

        // Get user information
        const userResponse = await axios.get(`${DISCORD_API_URL}/users/@me`, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const user = userResponse.data;

        // Store user info in session
        req.session.user = {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar,
            email: user.email
        };

        // Redirect back to main page
        res.redirect('/');

    } catch (error) {
        console.error('OAuth2 error:', error);
        res.redirect('/?error=auth_failed');
    }
});

// Get current user info
app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({
            loggedIn: true,
            user: req.session.user
        });
    } else {
        res.json({
            loggedIn: false,
            user: null
        });
    }
});

// Logout route
app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure to:');
    console.log('1. Install dependencies: npm install express axios express-session');
    console.log('2. Set your CLIENT_SECRET from Discord Developer Portal');
    console.log('3. Add http://localhost:3001/auth/callback to your Discord app redirects');
});
