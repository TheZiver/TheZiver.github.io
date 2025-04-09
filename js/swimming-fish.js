/**
 * FISH COMMUNITY WEBSITE - SWIMMING FISH (v4)
 * Creates and animates swimming fish background elements using icon_urls from GitHub.
 * Features:
 * - Loads fish icons from community data
 * - Spawns fish at random positions on each page load
 * - Natural swimming motion with wave effects
 * - Responsive design with different fish sizes
 */

document.addEventListener('DOMContentLoaded', function() {
    initSwimmingFish();
});

// --- Global Variables ---
let animationFrameId = null;
let fishElements = [];
let lastUpdateTime = 0;
window.fishAnimationRunning = false;

// Cache for community data to avoid repeated downloads
let cachedCommunityData = null;
let lastCacheTime = 0;

// Cache for preloaded images
let preloadedImages = {};
let preloadComplete = false;

// Cache size limits and tracking
const MAX_CACHE_ITEMS = 100; // Maximum number of communities to cache
let currentCacheSize = 0;

// Rate limiting for image loading
const IMAGES_PER_BATCH = 5; // Number of images to load in each batch
const BATCH_INTERVAL = 1000; // Time between batches in milliseconds (1 second)

// --- Constants ---
const COMMUNITY_DATA_URL = "https://gist.githubusercontent.com/TheZiver/9fdd3f8c495098ffa0beceece373d382/raw";
const FALLBACK_IMAGE = 'images/fish_known.png'; // Fallback if fetch fails or images error
const MOBILE_BREAKPOINT = 768; // Mobile breakpoint in pixels

/**
 * Initialize the swimming fish system
 */
function initSwimmingFish() {
    console.log('Initializing swimming fish system (v4)');

    // Try to load cached community data from sessionStorage
    try {
        const storedData = sessionStorage.getItem('communityData');
        const timestamp = sessionStorage.getItem('communityDataTimestamp');

        if (storedData && timestamp) {
            cachedCommunityData = JSON.parse(storedData);
            lastCacheTime = parseInt(timestamp, 10);
            console.log('Loaded community data from sessionStorage');

            // Check if we have preloaded images in sessionStorage
            const preloadedData = sessionStorage.getItem('preloadedImages');
            if (preloadedData) {
                preloadedImages = JSON.parse(preloadedData);
                preloadComplete = true;
                console.log('Loaded preloaded image data from sessionStorage');
            }
        }
    } catch (e) {
        console.warn('Error loading from sessionStorage:', e);
    }

    // Check if we should show fish on this page
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isAquariumPage = currentPage === 'aquarium.html';

    // On mobile, only show fish on the aquarium page
    const shouldShowFish = !isMobile || isAquariumPage;

    console.log(`Device: ${isMobile ? 'Mobile' : 'Desktop'}, Page: ${currentPage}, Show fish: ${shouldShowFish}`);

    if (shouldShowFish) {
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

        // Create new fish with random positions on each page load
        console.log('Creating new fish with random positions...');
        createFish(container);
    } else {
        console.log('Swimming fish disabled on mobile for non-aquarium pages');
        // Remove any existing fish container to save resources
        const existingContainer = document.getElementById('swimming-images-background');
        if (existingContainer) {
            existingContainer.remove();
        }
    }

    // Preload images in the background if not already done
    // We still preload on all pages for better performance when navigating to aquarium
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
    const cacheAge = now - lastCacheTime;
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

    if (cachedCommunityData && cachedCommunityData.length > 0 && cacheAge < CACHE_DURATION) {
        console.log("Using cached community data...");
        return cachedCommunityData;
    }

    console.log("Fetching community data for fish icons...");
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

            // Apply size-based cache limit
            const groups = data.community_groups;
            if (groups.length > MAX_CACHE_ITEMS) {
                console.log(`Limiting cache to ${MAX_CACHE_ITEMS} items (from ${groups.length})`);
                // Prioritize verified and certified communities
                const prioritizedGroups = prioritizeGroupsForCache(groups);
                cachedCommunityData = prioritizedGroups.slice(0, MAX_CACHE_ITEMS);
                currentCacheSize = MAX_CACHE_ITEMS;
            } else {
                cachedCommunityData = groups;
                currentCacheSize = groups.length;
            }
        } else {
            // Fallback for old structure
            console.log('Using old JSON structure');
            const groups = data || [];
            if (groups.length > MAX_CACHE_ITEMS) {
                cachedCommunityData = groups.slice(0, MAX_CACHE_ITEMS);
                currentCacheSize = MAX_CACHE_ITEMS;
            } else {
                cachedCommunityData = groups;
                currentCacheSize = groups.length;
            }
        }
        lastCacheTime = now;

        // Log the first community to debug
        if (cachedCommunityData.length > 0) {
            console.log('First community:', JSON.stringify(cachedCommunityData[0], null, 2));
            console.log('First community tags:', cachedCommunityData[0].tags);
        } else {
            console.warn('No communities found in the data!');
        }

        // Also store in sessionStorage for persistence across page loads in the same session
        try {
            sessionStorage.setItem('communityData', JSON.stringify(cachedCommunityData));
            sessionStorage.setItem('communityDataTimestamp', now.toString());
        } catch (e) {
            console.warn('Could not store community data in sessionStorage:', e);
        }

        return cachedCommunityData;
    } catch (error) {
        console.error('Error fetching community data:', error);

        // Try to get data from sessionStorage if fetch fails
        try {
            const storedData = sessionStorage.getItem('communityData');
            const timestamp = sessionStorage.getItem('communityDataTimestamp');

            if (storedData && timestamp) {
                console.log('Using community data from sessionStorage after fetch failure');
                cachedCommunityData = JSON.parse(storedData);
                lastCacheTime = parseInt(timestamp, 10);
                return cachedCommunityData;
            }
        } catch (e) {
            console.warn('Error retrieving from sessionStorage:', e);
        }

        return []; // Return empty array if all else fails
    }
}

