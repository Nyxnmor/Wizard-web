/**
 * Spotify Authentication Handler for Wizard Bot
 * Handles OAuth flow and token management
 */

class SpotifyAuth {
    constructor() {
        this.config = {
            clientId: 'e90e80ecde3145a3beb5e02980f1bad6',
            redirectUri: 'https://wizardspell.netlify.app/spotify/callback',
            backendUrl: 'https://your-backend.com/api/spotify/auth', // Replace with your actual backend URL
            scopes: [
                'user-read-private',
                'user-read-email',
                'user-top-read',
                'user-read-recently-played',
                'user-read-playback-state',
                'user-modify-playback-state',
                'user-read-currently-playing',
                'playlist-read-private',
                'playlist-read-collaborative',
                'streaming'
            ]
        };
    }

    /**
     * Generate a cryptographically secure random state parameter
     */
    generateRandomState() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Initiate Spotify OAuth flow
     */
    initiateAuth() {
        const state = this.generateRandomState();
        
        // Store state for validation
        sessionStorage.setItem('spotify_auth_state', state);
        
        // Build authorization URL
        const authUrl = `https://accounts.spotify.com/authorize?` +
            `client_id=${this.config.clientId}&` +
            `response_type=code&` +
            `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
            `scope=${encodeURIComponent(this.config.scopes.join(' '))}&` +
            `state=${state}`;

        // Redirect to Spotify
        window.location.href = authUrl;
    }

    /**
     * Handle OAuth callback
     */
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            throw new Error(`Spotify authorization error: ${error}`);
        }

        if (!code || !state) {
            throw new Error('Missing authorization code or state parameter');
        }

        // Validate state parameter
        const storedState = sessionStorage.getItem('spotify_auth_state');
        if (state !== storedState) {
            throw new Error('Invalid state parameter - possible CSRF attack');
        }

        // Clear stored state
        sessionStorage.removeItem('spotify_auth_state');

        // Exchange code for tokens
        return await this.exchangeCodeForTokens(code, state);
    }

    /**
     * Exchange authorization code for access tokens
     */
    async exchangeCodeForTokens(code, state) {
        try {
            const response = await fetch(this.config.backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    state: state,
                    redirect_uri: this.config.redirectUri
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Token exchange failed');
            }

            return result;
        } catch (error) {
            console.error('Token exchange error:', error);
            throw new Error('Failed to exchange authorization code for tokens');
        }
    }

    /**
     * Check if user is authenticated
     */
    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.config.backendUrl}/status`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                return { authenticated: false };
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Auth status check error:', error);
            return { authenticated: false };
        }
    }

    /**
     * Disconnect Spotify account
     */
    async disconnect() {
        try {
            const response = await fetch(`${this.config.backendUrl}/disconnect`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Disconnect error:', error);
            throw new Error('Failed to disconnect Spotify account');
        }
    }

    /**
     * Get user's Spotify profile
     */
    async getUserProfile() {
        try {
            const response = await fetch(`${this.config.backendUrl}/profile`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Profile fetch error:', error);
            throw new Error('Failed to fetch user profile');
        }
    }
}

// Utility functions for UI handling
class SpotifyAuthUI {
    constructor() {
        this.auth = new SpotifyAuth();
    }

    /**
     * Show loading state
     */
    showLoading(elementId = 'loadingState') {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading(elementId = 'loadingState') {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    }

    /**
     * Show success state
     */
    showSuccess(elementId = 'successState') {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
        }
    }

    /**
     * Show error state
     */
    showError(errorMessage, elementId = 'errorState', detailsId = 'errorDetails') {
        const errorElement = document.getElementById(elementId);
        const detailsElement = document.getElementById(detailsId);
        
        if (errorElement) {
            errorElement.style.display = 'block';
        }
        
        if (detailsElement && errorMessage) {
            detailsElement.textContent = errorMessage;
            detailsElement.style.display = 'block';
        }
    }

    /**
     * Start countdown timer
     */
    startCountdown(seconds = 10, elementId = 'countdown') {
        const countdownElement = document.getElementById(elementId);
        if (!countdownElement) return;

        let remaining = seconds;
        countdownElement.textContent = remaining;

        const interval = setInterval(() => {
            remaining--;
            countdownElement.textContent = remaining;

            if (remaining <= 0) {
                clearInterval(interval);
                this.closeWindow();
            }
        }, 1000);
    }

    /**
     * Attempt to close the window
     */
    closeWindow() {
        // Try to close the window (may not work due to browser security)
        window.close();
        
        // Fallback: redirect to Discord
        setTimeout(() => {
            window.location.href = 'https://discord.com/channels/@me';
        }, 1000);
    }

    /**
     * Handle authentication flow
     */
    async handleAuthFlow() {
        try {
            this.showLoading();
            const result = await this.auth.handleCallback();
            
            this.hideLoading();
            this.showSuccess();
            this.startCountdown();
            
            return result;
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
            throw error;
        }
    }

    /**
     * Initiate authentication
     */
    initiateAuth() {
        this.auth.initiateAuth();
    }
}

// Global instances
window.spotifyAuth = new SpotifyAuth();
window.spotifyAuthUI = new SpotifyAuthUI();

// Auto-handle callback if on callback page
if (window.location.pathname.includes('/spotify/callback')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.spotifyAuthUI.handleAuthFlow().catch(error => {
            console.error('Authentication flow failed:', error);
        });
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpotifyAuth, SpotifyAuthUI };
}
