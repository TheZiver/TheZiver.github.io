/**
 * FISH COMMUNITY WEBSITE - SWIMMING FISH (v28 - PRODUCTION READY)
 * Creates and animates swimming fish background elements using icon_urls from GitHub.
 * Features:
 * - Loads fish icons from community data
 * - Spawns ALL fish in the center of the screen
 * - Natural swimming motion with wave effects
 * - Size based on status: VERIFIED (largest), CERTIFIED (medium), others (smallest)
 * - Enhanced caching system to prevent repeated API requests
 * - Displays ALL fish without limiting the number
 * - Improved CORS handling and error recovery
 * - Logs image URLs only when loading from source (not cache)
 * - Improved caching reliability with better error handling
 */

// Fallback image in case no community data is available
const FALLBACK_IMAGE = "https://api.vrchat.cloud/api/1/file/file_e69a1a67-1622-4205-9a62-96ff93dddeaf/1/file";

document.addEventListener('DOMContentLoaded', function() {
    initSwimmingFish();
});

// --- Global Variables ---
let animationFrameId = null;
let fishElements = [];
let lastUpdateTime = 0;
window.fishAnimationRunning = false;

// Global cache objects to persist across page changes
if (!window.fishCommunityCache) {
    window.fishCommunityCache = {
        communityData: null,
        lastCacheTime: 0,
        preloadedImages: {},
        preloadComplete: false,
        imagesTimestamp: 0
    };
}

// Local references to global cache
let cachedCommunityData = window.fishCommunityCache.communityData;
let lastCacheTime = window.fishCommunityCache.lastCacheTime;
let preloadedImages = window.fishCommunityCache.preloadedImages;
let preloadComplete = window.fishCommunityCache.preloadComplete;

/**
 * Debug function to check cache status
 * This helps diagnose caching issues
 */
function checkCacheStatus() {
    console.group('Fish Image Cache Status');

    // Check localStorage
    try {
        const cachedImageData = localStorage.getItem('fishCommunityImages');
        const cachedTimestamp = localStorage.getItem('fishCommunityImagesTimestamp');

        if (cachedImageData && cachedTimestamp) {
            const timestamp = parseInt(cachedTimestamp, 10);
            const now = Date.now();
            const ageInDays = Math.floor((now - timestamp) / (24 * 60 * 60 * 1000));
            const ageInHours = Math.floor((now - timestamp) / (60 * 60 * 1000));

            try {
                const parsedData = JSON.parse(cachedImageData);
                const imageCount = Object.keys(parsedData).length;
                const imagesWithDataUrl = Object.values(parsedData).filter(img => img.dataUrl).length;
                const cacheSize = new Blob([cachedImageData]).size / 1024;

                console.log(`LocalStorage: ${imageCount} images (${imagesWithDataUrl} with dataURL)`);
                console.log(`Cache age: ${ageInDays} days, ${ageInHours % 24} hours`);
                console.log(`Cache size: ${cacheSize.toFixed(2)} KB`);
            } catch (e) {
                console.warn('Error parsing localStorage cache:', e);
            }
        } else {
            console.log('No localStorage cache found');
        }
    } catch (e) {
        console.warn('Error accessing localStorage:', e);
    }

    // Check global cache
    if (window.fishCommunityCache && window.fishCommunityCache.preloadedImages) {
        const globalImages = Object.keys(window.fishCommunityCache.preloadedImages).length;
        const globalWithDataUrl = Object.values(window.fishCommunityCache.preloadedImages)
            .filter(img => img && img.dataUrl).length;

        console.log(`Global cache: ${globalImages} images (${globalWithDataUrl} with dataURL)`);
    } else {
        console.log('No global cache initialized');
    }

    // Check current page fish
    const fishOnPage = document.querySelectorAll('.swimming-image').length;
    const cachedFish = document.querySelectorAll('.swimming-image[data-cached="true"]').length;

    console.log(`Current page: ${fishOnPage} fish (${cachedFish} using cache)`);
    console.groupEnd();
}

// Run cache check when page loads
setTimeout(checkCacheStatus, 2000);

/**
 * Add a debug button to clear cache (only in development)
 */
function addCacheControlButton() {
    // Only add in development environments
    if (window.location.hostname !== 'localhost' &&
        !window.location.hostname.includes('127.0.0.1') &&
        !window.location.hostname.includes('.github.io')) {
        return;
    }

    const button = document.createElement('button');
    button.textContent = 'Clear Fish Cache';
    button.style.position = 'fixed';
    button.style.bottom = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.padding = '5px 10px';
    button.style.backgroundColor = '#333';
    button.style.color = '#fff';
    button.style.border = '1px solid #555';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '12px';
    button.style.opacity = '0.7';

    button.addEventListener('mouseover', () => {
        button.style.opacity = '1';
    });

    button.addEventListener('mouseout', () => {
        button.style.opacity = '0.7';
    });

    button.addEventListener('click', () => {
        try {
            // Clear localStorage cache
            localStorage.removeItem('fishCommunityImages');
            localStorage.removeItem('fishCommunityImagesTimestamp');

            // Clear global cache
            window.fishCommunityCache.preloadedImages = {};
            window.fishCommunityCache.preloadComplete = false;
            window.fishCommunityCache.imagesTimestamp = 0;

            // Update local references
            preloadedImages = {};
            preloadComplete = false;

            alert('Fish image cache cleared! Reloading page...');
            window.location.reload();
        } catch (e) {
            console.error('Error clearing cache:', e);
            alert('Error clearing cache: ' + e.message);
        }
    });

    document.body.appendChild(button);
}

// Add cache control button after a short delay
setTimeout(addCacheControlButton, 3000);



// --- Constants ---
// Use the correct URL that doesn't have CORS issues
const COMMUNITY_DATA_URL = "https://gist.githubusercontent.com/TheZiver/9fdd3f8c495098ffa0beceece373d382/raw";
// FALLBACK_IMAGE is defined at the top of the file
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Initialize the swimming fish system
 */
