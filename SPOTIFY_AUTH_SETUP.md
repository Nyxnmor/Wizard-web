# Spotify Authentication Setup Guide

This guide explains how to set up the automatic Spotify authentication system for Wizard Bot, similar to Bleed Bot's seamless authentication flow.

## 🎯 Overview

The system provides a complete OAuth flow where users can authenticate with Spotify through a simple click, without manual code copying.

## 📁 File Structure

```
├── spotify.html                 # Main Spotify authentication page
├── spotify/
│   └── callback.html           # OAuth callback handler
├── spotify-auth.js             # Authentication JavaScript library
├── backend-example.js          # Backend API implementation example
└── SPOTIFY_AUTH_SETUP.md       # This setup guide
```

## 🔧 Setup Instructions

### 1. Frontend Setup (Already Complete)

The frontend files are ready to use:

- **`spotify.html`** - Main authentication page with Spotify branding
- **`spotify/callback.html`** - Handles OAuth callback from Spotify
- **`spotify-auth.js`** - JavaScript library for authentication flow

### 2. Backend Setup

#### Option A: Use the Provided Example

1. Install dependencies:
```bash
npm install express node-fetch
```

2. Update the backend URL in `spotify-auth.js`:
```javascript
backendUrl: 'https://your-backend-domain.com/api/spotify/auth'
```

3. Deploy the backend using the code in `backend-example.js`

#### Option B: Custom Backend Implementation

Create the following API endpoints:

**POST `/api/spotify/auth`**
- Exchanges authorization code for access tokens
- Validates state parameter for security
- Stores user tokens securely

**GET `/api/spotify/status`**
- Checks if user is authenticated
- Returns authentication status

**GET `/api/spotify/profile`**
- Returns user's Spotify profile information

**POST `/api/spotify/disconnect`**
- Disconnects user's Spotify account

### 3. Spotify App Configuration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or use existing one
3. Set redirect URI to: `https://wizardspell.netlify.app/spotify/callback`
4. Note your Client ID and Client Secret

### 4. Environment Variables

Set up these environment variables on your backend:

```bash
SPOTIFY_CLIENT_ID=e90e80ecde3145a3beb5e02980f1bad6
SPOTIFY_CLIENT_SECRET=edd6cee9fe3b433d99b18590a2d0d3b3
SPOTIFY_REDIRECT_URI=https://wizardspell.netlify.app/spotify/callback
```

## 🚀 How It Works

### User Flow

1. **User types `!spotify login` in Discord**
2. **Bot opens browser to Spotify auth page**
3. **User authorizes on Spotify**
4. **Spotify redirects to callback page**
5. **Website automatically completes authentication**
6. **User sees success message**
7. **User can immediately use Spotify commands**

### Technical Flow

1. **Authorization Request**
   - User clicks "Connect with Spotify"
   - Frontend generates secure state parameter
   - Redirects to Spotify OAuth with proper scopes

2. **Spotify Authorization**
   - User authorizes on Spotify
   - Spotify redirects to callback with code and state

3. **Token Exchange**
   - Callback page extracts code and state
   - Sends POST request to backend API
   - Backend exchanges code for access/refresh tokens
   - Tokens stored securely for user

4. **Success Handling**
   - User sees success message
   - Automatic redirect back to Discord
   - User can now use music commands

## 🔒 Security Features

- **State Parameter Validation** - Prevents CSRF attacks
- **Secure Token Storage** - Tokens encrypted and stored safely
- **HTTPS Only** - All communication over secure connections
- **Token Refresh** - Automatic token renewal
- **Error Handling** - Comprehensive error management

## 🎵 Required Spotify Scopes

The system requests these permissions:

- `user-read-private` - Read user's subscription details
- `user-read-email` - Read user's email address
- `user-top-read` - Read user's top artists and tracks
- `user-read-recently-played` - Read user's recently played tracks
- `user-read-playback-state` - Read user's current playback
- `user-modify-playback-state` - Control user's playback
- `user-read-currently-playing` - Read user's currently playing track
- `playlist-read-private` - Read user's private playlists
- `playlist-read-collaborative` - Read collaborative playlists
- `streaming` - Control playback on user's devices

## 🧪 Testing

### Test the Complete Flow

1. **Start your backend server**
2. **Open `spotify.html` in browser**
3. **Click "Connect with Spotify"**
4. **Authorize on Spotify**
5. **Verify callback page shows success**
6. **Check backend logs for token storage**

### Test Error Scenarios

- Invalid authorization code
- Expired authorization code
- Network errors
- Invalid state parameter
- Spotify API errors

## 🔧 Customization

### Update Backend URL

In `spotify-auth.js`, change:
```javascript
backendUrl: 'https://your-backend-domain.com/api/spotify/auth'
```

### Customize UI

- Modify `spotify.html` for branding
- Update `spotify/callback.html` for success/error messages
- Customize CSS in both files

### Add Features

- User profile display
- Connection status checking
- Disconnect functionality
- Token refresh handling

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid state parameter"**
   - Check state generation and validation
   - Ensure proper session storage

2. **"Failed to exchange code"**
   - Verify Spotify credentials
   - Check redirect URI matches exactly
   - Ensure backend is running

3. **"Authentication failed"**
   - Check network connectivity
   - Verify backend API endpoints
   - Check browser console for errors

### Debug Mode

Enable debug logging in `spotify-auth.js`:
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

1. **Generate state parameter** with user ID
2. **Open browser** to Spotify auth URL
3. **Handle successful authentication** callback
4. **Enable music commands** for authenticated users

### Example Bot Code

```javascript
// Discord bot command
client.on('message', async (message) => {
    if (message.content === '!spotify login') {
        const state = generateStateWithUserId(message.author.id);
        const authUrl = `https://wizardspell.netlify.app/spotify.html?state=${state}`;
        
        await message.author.send(`Click here to connect Spotify: ${authUrl}`);
    }
});
```

## 📊 Monitoring

### Log Important Events

- Successful authentications
- Failed authentications
- Token refreshes
- User disconnections

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

## ✅ Success Criteria

- ✅ User types `!spotify login` in Discord
- ✅ Bot automatically opens Spotify auth
- ✅ User authorizes on Spotify
- ✅ Gets redirected to website
- ✅ Sees success message
- ✅ Can use Spotify commands immediately
- ✅ No manual steps required

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify backend API is responding
3. Test with different browsers
4. Check Spotify app configuration
5. Review server logs

## 🔄 Updates

To update the system:

1. **Update frontend files** as needed
2. **Deploy backend changes**
3. **Test authentication flow**
4. **Update documentation**

---

**Goal Achieved**: Seamless Spotify authentication like Bleed Bot - one click and done! 🎉