/**
 * Prioritize groups for caching based on status
 */
function prioritizeGroupsForCache(groups) {
    // Create a copy to avoid modifying the original array
    const sortedGroups = [...groups];

    // Sort by priority: VERIFIED > CERTIFIED > FISH > KNOWN
    return sortedGroups.sort((a, b) => {
        const statusA = getStatusFromTags(a.tags);
        const statusB = getStatusFromTags(b.tags);

        // Define priority order (lower number = higher priority)
        const priority = {
            'FISH_VERIFIED': 1,
            'SYSTEM': 1, // Same priority as FISH_VERIFIED
            'FISH_CERTIFIED': 2,
            'FISH': 3,
            'FISH_KNOWN': 4
        };

        return (priority[statusA] || 99) - (priority[statusB] || 99);
    });
}

/**
 * Check if an image is already in the browser's cache
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - True if the image is in cache, false otherwise
 */
async function isImageInCache(url) {
    // Create a new XMLHttpRequest to check if the image is in cache
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        // Use HEAD request to avoid downloading the full image
        xhr.open('HEAD', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                // Check if we got a 304 Not Modified (cached) or 200 OK with cache headers
                const fromCache = xhr.status === 304 ||
                                 (xhr.getResponseHeader('X-From-Cache') === 'true') ||
                                 (xhr.getResponseHeader('Age') !== null);
                resolve(fromCache);
            }
        };
        xhr.onerror = function() {
            // If error, assume not cached
            resolve(false);
        };
        // Add cache validation headers
        xhr.setRequestHeader('Cache-Control', 'max-age=0');
        xhr.send();
    });
}

/**
 * Preload all community images with smart caching
 */