function initSwimmingFish() {
    // Check if this is the aquarium page using both class and URL path
    const currentPath = window.location.pathname;
    const isAquariumByPath = currentPath.includes('aquarium.html');
    const isAquariumByClass = document.body.classList.contains('theme-aquarium');
    const isAquariumPage = isAquariumByClass || isAquariumByPath;

    // For testing purposes, we'll enable fish on all devices and all pages
    // This ensures fish are always visible regardless of device
    const isMobile = false; // Force mobile detection to be false

    // If on mobile and not on aquarium page, don't initialize fish
    if (isMobile && !isAquariumPage) {
        // Add a container with a message if it doesn't exist yet
        let container = document.getElementById('swimming-images-background');
        if (container) {
            // Clear any existing content
            container.innerHTML = '';

            // Add a small indicator that fish are disabled for performance
            const disabledMsg = document.createElement('div');
            disabledMsg.className = 'fish-disabled-message';
            disabledMsg.textContent = '＜＞＜';
            disabledMsg.title = 'Swimming fish disabled on mobile for better performance. Visit the AQUARIUM page to see them!';
            container.appendChild(disabledMsg);
        }

        return;
    }

    // Sync local variables with global cache
    cachedCommunityData = window.fishCommunityCache.communityData;
    lastCacheTime = window.fishCommunityCache.lastCacheTime;
    preloadedImages = window.fishCommunityCache.preloadedImages;
    preloadComplete = window.fishCommunityCache.preloadComplete;

    // If global cache is empty, try to load from storage
    if (!window.fishCommunityCache.communityData) {
        // Try to load cached community data from sessionStorage
        try {
            const storedData = sessionStorage.getItem('communityData');
            const timestamp = sessionStorage.getItem('communityDataTimestamp');

            if (storedData && timestamp) {
                window.fishCommunityCache.communityData = JSON.parse(storedData);
                window.fishCommunityCache.lastCacheTime = parseInt(timestamp, 10);

                // Update local references
                cachedCommunityData = window.fishCommunityCache.communityData;
                lastCacheTime = window.fishCommunityCache.lastCacheTime;

                console.log('Loaded community data from sessionStorage');
            }
        } catch (e) {
            console.warn('Error loading community data from sessionStorage:', e);
        }
    } else {
        console.log('Using community data from global cache');
    }

    // If global image cache is empty, try to load from storage
    if (!window.fishCommunityCache.preloadComplete) {
        // Try to load cached image data from localStorage (persistent across sessions)
        try {
            const cachedImageData = localStorage.getItem('fishCommunityImages');
            const cachedTimestamp = localStorage.getItem('fishCommunityImagesTimestamp');

            if (cachedImageData && cachedTimestamp) {
                const timestamp = parseInt(cachedTimestamp, 10);
                const now = Date.now();

                // If cache is still valid (less than 7 days old)
                if (now - timestamp < IMAGE_CACHE_DURATION) {
                    const parsedData = JSON.parse(cachedImageData);
                    const imageCount = Object.keys(parsedData).length;

                    if (imageCount > 0) {
                        // Count images with data URLs
                        const imagesWithDataUrl = Object.values(parsedData).filter(img => img.dataUrl).length;
                        console.log(`Loaded ${imageCount} images from localStorage cache (${imagesWithDataUrl} with dataURL) - valid for 7 days`);

                        // Update global cache
                        window.fishCommunityCache.preloadedImages = parsedData;
                        window.fishCommunityCache.imagesTimestamp = timestamp;
                        window.fishCommunityCache.preloadComplete = true;

                        // Update local references
                        preloadedImages = parsedData;
                        preloadComplete = true;
                    } else {
                        console.log('Cached data exists but contains no images');
                    }
                } else {
                    console.log(`Cached image data expired (${Math.floor((now - timestamp) / (24 * 60 * 60 * 1000))} days old), will fetch fresh data`);
                }
            }
        } catch (e) {
            console.warn('Error loading image cache:', e);
        }
    } else {
        // Count images with data URLs in global cache
        const totalImages = Object.keys(window.fishCommunityCache.preloadedImages).length;
        const imagesWithDataUrl = Object.values(window.fishCommunityCache.preloadedImages).filter(img => img.dataUrl).length;
        console.log(`Using ${totalImages} images from global cache (${imagesWithDataUrl} with dataURL)`);
    }

    let container = document.getElementById('swimming-images-background');
    if (!container) {
        console.log('Creating swimming fish container');
        container = document.createElement('div');
        container.id = 'swimming-images-background';
        container.className = 'swimming-images-container';
        document.body.insertBefore(container, document.body.firstChild);
    }

    // Add necessary CSS styles dynamically
    addSwimmingFishStyles();

    // Always create new fish with random positions on each page load
    console.log('Creating new fish with random positions...');
    createFish(container);

    // Preload images in the background if not already done
    if (!preloadComplete) {
        preloadImages();
    }
}

// Storage functions removed - fish now spawn at random positions on each page load

/**
 * Fetch community data from GitHub with caching
 */
async function fetchCommunityData() {
    // Check if we have cached data that's less than 30 minutes old
    const now = Date.now();
    const cacheAge = now - window.fishCommunityCache.lastCacheTime;
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

    if (window.fishCommunityCache.communityData &&
        window.fishCommunityCache.communityData.length > 0 &&
        cacheAge < CACHE_DURATION) {
        return window.fishCommunityCache.communityData;
    }


    try {
        // Use fetch with no-cors mode as a fallback if needed
        let data;
        try {
            // First try with regular fetch
            console.log('Fetching community data from:', COMMUNITY_DATA_URL);
            const response = await fetch(COMMUNITY_DATA_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            data = await response.json();
            console.log("Successfully fetched community data.");
        } catch (fetchError) {
            console.warn('Initial fetch failed, trying with XMLHttpRequest:', fetchError);

            // Fall back to XMLHttpRequest
            data = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', COMMUNITY_DATA_URL, true);
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            console.log("Successfully fetched community data with XHR.");
                            resolve(data);
                        } catch (e) {
                            console.error("Error parsing community data JSON:", e);
                            reject(e);
                        }
                    } else {
                        reject(new Error(`HTTP error! status: ${xhr.status}`));
                    }
                };
                xhr.onerror = function() {
                    reject(new Error("Network error during community data fetch"));
                };
                xhr.send();
            });
        }

        // Cache the data and update the timestamp
        // Check if the data has the new structure with community_groups property
        console.log('Raw data structure:', Object.keys(data));

        if (data.community_groups && Array.isArray(data.community_groups)) {
            console.log('Using new JSON structure with community_groups property');
            console.log('Number of groups found:', data.community_groups.length);
            window.fishCommunityCache.communityData = data.community_groups;
            cachedCommunityData = data.community_groups;
        } else {
            // Fallback for old structure
            console.log('Using old JSON structure');
            window.fishCommunityCache.communityData = data || [];
            cachedCommunityData = data || [];
        }
        window.fishCommunityCache.lastCacheTime = now;
        lastCacheTime = now;



        // Also store in sessionStorage for persistence across page loads in the same session
        try {
            sessionStorage.setItem('communityData', JSON.stringify(cachedCommunityData));
            sessionStorage.setItem('communityDataTimestamp', now.toString());
        } catch (e) {
            // Silently fail if sessionStorage is not available
        }

        return cachedCommunityData;
    } catch (error) {
        // Error fetching community data

        // Try to get data from sessionStorage if fetch fails
        try {
            const storedData = sessionStorage.getItem('communityData');
            const timestamp = sessionStorage.getItem('communityDataTimestamp');

            if (storedData && timestamp) {

                cachedCommunityData = JSON.parse(storedData);
                lastCacheTime = parseInt(timestamp, 10);
                return cachedCommunityData;
            }
        } catch (e) {
            // Silently fail if sessionStorage is not available
        }

        return []; // Return empty array if all else fails
    }
}

