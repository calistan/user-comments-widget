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
            if (isOpen) {
                closePanel();
            } else {
                openPanel();
            }
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

        // Add classes for animation
        feedbackPanel.classList.add('feedback-widget-panel-open');
        feedbackButton.classList.add('feedback-widget-button-hidden');

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

        // Restore body scroll
        preventBodyScroll(false);

        // Update ARIA attributes
        feedbackPanel.setAttribute('aria-hidden', 'true');
        feedbackButton.setAttribute('aria-expanded', 'false');

        // Remove classes for animation
        feedbackPanel.classList.remove('feedback-widget-panel-open');
        feedbackButton.classList.remove('feedback-widget-button-hidden');

        // Restore focus to previously focused element or feedback button
        setTimeout(() => {
            if (window.feedbackWidgetPreviousFocus &&
                document.contains(window.feedbackWidgetPreviousFocus)) {
                window.feedbackWidgetPreviousFocus.focus();
            } else {
                feedbackButton.focus();
            }
            window.feedbackWidgetPreviousFocus = null;
        }, 100);

        // Reset form and messages after animation
        setTimeout(() => {
            resetForm();
        }, 300);

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
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    /**
     * Dispatch custom widget events
     */
    function dispatchWidgetEvent(eventType) {
        const event = new CustomEvent(`feedbackWidget:${eventType}`, {
            detail: {
                widget: 'feedback',
                timestamp: Date.now(),
                config: config
            }
        });
        window.dispatchEvent(event);
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
            /* CSS Reset for widget elements */
            .feedback-widget-container,
            .feedback-widget-container * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.5;
            }

            /* Main container */
            .feedback-widget-container {
                position: fixed;
                z-index: 999999;
                pointer-events: none;
            }

            /* Floating Button */
            .feedback-widget-button {
                position: fixed;
                z-index: 1000000;
                background: ${config.primaryColor};
                color: white;
                border: none;
                border-radius: 50px;
                padding: 12px 20px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                user-select: none;
                font-size: 14px;
                font-weight: 500;
            }

            .feedback-widget-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            }

            .feedback-widget-button:focus {
                outline: none;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 3px ${config.primaryColor}40;
            }

            .feedback-widget-button:active {
                transform: translateY(0);
                transition-duration: 0.1s;
            }

            .feedback-widget-button-hidden {
                opacity: 0;
                transform: scale(0.8) translateY(-2px);
                pointer-events: none;
            }

            .feedback-widget-button-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .feedback-widget-button-text {
                white-space: nowrap;
            }

            /* Position variants */
            .feedback-widget-bottom-right {
                bottom: 20px;
                right: 20px;
            }

            .feedback-widget-bottom-left {
                bottom: 20px;
                left: 20px;
            }

            .feedback-widget-top-right {
                top: 20px;
                right: 20px;
            }

            .feedback-widget-top-left {
                top: 20px;
                left: 20px;
            }

            /* Feedback Panel */
            .feedback-widget-panel {
                position: fixed;
                z-index: 1000001;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                width: 360px;
                max-width: calc(100vw - 40px);
                max-height: calc(100vh - 40px);
                overflow: hidden;
                transform: scale(0.8) translateY(20px);
                opacity: 0;
                transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
                will-change: transform, opacity;
            }

            .feedback-widget-panel-open {
                transform: scale(1) translateY(0);
                opacity: 1;
                pointer-events: auto;
            }

            .feedback-widget-panel:focus-within {
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 2px ${config.primaryColor}40;
            }

            /* Panel positioning */
            .feedback-widget-panel.feedback-widget-bottom-right {
                bottom: 80px;
                right: 20px;
                transform-origin: bottom right;
            }

            .feedback-widget-panel.feedback-widget-bottom-left {
                bottom: 80px;
                left: 20px;
                transform-origin: bottom left;
            }

            .feedback-widget-panel.feedback-widget-top-right {
                top: 80px;
                right: 20px;
                transform-origin: top right;
            }

            .feedback-widget-panel.feedback-widget-top-left {
                top: 80px;
                left: 20px;
                transform-origin: top left;
            }

            .feedback-widget-panel-content {
                padding: 24px;
            }

            /* Header */
            .feedback-widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .feedback-widget-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin: 0;
            }

            .feedback-widget-close {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 6px;
                color: #6b7280;
                transition: all 0.2s ease;
            }

            .feedback-widget-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            /* Form */
            .feedback-widget-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .feedback-widget-field {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .feedback-widget-label {
                font-size: 14px;
                font-weight: 500;
                color: #374151;
            }

            .feedback-widget-required {
                color: #ef4444;
            }

            .feedback-widget-input,
            .feedback-widget-textarea {
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.2s ease;
                background: white;
                color: #1f2937;
            }

            .feedback-widget-input:focus,
            .feedback-widget-textarea:focus {
                outline: none;
                border-color: ${config.primaryColor};
                box-shadow: 0 0 0 3px ${config.primaryColor}20;
            }

            .feedback-widget-textarea {
                resize: vertical;
                min-height: 80px;
            }

            /* Actions */
            .feedback-widget-actions {
                display: flex;
                gap: 12px;
                margin-top: 8px;
            }

            .feedback-widget-btn {
                padding: 10px 16px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                flex: 1;
            }

            .feedback-widget-btn-secondary {
                background: #f3f4f6;
                color: #374151;
            }

            .feedback-widget-btn-secondary:hover {
                background: #e5e7eb;
            }

            .feedback-widget-btn-primary {
                background: ${config.primaryColor};
                color: white;
            }

            .feedback-widget-btn-primary:hover {
                background: ${config.primaryColor}dd;
            }

            .feedback-widget-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .feedback-widget-loading {
                animation: feedback-widget-spin 1s linear infinite;
            }

            @keyframes feedback-widget-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            /* Messages */
            .feedback-widget-message {
                display: flex;
                gap: 12px;
                padding: 16px;
                border-radius: 8px;
                margin-top: 8px;
            }

            .feedback-widget-success {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                color: #166534;
            }

            .feedback-widget-error {
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
            }

            .feedback-widget-message-icon {
                flex-shrink: 0;
            }

            .feedback-widget-message-content h4 {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 4px;
            }

            .feedback-widget-message-content p {
                font-size: 13px;
                margin: 0;
            }

            /* Mobile responsiveness */
            @media (max-width: 480px) {
                .feedback-widget-panel {
                    width: calc(100vw - 20px);
                    left: 10px !important;
                    right: 10px !important;
                    bottom: 10px !important;
                    top: auto !important;
                    transform-origin: bottom center;
                }

                .feedback-widget-button {
                    padding: 10px 16px;
                    font-size: 13px;
                }

                .feedback-widget-button-text {
                    display: none;
                }

                .feedback-widget-panel-content {
                    padding: 20px;
                }

                .feedback-widget-actions {
                    flex-direction: column;
                }
            }

            /* Dark theme support */
            @media (prefers-color-scheme: dark) {
                .feedback-widget-panel {
                    background: #1f2937;
                    color: #f9fafb;
                }

                .feedback-widget-title {
                    color: #f9fafb;
                }

                .feedback-widget-close {
                    color: #9ca3af;
                }

                .feedback-widget-close:hover {
                    background: #374151;
                    color: #f3f4f6;
                }

                .feedback-widget-label {
                    color: #e5e7eb;
                }

                .feedback-widget-input,
                .feedback-widget-textarea {
                    background: #374151;
                    border-color: #4b5563;
                    color: #f9fafb;
                }

                .feedback-widget-input:focus,
                .feedback-widget-textarea:focus {
                    border-color: ${config.primaryColor};
                }

                .feedback-widget-btn-secondary {
                    background: #374151;
                    color: #e5e7eb;
                }

                .feedback-widget-btn-secondary:hover {
                    background: #4b5563;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // Expose public methods
    window.FeedbackWidget.init = init;
    window.FeedbackWidget.open = openPanel;
    window.FeedbackWidget.close = closePanel;
    
})();
