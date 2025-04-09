/**
 * Enhanced Lazy Loading for Images
 * - Uses Intersection Observer API for better performance
 * - Adds loading animation while images load
 * - Handles errors gracefully
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if Intersection Observer is supported
    if ('IntersectionObserver' in window) {
        // Create a loading animation style
        const style = document.createElement('style');
        style.textContent = `
            .lazy-image-loading {
                background-color: #1a1a1a;
                background-image: linear-gradient(90deg, #1a1a1a, #2a2a2a, #1a1a1a);
                background-size: 200% 100%;
                animation: lazyLoadingPulse 1.5s infinite;
                opacity: 0.7; /* Higher opacity for non-swimming images */
            }
            @keyframes lazyLoadingPulse {
                0% { background-position: 0% 0; }
                100% { background-position: -200% 0; }
            }
            .lazy-image-loaded {
                animation: fadeIn 0.3s ease-in-out;
                opacity: 1; /* Full opacity for regular images */
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .lazy-image-error {
                filter: grayscale(100%);
                /* No opacity reduction for error state */
            }
        `;
        document.head.appendChild(style);

        // Create the Intersection Observer
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;

                    // Skip if already processed
                    if (img.dataset.processed === 'true') return;

                    // Mark as being processed
                    img.dataset.processed = 'true';

                    // Add loading class
                    img.classList.add('lazy-image-loading');

                    // Store original src if not already stored
                    if (!img.dataset.src && img.src) {
                        img.dataset.src = img.src;
                    }

                    // If we have a data-src attribute, use it
                    if (img.dataset.src) {
                        const tempImage = new Image();

                        tempImage.onload = function() {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy-image-loading');

                            // Add the fade-in class for all non-swimming images
                            if (!img.classList.contains('swimming-image')) {
                                img.classList.add('lazy-image-loaded');
                                // Ensure full opacity for non-swimming images
                                img.style.opacity = '1';
                            }

                            // Respect data-no-resize attribute
                            if (img.hasAttribute('data-no-resize')) {
                                // Keep the inline styles if they exist
                                console.log('Preserving size for image with data-no-resize attribute:', img.src);
                            }

                            observer.unobserve(img);
                        };

                        tempImage.onerror = function() {
                            console.warn(`Failed to load image: ${img.dataset.src}`);
                            img.classList.remove('lazy-image-loading');
                            img.classList.add('lazy-image-error');

                            // Ensure full opacity for non-swimming images even in error state
                            if (!img.classList.contains('swimming-image')) {
                                img.style.opacity = '1';
                            }

                            observer.unobserve(img);
                        };

                        tempImage.src = img.dataset.src;
                    } else {
                        // If no data-src, just add loading attribute
                        img.setAttribute('loading', 'lazy');
                        img.classList.remove('lazy-image-loading');

                        // Ensure full opacity for non-swimming images
                        if (!img.classList.contains('swimming-image')) {
                            img.style.opacity = '1';
                        }

                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px', // Start loading when image is 50px from viewport
            threshold: 0.01 // Trigger when at least 1% of the image is visible
        });

        // Find all images to lazy load (exclude swimming images to prevent interference with animation)
        const images = document.querySelectorAll('img:not([data-no-lazy]):not(.swimming-image):not(.placeholder-fish)');
        images.forEach(img => {
            // Add loading="lazy" attribute for native lazy loading as fallback
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }

            // If image has src but no data-src, store the src as data-src
            if (img.src && !img.dataset.src) {
                img.dataset.src = img.src;
            }

            // Observe the image
            imageObserver.observe(img);
        });

        // Handle dynamically added images
        const mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        // Check if the added node is an image (exclude swimming images)
                        if (node.nodeName === 'IMG' && !node.dataset.noLazy &&
                            !node.classList.contains('swimming-image') &&
                            !node.classList.contains('placeholder-fish')) {
                            // Add loading="lazy" attribute
                            if (!node.hasAttribute('loading')) {
                                node.setAttribute('loading', 'lazy');
                            }

                            // Observe the image
                            imageObserver.observe(node);
                        }

                        // Check for images inside the added node (exclude swimming images)
                        if (node.querySelectorAll) {
                            const images = node.querySelectorAll('img:not([data-no-lazy]):not(.swimming-image):not(.placeholder-fish)');
                            images.forEach(img => {
                                // Add loading="lazy" attribute
                                if (!img.hasAttribute('loading')) {
                                    img.setAttribute('loading', 'lazy');
                                }

                                // Observe the image
                                imageObserver.observe(img);
                            });
                        }
                    });
                }
            });
        });

        // Start observing the document for added images
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    } else {
        // Fallback for browsers that don't support Intersection Observer
        console.log('Intersection Observer not supported, using native lazy loading only');

        // Add loading="lazy" to all images (except swimming images)
        const images = document.querySelectorAll('img:not([loading]):not(.swimming-image):not(.placeholder-fish)');
        images.forEach(img => {
            img.setAttribute('loading', 'lazy');
            // Ensure full opacity for non-swimming images
            if (!img.classList.contains('swimming-image')) {
                img.style.opacity = '1';
            }
        });
    }
});
