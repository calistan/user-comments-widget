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
        return 'https://user-comments-backend.onrender.com/submit_comment';
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

    // Rate limiting state
    let lastSubmissionTime = 0;
    let submissionCount = 0;
    let isSubmitting = false;

    // Retry logic state
    let retryAttempts = 0;
    const MAX_RETRY_ATTEMPTS = 3;
    const RETRY_DELAYS = [1000, 2000, 4000]; // Progressive delays in ms
    
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

        // Set up viewport change listeners for mobile height adjustment
        setupViewportListeners();

        // Initial mobile height adjustment
        adjustMobileHeight();

        // Ensure form is in correct initial state
        ensureInitialFormState();
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

                    <!-- Honeypot field for spam prevention -->
                    <div class="feedback-widget-honeypot" style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">
                        <label for="feedback-widget-website">Website (leave blank)</label>
                        <input
                            type="text"
                            id="feedback-widget-website"
                            name="website"
                            tabindex="-1"
                            autocomplete="off"
                        />
                    </div>
                    
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

        // Set up real-time validation after panel is created
        setTimeout(setupRealTimeValidation, 100);
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

        // Adjust mobile height before opening
        adjustMobileHeight();

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
     * Validate email format
     */
    function validateEmail(email) {
        if (!email) return true; // Email is optional

        // RFC 5322 compliant email regex (simplified but robust)
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Validate comment content
     */
    function validateComment(comment) {
        if (!comment || !comment.trim()) {
            return { valid: false, message: 'Comment is required.' };
        }

        const trimmed = comment.trim();

        if (trimmed.length < 3) {
            return { valid: false, message: 'Comment must be at least 3 characters long.' };
        }

        if (trimmed.length > 2000) {
            return { valid: false, message: 'Comment must be less than 2000 characters.' };
        }

        // Check for spam patterns
        const spamPatterns = [
            /(.)\1{10,}/, // Repeated characters
            /^[A-Z\s!]{20,}$/, // All caps
            /(https?:\/\/[^\s]+.*){3,}/, // Multiple URLs
        ];

        for (const pattern of spamPatterns) {
            if (pattern.test(trimmed)) {
                return { valid: false, message: 'Comment appears to be spam. Please provide genuine feedback.' };
            }
        }

        return { valid: true };
    }

    /**
     * Validate name field
     */
    function validateName(name) {
        if (!name) return { valid: true }; // Name is optional

        const trimmed = name.trim();

        if (trimmed.length > 100) {
            return { valid: false, message: 'Name must be less than 100 characters.' };
        }

        // Basic name validation (letters, spaces, hyphens, apostrophes)
        const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
        if (!nameRegex.test(trimmed)) {
            return { valid: false, message: 'Name contains invalid characters.' };
        }

        return { valid: true };
    }

    /**
     * Check rate limiting
     */
    function checkRateLimit() {
        const now = Date.now();
        const timeSinceLastSubmission = now - lastSubmissionTime;

        // Prevent double submissions (within 2 seconds)
        if (timeSinceLastSubmission < 2000) {
            return { allowed: false, message: 'Please wait before submitting again.' };
        }

        // Reset submission count every hour
        if (timeSinceLastSubmission > 3600000) { // 1 hour
            submissionCount = 0;
        }

        // Limit to 5 submissions per hour
        if (submissionCount >= 5) {
            return { allowed: false, message: 'Too many submissions. Please try again later.' };
        }

        return { allowed: true };
    }

    /**
     * Show field validation error
     */
    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Remove existing error
        const existingError = field.parentNode.querySelector('.feedback-widget-field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error styling
        field.classList.add('feedback-widget-field-invalid');

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'feedback-widget-field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);

        // Focus the field
        field.focus();
    }

    /**
     * Clear field validation errors
     */
    function clearFieldErrors() {
        const fields = ['feedback-widget-comment', 'feedback-widget-name', 'feedback-widget-email'];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.remove('feedback-widget-field-invalid');
                const error = field.parentNode.querySelector('.feedback-widget-field-error');
                if (error) {
                    error.remove();
                }
            }
        });
    }

    /**
     * Clear validation error for a specific field
     */
    function clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('feedback-widget-field-invalid');
            const error = field.parentNode.querySelector('.feedback-widget-field-error');
            if (error) {
                error.remove();
            }
        }
    }

    /**
     * Set up real-time validation for form fields
     */
    function setupRealTimeValidation() {
        const commentField = document.getElementById('feedback-widget-comment');
        const nameField = document.getElementById('feedback-widget-name');
        const emailField = document.getElementById('feedback-widget-email');

        // Real-time comment validation
        if (commentField) {
            // Validate on blur (when user leaves field)
            commentField.addEventListener('blur', function() {
                const value = this.value;
                clearFieldError('feedback-widget-comment');

                if (value.trim()) { // Only validate if not empty (required check happens on submit)
                    const validation = validateComment(value);
                    if (!validation.valid) {
                        showFieldError('feedback-widget-comment', validation.message);
                    }
                }
            });

            // Clear error on input (when user starts typing)
            commentField.addEventListener('input', function() {
                if (this.classList.contains('feedback-widget-field-invalid')) {
                    clearFieldError('feedback-widget-comment');
                }
            });
        }

        // Real-time name validation
        if (nameField) {
            nameField.addEventListener('blur', function() {
                const value = this.value;
                clearFieldError('feedback-widget-name');

                if (value.trim()) { // Only validate if not empty (name is optional)
                    const validation = validateName(value);
                    if (!validation.valid) {
                        showFieldError('feedback-widget-name', validation.message);
                    }
                }
            });

            nameField.addEventListener('input', function() {
                if (this.classList.contains('feedback-widget-field-invalid')) {
                    clearFieldError('feedback-widget-name');
                }
            });
        }

        // Real-time email validation
        if (emailField) {
            emailField.addEventListener('blur', function() {
                const value = this.value;
                clearFieldError('feedback-widget-email');

                if (value.trim()) { // Only validate if not empty (email is optional)
                    if (!validateEmail(value)) {
                        showFieldError('feedback-widget-email', 'Please enter a valid email address.');
                    }
                }
            });

            emailField.addEventListener('input', function() {
                if (this.classList.contains('feedback-widget-field-invalid')) {
                    clearFieldError('feedback-widget-email');
                }
            });
        }

        console.log('[FeedbackWidget] Real-time validation set up');
    }

    /**
     * Handle form submission with comprehensive validation
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting) {
            console.log('[FeedbackWidget] Submission already in progress');
            return;
        }

        // Clear previous errors
        clearFieldErrors();

        // Get form data
        const formData = new FormData(e.target);
        const comment = formData.get('comment') || '';
        const name = formData.get('name') || '';
        const email = formData.get('email') || '';
        const honeypot = formData.get('website') || '';

        // Honeypot spam check - if filled, it's likely a bot
        if (honeypot.trim() !== '') {
            console.log('[FeedbackWidget] Honeypot triggered - potential spam bot detected');
            showError('Submission failed. Please try again.');
            return;
        }

        // Validate comment (required)
        const commentValidation = validateComment(comment);
        if (!commentValidation.valid) {
            showFieldError('feedback-widget-comment', commentValidation.message);
            return;
        }

        // Validate name (optional)
        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
            showFieldError('feedback-widget-name', nameValidation.message);
            return;
        }

        // Validate email (optional)
        if (!validateEmail(email)) {
            showFieldError('feedback-widget-email', 'Please enter a valid email address.');
            return;
        }

        // Check rate limiting
        const rateLimitCheck = checkRateLimit();
        if (!rateLimitCheck.allowed) {
            showError(rateLimitCheck.message);
            return;
        }

        // Prepare submission data with auto-detected info
        const data = {
            comment: comment.trim(),
            name: name.trim(),
            email: email.trim(),
            company: config.websiteDomain, // Auto-detected from website
            website_url: config.websiteUrl,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            widget_version: '1.0.0'
        };

        // Set submission state
        isSubmitting = true;
        lastSubmissionTime = Date.now();
        submissionCount++;

        // Show loading state
        showLoading(true);

        console.log('[FeedbackWidget] Submitting feedback:', {
            ...data,
            user_agent: '[REDACTED]' // Don't log full user agent
        });

        // Submit to backend with CORS handling and retry logic
        submitWithRetry(data);
    }

    /**
     * Submit data with retry logic and CORS handling
     */
    function submitWithRetry(data, attemptNumber = 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        // Enhanced headers for CORS and better compatibility
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest', // Helps with CORS preflight
            'X-Widget-Version': data.widget_version || '1.0.0',
            'X-Widget-Origin': config.websiteDomain || 'unknown'
        };

        // Add CORS mode and credentials handling
        const fetchOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
            signal: controller.signal,
            mode: 'cors', // Explicitly set CORS mode
            credentials: 'omit', // Don't send cookies for security
            cache: 'no-cache' // Prevent caching of submissions
        };

        console.log(`[FeedbackWidget] Submission attempt ${attemptNumber + 1}/${MAX_RETRY_ATTEMPTS + 1}`);

        fetch(config.apiUrl, fetchOptions)
        .then(response => {
            clearTimeout(timeoutId);

            // Handle CORS errors
            if (!response.ok) {
                if (response.status === 0) {
                    throw new Error('CORS_ERROR: Cross-origin request blocked');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response.json();
        })
        .then(result => {
            // Success - reset retry counter and show success
            retryAttempts = 0;
            isSubmitting = false;
            showLoading(false);

            // Reset form and show success
            resetFormData();
            showSuccess();

            console.log('[FeedbackWidget] Feedback submitted successfully:', result);

            // Dispatch success event
            dispatchWidgetEvent('submitted', {
                success: true,
                attempt: attemptNumber + 1,
                data: {
                    comment: data.comment,
                    name: data.name,
                    email: data.email ? '[PROVIDED]' : '[NOT PROVIDED]'
                }
            });
        })
        .catch(error => {
            clearTimeout(timeoutId);

            console.error(`[FeedbackWidget] Submission attempt ${attemptNumber + 1} failed:`, error);

            // Determine if we should retry
            const shouldRetry = shouldRetrySubmission(error, attemptNumber);

            if (shouldRetry) {
                const delay = RETRY_DELAYS[attemptNumber] || 4000;
                console.log(`[FeedbackWidget] Retrying in ${delay}ms...`);

                // Show retry message to user
                showRetryMessage(attemptNumber + 1, MAX_RETRY_ATTEMPTS + 1);

                setTimeout(() => {
                    submitWithRetry(data, attemptNumber + 1);
                }, delay);
            } else {
                // All retries exhausted or non-retryable error
                retryAttempts = 0;
                isSubmitting = false;
                showLoading(false);

                const errorMessage = getErrorMessage(error, attemptNumber);
                showError(errorMessage);

                // Dispatch error event
                dispatchWidgetEvent('submitError', {
                    error: error.message,
                    attempts: attemptNumber + 1,
                    finalError: true,
                    data: {
                        comment: data.comment,
                        name: data.name,
                        email: data.email ? '[PROVIDED]' : '[NOT PROVIDED]'
                    }
                });
            }
        });
    }

    /**
     * Determine if submission should be retried based on error type
     */
    function shouldRetrySubmission(error, attemptNumber) {
        // Don't retry if we've exceeded max attempts
        if (attemptNumber >= MAX_RETRY_ATTEMPTS) {
            return false;
        }

        // Retry for network errors, timeouts, and server errors
        const retryableErrors = [
            'Failed to fetch', // Network error
            'AbortError', // Timeout
            'CORS_ERROR', // CORS issues
            'HTTP 500', // Server error
            'HTTP 502', // Bad gateway
            'HTTP 503', // Service unavailable
            'HTTP 504', // Gateway timeout
        ];

        return retryableErrors.some(retryableError =>
            error.message.includes(retryableError) || error.name === retryableError
        );
    }

    /**
     * Get user-friendly error message based on error type and attempts
     */
    function getErrorMessage(error, attemptNumber) {
        const totalAttempts = attemptNumber + 1;

        if (error.name === 'AbortError') {
            return `Request timed out after ${totalAttempts} attempt${totalAttempts > 1 ? 's' : ''}. Please check your connection and try again.`;
        } else if (error.message.includes('Failed to fetch') || error.message.includes('CORS_ERROR')) {
            return `Network error after ${totalAttempts} attempt${totalAttempts > 1 ? 's' : ''}. Please check your connection and try again.`;
        } else if (error.message.includes('HTTP 429')) {
            return 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('HTTP 4')) {
            return 'Invalid request. Please check your input and try again.';
        } else if (error.message.includes('HTTP 5')) {
            return `Server error after ${totalAttempts} attempt${totalAttempts > 1 ? 's' : ''}. Please try again later.`;
        } else {
            return `Failed to submit feedback after ${totalAttempts} attempt${totalAttempts > 1 ? 's' : ''}. Please try again.`;
        }
    }

    /**
     * Show retry message to user
     */
    function showRetryMessage(currentAttempt, maxAttempts) {
        const form = document.getElementById('feedback-widget-form');
        if (form) {
            // Create or update retry message
            let retryMessage = document.getElementById('feedback-widget-retry-message');
            if (!retryMessage) {
                retryMessage = document.createElement('div');
                retryMessage.id = 'feedback-widget-retry-message';
                retryMessage.className = 'feedback-widget-retry-message';
                form.appendChild(retryMessage);
            }

            retryMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: #f59e0b; font-size: 13px; margin-top: 8px;">
                    <div class="feedback-widget-spinner" style="width: 12px; height: 12px;"></div>
                    <span>Retrying... (${currentAttempt}/${maxAttempts})</span>
                </div>
            `;
            retryMessage.style.display = 'block';

            // Hide retry message after a moment
            setTimeout(() => {
                if (retryMessage) {
                    retryMessage.style.display = 'none';
                }
            }, 3000);
        }
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
        const error = document.getElementById('feedback-widget-error');

        // Hide form and error, show success
        if (form) {
            form.style.display = 'none';
            form.style.visibility = 'hidden';
        }
        if (error) {
            error.style.display = 'none';
            error.style.visibility = 'hidden';
        }
        if (success) {
            success.style.display = 'block';
            success.style.visibility = 'visible';
        }

        console.log('[FeedbackWidget] Success message shown');

        // Auto close after 3 seconds and reset form
        setTimeout(() => {
            closePanel();
            // Reset form after closing for next use
            setTimeout(() => {
                resetForm();
            }, 500);
        }, 3000);
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        const form = document.getElementById('feedback-widget-form');
        const success = document.getElementById('feedback-widget-success');
        const error = document.getElementById('feedback-widget-error');
        const errorText = document.getElementById('feedback-widget-error-text');

        // Hide form and success, show error
        if (form) {
            form.style.display = 'none';
            form.style.visibility = 'hidden';
        }
        if (success) {
            success.style.display = 'none';
            success.style.visibility = 'hidden';
        }
        if (error && errorText) {
            errorText.textContent = message;
            error.style.display = 'block';
            error.style.visibility = 'visible';
        }

        console.log('[FeedbackWidget] Error message shown:', message);

        // Auto hide after 5 seconds
        setTimeout(() => {
            resetForm();
        }, 5000);
    }
    
    /**
     * Reset form data only (keep form visible)
     */
    function resetFormData() {
        const form = document.getElementById('feedback-widget-form');

        if (form) {
            form.reset();
            showLoading(false);
        }

        // Clear any field errors
        clearFieldErrors();

        console.log('[FeedbackWidget] Form data reset');
    }

    /**
     * Reset form and messages (full reset)
     */
    function resetForm() {
        const form = document.getElementById('feedback-widget-form');
        const success = document.getElementById('feedback-widget-success');
        const error = document.getElementById('feedback-widget-error');

        // Ensure only form is visible
        if (form) {
            form.style.display = 'block';
            form.style.visibility = 'visible';
        }
        if (success) {
            success.style.display = 'none';
            success.style.visibility = 'hidden';
        }
        if (error) {
            error.style.display = 'none';
            error.style.visibility = 'hidden';
        }

        // Reset form data and clear errors
        resetFormData();

        console.log('[FeedbackWidget] Full form reset');
    }

    /**
     * Ensure form is in correct initial state (called after widget creation)
     */
    function ensureInitialFormState() {
        // Wait for DOM elements to be available
        setTimeout(() => {
            const form = document.getElementById('feedback-widget-form');
            const success = document.getElementById('feedback-widget-success');
            const error = document.getElementById('feedback-widget-error');

            // Force initial state - form visible, messages hidden
            if (form) {
                form.style.display = 'block';
                form.style.visibility = 'visible';
            }
            if (success) {
                success.style.display = 'none';
                success.style.visibility = 'hidden';
            }
            if (error) {
                error.style.display = 'none';
                error.style.visibility = 'hidden';
            }

            console.log('[FeedbackWidget] Initial form state ensured');
        }, 50); // Small delay to ensure DOM is ready
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
     * Adjust widget height for mobile devices based on viewport
     */
    function adjustMobileHeight() {
        if (!feedbackPanel || window.innerWidth >= 768) return;

        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Very conservative approach for small screens
        let maxHeight, topMargin, bottomMargin;

        if (viewportHeight < 500) {
            // Landscape phones or very small screens
            maxHeight = Math.max(300, viewportHeight - 80);
            topMargin = 20;
            bottomMargin = 20;
        } else if (viewportHeight < 600) {
            // Small portrait phones
            maxHeight = Math.max(400, viewportHeight - 120);
            topMargin = 40;
            bottomMargin = 40;
        } else {
            // Standard mobile screens
            maxHeight = Math.max(500, viewportHeight - 160);
            topMargin = 60;
            bottomMargin = 80;
        }

        // Apply dynamic styles
        feedbackPanel.style.setProperty('max-height', `${maxHeight}px`, 'important');
        feedbackPanel.style.setProperty('top', `${topMargin}px`, 'important');
        feedbackPanel.style.setProperty('bottom', `${bottomMargin}px`, 'important');

        // Log for debugging
        console.log(`[FeedbackWidget] Mobile height adjusted: ${viewportWidth}x${viewportHeight} -> maxHeight: ${maxHeight}px`);
    }

    /**
     * Handle viewport changes (resize, orientation change)
     */
    function handleViewportChange() {
        // Debounce rapid resize events
        clearTimeout(window.feedbackWidgetResizeTimeout);
        window.feedbackWidgetResizeTimeout = setTimeout(() => {
            adjustMobileHeight();
            dispatchWidgetEvent('viewportChanged', {
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768
            });
        }, 100);
    }

    /**
     * Set up viewport change listeners
     */
    function setupViewportListeners() {
        // Listen for window resize
        window.addEventListener('resize', handleViewportChange);

        // Listen for orientation change (mobile devices)
        window.addEventListener('orientationchange', () => {
            // Delay to allow orientation change to complete
            setTimeout(handleViewportChange, 200);
        });

        // Listen for visual viewport changes (mobile keyboard, etc.)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
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

                /* Mobile-first sizing with safe margins and reduced height */
                width: calc(100vw - 32px) !important;
                max-width: calc(100vw - 32px) !important;
                max-height: calc(100vh - 160px) !important; /* Reduced from 100px to 160px for safety */
                left: 16px !important;
                right: 16px !important;
                bottom: 80px !important;
                top: 60px !important; /* Add safe top margin */
                transform-origin: center !important; /* Changed from bottom center */
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
                max-height: 100% !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
                display: flex !important;
                flex-direction: column !important;
                box-sizing: border-box !important;
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

            /* ===== FORM VALIDATION STYLES ===== */
            .feedback-widget-field-invalid {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
            }

            .feedback-widget-field-error {
                color: #ef4444 !important;
                font-size: 12px !important;
                margin-top: 4px !important;
                display: flex !important;
                align-items: center !important;
                gap: 4px !important;
                line-height: 1.3 !important;
            }

            .feedback-widget-field-error::before {
                content: "⚠" !important;
                font-size: 10px !important;
            }

            /* ===== HONEYPOT FIELD (SPAM PREVENTION) ===== */
            .feedback-widget-honeypot {
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                opacity: 0 !important;
                pointer-events: none !important;
                visibility: hidden !important;
                width: 0 !important;
                height: 0 !important;
                overflow: hidden !important;
                z-index: -1 !important;
            }

            .feedback-widget-honeypot input {
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                opacity: 0 !important;
                width: 0 !important;
                height: 0 !important;
                border: none !important;
                background: transparent !important;
                color: transparent !important;
                font-size: 0 !important;
                line-height: 0 !important;
                outline: none !important;
                box-shadow: none !important;
            }

            /* ===== RETRY MESSAGE STYLING ===== */
            .feedback-widget-retry-message {
                background: #fffbeb !important;
                border: 1px solid #fcd34d !important;
                border-radius: 6px !important;
                padding: 8px 12px !important;
                margin-top: 8px !important;
                font-size: 13px !important;
                color: #92400e !important;
                display: none !important;
                animation: fadeIn 0.3s ease-in-out !important;
            }

            .feedback-widget-retry-message .feedback-widget-spinner {
                border: 2px solid #fcd34d !important;
                border-top: 2px solid #f59e0b !important;
                border-radius: 50% !important;
                animation: spin 1s linear infinite !important;
                display: inline-block !important;
                flex-shrink: 0 !important;
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
                gap: 12px !important;
                padding: 16px !important;
                border-radius: 8px !important;
                margin-top: 16px !important;
                align-items: flex-start !important;
                /* Default hidden state */
                display: none !important;
                visibility: hidden !important;
            }

            /* Only show messages when explicitly displayed */
            .feedback-widget-message[style*="display: block"] {
                display: flex !important;
                visibility: visible !important;
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

            /* Very small screens (height < 600px) - Extra conservative */
            @media (max-height: 600px) {
                .feedback-widget-panel {
                    max-height: calc(100vh - 120px) !important;
                    top: 40px !important;
                    bottom: 40px !important;
                }

                .feedback-widget-panel-content {
                    padding: 16px !important;
                }

                .feedback-widget-header {
                    margin-bottom: 12px !important;
                }

                .feedback-widget-title {
                    font-size: 16px !important;
                }

                .feedback-widget-actions {
                    margin-top: 12px !important;
                }

                .feedback-widget-btn {
                    padding: 12px 16px !important;
                    min-height: 44px !important;
                }
            }

            /* Extra small screens (height < 500px) - Landscape phones */
            @media (max-height: 500px) {
                .feedback-widget-panel {
                    max-height: calc(100vh - 80px) !important;
                    top: 20px !important;
                    bottom: 20px !important;
                    border-radius: 8px !important;
                }

                .feedback-widget-panel-content {
                    padding: 12px !important;
                }

                .feedback-widget-header {
                    margin-bottom: 8px !important;
                }

                .feedback-widget-title {
                    font-size: 14px !important;
                }

                .feedback-widget-field {
                    gap: 4px !important;
                }

                .feedback-widget-textarea {
                    min-height: 60px !important;
                    max-height: 80px !important;
                }

                .feedback-widget-actions {
                    margin-top: 8px !important;
                    gap: 8px !important;
                }

                .feedback-widget-btn {
                    padding: 10px 12px !important;
                    min-height: 40px !important;
                    font-size: 14px !important;
                }
            }

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
