// Smooth scrolling for navigation links (only internal anchor links)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // Only prevent default for internal anchor links that actually exist on the page
        if (href.startsWith('#') && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(26, 26, 26, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.background = 'rgba(26, 26, 26, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.feature-card, .command-category');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Discord OAuth Configuration
const DISCORD_CONFIG = {
    clientId: '897289331075612693',
    redirectUri: 'https://wizardspell.netlify.app/',
    scopes: ['identify', 'email', 'guilds'],
    permissions: '8' // Administrator permission
};

// Discord OAuth Authorization Redirect
function redirectToBotAuth() {
    // Generate state parameter for security
    const state = generateRandomState();
    sessionStorage.setItem('discord_auth_state', state);
    
    // Build Discord OAuth URL
    const authUrl = `https://discord.com/oauth2/authorize?` +
        `client_id=${DISCORD_CONFIG.clientId}&` +
        `redirect_uri=${encodeURIComponent(DISCORD_CONFIG.redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(DISCORD_CONFIG.scopes.join(' '))}&` +
        `state=${state}`;
    
    // Redirect to Discord OAuth
    window.location.href = authUrl;
}

// Generate random state parameter
function generateRandomState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Authentication state management
let currentUser = null;

// Show user profile
function showUserProfile() {
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const userAvatar = document.getElementById('userAvatar');
    const userDisplayName = document.getElementById('userDisplayName');
    
    if (currentUser) {
        // Set user avatar
        if (currentUser.avatar) {
            userAvatar.src = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=64`;
        } else {
            userAvatar.src = `https://cdn.discordapp.com/embed/avatars/${currentUser.discriminator % 5}.png`;
        }
        
        // Set username (use global_name if available, otherwise username)
        userDisplayName.textContent = currentUser.global_name || currentUser.username;
        
        // Show profile, hide login button
        loginBtn.style.display = 'none';
        userProfile.style.display = 'flex';
    }
}

// Show login button
function showLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    
    loginBtn.style.display = 'flex';
    userProfile.style.display = 'none';
    currentUser = null;
}

// Check if user is returning from Discord OAuth callback
function checkDiscordCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    
    if (authSuccess === 'true') {
        // Get user data from localStorage (set by callback page)
        const userData = localStorage.getItem('discord_user_data');
        if (userData) {
            currentUser = JSON.parse(userData);
            showUserProfile();
            // Clear the data from localStorage
            localStorage.removeItem('discord_user_data');
        }
    }
}

// Check current authentication status
async function checkAuthStatus() {
    try {
        // Check if we have stored user data
        const userData = localStorage.getItem('discord_user_data');
        if (userData) {
            currentUser = JSON.parse(userData);
            showUserProfile();
            return;
        }
        
        // If no stored data, check with backend
        const response = await fetch('/api/discord/status', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.authenticated && result.user) {
                currentUser = result.user;
                showUserProfile();
            }
        }
    } catch (error) {
        console.log('Auth status check failed:', error);
    }
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('discord_user_data');
    showLoginButton();
    
    // Optionally call backend logout endpoint
    fetch('/api/discord/logout', {
        method: 'POST',
        credentials: 'include'
    }).catch(error => {
        console.log('Logout request failed:', error);
    });
}

// Login button click handler
// Remove old event listeners since we're using onclick now

// Add to Discord button click handler - REMOVED since HTML already has direct link
// The button in index.html already has the correct href to the bot invite link





// Typing effect for the hero title
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing effect when page loads
document.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.querySelector('.hero-title');
    const originalText = heroTitle.innerHTML;
    
    // Reset to original text first
    heroTitle.innerHTML = '';
    
    // Start typing effect after a short delay
    setTimeout(() => {
        typeWriter(heroTitle, originalText, 50);
    }, 500);
    
    // Check authentication status
    checkDiscordCallback();
    checkAuthStatus();
});