async function preloadImages() {
    console.log('Preloading community images with smart caching...');

    const communityGroups = await fetchCommunityData();
    let imagesToPreload = [];

    // Extract all image URLs
    if (communityGroups && communityGroups.length > 0) {
        communityGroups.forEach(group => {
            // Include all groups, even those with SYSTEM tag
            if (group.tags && Array.isArray(group.tags) && group.tags.includes('SYSTEM')) {
                console.log(`Including SYSTEM-tagged group for preload: ${group.group_name || 'Unknown Group'}`);
            }

            // Check if the group itself has an icon_url
            if (group.icon_url && typeof group.icon_url === 'string' && group.icon_url.trim() !== '') {
                // Get status from tags array
                const status = getStatusFromTags(group.tags);

                // Include all statuses, including SYSTEM
                if (status === 'SYSTEM') {
                    console.log(`Including group with SYSTEM status for preload: ${group.group_name || 'Unknown Group'}`);
                }

                imagesToPreload.push({
                    url: group.icon_url,
                    name: group.group_name || 'Unknown Group',
                    status: status
                });
            }
        });
    }

    // Sort images by priority for preloading
    imagesToPreload = prioritizeImagesForPreload(imagesToPreload);

    // Check if we need to use rate limiting
    // We'll test the first image to see if it's cached
    let useRateLimiting = true;

    if (imagesToPreload.length > 0) {
        try {
            // Try to check if the first image is in cache
            // If it is, we assume most others are too (since they're loaded together)
            const firstImageUrl = imagesToPreload[0].url;
            const isFirstImageCached = await isImageInCache(firstImageUrl);

            useRateLimiting = !isFirstImageCached;
            console.log(`First image cache check: ${isFirstImageCached ? 'CACHED' : 'NOT CACHED'}`);
            console.log(`Using rate limiting: ${useRateLimiting ? 'YES' : 'NO'}`);
        } catch (error) {
            console.warn('Error checking image cache status:', error);
            // If there's an error checking cache, use rate limiting to be safe
            useRateLimiting = true;
        }
    }

    if (useRateLimiting) {
        // Use rate-limited loading for uncached images
        console.log(`Starting rate-limited preloading of ${imagesToPreload.length} images (${IMAGES_PER_BATCH} per ${BATCH_INTERVAL}ms)`);

        // Process images in batches
        for (let i = 0; i < imagesToPreload.length; i += IMAGES_PER_BATCH) {
            // Get the current batch
            const batch = imagesToPreload.slice(i, i + IMAGES_PER_BATCH);
            console.log(`Preloading batch ${Math.floor(i/IMAGES_PER_BATCH) + 1}: ${batch.length} images`);

            // Process this batch
            const batchPromises = batch.map(item => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        preloadedImages[item.url] = {
                            loaded: true,
                            name: item.name,
                            status: item.status
                        };
                        console.log(`Loaded: ${item.name}`);
                        resolve();
                    };
                    img.onerror = () => {
                        preloadedImages[item.url] = {
                            loaded: false,
                            name: item.name,
                            status: item.status
                        };
                        console.log(`Failed to load: ${item.name}`);
                        resolve();
                    };
                    img.src = item.url;
                });
            });

            // Wait for current batch to complete
            await Promise.all(batchPromises);

            // If this isn't the last batch, wait before processing the next one
            if (i + IMAGES_PER_BATCH < imagesToPreload.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_INTERVAL));
            }
        }
    } else {
        // Fast loading for cached images - load all at once
        console.log(`Fast preloading all ${imagesToPreload.length} images (already cached)`);

        const allPromises = imagesToPreload.map(item => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    preloadedImages[item.url] = {
                        loaded: true,
                        name: item.name,
                        status: item.status
                    };
                    resolve();
                };
                img.onerror = () => {
                    preloadedImages[item.url] = {
                        loaded: false,
                        name: item.name,
                        status: item.status
                    };
                    console.warn(`Failed to load cached image: ${item.name}`);
                    resolve();
                };
                img.src = item.url;
            });
        });

        // Wait for all images to load at once
        await Promise.all(allPromises);
        console.log(`Completed fast preloading of ${imagesToPreload.length} images`);
    }

    // Store preloaded image data in sessionStorage
    try {
        sessionStorage.setItem('preloadedImages', JSON.stringify(preloadedImages));
    } catch (e) {
        console.warn('Could not store preloaded image data in sessionStorage:', e);
    }

    preloadComplete = true;
    console.log(`Preloaded ${Object.keys(preloadedImages).length} images`);
}

/**
 * Prioritize images for preloading based on status
 */
