# Discord OAuth Authentication Setup Guide

This guide explains how to set up the Discord OAuth authentication system for Wizard Bot, allowing users to authenticate and see their profile information.

## 🎯 Overview

The system provides a complete Discord OAuth flow where users can authenticate with Discord and see their profile information, including username, avatar, email, and servers where the bot is present.

## 📁 File Structure

```
├── index.html                    # Main page with Discord login button
├── script.js                     # Updated with Discord OAuth functionality
├── discord/
│   └── callback.html            # Discord OAuth callback handler
├── discord-backend-example.js   # Backend API implementation example
└── DISCORD_OAUTH_SETUP.md       # This setup guide
```

## 🔧 Setup Instructions

### 1. Frontend Setup (Already Complete)

The frontend files are ready to use:

- **`index.html`** - Main page with "Login with Discord" button
- **`script.js`** - Updated with Discord OAuth functionality
- **`discord/callback.html`** - Handles Discord OAuth callback

### 2. Backend Setup

#### Option A: Use the Provided Example

1. Install dependencies:
```bash
npm install express node-fetch cookie-parser
```

2. Update the backend URL in `script.js` and `discord/callback.html`:
```javascript
backendUrl: 'https://your-backend-domain.com/api/discord/auth'
```

3. Deploy the backend using the code in `discord-backend-example.js`

#### Option B: Custom Backend Implementation

Create the following API endpoints:

**POST `/api/discord/auth`**
- Exchanges authorization code for access tokens
- Validates state parameter for security
- Gets user information from Discord API
- Gets user's guilds (servers)
- Stores session data

**GET `/api/discord/status`**
- Checks if user is authenticated
- Returns authentication status and user info

**GET `/api/discord/profile`**
- Returns user's Discord profile information

**GET `/api/discord/guilds`**
- Returns user's guilds where bot is present

**POST `/api/discord/logout`**
- Logs out user and clears session

### 3. Discord Application Configuration

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (Client ID: 897289331075612693)
3. Go to OAuth2 settings
4. Add redirect URI: `https://wizardspell.netlify.app/`
5. Note your Client Secret

### 4. Environment Variables

Set up these environment variables on your backend:

```bash
DISCORD_CLIENT_ID=897289331075612693
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
DISCORD_REDIRECT_URI=https://wizardspell.netlify.app/
```

## 🚀 How It Works

### User Flow

1. **User clicks "Login with Discord"** on your website
2. **Redirects to Discord OAuth** with proper scopes
3. **User authorizes** on Discord
4. **Discord redirects** to main page with OAuth parameters
5. **Website automatically completes** the authentication
6. **User sees their profile** with avatar, username, email
7. **User sees servers** where the bot is present
8. **User gets redirected** back to main page
9. **Main page shows user profile** in navigation

### Technical Flow

1. **Authorization Request**
   - User clicks "Login with Discord"
   - Frontend generates secure state parameter
   - Redirects to Discord OAuth with scopes: identify, email, guilds

2. **Discord Authorization**
   - User authorizes on Discord
   - Discord redirects to callback with code and state

3. **Token Exchange**
   - Callback page extracts code and state
   - Sends POST request to backend API
   - Backend exchanges code for access/refresh tokens
   - Backend gets user info and guilds from Discord API
   - Session data stored securely

4. **Success Handling**
   - User sees success message with profile
   - User data stored in localStorage
   - Automatic redirect back to main page
   - Main page shows user profile in navigation

## 🔒 Security Features

- **State Parameter Validation** - Prevents CSRF attacks
- **Secure Session Storage** - Sessions stored securely with expiration
- **HTTPS Only** - All communication over secure connections
- **Token Refresh** - Automatic token renewal
- **Session Cleanup** - Automatic cleanup of expired sessions
- **CORS Configuration** - Proper CORS setup for security

## 🎵 Required Discord Scopes

The system requests these permissions:

- `identify` - Read user's basic account information
- `email` - Read user's email address
- `guilds` - Read user's guilds (servers)

## 🧪 Testing

### Test the Complete Flow

1. **Start your backend server**
2. **Open your website** in browser
3. **Click "Login with Discord"**
4. **Authorize on Discord**
5. **Verify callback page shows success with profile**
6. **Check main page shows user profile in navigation**

### Test Error Scenarios

- Invalid authorization code
- Expired authorization code
- Network errors
- Invalid state parameter
- Discord API errors

## 🔧 Customization

### Update Backend URL

In `script.js` and `discord/callback.html`, change:
```javascript
backendUrl: 'https://your-backend-domain.com/api/discord/auth'
```

### Customize UI

- Modify user profile display in navigation
- Update callback page success/error messages
- Customize CSS for user profile elements

### Add Features

- User guild management
- Bot permissions display
- User settings page
- Session management

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid state parameter"**
   - Check state generation and validation
   - Ensure proper session storage

2. **"Failed to exchange code"**
   - Verify Discord credentials
   - Check redirect URI matches exactly
   - Ensure backend is running

3. **"Authentication failed"**
   - Check network connectivity
   - Verify backend API endpoints
   - Check browser console for errors

4. **User profile not showing**
   - Check localStorage for user data
   - Verify backend returns user information
   - Check authentication status endpoint

### Debug Mode

Enable debug logging in `script.js`:
```javascript
// Add this at the top of the file
const DEBUG = true;
```

## 📱 Mobile Support

The authentication flow works on mobile devices:

- Responsive design for all screen sizes
- Touch-friendly buttons
- Mobile browser compatibility
- Automatic window closing (where supported)

## 🔄 Integration with Discord Bot

### Bot Commands

Update your Discord bot to:

1. **Check user authentication** before allowing certain commands
2. **Display user info** in bot responses
3. **Manage user sessions** on the backend
4. **Handle user preferences** and settings

### Example Bot Code

```javascript
// Discord bot command
client.on('interactionCreate', async (interaction) => {
    if (interaction.commandName === 'profile') {
        // Check if user is authenticated on website
        const userSession = await checkUserSession(interaction.user.id);
        
        if (userSession) {
            await interaction.reply({
                content: `Hello ${userSession.user.global_name || userSession.user.username}! You're authenticated on our website.`,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: 'Please authenticate on our website first: https://wizardspell.netlify.app',
                ephemeral: true
            });
        }
    }
});
```

## 📊 Monitoring

### Log Important Events

- Successful authentications
- Failed authentications
- Token refreshes
- User logouts
- Session expirations

### Analytics

Track:
- Authentication success rate
- User engagement
- Error frequency
- Performance metrics

## 🚀 Deployment

### Frontend (Netlify)

1. **Connect repository** to Netlify
2. **Set build command** (if needed)
3. **Deploy** automatically on push

### Backend

1. **Deploy to your preferred platform** (Heroku, AWS, etc.)
2. **Set environment variables**
3. **Configure HTTPS**
4. **Update CORS settings**
5. **Set up session storage** (Redis recommended for production)

## ✅ Success Criteria

- ✅ User clicks "Login with Discord"
- ✅ Redirects to Discord OAuth
- ✅ User authorizes on Discord
- ✅ Gets redirected to callback page
- ✅ Sees success message with profile
- ✅ Gets redirected to main page
- ✅ Main page shows user profile in navigation
- ✅ User can see their servers where bot is present

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify backend API is responding
3. Test with different browsers
4. Check Discord application configuration
5. Review server logs

## 🔄 Updates

To update the system:

1. **Update frontend files** as needed
2. **Deploy backend changes**
3. **Test authentication flow**
4. **Update documentation**

---

**Goal Achieved**: Complete Discord OAuth authentication with user profile display! 🎉