/**
 * Use a CORS proxy to preload images that would otherwise be blocked by CORS
 * This function runs in the background and updates the cache with data URLs
 */
async function proxyPreloadImages(imageItems) {
    console.log('%cStarting background proxy caching...', 'color: #4CAF50; font-weight: bold');
    console.log(`Will attempt to cache ${imageItems.length} images using CORS proxy`);

    // Function to get a proxied URL to bypass CORS
    function getProxiedUrl(url) {
        return `https://corsproxy.io/?${encodeURIComponent(url)}`;
    }

    // Keep track of progress
    let processedCount = 0;
    let successCount = 0;

    // Process images in small batches to avoid overwhelming the browser
    const BATCH_SIZE = 3;

    // First, try to fetch the community data to get the latest image URLs
    try {
        console.log('Fetching latest community data for proxy caching...');
        const response = await fetch(COMMUNITY_DATA_URL);
        const data = await response.json();

        // Check if we have the new JSON structure with community_groups
        if (data.community_groups) {
            console.log(`Found ${data.community_groups.length} community groups in data`);

            // Filter out groups with SYSTEM tag
            const filteredGroups = data.community_groups.filter(group =>
                !group.tags || !group.tags.includes('SYSTEM')
            );

            console.log(`Processing ${filteredGroups.length} groups (excluding SYSTEM groups)`);

            // Create a new array of image items with the latest data
            const updatedImageItems = filteredGroups.map(group => ({
                url: group.icon_url,
                status: group.tags && group.tags.includes('FISH_VERIFIED') ? 'FISH_VERIFIED' :
                       group.tags && group.tags.includes('FISH_CERTIFIED') ? 'FISH_CERTIFIED' :
                       group.tags && group.tags.includes('FISH') ? 'FISH' : 'FISH_KNOWN',
                name: group.group_name || 'Unknown Group'
            }));

            // Use the updated image items instead
            if (updatedImageItems.length > 0) {
                console.log(`Using ${updatedImageItems.length} updated image items from fresh data`);
                imageItems = updatedImageItems;
            }
        } else {
            // Old JSON structure
            console.log('Using old JSON structure from community data');
            const updatedImageItems = data.map(group => ({
                url: group.imageUrl,
                status: group.status || 'FISH_KNOWN',
                name: group.name || 'Unknown Group'
            }));

            if (updatedImageItems.length > 0) {
                console.log(`Using ${updatedImageItems.length} updated image items from old data structure`);
                imageItems = updatedImageItems;
            }
        }
    } catch (e) {
        console.warn(`Error fetching community data for proxy caching: ${e.message}`);
        console.log('Continuing with existing image items...');
    }

    // Filter out items without URLs
    imageItems = imageItems.filter(item => item.url);
    console.log(`Will process ${imageItems.length} valid image URLs`);

    for (let i = 0; i < imageItems.length; i += BATCH_SIZE) {
        // Get a batch of images to process
        const batch = imageItems.slice(i, i + BATCH_SIZE);

        // Process each image in the batch
        await Promise.all(batch.map(async (item) => {
            try {
                // Skip if we already have a data URL for this image
                if (preloadedImages[item.url] && preloadedImages[item.url].dataUrl) {
                    processedCount++;
                    return;
                }

                // Create a proxied URL
                const proxiedUrl = getProxiedUrl(item.url);

                // Load the image
                const img = new Image();
                img.crossOrigin = 'anonymous';

                // Wait for the image to load
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('Image load failed'));
                    img.src = proxiedUrl;
                });

                // Resize the image to 128×128
                const canvas = document.createElement('canvas');
                canvas.width = 128;
                canvas.height = 128;
                const ctx = canvas.getContext('2d');

                // Use high-quality resizing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, 128, 128);

                // Get data URL
                const dataUrl = canvas.toDataURL('image/png', 0.9);

                // Update the cache
                if (preloadedImages[item.url]) {
                    preloadedImages[item.url].dataUrl = dataUrl;
                    preloadedImages[item.url].timestamp = Date.now();
                } else {
                    preloadedImages[item.url] = {
                        loaded: true,
                        status: item.status,
                        name: item.name,
                        timestamp: Date.now(),
                        dataUrl: dataUrl
                    };
                }

                successCount++;
                console.log(`Proxy cached: ${item.url.substring(0, 50)}...`);
            } catch (e) {
                console.warn(`Proxy caching failed for ${item.url}: ${e.message}`);
            } finally {
                processedCount++;
            }
        }));

        // Save progress to localStorage every few batches
        if (i % (BATCH_SIZE * 5) === 0 && i > 0) {
            try {
                localStorage.setItem('fishCommunityImages', JSON.stringify(preloadedImages));
                localStorage.setItem('fishCommunityImagesTimestamp', Date.now().toString());
                console.log(`%cSaved progress: ${successCount}/${processedCount} images cached`, 'color: #2196F3');
            } catch (e) {
                console.warn('Error saving progress to localStorage:', e);
            }
        }

        // Small delay between batches to avoid freezing the UI
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Final save to localStorage
    try {
        localStorage.setItem('fishCommunityImages', JSON.stringify(preloadedImages));
        localStorage.setItem('fishCommunityImagesTimestamp', Date.now().toString());
        console.log(`%cProxy caching complete! ${successCount}/${processedCount} images cached`, 'color: #4CAF50; font-weight: bold');
    } catch (e) {
        console.warn('Error saving to localStorage:', e);
    }
}

/**
 * Preload all community images to improve performance
 * with persistent caching to avoid VRChat API rate limiting
 */