function prioritizeImagesForPreload(images) {
    // Create a copy to avoid modifying the original array
    const sortedImages = [...images];

    // Sort by priority: VERIFIED > CERTIFIED > FISH > KNOWN
    return sortedImages.sort((a, b) => {
        // Define priority order (lower number = higher priority)
        const priority = {
            'FISH_VERIFIED': 1,
            'SYSTEM': 1, // Same priority as FISH_VERIFIED
            'FISH_CERTIFIED': 2,
            'FISH': 3,
            'FISH_KNOWN': 4
        };

        return (priority[a.status] || 99) - (priority[b.status] || 99);
    });
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
 */
async function createFish(container) {
    console.log('Attempting to create fish from GitHub icon_urls...');

    container.innerHTML = ''; // Clear existing fish
    fishElements = []; // Reset the array

    const communityGroups = await fetchCommunityData();
    let imageUrls = [];

    if (!communityGroups || communityGroups.length === 0) {
        console.warn('No community groups found!');
        return;
    }

    // Create an array to store image URLs with their status
    let imageUrlsWithStatus = [];

    if (communityGroups && communityGroups.length > 0) {
        // Extract all icon_urls from all communities in all groups
        communityGroups.forEach(group => {
            // Include all groups, even those with SYSTEM tag
            if (group.tags && Array.isArray(group.tags) && group.tags.includes('SYSTEM')) {
                console.log(`Including SYSTEM-tagged group: ${group.group_name || 'Unknown Group'}`);
            }

            // Check if the group itself has an icon_url
            if (group.icon_url && typeof group.icon_url === 'string' && group.icon_url.trim() !== '') {
                // Get status from tags array
                const status = getStatusFromTags(group.tags);

                // Include all statuses, including SYSTEM
                if (status === 'SYSTEM') {
                    console.log(`Including group with SYSTEM status: ${group.group_name || 'Unknown Group'}`);
                }

                imageUrlsWithStatus.push({
                    url: group.icon_url,
                    status: status,
                    name: group.group_name || 'Group'
                });
                console.log(`Added group icon: ${group.icon_url} with status: ${status}`);
            }

            // In the new structure, we don't have nested communities anymore
            // All groups are at the top level in community_groups
        });

        // Extract just the URLs for backward compatibility
        imageUrls = imageUrlsWithStatus.map(item => item.url);

        console.log(`Found ${imageUrls.length} unique icon_urls.`);
    } else {
        console.warn("No community data fetched or community list empty.");
    }

    // If no valid icon_urls were found after fetching, use the single fallback
    if (imageUrls.length === 0) {
        console.warn("No valid icon_urls found. Using single fallback image.");
        imageUrls.push(FALLBACK_IMAGE);
    }

    // Always use all available fish images
    const imageCount = imageUrls.length;

    console.log(`Creating ${imageCount} fish (using all available images)...`);

    // Simple random function
    function getRandom(max) {
        return Math.random() * max;
    }

    // Sort images by priority for display
    imageUrlsWithStatus = prioritizeImagesForPreload(imageUrlsWithStatus);

    // Check if we need to use rate limiting for fish creation
    // We'll test the first image to see if it's cached
    let useRateLimiting = true;

    if (imageUrlsWithStatus.length > 0) {
        try {
            // Try to check if the first image is in cache
            // If it is, we assume most others are too (since they're loaded together)
            const firstImageUrl = imageUrlsWithStatus[0].url;
            const isFirstImageCached = await isImageInCache(firstImageUrl);

            useRateLimiting = !isFirstImageCached;
            console.log(`First fish image cache check: ${isFirstImageCached ? 'CACHED' : 'NOT CACHED'}`);
            console.log(`Using rate limiting for fish creation: ${useRateLimiting ? 'YES' : 'NO'}`);
        } catch (error) {
            console.warn('Error checking fish image cache status:', error);
            // If there's an error checking cache, use rate limiting to be safe
            useRateLimiting = true;
        }
    }

    // Start animation immediately so fish move while loading
    // We'll create an initial set of placeholder fish that will be replaced as images load
    createInitialPlaceholderFish(container, imageCount, getRandom);
    startAnimation();

    // Create fish elements with or without rate limiting based on cache status
    if (useRateLimiting) {
        await createFishWithRateLimiting(container, imageUrlsWithStatus, imageCount, getRandom);
    } else {
        await createAllFishAtOnce(container, imageUrlsWithStatus, imageCount, getRandom);
    }

    // Log completion
    if (fishElements.length > 0) {
        console.log(`${fishElements.length} fish are now swimming`);
    } else {
        console.log("No fish elements created.");
    }
}

/**
 * Create initial placeholder fish that will swim while the real images load
 */
function createInitialPlaceholderFish(container, count, getRandom) {
    console.log(`Creating ${Math.min(10, count)} placeholder fish for immediate animation...`);

    // Clear any existing fish elements
    fishElements = [];

    // Create a limited number of placeholder fish (max 10) to avoid performance issues
    const placeholderCount = Math.min(10, count);
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    for (let i = 0; i < placeholderCount; i++) {
        const img = document.createElement('img');
        img.className = 'swimming-image placeholder-fish';
        img.alt = '＜＞＜';
        img.dataset.status = 'LOADING';

        // Use a simple loading image
        img.src = FALLBACK_IMAGE;

        // Random size - medium for all placeholders
        img.classList.add('size-medium');

        // Random position
        const x = getRandom(screenWidth - 100);
        const y = getRandom(screenHeight - 100);
        img.style.left = `${x}px`;
        img.style.top = `${y}px`;

        // Movement parameters
        img.dataset.speedX = (0.3 + getRandom(0.4)).toFixed(2);
        img.dataset.speedY = (0.2 + getRandom(0.3)).toFixed(2);
        img.dataset.directionX = getRandom(1) > 0.5 ? 1 : -1;
        img.dataset.directionY = getRandom(1) > 0.5 ? 1 : -1;
        img.dataset.waveOffset = (i * 1.5) + getRandom(5);

        container.appendChild(img);
        fishElements.push(img);
    }
}

/**
 * Create a single fish element
 */
function createFishElement(container, index, imageUrlsWithStatus, imageCount, getRandom) {
    const img = document.createElement('img');
    img.className = 'swimming-image';
    img.alt = '＜＞＜';

    // For the first set of fish, use each image exactly once
    // This ensures all community icons are displayed
    let selectedItem;
    if (index < imageUrlsWithStatus.length) {
        // Use each image once in sequence
        selectedItem = imageUrlsWithStatus[index];
        // Add status as a data attribute and class for styling
        img.dataset.status = selectedItem.status || 'FISH_KNOWN';
        img.classList.add('status-' + (selectedItem.status || 'FISH_KNOWN').toLowerCase());
    } else {
        // If we need more fish than unique images, select randomly from all images
        selectedItem = imageUrlsWithStatus[Math.floor(getRandom(imageUrlsWithStatus.length))];
        img.dataset.status = selectedItem.status || 'FISH_KNOWN';
        img.classList.add('status-' + (selectedItem.status || 'FISH_KNOWN').toLowerCase());
    }
    const selectedUrl = selectedItem.url;
    img.src = selectedUrl;

    img.onerror = () => {
        console.warn(`Failed to load image: ${img.src}. Using fallback.`);
        img.src = FALLBACK_IMAGE;
        img.onerror = null; // Prevent infinite loops
    };

    // Size based on status
    let sizeClass = 'size-small'; // Default size for most fish

    // Assign size based on status
    if (selectedItem.status === 'FISH_VERIFIED' || selectedItem.status === 'SYSTEM') {
        sizeClass = 'size-large'; // Largest size for verified and system fish
    } else if (selectedItem.status === 'FISH_CERTIFIED') {
        sizeClass = 'size-medium'; // Medium size for certified fish
    } else {
        sizeClass = 'size-small'; // Smallest size for all others
    }

    img.classList.add(sizeClass);

    // Evenly distribute fish across the screen in a grid pattern
    // With more fish, we need a more efficient grid layout
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calculate optimal grid dimensions based on aspect ratio
    const screenRatio = screenWidth / screenHeight;
    const gridCols = Math.ceil(Math.sqrt(imageCount * screenRatio));
    const gridRows = Math.ceil(imageCount / gridCols);

    // Calculate cell dimensions
    const cellWidth = screenWidth / gridCols;
    const cellHeight = screenHeight / gridRows;

    // Calculate position within the fish's assigned grid cell, plus some randomness
    const gridCol = index % gridCols;
    const gridRow = Math.floor(index / gridCols);
    const xPos = (gridCol * cellWidth) + getRandom(cellWidth * 0.7);
    const yPos = (gridRow * cellHeight) + getRandom(cellHeight * 0.7);
    img.style.left = `${xPos}px`;
    img.style.top = `${yPos}px`;

    // More consistent movement parameters with less variation
    img.dataset.speedX = (0.3 + getRandom(0.4)).toFixed(2); // Reduced speed variation
    img.dataset.speedY = (0.2 + getRandom(0.3)).toFixed(2); // Slower vertical movement
    img.dataset.directionX = getRandom(1) > 0.5 ? 1 : -1;
    img.dataset.directionY = getRandom(1) > 0.5 ? 1 : -1;
    // Assign a fixed wave offset to ensure fish don't synchronize
    img.dataset.waveOffset = (index * 1.5) + getRandom(5);

    container.appendChild(img);
    fishElements.push(img);

    return img;
}

/**
 * Create fish elements with rate limiting
 */
async function createFishWithRateLimiting(container, imageUrlsWithStatus, imageCount, getRandom) {
    console.log(`Creating ${imageCount} fish with rate limiting (${IMAGES_PER_BATCH} per ${BATCH_INTERVAL}ms)...`);

    // Remove placeholder class from existing fish
    document.querySelectorAll('.placeholder-fish').forEach(fish => {
        fish.classList.remove('placeholder-fish');
    });

    // Clear existing fish array but keep the DOM elements for smooth transition
    const existingFishCount = fishElements.length;
    fishElements = [];

    // Process fish in batches
    for (let i = 0; i < imageCount; i += IMAGES_PER_BATCH) {
        // Get the current batch size (might be smaller for the last batch)
        const batchSize = Math.min(IMAGES_PER_BATCH, imageCount - i);
        console.log(`Creating fish batch ${Math.floor(i/IMAGES_PER_BATCH) + 1}: ${batchSize} fish`);

        // Create or update fish for this batch
        for (let j = 0; j < batchSize; j++) {
            const index = i + j;

            // If we have existing fish elements, update them instead of creating new ones
            if (index < existingFishCount) {
                // Find existing fish element
                const existingFish = document.querySelector(`.swimming-image:nth-child(${index + 1})`);
                if (existingFish) {
                    // Update the existing fish with new image and properties
                    updateFishElement(existingFish, index, imageUrlsWithStatus, imageCount, getRandom);
                    fishElements.push(existingFish);
                    continue;
                }
            }

            // If no existing fish to update or we've used them all, create new ones
            createFishElement(container, index, imageUrlsWithStatus, imageCount, getRandom);
        }

        // If this isn't the last batch, wait before processing the next one
        if (i + IMAGES_PER_BATCH < imageCount) {
            await new Promise(resolve => setTimeout(resolve, BATCH_INTERVAL));
        }
    }
}

/**
 * Update an existing fish element with new properties
 */
function updateFishElement(fishElement, index, imageUrlsWithStatus, imageCount, getRandom) {
    // Select the image to use
    let selectedItem;
    if (index < imageUrlsWithStatus.length) {
        selectedItem = imageUrlsWithStatus[index];
    } else {
        selectedItem = imageUrlsWithStatus[Math.floor(getRandom(imageUrlsWithStatus.length))];
    }

    // Update status and class
    fishElement.dataset.status = selectedItem.status || 'FISH_KNOWN';

    // Remove all status classes
    fishElement.classList.remove('status-fish_verified', 'status-fish_certified', 'status-fish', 'status-fish_known');

    // Add the correct status class
    fishElement.classList.add('status-' + (selectedItem.status || 'FISH_KNOWN').toLowerCase());

    // Update image source
    fishElement.src = selectedItem.url;

    // Update error handler
    fishElement.onerror = () => {
        console.warn(`Failed to load image: ${fishElement.src}. Using fallback.`);
        fishElement.src = FALLBACK_IMAGE;
        fishElement.onerror = null; // Prevent infinite loops
    };

    // Update size class based on status
    fishElement.classList.remove('size-small', 'size-medium', 'size-large');

    let sizeClass = 'size-small';
    if (selectedItem.status === 'FISH_VERIFIED' || selectedItem.status === 'SYSTEM') {
        sizeClass = 'size-large';
    } else if (selectedItem.status === 'FISH_CERTIFIED') {
        sizeClass = 'size-medium';
    } else {
        sizeClass = 'size-small';
    }

    fishElement.classList.add(sizeClass);

    // Keep the existing position and movement parameters for smooth transition

    return fishElement;
}

/**
 * Create all fish at once (for when images are already cached)
 */
async function createAllFishAtOnce(container, imageUrlsWithStatus, imageCount, getRandom) {
    console.log(`Creating all ${imageCount} fish at once (images already cached)...`);

    // Remove placeholder class from existing fish
    document.querySelectorAll('.placeholder-fish').forEach(fish => {
        fish.classList.remove('placeholder-fish');
    });

    // Clear existing fish array but keep the DOM elements for smooth transition
    const existingFishCount = fishElements.length;
    fishElements = [];

    // Create or update all fish at once
    for (let i = 0; i < imageCount; i++) {
        // If we have existing fish elements, update them instead of creating new ones
        if (i < existingFishCount) {
            // Find existing fish element
            const existingFish = document.querySelector(`.swimming-image:nth-child(${i + 1})`);
            if (existingFish) {
                // Update the existing fish with new image and properties
                updateFishElement(existingFish, i, imageUrlsWithStatus, imageCount, getRandom);
                fishElements.push(existingFish);
                continue;
            }
        }

        // If no existing fish to update or we've used them all, create new ones
        createFishElement(container, i, imageUrlsWithStatus, imageCount, getRandom);
    }

    console.log(`Created/updated ${imageCount} fish at once`);
}

/**
 * Start the animation loop
 */
function startAnimation() {
    console.log("Attempting to start animation (v4)...");
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        console.log("Cancelled existing animation frame.");
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
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        }

        .swimming-image {
            position: absolute;
            /* Remove fixed width/height to allow size classes to work */
            opacity: 0.4; /* Default opacity for most pages */
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
        .swimming-image.status-fish_verified,
        .swimming-image.status-system {
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)); /* Bright white glow for verified and system */
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

        /* Placeholder fish style while loading */
        .swimming-image.placeholder-fish {
            opacity: 0.3;
            filter: grayscale(100%) brightness(70%);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 0.2; }
            50% { opacity: 0.4; }
            100% { opacity: 0.2; }
        }

        /* Mobile-specific styles */
        @media (max-width: 768px) {
            /* Only show swimming fish on aquarium page on mobile */
            .swimming-images-container {
                display: none;
            }

            /* Override for aquarium page */
            body.theme-aquarium .swimming-images-container {
                display: block;
            }
        }

        /* Fish sizes based on status - exact sizes as requested */
        .swimming-image.size-small { width: 60px !important; height: 60px !important; } /* FISH_KNOWN size */
        .swimming-image.size-medium { width: 90px !important; height: 90px !important; } /* FISH_CERTIFIED size */
        .swimming-image.size-large { width: 120px !important; height: 120px !important; } /* FISH_VERIFIED size */

        /* Theme-specific adjustments for swimming images */
        .theme-rosefish .swimming-image {
            filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.3));
        }
        .theme-rosefish .swimming-image.status-fish_verified,
        .theme-rosefish .swimming-image.status-system {
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
        .theme-store .swimming-image.status-fish_verified,
        .theme-store .swimming-image.status-system {
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
    console.log("Added swimming fish styles (v4).");
}
