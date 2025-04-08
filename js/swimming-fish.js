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

// --- Constants ---
const COMMUNITY_DATA_URL = "https://gist.githubusercontent.com/TheZiver/9fdd3f8c495098ffa0beceece373d382/raw";
const FALLBACK_IMAGE = 'images/fish_known.png'; // Fallback if fetch fails or images error

/**
 * Initialize the swimming fish system
 */
function initSwimmingFish() {
    console.log('Initializing swimming fish system (v4)');

    // Check if we should disable fish on mobile (except on aquarium page)
    const isMobile = window.innerWidth <= 767;
    const isAquariumPage = document.body.classList.contains('theme-aquarium');

    // If on mobile and not on aquarium page, don't initialize fish
    if (isMobile && !isAquariumPage) {
        console.log('Mobile device detected and not on aquarium page. Disabling swimming fish for better performance.');

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
            cachedCommunityData = data.community_groups;
        } else {
            // Fallback for old structure
            console.log('Using old JSON structure');
            cachedCommunityData = data || [];
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
 * Preload all community images to improve performance
 */
async function preloadImages() {
    console.log('Preloading community images...');

    const communityGroups = await fetchCommunityData();
    let imagesToPreload = [];

    // Extract all image URLs
    if (communityGroups && communityGroups.length > 0) {
        communityGroups.forEach(group => {
            // Skip groups with SYSTEM tag
            if (group.tags && Array.isArray(group.tags) && group.tags.includes('SYSTEM')) {
                console.log(`Skipping SYSTEM-tagged group for preload: ${group.group_name || 'Unknown Group'}`);
                return;
            }

            // Check if the group itself has an icon_url
            if (group.icon_url && typeof group.icon_url === 'string' && group.icon_url.trim() !== '') {
                // Get status from tags array
                const status = getStatusFromTags(group.tags);

                // Skip if status is SYSTEM
                if (status === 'SYSTEM') {
                    console.log(`Skipping group with SYSTEM status for preload: ${group.group_name || 'Unknown Group'}`);
                    return;
                }

                imagesToPreload.push({
                    url: group.icon_url,
                    name: group.group_name || 'Unknown Group',
                    status: status
                });
            }

            // In the new structure, we don't have nested communities anymore
            // All groups are at the top level in community_groups
        });
    }

    // Preload each image
    const preloadPromises = imagesToPreload.map(item => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                preloadedImages[item.url] = {
                    loaded: true,
                    name: item.name
                };
                resolve();
            };
            img.onerror = () => {
                preloadedImages[item.url] = {
                    loaded: false,
                    name: item.name
                };
                resolve();
            };
            img.src = item.url;
        });
    });

    // Wait for all images to preload
    await Promise.all(preloadPromises);

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
            // Skip groups with SYSTEM tag
            if (group.tags && Array.isArray(group.tags) && group.tags.includes('SYSTEM')) {
                console.log(`Skipping SYSTEM-tagged group: ${group.group_name || 'Unknown Group'}`);
                return;
            }

            // Check if the group itself has an icon_url
            if (group.icon_url && typeof group.icon_url === 'string' && group.icon_url.trim() !== '') {
                // Get status from tags array
                const status = getStatusFromTags(group.tags);

                // Skip if status is SYSTEM
                if (status === 'SYSTEM') {
                    console.log(`Skipping group with SYSTEM status: ${group.group_name || 'Unknown Group'}`);
                    return;
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

    // We'll use all images, ensuring each one appears at least once

    for (let i = 0; i < imageCount; i++) {
        const img = document.createElement('img');
        img.className = 'swimming-image';
        img.alt = '＜＞＜';

        // For the first set of fish, use each image exactly once
        // This ensures all community icons are displayed
        let selectedItem;
        if (i < imageUrlsWithStatus.length) {
            // Use each image once in sequence
            selectedItem = imageUrlsWithStatus[i];
            // Add status as a data attribute and class for styling
            img.dataset.status = selectedItem.status || 'FISH_KNOWN';
            img.classList.add('status-' + (selectedItem.status || 'FISH_KNOWN').toLowerCase());
        } else {
            // If we need more fish than unique images, select randomly from all images
            selectedItem = imageUrlsWithStatus[Math.floor(getRandom(imageUrlsWithStatus.length))];
            img.dataset.status = selectedItem.status || 'FISH_KNOWN';
            img.classList.add('status-' + (selectedItem.status || 'FISH_KNOWN').toLowerCase());
            console.log("Using additional fish with randomly selected images.");
        }
        const selectedUrl = selectedItem.url;
        img.src = selectedUrl;

        img.onerror = () => {
            console.warn(`Failed to load image: ${img.src}. Using fallback.`);
            img.src = FALLBACK_IMAGE;
            img.onerror = null; // Prevent infinite loops
        };

        // Random size
        const sizeClasses = ['size-small', 'size-medium', 'size-large'];
        const randomSizeClass = sizeClasses[Math.floor(getRandom(sizeClasses.length))];
        img.classList.add(randomSizeClass);

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
        const gridCol = i % gridCols;
        const gridRow = Math.floor(i / gridCols);
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
        img.dataset.waveOffset = (i * 1.5) + getRandom(5);

        container.appendChild(img);
        fishElements.push(img);
    }

    // Start animation if fish were created
    if (fishElements.length > 0) {
        startAnimation();
    } else {
        console.log("No fish elements created.");
    }
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
            width: 60px;
            height: 60px;
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

        .swimming-image.size-small { width: 40px; height: 40px; }
        .swimming-image.size-medium { width: 60px; height: 60px; }
        .swimming-image.size-large { width: 80px; height: 80px; }

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
    console.log("Added swimming fish styles (v4).");
}