// Parallax effect for background
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('body::before');
    
    if (parallax) {
        const speed = scrolled * 0.5;
        parallax.style.transform = `translateY(${speed}px)`;
    }
});

// Feature cards hover effect enhancement
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.borderColor = 'rgba(139, 92, 246, 0.5)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });
});

// Command items hover effect
document.querySelectorAll('.command-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        const code = this.querySelector('code');
        if (code) {
            code.style.background = 'rgba(139, 92, 246, 0.2)';
            code.style.borderColor = 'rgba(139, 92, 246, 0.4)';
        }
    });
    
    item.addEventListener('mouseleave', function() {
        const code = this.querySelector('code');
        if (code) {
            code.style.background = 'rgba(139, 92, 246, 0.1)';
            code.style.borderColor = 'rgba(139, 92, 246, 0.2)';
        }
    });
});

// Mobile menu toggle (for future mobile navigation)
function createMobileMenu() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelector('.nav-links');
    
    // Create mobile menu button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuBtn.style.display = 'none';
    
    // Add mobile menu button to navbar
    navbar.querySelector('.nav-container').insertBefore(mobileMenuBtn, navbar.querySelector('.nav-auth'));
    
    // Mobile menu toggle functionality
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-active');
        mobileMenuBtn.innerHTML = navLinks.classList.contains('mobile-active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
    
    // Show mobile menu button on small screens
    function checkMobile() {
        if (window.innerWidth <= 768) {
            mobileMenuBtn.style.display = 'block';
            navLinks.classList.add('mobile-nav');
        } else {
            mobileMenuBtn.style.display = 'none';
            navLinks.classList.remove('mobile-nav', 'mobile-active');
        }
    }
    
    window.addEventListener('resize', checkMobile);
    checkMobile();
}

// Initialize mobile menu
document.addEventListener('DOMContentLoaded', createMobileMenu);

// Add CSS for mobile menu
const mobileStyles = `
    @media (max-width: 768px) {
        .mobile-nav {
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background: rgba(26, 26, 26, 0.98);
            backdrop-filter: blur(10px);
            flex-direction: column;
            padding: 20px;
            gap: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transform: translateY(-100%);
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        .mobile-nav.mobile-active {
            transform: translateY(0);
            opacity: 1;
        }
        
        .mobile-menu-btn {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            transition: background 0.3s ease;
        }
        
        .mobile-menu-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
    }
`;

// Inject mobile styles
const styleSheet = document.createElement('style');
styleSheet.textContent = mobileStyles;
document.head.appendChild(styleSheet);

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Handle hash navigation for commands page
    if (window.location.pathname.includes('commands-web.html') && window.location.hash) {
        const categoryId = window.location.hash.substring(1);
        setTimeout(() => {
            const category = document.getElementById(categoryId);
            if (category) {
                category.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 500); // Small delay to ensure page is fully loaded
    }
});

// Navigation dropdown functionality
function toggleNavDropdown() {
    const navDropdown = document.querySelector('.nav-dropdown');
    navDropdown.classList.toggle('active');
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
    
    // Close dropdown after selection
    const navDropdown = document.querySelector('.nav-dropdown');
    navDropdown.classList.remove('active');
}

