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

// --- Constants ---
const COMMUNITY_DATA_URL = "https://gist.githubusercontent.com/TheZiver/9fdd3f8c495098ffa0beceece373d382/raw";
const FALLBACK_IMAGE = 'images/fish_known.png'; // Fallback if fetch fails or images error

/**
 * Initialize the swimming fish system
 */
function initSwimmingFish() {
    console.log('Initializing swimming fish system (v4)');

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
}

// Storage functions removed - fish now spawn at random positions on each page load

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

    // Copy array to modify for selecting unique URLs
    let availableUrls = [...imageUrls];

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

        // Evenly distribute fish across the screen in a grid pattern
        // This prevents fish from starting too close to each other
        const gridCols = Math.ceil(Math.sqrt(imageCount));
        const gridRows = Math.ceil(imageCount / gridCols);
        const cellWidth = window.innerWidth / gridCols;
        const cellHeight = window.innerHeight / gridRows;

        // Calculate position within the fish's assigned grid cell, plus some randomness
        const gridCol = i % gridCols;
        const gridRow = Math.floor(i / gridCols);
        const xPos = (gridCol * cellWidth) + getRandom(cellWidth * 0.8);
        const yPos = (gridRow * cellHeight) + getRandom(cellHeight * 0.8);
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
            opacity: 0.4; /* Slightly more visible */
            border-radius: 50%;
            object-fit: contain;
            will-change: transform, left, top;
            transition: none;
            filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
            background-color: rgba(0,0,0,0.1);
            backface-visibility: hidden; /* Smoother animations */
            -webkit-font-smoothing: subpixel-antialiased; /* Better rendering */
        }

        .swimming-image.size-small { width: 40px; height: 40px; }
        .swimming-image.size-medium { width: 60px; height: 60px; }
        .swimming-image.size-large { width: 80px; height: 80px; }

        /* Theme-specific adjustments for swimming images */
        .theme-rosefish .swimming-image {
            filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.3));
        }

        .theme-store .swimming-image {
            filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.3));
        }
    `;
    document.head.appendChild(styleElement);
    console.log("Added swimming fish styles (v4).");
}