async function preloadImages() {
    // First check if we already have images in the global cache
    if (window.fishCommunityCache.preloadComplete &&
        Object.keys(window.fishCommunityCache.preloadedImages).length > 0) {

        preloadedImages = window.fishCommunityCache.preloadedImages;
        preloadComplete = true;

        // Log cache statistics
        const totalImages = Object.keys(preloadedImages).length;
        const imagesWithDataUrl = Object.values(preloadedImages).filter(img => img.dataUrl).length;
        console.log(`Using global cache: ${totalImages} images (${imagesWithDataUrl} with dataURL)`);
        return;
    }

    // Then check localStorage for persistent cache
    try {
        const cachedImageData = localStorage.getItem('fishCommunityImages');
        const cachedTimestamp = localStorage.getItem('fishCommunityImagesTimestamp');

        if (cachedImageData && cachedTimestamp) {
            const timestamp = parseInt(cachedTimestamp, 10);
            const now = Date.now();

            // If cache is still valid (less than 7 days old)
            if (now - timestamp < IMAGE_CACHE_DURATION) {
                try {
                    const parsedData = JSON.parse(cachedImageData);
                    const imageCount = Object.keys(parsedData).length;

                    // Only use the cache if it actually contains images
                    if (imageCount > 0) {
                        // Mark all cached images as loaded
                        Object.keys(parsedData).forEach(key => {
                            if (parsedData[key]) {
                                parsedData[key].loaded = true;
                            }
                        });

                        // Check if we have any data URLs in the cache
                        const imagesWithDataUrl = Object.values(parsedData).filter(img => img.dataUrl).length;
                        console.log(`Found ${imagesWithDataUrl} images with data URLs in cache`);

                        // If we have very few data URLs, we might need to use the proxy approach
                        if (imagesWithDataUrl < 10 && imageUrlsWithStatus.length > 20) {
                            console.log('%cFew data URLs found in cache. Will attempt proxy caching in the background.', 'color: #FF9800; font-weight: bold');
                            // We'll still use the cache but trigger background proxy caching
                            setTimeout(() => {
                                proxyPreloadImages(imageUrlsWithStatus);
                            }, 5000); // Wait 5 seconds before starting proxy caching
                        }

                        window.fishCommunityCache.preloadedImages = parsedData;
                        window.fishCommunityCache.imagesTimestamp = timestamp;
                        window.fishCommunityCache.preloadComplete = true;

                        preloadedImages = parsedData;
                        preloadComplete = true;
                        return;
                    }
                } catch (e) {
                    // If there's an error parsing the cache, we'll just fetch fresh data
                }
            }
        }
    } catch (e) {
        // Silently fail if localStorage is not available
    }

    const communityGroups = await fetchCommunityData();
    let imagesToPreload = [];

    // Extract all image URLs
    if (communityGroups && communityGroups.length > 0) {
        communityGroups.forEach(group => {
            // Skip groups with SYSTEM tag
            if (group.tags && Array.isArray(group.tags) && group.tags.includes('SYSTEM')) {
                return;
            }

            // Check if the group itself has an icon_url
            if (group.icon_url && typeof group.icon_url === 'string' && group.icon_url.trim() !== '') {
                // Get status from tags array
                const status = getStatusFromTags(group.tags);

                // Skip if status is SYSTEM
                if (status === 'SYSTEM') {
                    return;
                }

                imagesToPreload.push({
                    url: group.icon_url,
                    name: group.group_name || 'Unknown Group',
                    status: status
                });
            }
        });
    }

    console.log(`Preloading ${imagesToPreload.length} images...`);

    // Initialize preloadedImages object
    preloadedImages = {};

    // Create a promise for each image to preload
    const preloadPromises = imagesToPreload.map(item => {
        return new Promise((resolve) => {
            const img = new Image();

            // Set up cross-origin attribute to allow canvas operations
            img.crossOrigin = 'anonymous';

            // Add a timeout to ensure the image is fully loaded before canvas operations
            // This helps with CORS and timing issues

            // Set crossOrigin to anonymous to allow canvas operations
            // This is needed for toDataURL() to work with external images
            img.crossOrigin = 'anonymous';

            // Set up load and error handlers
            img.onload = () => {
                // Small delay to ensure image is fully processed by the browser
                setTimeout(() => {
                    try {
                        // Always resize all images to 128×128 pixels for maximum storage efficiency
                        const TARGET_SIZE = 128; // Fixed size for all cached images
                        let targetWidth = TARGET_SIZE;
                        let targetHeight = TARGET_SIZE;
                        let needsResize = (img.width !== TARGET_SIZE || img.height !== TARGET_SIZE);

                        // Convert the loaded image to a data URL using canvas with potential resizing
                        const canvas = document.createElement('canvas');
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                        const ctx = canvas.getContext('2d');

                        // Draw the image with smoothing for better quality when downsizing
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                        // Log if image was resized
                        if (needsResize) {
                            console.log(`%cRESIZED: ${img.width}x${img.height} → ${targetWidth}x${targetHeight}`, 'color: #4CAF50; font-weight: bold');
                        } else {
                            console.log(`%cNO RESIZE NEEDED: Already ${img.width}x${img.height}`, 'color: #2196F3');
                        }

                        // Use PNG format with high compression for all images
                        // Since all images are now small icons (128×128), PNG works well
                        // and preserves transparency which is important for VRChat profile images
                        const dataUrl = canvas.toDataURL('image/png', 0.9);

                        preloadedImages[item.url] = {
                            loaded: true,
                            status: item.status,
                            name: item.name,
                            timestamp: Date.now(),
                            dataUrl: dataUrl
                        };
                        console.log(`Created data URL for: ${item.url}`);
                } catch (canvasError) {
                    // Check if this is a CORS-related error
                    const isCorsError = canvasError.name === 'SecurityError' ||
                                      canvasError.message.includes('tainted') ||
                                      canvasError.message.includes('cross-origin');

                    if (isCorsError) {
                        console.warn(`%cCORS Error: Cannot create data URL for ${item.url}`, 'color: #FF9800');
                        console.log('This is likely because the VRChat API does not allow cross-origin access.');
                    } else {
                        console.warn('Error creating data URL from image:', canvasError);
                    }

                    // Still cache the image info without the data URL
                    preloadedImages[item.url] = {
                        loaded: true,
                        status: item.status,
                        name: item.name,
                        timestamp: Date.now(),
                        corsBlocked: isCorsError // Flag CORS-blocked images
                    };
                }
                resolve();
                }, 50); // 50ms delay
            };

            img.onerror = () => {
                preloadedImages[item.url] = {
                    loaded: false,
                    status: item.status,
                    name: item.name,
                    timestamp: Date.now()
                };
                resolve();
            };

            // Start loading the image
            img.src = item.url;
        });
    });

    // Wait for all images to be processed (either loaded or failed)
    await Promise.all(preloadPromises);

    console.log(`Preloaded ${Object.keys(preloadedImages).length} images`);

    // Update the global cache
    window.fishCommunityCache.preloadedImages = preloadedImages;
    window.fishCommunityCache.imagesTimestamp = Date.now();
    window.fishCommunityCache.preloadComplete = true;

    // Store the preloaded image data in localStorage for persistent caching
    // Count images with data URLs
    const totalImages = Object.keys(preloadedImages).length;
    const imagesWithDataUrl = Object.values(preloadedImages).filter(img => img.dataUrl).length;

    // Calculate approximate size of the cache
    const cacheString = JSON.stringify(preloadedImages);
    const cacheSize = new Blob([cacheString]).size / (1024 * 1024); // Size in MB

    console.log(`Cache size: ~${cacheSize.toFixed(2)}MB (localStorage limit ~5MB)`);

    // Check if we need to start background proxy caching
    if (imagesWithDataUrl < totalImages * 0.5 && totalImages > 20) {
        console.log('%cLess than 50% of images have data URLs. Will attempt proxy caching in the background.', 'color: #FF9800; font-weight: bold');
        setTimeout(() => {
            proxyPreloadImages(imageUrlsWithStatus);
        }, 5000); // Wait 5 seconds before starting proxy caching
    }

    // If cache is too large, remove dataUrls from oldest entries until it fits
    if (cacheSize > 4.5) { // Leave some buffer below 5MB
        console.warn(`Cache too large (${cacheSize.toFixed(2)}MB), removing oldest dataUrls`);

        // Sort by timestamp (oldest first)
        const entries = Object.entries(preloadedImages);
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remove dataUrls until cache is small enough
        let currentSize = cacheSize;
        let removedCount = 0;

        for (const [_, data] of entries) {
            if (currentSize <= 4 || removedCount >= entries.length / 2) break; // Stop if small enough or removed half

            if (data.dataUrl) {
                const beforeSize = JSON.stringify(preloadedImages).length;
                delete data.dataUrl;
                const afterSize = JSON.stringify(preloadedImages).length;

                // Approximate size reduction
                const reduction = (beforeSize - afterSize) / (1024 * 1024);
                currentSize -= reduction;
                removedCount++;
            }
        }

        console.log(`Removed ${removedCount} dataUrls, new size: ~${currentSize.toFixed(2)}MB`);
    }

    try {
        // Add detailed debug logging
        console.log('%c[CACHE DEBUG] Attempting to save cache with these stats:', 'color: #FF5722; font-weight: bold');
        console.log(`- Total images: ${totalImages}`);
        console.log(`- Images with dataUrl: ${imagesWithDataUrl}`);
        console.log(`- Cache size: ${cacheSize.toFixed(2)}MB`);

        // Check if we actually have any data URLs
        if (imagesWithDataUrl === 0) {
            console.warn('%c[CACHE WARNING] No data URLs found in cache! This may be due to CORS restrictions.', 'color: #FF9800; font-weight: bold');
        }

        localStorage.setItem('fishCommunityImages', JSON.stringify(preloadedImages));
        localStorage.setItem('fishCommunityImagesTimestamp', Date.now().toString());
        console.log(`Saved image cache to localStorage: ${totalImages} images (${imagesWithDataUrl} with dataURL) - valid for 7 days`);

        // Verify what was saved
        const savedCache = localStorage.getItem('fishCommunityImages');
        const parsedCache = JSON.parse(savedCache);
        const savedWithDataUrl = Object.values(parsedCache).filter(img => img.dataUrl).length;
        console.log(`%c[CACHE VERIFY] Retrieved from localStorage: ${Object.keys(parsedCache).length} images (${savedWithDataUrl} with dataURL)`, 'color: #4CAF50; font-weight: bold');
    } catch (e) {
        console.warn('Error saving to localStorage:', e);

        // Try to save a reduced version without dataURLs if localStorage quota is exceeded
        try {
            // Create a copy without dataURLs to reduce size
            const reducedCache = {};
            Object.keys(preloadedImages).forEach(key => {
                reducedCache[key] = { ...preloadedImages[key] };
                delete reducedCache[key].dataUrl;
            });

            localStorage.setItem('fishCommunityImages', JSON.stringify(reducedCache));
            localStorage.setItem('fishCommunityImagesTimestamp', Date.now().toString());
            console.log('Saved reduced image cache (without dataURLs) to localStorage');
        } catch (e2) {
            console.warn('Error saving reduced cache to localStorage:', e2);

            // Fallback to sessionStorage if localStorage fails
            try {
                sessionStorage.setItem('preloadedImages', JSON.stringify(preloadedImages));
                console.log('Saved image cache to sessionStorage (fallback)');
            } catch (e3) {
                console.warn('Could not store preloaded image data in sessionStorage:', e3);
            }
        }
    }

    preloadComplete = true;
}



