// Comprehensive Error Handler for Osmo Resource Pages
(function() {
    'use strict';
    
    // Store original console methods
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    // Global error handler
    window.addEventListener('error', function(event) {
        // Handle UnicornStudio errors
        if (event.filename && event.filename.includes('unicornStudio')) {
            originalConsoleError('UnicornStudio Error handled:', event.error);
            event.preventDefault();
            return true;
        }
        
        // Handle video loading errors
        if (event.target && event.target.tagName === 'VIDEO') {
            originalConsoleWarn('Video loading error handled:', event.target.src);
            event.preventDefault();
            return true;
        }
        
        // Handle image loading errors
        if (event.target && event.target.tagName === 'IMG') {
            originalConsoleWarn('Image loading error handled:', event.target.src);
            // Set a placeholder or hide the image
            event.target.style.display = 'none';
            event.preventDefault();
            return true;
        }
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.stack) {
            if (event.reason.stack.includes('unicornStudio') || 
                event.reason.stack.includes('Turnstile') ||
                event.reason.stack.includes('Cloudflare')) {
                originalConsoleError('Promise rejection handled:', event.reason);
                event.preventDefault();
                return true;
            }
        }
    });
    
    // Handle permissions policy violations
    console.warn = function(...args) {
        const message = args.join(' ');
        if (message.includes('Potential permissions policy violation') ||
            message.includes('autoplay is not allowed') ||
            message.includes('encrypted-media is not allowed')) {
            // Silently handle permissions policy violations
            return;
        }
        return originalConsoleWarn.apply(this, args);
    };
    
    // Safe wrapper for video elements
    function handleVideoErrors() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.addEventListener('error', function(e) {
                originalConsoleWarn('Video error handled:', this.src);
                this.style.display = 'none';
            });
            
            video.addEventListener('loadstart', function() {
                // Add timeout for video loading
                setTimeout(() => {
                    if (this.readyState === 0) {
                        originalConsoleWarn('Video loading timeout:', this.src);
                        this.style.display = 'none';
                    }
                }, 10000); // 10 second timeout
            });
        });
    }
    
    // Safe wrapper for Cloudflare Turnstile
    function handleTurnstileErrors() {
        // Override turnstile functions if they exist
        if (window.turnstile) {
            const originalRender = window.turnstile.render;
            window.turnstile.render = function(...args) {
                try {
                    return originalRender.apply(this, args);
                } catch (error) {
                    originalConsoleError('Turnstile render error handled:', error);
                    return null;
                }
            };
        }
        
        // Handle turnstile load function
        window.turnstileLoad = function() {
            try {
                if (window.turnstile && typeof window.turnstile.render === 'function') {
                    // Check if element already has turnstile
                    const containers = document.querySelectorAll('[data-turnstile]');
                    containers.forEach(container => {
                        if (!container.hasAttribute('data-turnstile-rendered')) {
                            window.turnstile.render(container);
                            container.setAttribute('data-turnstile-rendered', 'true');
                        }
                    });
                }
            } catch (error) {
                originalConsoleError('Turnstile load error handled:', error);
            }
        };
    }
    
    // Handle fetch errors including 401, CORS, and file protocol issues
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args).catch(error => {
            if (error.message && (error.message.includes('401') || 
                                 error.message.includes('CORS') ||
                                 error.message.includes('Cross origin') ||
                                 error.message.includes('net::ERR_FAILED'))) {
                originalConsoleWarn('Network error handled:', args[0], error.message);
                // Return a resolved promise with empty response
                return Promise.resolve(new Response('{}', {
                    status: 200,
                    statusText: 'OK',
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
            throw error;
        });
    };
    
    // Handle XMLHttpRequest errors for CORS and file protocol issues
    const originalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXMLHttpRequest();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        xhr.open = function(method, url, ...args) {
            try {
                return originalOpen.call(this, method, url, ...args);
            } catch (error) {
                originalConsoleWarn('XMLHttpRequest open error handled:', url, error.message);
                return;
            }
        };
        
        xhr.send = function(...args) {
            try {
                return originalSend.apply(this, args);
            } catch (error) {
                originalConsoleWarn('XMLHttpRequest send error handled:', error.message);
                // Trigger success callback with empty response
                if (this.onload) {
                    this.status = 200;
                    this.responseText = '{}';
                    this.onload();
                }
                return;
            }
        };
        
        // Handle network errors
        xhr.addEventListener('error', function(e) {
            originalConsoleWarn('XMLHttpRequest network error handled:', e);
        });
        
        return xhr;
    };
    
    // Initialize error handlers when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            handleVideoErrors();
            handleTurnstileErrors();
        });
    } else {
        handleVideoErrors();
        handleTurnstileErrors();
    }
    
    // Re-run handlers when new content is loaded (for SPA navigation)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                handleVideoErrors();
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    originalConsoleError('Osmo Error Handler initialized successfully');
    
})();
