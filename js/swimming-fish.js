/**
 * FISH COMMUNITY WEBSITE - SWIMMING FISH (v15 - PRODUCTION READY)
 * Creates and animates swimming fish background elements using icon_urls from GitHub.
 * Features:
 * - Loads fish icons from community data
 * - Spawns ALL fish in the center of the screen
 * - Natural swimming motion with wave effects
 * - Size based on status: VERIFIED (largest), CERTIFIED (medium), others (smallest)
 * - Enhanced caching system to prevent repeated API requests
 * - Displays ALL fish without limiting the number
 * - Logs image URLs only when loading from source (not cache)
 * - Improved caching reliability with better error handling
 */

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
const COMMUNITY_DATA_URL = "https://gist.githubusercontent.com/TheZiver/9fdd3f8c495098ffa0beceece373d382/raw";
const FALLBACK_IMAGE = 'images/fish_known.png'; // Fallback if fetch fails or images error
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Initialize the swimming fish system
 */
function initSwimmingFish() {
    // Check if we should disable fish on mobile (except on aquarium page)
    const isMobile = window.innerWidth <= 767;

    // Check if this is the aquarium page using both class and URL path
    const currentPath = window.location.pathname;
    const isAquariumByPath = currentPath.includes('aquarium.html');
    const isAquariumByClass = document.body.classList.contains('theme-aquarium');
    const isAquariumPage = isAquariumByClass || isAquariumByPath;

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
        // Use XMLHttpRequest instead of fetch for better compatibility
        const data = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', COMMUNITY_DATA_URL, true);
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        console.log("Successfully fetched community data.");
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

            // Set up load and error handlers
            img.onload = () => {
                try {
                    // Convert the loaded image to a data URL using canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    // Get data URL (PNG format with compression)
                    const dataUrl = canvas.toDataURL('image/png', 0.8);

                    preloadedImages[item.url] = {
                        loaded: true,
                        status: item.status,
                        name: item.name,
                        timestamp: Date.now(),
                        dataUrl: dataUrl
                    };
                    console.log(`Created data URL for: ${item.url}`);
                } catch (canvasError) {
                    console.warn('Error creating data URL from image:', canvasError);
                    // Still cache the image info without the data URL
                    preloadedImages[item.url] = {
                        loaded: true,
                        status: item.status,
                        name: item.name,
                        timestamp: Date.now()
                    };
                }
                resolve();
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
    try {
        // Count images with data URLs
        const totalImages = Object.keys(preloadedImages).length;
        const imagesWithDataUrl = Object.values(preloadedImages).filter(img => img.dataUrl).length;

        localStorage.setItem('fishCommunityImages', JSON.stringify(preloadedImages));
        localStorage.setItem('fishCommunityImagesTimestamp', Date.now().toString());
        console.log(`Saved image cache to localStorage: ${totalImages} images (${imagesWithDataUrl} with dataURL) - valid for 7 days`);
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


    container.innerHTML = ''; // Clear existing fish
    fishElements = []; // Reset the array

    const communityGroups = await fetchCommunityData();
    let imageUrls = [];

    if (!communityGroups || communityGroups.length === 0) {
        return;
    }

    // Create an array to store image URLs with their status
    let imageUrlsWithStatus = [];

    // Configuration for batch loading
    const BATCH_SIZE = 5; // Number of images to load in each batch
    const BATCH_DELAY = 1000; // Milliseconds to wait between batches (1 second)

    if (communityGroups && communityGroups.length > 0) {
        // Extract all icon_urls from all communities in all groups
        communityGroups.forEach(group => {
            // Include all groups, even those with SYSTEM tag
            // We want to display all 74 fish

            // Check if the group itself has an icon_url
            if (group.icon_url && typeof group.icon_url === 'string' && group.icon_url.trim() !== '') {
                // Get status from tags array
                const status = getStatusFromTags(group.tags);

                // Include all statuses, even SYSTEM
                // We want to display all 74 fish

                // We'll check cache status when creating the fish

                imageUrlsWithStatus.push({
                    url: group.icon_url,
                    status: status,
                    name: group.group_name || 'Group'
                });


            }

            // In the new structure, we don't have nested communities anymore
            // All groups are at the top level in community_groups
        });

        // Extract just the URLs for backward compatibility
        imageUrls = imageUrlsWithStatus.map(item => item.url);


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
        if (isCached && preloadedImages[selectedUrl] && preloadedImages[selectedUrl].dataUrl) {
            // Use the cached data URL
            img.src = preloadedImages[selectedUrl].dataUrl;
            console.log(`Using cached data URL for: ${selectedUrl}`);
        } else {
            // Set the image source to the original URL
            img.src = selectedUrl;

            // If not cached, add this image to the preload cache for future use
            if (!isCached) {
                // Log the URL when loading from source (not cache)
                console.log(`Loading image from URL: ${selectedUrl}`);

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

    // Start animation if fish were created
    if (fishElements.length > 0) {
        startAnimation();
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
    const images = document.querySelectorAll('.swimming-image');
    if (!images.length) return;

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
            width: 60px; /* Larger default size */
            height: 60px;
            opacity: 0.6; /* Higher opacity for better visibility */
            border-radius: 50%;
            object-fit: contain;
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