/**
 * Helper function to get status from tags array
 * @param {Array} tags - Array of tags
 * @returns {string} - Status string (FISH_VERIFIED, FISH, etc.)
 */
function getStatusFromTags(tags) {
    // Default status if no tags are present
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return 'FISH_KNOWN';
    }

    // Look for specific status tags in priority order
    if (tags.includes('FISH_VERIFIED')) {
        return 'FISH_VERIFIED';
    } else if (tags.includes('FISH_CERTIFIED')) {
        return 'FISH_CERTIFIED';
    } else if (tags.includes('FISH')) {
        return 'FISH';
    } else if (tags.includes('FISH_KNOWN')) {
        return 'FISH_KNOWN';
    } else if (tags.includes('SYSTEM')) {
        return 'SYSTEM'; // Mark as SYSTEM to be filtered out later
    }

    // Default fallback
    return 'FISH_KNOWN';
}

/**
 * Create fish elements by fetching data and using icon_urls
 * Uses a batched loading approach to prevent rate limiting
 */
async function createFish(container) {
    console.log('Creating fish in container:', container);

    container.innerHTML = ''; // Clear existing fish
    fishElements = []; // Reset the array

    // Fetch community data
    let communityGroups = await fetchCommunityData();
    console.log('Fetched community data:', communityGroups ? communityGroups.length : 0, 'groups');

    // Create arrays to store image URLs
    let imageUrls = [];
    let imageUrlsWithStatus = [];

    // Handle the case where communityGroups is empty or undefined
    if (!communityGroups || communityGroups.length === 0) {
        console.warn('No community groups found, using fallback image');
        imageUrls.push(FALLBACK_IMAGE);
        imageUrlsWithStatus.push({
            url: FALLBACK_IMAGE,
            status: 'FISH_KNOWN',
            name: 'Fallback Fish'
        });
    } else {
        // Extract all icon_urls from all communities in all groups
        communityGroups.forEach(group => {
            // Include all groups, even those with SYSTEM tag
            // We want to display all fish

            // Check if the group itself has an icon_url
            if (group.icon_url && typeof group.icon_url === 'string' && group.icon_url.trim() !== '') {
                // Get status from tags array
                const status = getStatusFromTags(group.tags);

                // Include all statuses, even SYSTEM
                // We want to display all fish

                // We'll check cache status when creating the fish
                imageUrlsWithStatus.push({
                    url: group.icon_url,
                    status: status,
                    name: group.group_name || 'Group'
                });
            }
        });

        // Extract just the URLs for backward compatibility
        imageUrls = imageUrlsWithStatus.map(item => item.url);
        console.log('Extracted', imageUrls.length, 'image URLs from community groups');
    }

    // If no valid icon_urls were found after fetching, use the single fallback
    if (imageUrls.length === 0) {
        imageUrls.push(FALLBACK_IMAGE);
    }

    // Always use all available fish images
    // Show each fish exactly once (no duplicates)
    const imageCount = imageUrls.length;



    // Simple random function
    function getRandom(max) {
        return Math.random() * max;
    }

    // Function to create a single fish
    function createSingleFish(index, selectedItem) {
        if (!selectedItem || !selectedItem.url) return null;

        const img = document.createElement('img');
        img.className = 'swimming-image';
        img.alt = '＜＞＜';

        // Add status as a data attribute and class for styling
        img.dataset.status = selectedItem.status || 'FISH_KNOWN';
        img.classList.add('status-' + (selectedItem.status || 'FISH_KNOWN').toLowerCase());

        const selectedUrl = selectedItem.url;

        // Always add error handler first (for both cached and non-cached images)
        img.onerror = () => {
            console.warn(`Failed to load image: ${img.src}. Using fallback.`);
            img.src = FALLBACK_IMAGE;
            img.onerror = null; // Prevent infinite loops
        };

        // Check if we have this image in our preloaded cache
        const isCached = preloadComplete && preloadedImages[selectedUrl] && preloadedImages[selectedUrl].loaded;

        // Add data attribute to indicate cache status
        img.dataset.cached = isCached ? 'true' : 'false';

        // If cached, use a data URL or blob URL from cache instead of the original URL
        if (isCached && preloadedImages[selectedUrl]) {
            if (preloadedImages[selectedUrl].dataUrl) {
                // Use the cached data URL
                img.src = preloadedImages[selectedUrl].dataUrl;
                // Don't log every cached image to reduce console spam
                // console.log(`Using cached data URL for: ${selectedUrl}`);
            } else {
                // We have the image in cache but no dataUrl (likely due to CORS)
                // Use the original URL but mark as cached since we know it works
                img.src = selectedUrl;
                // Don't log every cached image to reduce console spam
                // console.log(`Using original URL (CORS-limited cache) for: ${selectedUrl}`);
            }
        } else {
            // Set the image source to the original URL
            img.src = selectedUrl;

            // If not cached, add this image to the preload cache for future use
            if (!isCached) {
                // Only log the first few uncached images to reduce console spam
                if (index < 5) {
                    console.log(`Loading image from URL (${index+1}/5 logged): ${selectedUrl}`);
                } else if (index === 5) {
                    console.log(`Additional uncached images being loaded (not logged individually)`);
                }

                // Create a new Image object to preload this image for future use
                const preloadImg = new Image();

                // Set up cross-origin attribute to allow canvas operations
                preloadImg.crossOrigin = 'anonymous';

                preloadImg.onload = () => {
                    try {
                        // Convert the loaded image to a data URL using canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = preloadImg.width;
                        canvas.height = preloadImg.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(preloadImg, 0, 0);

                        // Get data URL (PNG format with compression)
                        const dataUrl = canvas.toDataURL('image/png', 0.8);

                        // Add to preloaded images cache with the data URL
                        preloadedImages[selectedUrl] = {
                            loaded: true,
                            status: selectedItem.status || 'FISH_KNOWN',
                            name: selectedItem.name || 'Unknown',
                            timestamp: Date.now(),
                            dataUrl: dataUrl
                        };

                        // Update global cache
                        window.fishCommunityCache.preloadedImages = preloadedImages;
                        window.fishCommunityCache.preloadComplete = true;

                        // Update localStorage cache (but don't block the UI)
                        setTimeout(() => {
                            try {
                                localStorage.setItem('fishCommunityImages', JSON.stringify(preloadedImages));
                                localStorage.setItem('fishCommunityImagesTimestamp', Date.now().toString());
                                console.log(`Cached image data URL for: ${selectedUrl}`);
                            } catch (e) {
                                console.warn('Error saving to localStorage:', e);

                                // If localStorage fails due to quota, try to clear old entries
                                try {
                                    // Remove oldest 20% of entries
                                    const keys = Object.keys(preloadedImages);
                                    const sortedKeys = keys.sort((a, b) =>
                                        preloadedImages[a].timestamp - preloadedImages[b].timestamp
                                    );
                                    const keysToRemove = sortedKeys.slice(0, Math.floor(keys.length * 0.2));

                                    keysToRemove.forEach(key => {
                                        delete preloadedImages[key];
                                    });

                                    // Try saving again with fewer items
                                    localStorage.setItem('fishCommunityImages', JSON.stringify(preloadedImages));
                                    localStorage.setItem('fishCommunityImagesTimestamp', Date.now().toString());
                                    console.log(`Cleared ${keysToRemove.length} old cache entries and saved again`);
                                } catch (e2) {
                                    console.warn('Failed to save even after clearing old entries:', e2);
                                }
                            }
                        }, 100);
                    } catch (canvasError) {
                        console.warn('Error creating data URL from image:', canvasError);
                        // Still cache the image info without the data URL
                        preloadedImages[selectedUrl] = {
                            loaded: true,
                            status: selectedItem.status || 'FISH_KNOWN',
                            name: selectedItem.name || 'Unknown',
                            timestamp: Date.now()
                        };
                    }
                };

                preloadImg.onerror = () => {
                    console.warn(`Failed to preload image: ${selectedUrl}`);
                    preloadedImages[selectedUrl] = {
                        loaded: false,
                        status: selectedItem.status || 'FISH_KNOWN',
                        name: selectedItem.name || 'Unknown',
                        timestamp: Date.now()
                    };
                };

                // Start loading the image
                preloadImg.src = selectedUrl;
            }
        }

        // Assign size based on fish status
        // FISH_VERIFIED = largest, FISH_CERTIFIED = medium, others = smallest
        let sizeClass;

        // Check if the selectedItem has tags
        if (selectedItem && selectedItem.tags && Array.isArray(selectedItem.tags)) {
            if (selectedItem.tags.includes('FISH_VERIFIED')) {
                sizeClass = 'size-large';  // Largest size for FISH_VERIFIED
                img.classList.add('fish-verified'); // Add special class for styling
            } else if (selectedItem.tags.includes('FISH_CERTIFIED')) {
                sizeClass = 'size-medium'; // Medium size for FISH_CERTIFIED
                img.classList.add('fish-certified'); // Add special class for styling
            } else {
                sizeClass = 'size-small';  // Smallest size for everything else
            }
        } else {
            // Fallback for items without tags or using the old status field
            if (selectedItem && selectedItem.status === 'FISH_VERIFIED') {
                sizeClass = 'size-large';
                img.classList.add('fish-verified');
            } else if (selectedItem && selectedItem.status === 'FISH_CERTIFIED') {
                sizeClass = 'size-medium';
                img.classList.add('fish-certified');
            } else {
                sizeClass = 'size-small';
            }
        }

        img.classList.add(sizeClass);

        // CENTER SPAWN - All fish spawn in the center and move outward
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Get the center of the screen
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;

        // Create a small random offset from center (small cluster in the middle)
        // This creates a tight cluster in the center that will spread out
        const maxInitialOffset = 100; // pixels from center
        const randomOffsetX = (Math.random() - 0.5) * maxInitialOffset;
        const randomOffsetY = (Math.random() - 0.5) * maxInitialOffset;

        // Calculate final position with the fish centered on that point
        const fishWidth = 50; // approximate width
        const fishHeight = 50; // approximate height
        const xPos = centerX + randomOffsetX - (fishWidth / 2);
        const yPos = centerY + randomOffsetY - (fishHeight / 2);

        // Set position
        img.style.left = `${xPos}px`;
        img.style.top = `${yPos}px`;

        // Log spawn information in debug mode
        if (window.location.search.includes('debug=true') && index === 0) {
            console.log(`CENTER SPAWN: All ${imageCount} fish spawning near center (${centerX}, ${centerY})`);
            console.log(`Max initial offset: ${maxInitialOffset}px`);
        }

        // Faster movement to spread out from center quickly
        img.dataset.speedX = (0.5 + getRandom(0.5)).toFixed(2); // Faster horizontal movement
        img.dataset.speedY = (0.4 + getRandom(0.4)).toFixed(2); // Faster vertical movement

        // Direction away from center to spread out
        // This makes fish move away from the center in all directions
        img.dataset.directionX = randomOffsetX >= 0 ? 1 : -1;
        img.dataset.directionY = randomOffsetY >= 0 ? 1 : -1;
        // Assign a fixed wave offset to ensure fish don't synchronize
        img.dataset.waveOffset = (index * 1.5) + getRandom(5);

        return img;
    }

    // Load fish in batches to avoid overwhelming the VRChat API
    async function loadFishInBatches() {
        // Count of non-cached images to track potential API load
        let nonCachedCount = 0;

        // Define batch size and delay constants
        const BATCH_SIZE = 5; // Number of images to load in each batch
        const BATCH_DELAY = 1000; // Milliseconds to wait between batches (1 second)

        // Process images in batches
        for (let i = 0; i < imageCount; i += BATCH_SIZE) {
            const batchEnd = Math.min(i + BATCH_SIZE, imageCount);
            // Create and add fish elements for this batch
            for (let j = i; j < batchEnd; j++) {
                // Use each image exactly once in sequence
                // This ensures no duplicates
                let selectedItem = imageUrlsWithStatus[j];

                const img = createSingleFish(j, selectedItem);
                if (img) {
                    container.appendChild(img);
                    fishElements.push(img);

                    // Count non-cached images
                    const isCached = img.dataset.cached === 'true';
                    if (!isCached) {
                        nonCachedCount++;
                    }
                }
            }

            // If we have non-cached images in this batch and there are more batches to load,
            // add a delay before the next batch to avoid overwhelming the VRChat API
            if (nonCachedCount > 0 && batchEnd < imageCount) {
                // Add a delay before the next batch to avoid overwhelming the VRChat API
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
                nonCachedCount = 0; // Reset for next batch
            }
        }


    }

    // Start loading fish in batches
    await loadFishInBatches();

    // Log how many fish were created
    console.log(`Created ${fishElements.length} fish elements`);

    // Force display of fish elements
    fishElements.forEach(fish => {
        fish.style.display = 'block';
    });

    // Start animation if fish were created
    if (fishElements.length > 0) {
        console.log('Starting fish animation');
        startAnimation();

        // Start proxy caching in the background after a delay
        // This will create data URLs for all images to improve caching
        setTimeout(() => {
            console.log('Starting background proxy caching...');
            proxyPreloadImages(imageUrlsWithStatus);
        }, 3000); // Wait 3 seconds before starting proxy caching
    } else {
        console.warn('No fish elements were created, animation not started');
    }
}