// Scroll to specific category on commands page
function scrollToCategory(categoryId) {
    // Check if we're on the commands page
    if (window.location.pathname.includes('commands-web.html')) {
        const category = document.getElementById(categoryId);
        if (category) {
            category.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    } else {
        // If not on commands page, navigate to it with the category anchor
        window.location.href = `commands-web.html#${categoryId}`;
    }
    
    // Close dropdown after selection
    const navDropdown = document.querySelector('.nav-dropdown');
    if (navDropdown) {
        navDropdown.classList.remove('active');
    }
}

// Close navigation dropdown when clicking outside
document.addEventListener('click', (e) => {
    const navDropdown = document.querySelector('.nav-dropdown');
    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    
    if (navDropdown && !navDropdown.contains(e.target) && !dropdownTrigger.contains(e.target)) {
        navDropdown.classList.remove('active');
    }
});

// Enhanced search functionality for documentation page
function searchCommands() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    const commandCards = document.querySelectorAll('.command-card');
    const commandsGrid = document.getElementById('commandsGrid');
    
    if (!searchInput || !commandsGrid) return; // Not on documentation page
    
    let hasResults = false;
    
    commandCards.forEach(card => {
        const searchData = card.getAttribute('data-search') || '';
        const commandName = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('.command-description').textContent.toLowerCase();
        const usage = card.querySelector('.command-usage').textContent.toLowerCase();
        const category = card.querySelector('.category-badge').textContent.toLowerCase();
        
        // Check if search term matches any part of the command
        const matches = 
            commandName.includes(searchTerm) ||
            description.includes(searchTerm) ||
            usage.includes(searchTerm) ||
            category.includes(searchTerm) ||
            searchData.includes(searchTerm);
        
        if (searchTerm === '' || matches) {
            card.style.display = 'block';
            hasResults = true;
            
            // Highlight matching text if there's a search term
            if (searchTerm !== '') {
                highlightSearchTerm(card, searchTerm);
            } else {
                removeHighlight(card);
            }
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show/hide no results message
    showNoResultsMessage(hasResults, searchTerm);
}

// Highlight search terms in command cards
function highlightSearchTerm(card, searchTerm) {
    const elements = card.querySelectorAll('h3, .command-description, .command-usage');
    
    elements.forEach(element => {
        const originalText = element.getAttribute('data-original') || element.innerHTML;
        element.setAttribute('data-original', originalText);
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const highlightedText = originalText.replace(regex, '<mark style="background-color: rgba(139, 92, 246, 0.3); color: #fff; padding: 2px 4px; border-radius: 3px;">$1</mark>');
        element.innerHTML = highlightedText;
    });
}

// Remove highlighting from command cards
function removeHighlight(card) {
    const elements = card.querySelectorAll('h3, .command-description, .command-usage');
    
    elements.forEach(element => {
        const originalText = element.getAttribute('data-original');
        if (originalText) {
            element.innerHTML = originalText;
            element.removeAttribute('data-original');
        }
    });
}

// Show or hide no results message
function showNoResultsMessage(hasResults, searchTerm) {
    let noResultsMsg = document.getElementById('noResultsMessage');
    
    if (!hasResults && searchTerm !== '') {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.id = 'noResultsMessage';
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3>No commands found</h3>
                    <p>No commands match your search for "<strong>${searchTerm}</strong>"</p>
                    <p>Try searching for different keywords like:</p>
                    <div style="margin-top: 15px;">
                        <span class="search-suggestion">antinuke</span>
                        <span class="search-suggestion">moderation</span>
                        <span class="search-suggestion">nickname</span>
                        <span class="search-suggestion">usage</span>
                    </div>
                </div>
            `;
            
            const commandsContainer = document.querySelector('.commands-container');
            if (commandsContainer) {
                commandsContainer.appendChild(noResultsMsg);
            }
        }
        noResultsMsg.style.display = 'block';
    } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

// Add search suggestions functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Add event listeners for search
        searchInput.addEventListener('input', searchCommands);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                searchCommands();
            }
        });
        
        // Add search suggestions click handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('search-suggestion')) {
                searchInput.value = e.target.textContent;
                searchCommands();
            }
        });
    }
});

// Add CSS for loading state
const loadingStyles = `
    body:not(.loaded) {
        overflow: hidden;
    }
    
    body:not(.loaded)::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #0a0a0a;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    body:not(.loaded)::before {
        content: '✨';
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        z-index: 10000;
        animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); }
    }
`;

const loadingStyleSheet = document.createElement('style');
loadingStyleSheet.textContent = loadingStyles;
document.head.appendChild(loadingStyleSheet);
