// Safe wrapper for UnicornStudio to prevent crashes
(function() {
    'use strict';
    
    // Store original console.error to avoid infinite loops
    const originalConsoleError = console.error;
    
    // Add global error handler for UnicornStudio
    window.addEventListener('error', function(event) {
        if (event.filename && event.filename.includes('unicornStudio')) {
            originalConsoleError('UnicornStudio Error caught and handled:', event.error);
            event.preventDefault();
            return true;
        }
    });
    
    // Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.stack && event.reason.stack.includes('unicornStudio')) {
            originalConsoleError('UnicornStudio Promise rejection caught and handled:', event.reason);
            event.preventDefault();
            return true;
        }
    });
    
    // Wrap the original UnicornStudio initialization
    const originalUnicornStudio = window.UnicornStudio;
    
    if (originalUnicornStudio) {
        window.UnicornStudio = {
            ...originalUnicornStudio,
            init: function(...args) {
                try {
                    return originalUnicornStudio.init.apply(this, args);
                } catch (error) {
                    originalConsoleError('UnicornStudio init error caught:', error);
                    return Promise.resolve([]);
                }
            },
            addScene: function(...args) {
                try {
                    return originalUnicornStudio.addScene.apply(this, args);
                } catch (error) {
                    originalConsoleError('UnicornStudio addScene error caught:', error);
                    return Promise.resolve(null);
                }
            }
        };
    }
    
    // Override problematic methods that cause the "Cannot set properties of undefined" error
    const originalArrayPrototype = Array.prototype;
    const safeArrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice'];
    
    safeArrayMethods.forEach(method => {
        const originalMethod = originalArrayPrototype[method];
        originalArrayPrototype[method] = function(...args) {
            try {
                if (this === undefined || this === null) {
                    originalConsoleError(`Attempted to call ${method} on undefined/null array`);
                    return;
                }
                return originalMethod.apply(this, args);
            } catch (error) {
                originalConsoleError(`Array ${method} error caught:`, error);
                return this;
            }
        };
    });
    
})();