/**
 * Start the animation loop
 */
function startAnimation() {

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    lastUpdateTime = Date.now();
    window.fishAnimationRunning = true;
    animateSwimmingImages(); // Start the enhanced animation loop
}

/**
 * Animates the swimming community images
 * Creates a fish-like swimming motion for all images in the background
 */
function animateSwimmingImages() {
    // Use the fishElements array instead of querying the DOM
    if (!fishElements.length) {
        console.warn('No fish elements to animate');
        window.fishAnimationRunning = false;
        return;
    }

    const images = fishElements;

    // Set a flag to indicate animation is running
    if (!window.fishAnimationRunning) {
        window.fishAnimationRunning = true;
        console.log('Fish animation started');
    }

    images.forEach(img => {
        try {
            // Get current position
            let x = parseFloat(img.style.left) || 0;
            let y = parseFloat(img.style.top) || 0;

            // Get movement parameters
            const speedX = parseFloat(img.dataset.speedX || 0.5);
            const speedY = parseFloat(img.dataset.speedY || 0.3);
            let dirX = parseFloat(img.dataset.directionX || 1);
            let dirY = parseFloat(img.dataset.directionY || 1);

            // Add simplified swimming motion with reduced wave components
            const time = Date.now() / 1000;

            // Primary wave motion (side to side) - reduced amplitude
            const waveOffset = parseFloat(img.dataset.waveOffset || Math.random() * 10);
            const primaryWaveFreq = 0.3; // Slower frequency
            const primaryWaveAmp = 1.0; // Reduced amplitude
            const primaryWave = Math.sin((time + waveOffset) * primaryWaveFreq) * primaryWaveAmp;

            // Simplified wave motion - removed secondary wave
            const waveY = primaryWave;

            // Minimal horizontal wobble
            const wobbleFreq = 0.5;
            const wobbleAmp = 0.2; // Reduced amplitude
            const wobbleX = Math.sin((time + waveOffset + 2) * wobbleFreq) * wobbleAmp;

            // Calculate new position with enhanced swimming motion
            x += dirX * speedX + (dirX * wobbleX);
            y += dirY * speedY + waveY;

            // Improved boundary handling with smoother transitions
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const imgWidth = img.offsetWidth || 60;
            const imgHeight = img.offsetHeight || 60;

            // Horizontal boundary checks
            if (x < -imgWidth) {
                // When exiting left, reappear on right
                x = screenWidth + 10; // Add a small offset for smoother entry
                // Randomize vertical position slightly for more natural movement
                y = y + (Math.random() * 40 - 20);
            } else if (x > screenWidth + 10) {
                // When exiting right, reappear on left
                x = -imgWidth - 10; // Add a small offset for smoother entry
                // Randomize vertical position slightly for more natural movement
                y = y + (Math.random() * 40 - 20);
            }

            // Vertical boundary checks with simple bounce effect
            if (y < 0) {
                // Bounce off top boundary
                y = 0;
                dirY *= -1;
            } else if (y > screenHeight - imgHeight) {
                // Bounce off bottom boundary
                y = screenHeight - imgHeight;
                dirY *= -1;
            }

            // Very rarely change direction randomly (reduced from 0.005 to 0.001)
            // This makes fish movement more predictable and less chaotic
            if (Math.random() < 0.001) {
                dirX *= -1;
                img.dataset.directionX = dirX;
            }
            if (Math.random() < 0.001) {
                dirY *= -1;
                img.dataset.directionY = dirY;
            }

            // Apply new position and direction
            img.style.left = `${x}px`;
            img.style.top = `${y}px`;
            img.dataset.directionX = dirX;
            img.dataset.directionY = dirY;

            // Store wave offset if not already set
            if (!img.dataset.waveOffset) {
                img.dataset.waveOffset = Math.random() * 10;
            }

            // Simplified transform with minimal rotation
            // Just flip the fish based on direction with very slight tilt
            const tiltAmount = Math.sin(time + waveOffset) * 3; // Minimal tilt

            // Apply simplified transformations
            img.style.transform = `
                scaleX(${dirX > 0 ? 1 : -1})
                rotate(${tiltAmount}deg)
            `;
        } catch (error) {
            console.error("Error animating fish:", img, error);
        }
    });

    // Fish data is no longer stored between page loads

    // Continue animation with a safety check
    if (window.fishAnimationRunning) {
        animationFrameId = requestAnimationFrame(animateSwimmingImages);
    } else {
        // If somehow the animation flag got reset, restart it
        window.fishAnimationRunning = true;
        animationFrameId = requestAnimationFrame(animateSwimmingImages);
    }
}

