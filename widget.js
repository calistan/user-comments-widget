/**
 * Feedback Widget - Embeddable feedback collection widget
 * Version: 1.0.0
 * 
 * Usage: <script src="path/to/widget.js"></script>
 *        <script>FeedbackWidget.init(options);</script>
 */

(function() {
    'use strict';
    
    // Namespace to avoid conflicts
    window.FeedbackWidget = window.FeedbackWidget || {};
    
    // Auto-detect environment and set appropriate API URL
    function getDefaultApiUrl() {
        const hostname = window.location.hostname;

        // If running locally (localhost, 127.0.0.1, or file://)
        if (hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '' ||
            window.location.protocol === 'file:') {
            return 'http://localhost:5000/submit_comment';
        }

        // If running in production (any other domain)
        return 'https://user-comments.onrender.com/submit_comment';
    }

    // Default configuration
    const DEFAULT_CONFIG = {
        position: 'bottom-right',
        theme: 'auto',
        primaryColor: '#00C2A8',
        placeholder: 'Share your feedback...',
        title: 'Feedback',
        showEmail: true,
        showName: true,
        apiUrl: getDefaultApiUrl()
    };
    
    // Widget state
    let isOpen = false;
    let config = {};
    let widgetContainer = null;
    let feedbackButton = null;
    let feedbackPanel = null;
    
    /**
     * Initialize the feedback widget
     * @param {Object} options - Configuration options
     */
    function init(options = {}) {
        config = { ...DEFAULT_CONFIG, ...options };

        // Auto-detect website domain
        config.websiteUrl = window.location.origin;
        config.websiteDomain = window.location.hostname;

        // Log environment info for debugging
        const isLocal = config.apiUrl.includes('localhost');
        console.log(`[FeedbackWidget] Initializing in ${isLocal ? 'LOCAL' : 'PRODUCTION'} mode`);
        console.log(`[FeedbackWidget] API URL: ${config.apiUrl}`);
        console.log(`[FeedbackWidget] Website: ${config.websiteUrl}`);

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createWidget);
        } else {
            createWidget();
        }
    }
    
    /**
     * Create the widget HTML structure
     */
    function createWidget() {
        // Create main container
        widgetContainer = document.createElement('div');
        widgetContainer.id = 'feedback-widget-container';
        widgetContainer.className = 'feedback-widget-container';
        
        // Create floating button
        feedbackButton = createFeedbackButton();
        
        // Create feedback panel
        feedbackPanel = createFeedbackPanel();
        
        // Append to container
        widgetContainer.appendChild(feedbackButton);
        widgetContainer.appendChild(feedbackPanel);
        
        // Inject CSS
        injectCSS();
        
        // Append to body
        document.body.appendChild(widgetContainer);
        
        // Set up event listeners
        setupEventListeners();

        // Set up theme detection and listener
        setupThemeListener();
        updateThemeClass(detectTheme());
    }
    
    /**
     * Create the floating feedback button
     */
    function createFeedbackButton() {
        const button = document.createElement('button');
        button.id = 'feedback-widget-button';
        button.className = `feedback-widget-button feedback-widget-${config.position}`;
        button.type = 'button';
        button.setAttribute('aria-label', `Open ${config.title} panel`);
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-haspopup', 'dialog');
        button.innerHTML = `
            <div class="feedback-widget-button-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M8 12H16M8 8H16M8 16H12M21 12C21 16.9706 16.9706 21 12 21C10.2 21 8.5 20.5 7 19.6L3 21L4.4 17C3.5 15.5 3 13.8 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="feedback-widget-button-text">${config.title}</span>
            </div>
        `;
        return button;
    }
    
    /**
     * Create the feedback panel
     */
    function createFeedbackPanel() {
        const panel = document.createElement('div');
        panel.id = 'feedback-widget-panel';
        panel.className = `feedback-widget-panel feedback-widget-${config.position}`;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', 'feedback-widget-title');
        panel.setAttribute('aria-hidden', 'true');

        panel.innerHTML = `
            <div class="feedback-widget-panel-content">
                <div class="feedback-widget-header">
                    <h3 class="feedback-widget-title" id="feedback-widget-title">${config.title}</h3>
                    <button type="button" class="feedback-widget-close" id="feedback-widget-close" aria-label="Close feedback panel">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                
                <form id="feedback-widget-form" class="feedback-widget-form">
                    <div class="feedback-widget-field">
                        <label for="feedback-widget-comment" class="feedback-widget-label">
                            Comment <span class="feedback-widget-required">*</span>
                        </label>
                        <textarea 
                            id="feedback-widget-comment" 
                            name="comment" 
                            class="feedback-widget-textarea" 
                            placeholder="${config.placeholder}"
                            required
                            rows="4"
                        ></textarea>
                    </div>
                    
                    ${config.showName ? `
                    <div class="feedback-widget-field">
                        <label for="feedback-widget-name" class="feedback-widget-label">
                            Name (Optional)
                        </label>
                        <input 
                            type="text" 
                            id="feedback-widget-name" 
                            name="name" 
                            class="feedback-widget-input" 
                            placeholder="Your name"
                        />
                    </div>
                    ` : ''}
                    
                    ${config.showEmail ? `
                    <div class="feedback-widget-field">
                        <label for="feedback-widget-email" class="feedback-widget-label">
                            Email (Optional)
                        </label>
                        <input 
                            type="email" 
                            id="feedback-widget-email" 
                            name="email" 
                            class="feedback-widget-input" 
                            placeholder="your@email.com"
                        />
                    </div>
                    ` : ''}
                    
                    <div class="feedback-widget-actions">
                        <button type="button" class="feedback-widget-btn feedback-widget-btn-secondary" id="feedback-widget-cancel">
                            Cancel
                        </button>
                        <button type="submit" class="feedback-widget-btn feedback-widget-btn-primary" id="feedback-widget-submit">
                            <span class="feedback-widget-submit-text">Send Feedback</span>
                            <span class="feedback-widget-loading" style="display: none;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                        </button>
                    </div>
                </form>
                
                <div id="feedback-widget-success" class="feedback-widget-message feedback-widget-success" style="display: none;">
                    <div class="feedback-widget-message-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="feedback-widget-message-content">
                        <h4>Thank you!</h4>
                        <p>Your feedback has been submitted successfully.</p>
                    </div>
                </div>
                
                <div id="feedback-widget-error" class="feedback-widget-message feedback-widget-error" style="display: none;">
                    <div class="feedback-widget-message-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="feedback-widget-message-content">
                        <h4>Error</h4>
                        <p id="feedback-widget-error-text">Something went wrong. Please try again.</p>
                    </div>
                </div>
            </div>
        `;
        
        return panel;
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Button click to toggle panel
        feedbackButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            togglePanel();
        });

        // Close button
        const closeBtn = document.getElementById('feedback-widget-close');
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closePanel();
        });

        // Cancel button
        const cancelBtn = document.getElementById('feedback-widget-cancel');
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closePanel();
        });

        // Form submission
        const form = document.getElementById('feedback-widget-form');
        form.addEventListener('submit', handleFormSubmit);

        // ESC key to close with improved accessibility
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                closePanel();
                // Return focus to the feedback button
                feedbackButton.focus();
            }
        });

        // Click outside to close with improved detection
        document.addEventListener('click', function(e) {
            if (isOpen && !widgetContainer.contains(e.target)) {
                closePanel();
            }
        });

        // Prevent clicks inside the panel from closing it
        feedbackPanel.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Handle focus trapping when panel is open
        document.addEventListener('keydown', handleFocusTrapping);

        // Handle keyboard navigation for button
        feedbackButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePanel();
            }
        });
    }
    
    /**
     * Toggle the feedback panel open/closed
     */
    function togglePanel() {
        if (isOpen) {
            closePanel();
        } else {
            openPanel();
        }
    }

    /**
     * Open the feedback panel
     */
    function openPanel() {
        if (isOpen) return; // Prevent multiple opens

        isOpen = true;

        // Prevent body scroll
        preventBodyScroll(true);

        // Add ARIA attributes for accessibility
        feedbackPanel.setAttribute('aria-hidden', 'false');
        feedbackButton.setAttribute('aria-expanded', 'true');

        // Add classes for animation with enhanced smooth transitions
        feedbackPanel.classList.add('feedback-widget-panel-opening');
        feedbackButton.classList.add('feedback-widget-button-hidden');

        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
            feedbackPanel.classList.add('feedback-widget-panel-open');
            feedbackPanel.classList.remove('feedback-widget-panel-opening');
        });

        // Store the previously focused element
        window.feedbackWidgetPreviousFocus = document.activeElement;

        // Focus on comment field with proper timing
        setTimeout(() => {
            const commentField = document.getElementById('feedback-widget-comment');
            if (commentField) {
                commentField.focus();
            }
        }, 350); // Slightly longer to ensure animation completes

        // Dispatch custom event
        dispatchWidgetEvent('opened');
    }

    /**
     * Close the feedback panel
     */
    function closePanel() {
        if (!isOpen) return; // Prevent multiple closes

        isOpen = false;

        // Update ARIA attributes
        feedbackPanel.setAttribute('aria-hidden', 'true');
        feedbackButton.setAttribute('aria-expanded', 'false');

        // Add closing animation class for smooth transition
        feedbackPanel.classList.add('feedback-widget-panel-closing');
        feedbackPanel.classList.remove('feedback-widget-panel-open');

        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
            feedbackButton.classList.remove('feedback-widget-button-hidden');
        });

        // Wait for animation to complete before restoring scroll and focus
        setTimeout(() => {
            // Restore body scroll
            preventBodyScroll(false);

            // Remove closing class
            feedbackPanel.classList.remove('feedback-widget-panel-closing');

            // Restore focus to previously focused element or feedback button
            if (window.feedbackWidgetPreviousFocus &&
                document.contains(window.feedbackWidgetPreviousFocus)) {
                window.feedbackWidgetPreviousFocus.focus();
            } else {
                feedbackButton.focus();
            }
            window.feedbackWidgetPreviousFocus = null;

            // Reset form and messages after animation
            resetForm();
        }, 350); // Match animation duration

        // Dispatch custom event
        dispatchWidgetEvent('closed');
    }
    
    /**
     * Handle form submission
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = {
            comment: formData.get('comment'),
            name: formData.get('name') || '',
            email: formData.get('email') || '',
            company: config.websiteDomain, // Auto-detected from website
            website_url: config.websiteUrl
        };

        // Show loading state
        showLoading(true);

        // Submit to backend
        console.log('Submitting feedback:', data);

        // Make actual API call
        fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            showLoading(false);
            showSuccess();
            console.log('Feedback submitted successfully:', result);
        })
        .catch(error => {
            showLoading(false);
            showError('Failed to submit feedback. Please try again.');
            console.error('Error submitting feedback:', error);
        });
    }
    
    /**
     * Show/hide loading state
     */
    function showLoading(loading) {
        const submitBtn = document.getElementById('feedback-widget-submit');
        const submitText = submitBtn.querySelector('.feedback-widget-submit-text');
        const loadingIcon = submitBtn.querySelector('.feedback-widget-loading');
        
        if (loading) {
            submitBtn.disabled = true;
            submitText.style.display = 'none';
            loadingIcon.style.display = 'inline-flex';
        } else {
            submitBtn.disabled = false;
            submitText.style.display = 'inline';
            loadingIcon.style.display = 'none';
        }
    }
    
    /**
     * Show success message
     */
    function showSuccess() {
        const form = document.getElementById('feedback-widget-form');
        const success = document.getElementById('feedback-widget-success');
        
        form.style.display = 'none';
        success.style.display = 'block';
        
        // Auto close after 3 seconds
        setTimeout(() => {
            closePanel();
        }, 3000);
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        const form = document.getElementById('feedback-widget-form');
        const error = document.getElementById('feedback-widget-error');
        const errorText = document.getElementById('feedback-widget-error-text');
        
        errorText.textContent = message;
        form.style.display = 'none';
        error.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            resetForm();
        }, 5000);
    }
    
    /**
     * Reset form and messages
     */
    function resetForm() {
        const form = document.getElementById('feedback-widget-form');
        const success = document.getElementById('feedback-widget-success');
        const error = document.getElementById('feedback-widget-error');

        // Ensure only form is visible
        if (form) form.style.display = 'block';
        if (success) success.style.display = 'none';
        if (error) error.style.display = 'none';

        // Reset form data
        if (form) {
            form.reset();
            showLoading(false);
        }
    }

    /**
     * Prevent or restore body scroll
     */
    function preventBodyScroll(prevent) {
        if (prevent) {
            // Store current scroll position
            window.feedbackWidgetScrollY = window.scrollY;

            // Apply styles to prevent scroll
            document.body.style.position = 'fixed';
            document.body.style.top = `-${window.feedbackWidgetScrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        } else {
            // Restore scroll
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';

            // Restore scroll position
            if (typeof window.feedbackWidgetScrollY === 'number') {
                window.scrollTo(0, window.feedbackWidgetScrollY);
                window.feedbackWidgetScrollY = null;
            }
        }
    }

    /**
     * Handle focus trapping within the widget when open
     */
    function handleFocusTrapping(e) {
        if (!isOpen || e.key !== 'Tab') return;

        const focusableElements = feedbackPanel.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        const focusableArray = Array.from(focusableElements);
        const firstFocusable = focusableArray[0];
        const lastFocusable = focusableArray[focusableArray.length - 1];

        // If no focusable elements, prevent tabbing
        if (focusableArray.length === 0) {
            e.preventDefault();
            return;
        }

        if (e.shiftKey) {
            // Shift + Tab - moving backwards
            if (document.activeElement === firstFocusable || !feedbackPanel.contains(document.activeElement)) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab - moving forwards
            if (document.activeElement === lastFocusable || !feedbackPanel.contains(document.activeElement)) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    /**
     * Dispatch custom widget events
     */
    function dispatchWidgetEvent(eventType, additionalData = {}) {
        const event = new CustomEvent(`feedbackWidget:${eventType}`, {
            detail: {
                widget: 'feedback',
                timestamp: Date.now(),
                config: config,
                ...additionalData
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Detect user's theme preference
     */
    function detectTheme() {
        // Check for explicit theme setting in config
        if (config.theme && config.theme !== 'auto') {
            return config.theme;
        }

        // Auto-detect based on system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    /**
     * Set up theme change listener
     */
    function setupThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            // Listen for theme changes
            const handleThemeChange = (e) => {
                if (config.theme === 'auto' || !config.theme) {
                    updateThemeClass(e.matches ? 'dark' : 'light');
                    dispatchWidgetEvent('themeChanged', { theme: e.matches ? 'dark' : 'light' });
                }
            };

            // Use modern addEventListener if available, fallback for older browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleThemeChange);
            } else {
                // Legacy browsers - suppress deprecation warning as this is intentional fallback
                mediaQuery.addListener(handleThemeChange);
            }
        }
    }

    /**
     * Update theme class on widget container
     */
    function updateThemeClass(theme) {
        if (widgetContainer) {
            widgetContainer.classList.remove('feedback-widget-theme-light', 'feedback-widget-theme-dark');
            widgetContainer.classList.add(`feedback-widget-theme-${theme}`);
        }
    }

    /**
     * Inject CSS styles into the page
     */
    function injectCSS() {
        // Check if styles already injected
        if (document.getElementById('feedback-widget-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'feedback-widget-styles';
        style.textContent = `
            /* ===== COMPREHENSIVE CSS RESET FOR WIDGET ===== */
            .feedback-widget-container,
            .feedback-widget-container *,
            .feedback-widget-container *::before,
            .feedback-widget-container *::after {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                border: 0;
                font-size: 100%;
                font: inherit;
                vertical-align: baseline;
                background: transparent;
                color: inherit;
                text-decoration: none;
                list-style: none;
                outline: none;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
                line-height: 1.5;
            }

            /* Reset form elements specifically */
            .feedback-widget-container input,
            .feedback-widget-container textarea,
            .feedback-widget-container button,
            .feedback-widget-container select {
                font-family: inherit;
                font-size: inherit;
                line-height: inherit;
                color: inherit;
                background: transparent;
                border: none;
                outline: none;
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
            }

            /* Prevent host site styles from interfering */
            .feedback-widget-container {
                all: initial;
                position: fixed !important;
                z-index: 2147483647 !important; /* Maximum safe z-index */
                pointer-events: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif !important;
                font-size: 14px !important;
                line-height: 1.5 !important;
                color: #1f2937 !important;
                text-align: left !important;
                direction: ltr !important;
            }

            /* ===== MOBILE-FIRST FLOATING BUTTON ===== */
            .feedback-widget-button {
                position: fixed !important;
                z-index: 2147483646 !important; /* Just below container */
                background: ${config.primaryColor} !important;
                color: white !important;
                border: none !important;
                border-radius: 50px !important;
                cursor: pointer !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                pointer-events: auto !important;
                user-select: none !important;
                font-weight: 500 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                text-align: center !important;
                white-space: nowrap !important;

                /* Mobile-first sizing */
                padding: 12px !important;
                font-size: 0 !important; /* Hide text on mobile by default */
                width: 56px !important;
                height: 56px !important;
                min-width: 56px !important;
                min-height: 56px !important;
            }

            /* Button interaction states */
            .feedback-widget-button:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15) !important;
                background: ${config.primaryColor}dd !important;
            }

            .feedback-widget-button:focus {
                outline: none !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 3px ${config.primaryColor}40 !important;
            }

            .feedback-widget-button:active {
                transform: translateY(0) !important;
                transition-duration: 0.1s !important;
            }

            .feedback-widget-button-hidden {
                opacity: 0 !important;
                transform: scale(0.8) translateY(-2px) !important;
                pointer-events: none !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            /* Button content layout */
            .feedback-widget-button-content {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 8px !important;
                width: 100% !important;
                height: 100% !important;
            }

            /* Button text - hidden on mobile by default */
            .feedback-widget-button-text {
                display: none !important;
                white-space: nowrap !important;
                font-size: 14px !important;
                font-weight: 500 !important;
            }

            /* Button icon */
            .feedback-widget-button svg {
                width: 20px !important;
                height: 20px !important;
                flex-shrink: 0 !important;
            }

            /* ===== MOBILE-FIRST POSITION VARIANTS ===== */
            /* Mobile positioning - always bottom center for better UX */
            .feedback-widget-bottom-right,
            .feedback-widget-bottom-left,
            .feedback-widget-top-right,
            .feedback-widget-top-left {
                bottom: 16px !important;
                right: 16px !important;
                left: auto !important;
                top: auto !important;
            }

            /* ===== MOBILE-FIRST FEEDBACK PANEL ===== */
            .feedback-widget-panel {
                position: fixed !important;
                z-index: 2147483645 !important; /* Below button */
                background: white !important;
                border-radius: 12px !important;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1) !important;
                overflow: hidden !important;
                transform: scale(0.8) translateY(20px) !important;
                opacity: 0 !important;
                transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
                pointer-events: none !important;
                will-change: transform, opacity !important;
                visibility: hidden !important;

                /* Mobile-first sizing - full width with margins */
                width: calc(100vw - 32px) !important;
                max-width: calc(100vw - 32px) !important;
                max-height: calc(100vh - 100px) !important;
                left: 16px !important;
                right: 16px !important;
                bottom: 80px !important;
                top: auto !important;
                transform-origin: bottom center !important;
            }

            /* Panel animation states */
            .feedback-widget-panel-opening {
                visibility: visible !important;
                pointer-events: auto !important;
            }

            .feedback-widget-panel-open {
                transform: scale(1) translateY(0) !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                visibility: visible !important;
            }

            .feedback-widget-panel-closing {
                transform: scale(0.8) translateY(20px) !important;
                opacity: 0 !important;
                pointer-events: none !important;
                transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            .feedback-widget-panel:focus-within {
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 2px ${config.primaryColor}40 !important;
            }

            /* Mobile-first panel positioning - all positions use bottom center on mobile */
            .feedback-widget-panel.feedback-widget-bottom-right,
            .feedback-widget-panel.feedback-widget-bottom-left,
            .feedback-widget-panel.feedback-widget-top-right,
            .feedback-widget-panel.feedback-widget-top-left {
                bottom: 80px !important;
                left: 16px !important;
                right: 16px !important;
                top: auto !important;
                transform-origin: bottom center !important;
            }

            /* ===== MOBILE-FIRST PANEL CONTENT ===== */
            .feedback-widget-panel-content {
                padding: 20px !important;
                height: 100% !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }

            /* Header */
            .feedback-widget-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 16px !important;
                flex-shrink: 0 !important;
            }

            .feedback-widget-title {
                font-size: 18px !important;
                font-weight: 600 !important;
                color: #1f2937 !important;
                margin: 0 !important;
                line-height: 1.3 !important;
            }

            .feedback-widget-close {
                background: none !important;
                border: none !important;
                cursor: pointer !important;
                padding: 8px !important;
                border-radius: 6px !important;
                color: #6b7280 !important;
                transition: all 0.2s ease !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                min-width: 32px !important;
                min-height: 32px !important;
                flex-shrink: 0 !important;
            }

            .feedback-widget-close:hover {
                background: #f3f4f6 !important;
                color: #374151 !important;
            }

            .feedback-widget-close:focus {
                outline: none !important;
                box-shadow: 0 0 0 2px ${config.primaryColor}40 !important;
            }

            /* ===== MOBILE-FIRST FORM STYLES ===== */
            .feedback-widget-form {
                display: flex !important;
                flex-direction: column !important;
                gap: 16px !important;
                flex: 1 !important;
                min-height: 0 !important;
            }

            .feedback-widget-field {
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
            }

            .feedback-widget-label {
                font-size: 14px !important;
                font-weight: 500 !important;
                color: #374151 !important;
                line-height: 1.4 !important;
            }

            .feedback-widget-required {
                color: #ef4444 !important;
            }

            .feedback-widget-input,
            .feedback-widget-textarea {
                padding: 12px !important;
                border: 1px solid #d1d5db !important;
                border-radius: 8px !important;
                font-size: 16px !important; /* Prevent zoom on iOS */
                transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
                background: white !important;
                color: #1f2937 !important;
                width: 100% !important;
                -webkit-appearance: none !important;
                appearance: none !important;
            }

            .feedback-widget-input:focus,
            .feedback-widget-textarea:focus {
                outline: none !important;
                border-color: ${config.primaryColor} !important;
                box-shadow: 0 0 0 3px ${config.primaryColor}20 !important;
            }

            .feedback-widget-textarea {
                resize: vertical !important;
                min-height: 80px !important;
                max-height: 120px !important;
                font-family: inherit !important;
            }

            /* ===== MOBILE-FIRST ACTIONS ===== */
            .feedback-widget-actions {
                display: flex !important;
                gap: 12px !important;
                margin-top: 16px !important;
                flex-shrink: 0 !important;
                /* Mobile: stack buttons vertically for better touch targets */
                flex-direction: column !important;
            }

            .feedback-widget-btn {
                padding: 14px 16px !important; /* Larger touch targets on mobile */
                border-radius: 8px !important;
                font-size: 16px !important; /* Prevent zoom on iOS */
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                border: none !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                width: 100% !important;
                min-height: 48px !important; /* Minimum touch target size */
                text-align: center !important;
                -webkit-appearance: none !important;
                appearance: none !important;
            }

            .feedback-widget-btn-secondary {
                background: #f3f4f6 !important;
                color: #374151 !important;
                border: 1px solid #e5e7eb !important;
            }

            .feedback-widget-btn-secondary:hover {
                background: #e5e7eb !important;
            }

            .feedback-widget-btn-primary {
                background: ${config.primaryColor} !important;
                color: white !important;
            }

            .feedback-widget-btn-primary:hover {
                background: ${config.primaryColor}dd !important;
            }

            .feedback-widget-btn:disabled {
                opacity: 0.6 !important;
                cursor: not-allowed !important;
            }

            .feedback-widget-btn:focus {
                outline: none !important;
                box-shadow: 0 0 0 3px ${config.primaryColor}40 !important;
            }

            .feedback-widget-loading {
                animation: feedback-widget-spin 1s linear infinite !important;
            }

            @keyframes feedback-widget-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            /* ===== MOBILE-FIRST MESSAGES ===== */
            .feedback-widget-message {
                display: flex !important;
                gap: 12px !important;
                padding: 16px !important;
                border-radius: 8px !important;
                margin-top: 16px !important;
                align-items: flex-start !important;
            }

            .feedback-widget-success {
                background: #f0fdf4 !important;
                border: 1px solid #bbf7d0 !important;
                color: #166534 !important;
            }

            .feedback-widget-error {
                background: #fef2f2 !important;
                border: 1px solid #fecaca !important;
                color: #dc2626 !important;
            }

            .feedback-widget-message-icon {
                flex-shrink: 0 !important;
                margin-top: 2px !important;
            }

            .feedback-widget-message-content h4 {
                font-size: 14px !important;
                font-weight: 600 !important;
                margin-bottom: 4px !important;
                line-height: 1.3 !important;
            }

            .feedback-widget-message-content p {
                font-size: 13px !important;
                margin: 0 !important;
                line-height: 1.4 !important;
            }

            /* ===== RESPONSIVE BREAKPOINTS ===== */

            /* Tablet styles (768px and up) */
            @media (min-width: 768px) {
                .feedback-widget-button {
                    padding: 12px 16px !important;
                    width: auto !important;
                    height: auto !important;
                    min-width: 48px !important;
                    min-height: 48px !important;
                }

                .feedback-widget-button-text {
                    display: inline !important;
                    font-size: 14px !important;
                }

                .feedback-widget-panel {
                    width: 380px !important;
                    max-width: calc(100vw - 40px) !important;
                    left: auto !important;
                    right: 20px !important;
                    bottom: 80px !important;
                }

                .feedback-widget-panel-content {
                    padding: 24px !important;
                }

                .feedback-widget-actions {
                    flex-direction: row !important;
                }

                .feedback-widget-btn {
                    padding: 12px 16px !important;
                    font-size: 14px !important;
                    min-height: 44px !important;
                    flex: 1 !important;
                }

                .feedback-widget-input,
                .feedback-widget-textarea {
                    font-size: 14px !important;
                }
            }

            /* Desktop styles (1024px and up) */
            @media (min-width: 1024px) {
                .feedback-widget-button {
                    padding: 12px 20px !important;
                }

                .feedback-widget-panel {
                    width: 400px !important;
                }

                /* Position-specific styles for desktop */
                .feedback-widget-bottom-right {
                    bottom: 20px !important;
                    right: 20px !important;
                    left: auto !important;
                    top: auto !important;
                }

                .feedback-widget-bottom-left {
                    bottom: 20px !important;
                    left: 20px !important;
                    right: auto !important;
                    top: auto !important;
                }

                .feedback-widget-top-right {
                    top: 20px !important;
                    right: 20px !important;
                    left: auto !important;
                    bottom: auto !important;
                }

                .feedback-widget-top-left {
                    top: 20px !important;
                    left: 20px !important;
                    right: auto !important;
                    bottom: auto !important;
                }

                /* Panel positioning for desktop */
                .feedback-widget-panel.feedback-widget-bottom-right {
                    bottom: 80px !important;
                    right: 20px !important;
                    left: auto !important;
                    top: auto !important;
                    transform-origin: bottom right !important;
                }

                .feedback-widget-panel.feedback-widget-bottom-left {
                    bottom: 80px !important;
                    left: 20px !important;
                    right: auto !important;
                    top: auto !important;
                    transform-origin: bottom left !important;
                }

                .feedback-widget-panel.feedback-widget-top-right {
                    top: 80px !important;
                    right: 20px !important;
                    left: auto !important;
                    bottom: auto !important;
                    transform-origin: top right !important;
                }

                .feedback-widget-panel.feedback-widget-top-left {
                    top: 80px !important;
                    left: 20px !important;
                    right: auto !important;
                    bottom: auto !important;
                    transform-origin: top left !important;
                }
            }

            /* ===== ENHANCED DARK THEME SUPPORT ===== */
            @media (prefers-color-scheme: dark) {
                .feedback-widget-panel {
                    background: #1f2937 !important;
                    color: #f9fafb !important;
                    border: 1px solid #374151 !important;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2) !important;
                }

                .feedback-widget-title {
                    color: #f9fafb !important;
                }

                .feedback-widget-close {
                    color: #9ca3af !important;
                }

                .feedback-widget-close:hover {
                    background: #374151 !important;
                    color: #f3f4f6 !important;
                }

                .feedback-widget-label {
                    color: #e5e7eb !important;
                }

                .feedback-widget-input,
                .feedback-widget-textarea {
                    background: #374151 !important;
                    border-color: #4b5563 !important;
                    color: #f9fafb !important;
                }

                .feedback-widget-input:focus,
                .feedback-widget-textarea:focus {
                    border-color: ${config.primaryColor} !important;
                    background: #374151 !important;
                }

                .feedback-widget-input::placeholder,
                .feedback-widget-textarea::placeholder {
                    color: #9ca3af !important;
                }

                .feedback-widget-btn-secondary {
                    background: #374151 !important;
                    color: #e5e7eb !important;
                    border-color: #4b5563 !important;
                }

                .feedback-widget-btn-secondary:hover {
                    background: #4b5563 !important;
                }

                .feedback-widget-success {
                    background: #064e3b !important;
                    border-color: #065f46 !important;
                    color: #a7f3d0 !important;
                }

                .feedback-widget-error {
                    background: #7f1d1d !important;
                    border-color: #991b1b !important;
                    color: #fca5a5 !important;
                }
            }

            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .feedback-widget-panel {
                    border: 2px solid currentColor !important;
                }

                .feedback-widget-input,
                .feedback-widget-textarea {
                    border: 2px solid currentColor !important;
                }

                .feedback-widget-btn {
                    border: 2px solid currentColor !important;
                }
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .feedback-widget-button,
                .feedback-widget-panel,
                .feedback-widget-btn,
                .feedback-widget-input,
                .feedback-widget-textarea,
                .feedback-widget-close {
                    transition: none !important;
                    animation: none !important;
                }

                .feedback-widget-loading {
                    animation: none !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // Expose public methods
    window.FeedbackWidget.init = init;
    window.FeedbackWidget.open = openPanel;
    window.FeedbackWidget.close = closePanel;
    window.FeedbackWidget.toggle = togglePanel;
    window.FeedbackWidget.isOpen = () => isOpen;
    
})();
