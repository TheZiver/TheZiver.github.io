/**
 * FISH COMMUNITY WEBSITE - SWIMMING FISH (v3)
 * Creates and animates swimming fish background elements using only icon_urls from GitHub.
 */

document.addEventListener('DOMContentLoaded', function() {
    initSwimmingFish();
});

let animationFrameId = null;
let fishElements = [];
let lastUpdateTime = 0;

// --- Constants ---
const COMMUNITY_DATA_URL = "https://gist.githubusercontent.com/TheZiver/9fdd3f8c495098ffa0beceece373d382/raw";
const FALLBACK_IMAGE = 'images/fish_known.png'; // Fallback if fetch fails or images error

/**
 * Initialize the swimming fish system
 */
function initSwimmingFish() {
    console.log('Initializing swimming fish system (v3 - GitHub Icons Only)');

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

    // Fetch data and create fish
    createFish(container);
}

/**
 * Fetch community data from GitHub
 */
async function fetchCommunityData() {
    console.log("Fetching community data for fish icons...");
    try {
        const response = await fetch(COMMUNITY_DATA_URL, { cache: "no-cache" });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Successfully fetched community data.");
        return data.community_groups || []; // Return the array of communities
    } catch (error) {
        console.error('Error fetching community data:', error);
        return []; // Return empty array on error
    }
}

/**
 * Create fish elements by fetching data and using icon_urls
 */
async function createFish(container) {
    console.log('Attempting to create fish from GitHub icon_urls...');

    container.innerHTML = ''; // Clear existing fish
    fishElements = []; // Reset the array

    const communities = await fetchCommunityData();
    let imageUrls = [];

    if (communities.length > 0) {
        // Extract only icon_urls that are valid strings
        imageUrls = communities
            .map(community => community.icon_url)
            .filter(url => typeof url === 'string' && url.trim() !== '');

        console.log(`Found ${imageUrls.length} unique icon_urls.`);
    } else {
        console.warn("No community data fetched or community list empty.");
    }

    // If no valid icon_urls were found after fetching, use the single fallback
    if (imageUrls.length === 0) {
        console.warn("No valid icon_urls found. Using single fallback image.");
        imageUrls.push(FALLBACK_IMAGE);
    }

    // Determine how many fish to create
    const screenWidth = window.innerWidth;
    const maxImages = screenWidth < 768 ? 10 : 20; // Number of fish to display
    const imageCount = Math.min(maxImages, imageUrls.length);

    console.log(`Creating ${imageCount} fish...`);

    // Simple random function
    function getRandom(max) {
        return Math.random() * max;
    }

    // Use a Set to track used URLs to ensure variety if possible
    const usedUrls = new Set();
    let availableUrls = [...imageUrls]; // Copy array to modify

    for (let i = 0; i < imageCount; i++) {
        const img = document.createElement('img');
        img.className = 'swimming-image';
        img.alt = 'Swimming community logo';

        // Select an image, prioritizing unused ones
        let selectedUrl;
        if (availableUrls.length > 0) {
            const randomIndex = Math.floor(getRandom(availableUrls.length));
            selectedUrl = availableUrls[randomIndex];
            availableUrls.splice(randomIndex, 1); // Remove from available
        } else {
            // If we run out of unique URLs (because imageCount > unique URLs), reuse randomly
            selectedUrl = imageUrls[Math.floor(getRandom(imageUrls.length))];
            console.log("Reusing image URL as count exceeds unique URLs.");
        }
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

        // Random initial position (in pixels)
        const xPos = getRandom(window.innerWidth);
        const yPos = getRandom(window.innerHeight);
        img.style.left = `${xPos}px`;
        img.style.top = `${yPos}px`;

        // Random movement parameters
        img.dataset.speedX = (0.3 + getRandom(0.7)).toFixed(2);
        img.dataset.speedY = (0.3 + getRandom(0.7)).toFixed(2);
        img.dataset.directionX = getRandom(1) > 0.5 ? 1 : -1;
        img.dataset.directionY = getRandom(1) > 0.5 ? 1 : -1;

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
    console.log("Attempting to start animation (v3)...");
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        console.log("Cancelled existing animation frame.");
    }
    lastUpdateTime = Date.now();
    animateAllFish(); // Start the loop
}

/**
 * Animate all fish elements
 */
function animateAllFish() {
    const currentTime = Date.now();
    const deltaTime = Math.min((currentTime - lastUpdateTime) / 1000, 0.1);
    lastUpdateTime = currentTime;

    fishElements.forEach(fish => {
        try {
            animateFish(fish, deltaTime);
        } catch (error) {
            console.error("Error animating fish:", fish, error);
        }
    });

    animationFrameId = requestAnimationFrame(animateAllFish);
}

/**
 * Animate a single fish element
 */
function animateFish(fish, deltaTime) {
    let x = parseFloat(fish.style.left) || 0;
    let y = parseFloat(fish.style.top) || 0;

    const speedX = parseFloat(fish.dataset.speedX || 0.5);
    const speedY = parseFloat(fish.dataset.speedY || 0.3);
    let dirX = parseFloat(fish.dataset.directionX || 1);
    let dirY = parseFloat(fish.dataset.directionY || 1);

    x += dirX * speedX * 60 * deltaTime;
    y += dirY * speedY * 60 * deltaTime;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const imgWidth = fish.offsetWidth || 60;
    const imgHeight = fish.offsetHeight || 60;

    if (dirX > 0 && x > screenWidth) {
        x = -imgWidth;
    } else if (dirX < 0 && x < -imgWidth) {
        x = screenWidth;
    }

    if (dirY > 0 && y > screenHeight) {
        y = -imgHeight;
    } else if (dirY < 0 && y < -imgHeight) {
        y = screenHeight;
    }

    // Randomly change horizontal direction occasionally
    if (Math.random() < 0.005) { // Adjust probability as needed
        dirX *= -1;
        console.log(`Fish ${fish.src} changing direction.`); // Log direction change
    }

    fish.style.left = `${x}px`;
    fish.style.top = `${y}px`;
    fish.style.transform = `scaleX(${dirX})`; // Apply flip based on direction

    fish.dataset.directionX = dirX;
    fish.dataset.directionY = dirY;
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
            opacity: 0.3;
            border-radius: 50%;
            object-fit: contain; /* Changed from cover to contain */
            will-change: transform, left, top;
            transition: none;
            filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.2));
            background-color: rgba(0,0,0,0.1); /* Optional: slight background for better visibility if image has transparency */
        }

        .swimming-image.size-small { width: 40px; height: 40px; }
        .swimming-image.size-medium { width: 60px; height: 60px; }
        .swimming-image.size-large { width: 80px; height: 80px; }
    `;
    document.head.appendChild(styleElement);
    console.log("Added swimming fish styles (v3).");
}