/**
 * Add necessary CSS styles dynamically.
 */
function addSwimmingFishStyles() {
    if (document.getElementById('swimming-fish-styles')) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'swimming-fish-styles';
    styleElement.textContent = `
        .swimming-images-container {
            position: fixed; /* Fixed position to cover the entire viewport */
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: -1;
            overflow: visible; /* Allow fish to be visible outside the container */
        }

        .swimming-image {
            position: absolute;
            width: 60px; /* Display size - independent of cached image size (128x128) */
            height: 60px;
            opacity: 0.6; /* Higher opacity for better visibility */
            border-radius: 50%;
            object-fit: contain; /* This ensures the 128x128 cached images display properly */
            will-change: transform, left, top;
            transition: none;
            filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.1)); /* Default: minimal glow */
            background-color: rgba(0,0,0,0.1);
            backface-visibility: hidden; /* Smoother animations */
            -webkit-font-smoothing: subpixel-antialiased; /* Better rendering */
        }

        /* Different glows based on verification status */
        .swimming-image.status-fish_verified {
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)); /* Bright white glow for verified */
            opacity: 0.5; /* Slightly more visible */
        }

        /* Same glow for FISH_CERTIFIED and FISH status as requested */
        .swimming-image.status-fish_certified,
        .swimming-image.status-fish {
            filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.5)); /* Medium white glow for certified and FISH */
            opacity: 0.45; /* Medium visibility */
        }

        .swimming-image.status-fish_known {
            filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.2)); /* Minimal glow for known */
            opacity: 0.4; /* Standard visibility */
        }

        /* Higher opacity for all fish on AQUARIUM page while maintaining glow effects */
        body.theme-aquarium .swimming-image {
            opacity: 1.0; /* Full opacity for better visibility */
        }

        /* Size variations - larger sizes with hierarchy based on status */
        .swimming-image.size-small { width: 50px; height: 50px; }  /* Smallest but still reasonably large */
        .swimming-image.size-medium { width: 65px; height: 65px; } /* Medium size for FISH_CERTIFIED */
        .swimming-image.size-large { width: 80px; height: 80px; }  /* Largest size for FISH_VERIFIED */

        /* Special styling for verified and certified fish */
        .swimming-image.fish-verified {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.8); /* Brighter glow for verified */
            z-index: 2; /* Higher z-index to appear above other fish */
        }

        .swimming-image.fish-certified {
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.6); /* Subtle glow for certified */
            z-index: 1; /* Medium z-index */
        }

        /* Theme-specific adjustments for swimming images */
        .theme-rosefish .swimming-image {
            filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.3));
        }
        .theme-rosefish .swimming-image.status-fish_verified {
            filter: drop-shadow(0 0 8px rgba(255, 0, 0, 0.8));
        }
        /* Same glow for FISH_CERTIFIED and FISH status in rosefish theme */
        .theme-rosefish .swimming-image.status-fish_certified,
        .theme-rosefish .swimming-image.status-fish {
            filter: drop-shadow(0 0 6px rgba(255, 0, 0, 0.5));
        }
        .theme-rosefish .swimming-image.status-fish_known {
            filter: drop-shadow(0 0 3px rgba(255, 0, 0, 0.2));
        }

        .theme-store .swimming-image {
            filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.3));
        }
        .theme-store .swimming-image.status-fish_verified {
            filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.8));
        }
        /* Same glow for FISH_CERTIFIED and FISH status in store theme */
        .theme-store .swimming-image.status-fish_certified,
        .theme-store .swimming-image.status-fish {
            filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.5));
        }
        .theme-store .swimming-image.status-fish_known {
            filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.2));
        }
    `;
    document.head.appendChild(styleElement);
}
