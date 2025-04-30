// Image mapping for community icons
const IMAGE_MAP = {
    community_fish: "fish_verified.png",
    community_rose_fish: "rose_fish.png",
    community_rose: "rose_fish.png",
    community_rat_fish: "rat_fish.png",
    community_rat: "rat_fish.png",
    community_cheese_fish: "cheese_fish.png",
    community_cheese: "cheese_fish.png",
    community_vapor_fish: "vapor_fish.png",
    community_vapor: "vapor_fish.png",
    community_gamble_fish: "gamble_fish.png",
    community_gamble: "gamble_fish.png",
    community_the_rusk_shack: "rusk_shack.png",
    community_rusk_shack: "rusk_shack.png",
    community_avifair: "avifair.png",
    community_family_friendly_cult: "family_friendly_cult.png",
    community_portal_media: "portal_media.png",
    community_test: "fish_known.png"
};

// Helper function to get image path from key
function getImagePath(key) {
    const filename = IMAGE_MAP[key];
    return filename ? `images/${filename}` : null;
}

// Generate community image key from name
function generateCommunityImageKey(name) {
    if (!name) return null;

    // Special case handling for specific names
    if (name.includes('FISH')) return 'community_fish';
    if (name.includes('ROSE')) return 'community_rose';
    if (name.includes('RAT')) return 'community_rat';
    if (name.includes('TEST')) return 'community_test';

    // General case
    let key = name.toLowerCase()
                  .replace(/＜＞＜/g, 'fish')
                  .replace(/[^a-z0-9\s_]/g, '')
                  .trim()
                  .replace(/\s+/g, '_');
    return `community_${key}`;
}

// Function to get group icon URL and tags
function getGroupIconUrl(groupId, groupName, groupIcons = {}) {
    // First try to get icon from the icons data by group ID
    if (groupIcons && groupId && groupIcons[groupId]) {
        const groupData = groupIcons[groupId];

        if (typeof groupData === 'object' && groupData.url) {
            console.log(`Using icon URL from Gist for ${groupName} (${groupId}): ${groupData.url}`);
            return {
                url: groupData.url,
                tags: groupData.tags || []
            };
        } else if (typeof groupData === 'string') {
            // Handle old format for backward compatibility
            console.log(`Using icon URL from Gist (old format) for ${groupName}: ${groupData}`);
            return {
                url: groupData,
                tags: []
            };
        }
    }

    // If no icon found in the icons data, try local image mapping
    const imageKey = generateCommunityImageKey(groupName);
    const mappedPath = imageKey ? getImagePath(imageKey) : null;

    if (mappedPath) {
        console.log(`Using local image for ${groupName}: ${mappedPath}`);
        return {
            url: mappedPath,
            tags: []
        };
    } else {
        // Use fish_known.png as fallback
        console.warn(`No mapping for ${groupName} (ID: ${groupId}), using fallback.`);
        return {
            url: 'images/fish_known.png',
            tags: []
        };
    }
}

// Function to add error handling to images
function addImageErrorHandling(imgElement) {
    imgElement.onerror = () => {
        const originalSrc = imgElement.src;
        console.warn(`Failed to load image: ${originalSrc}. Using fallback.`);

        // Check if the URL is from VRChat's API
        if (originalSrc.includes('api.vrchat.cloud')) {
            console.error('VRChat API URL failed to load. This might be due to CORS restrictions.');
        }

        // Use a different fallback based on the group tag if available
        const groupTag = imgElement.dataset.groupTag;
        if (groupTag && groupTag.includes('FISH_VERIFIED')) {
            imgElement.src = 'images/fish_verified.png';
        } else if (groupTag && groupTag.includes('FISH_CERTIFIED')) {
            imgElement.src = 'images/fish_certified.png';
        } else {
            imgElement.src = 'images/fish_known.png';
        }

        imgElement.onerror = null; // Prevent infinite loops
    };
    return imgElement;
}

// Initialize the leaderboard
document.addEventListener('DOMContentLoaded', function() {
    const podiumContainer = document.getElementById('podium');
    const listEntriesContainer = document.getElementById('list-entries');
    const page1 = document.getElementById('page1');
    const page2 = document.getElementById('page2');
    const otherButton = document.getElementById('otherButton');
    const backButton = document.getElementById('backButton');
    const ratFishLogo = document.getElementById('rat-fish-logo');
    // Add cache-busting parameter with current timestamp
    const timestamp = new Date().getTime();
    const leaderboardUrl = `https://gist.githubusercontent.com/Luiswillich-1/bc42cd2a914e54334a7673f66a659cd0/raw?_=${timestamp}`;
    const iconsUrl = `https://gist.githubusercontent.com/TheZiver/9fdd3f8c495098ffa0beceece373d382/raw?_=${timestamp}`;

    // Store for group icons
    let groupIcons = {};

    // Navigation between pages
    otherButton.addEventListener('click', function() {
        page1.classList.remove('active');
        page2.classList.add('active');
        console.log('Switched to page 2');
    });

    backButton.addEventListener('click', function() {
        page2.classList.remove('active');
        page1.classList.add('active');
        console.log('Switched back to page 1');
    });

    // First fetch the leaderboard data to ensure we have it
    console.log('Fetching leaderboard data from:', leaderboardUrl);

    // Show loading message
    podiumContainer.innerHTML = '<div class="loading-message">Fetching race data...</div>';
    listEntriesContainer.innerHTML = '<div class="loading-message">Fetching race data...</div>';

    fetch(leaderboardUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error fetching leaderboard! Status: ${response.status}`);
            }
            console.log('Leaderboard response received, parsing JSON...');
            return response.json();
        })
        .then(leaderboardData => {
            console.log('Leaderboard data fetched successfully:', typeof leaderboardData);

            // Update loading message
            podiumContainer.innerHTML = '<div class="loading-message">Fetching community icons...</div>';
            listEntriesContainer.innerHTML = '<div class="loading-message">Fetching community icons...</div>';

            // Now fetch the icons data
            console.log('Fetching icons data from:', iconsUrl);
            return fetch(iconsUrl)
                .then(response => {
                    if (!response.ok) {
                        console.warn(`HTTP error fetching icons! Status: ${response.status}`);
                        // Continue with leaderboard data even if icons fetch fails
                        return { leaderboardData, iconsData: null };
                    }
                    console.log('Icons response received, parsing JSON...');
                    return response.json()
                        .then(iconsData => {
                            console.log('Icons data parsed successfully:', typeof iconsData);
                            return { leaderboardData, iconsData };
                        })
                        .catch(error => {
                            console.error('Error parsing icons JSON:', error);
                            return { leaderboardData, iconsData: null };
                        });
                })
                .catch(error => {
                    console.error('Failed to fetch icons URL:', error);
                    return { leaderboardData, iconsData: null };
                });
        })
        .then(data => {
            // Process the combined data
            console.log('Processing combined data');

            const { leaderboardData, iconsData } = data;

            // Process icons data if available
            if (iconsData) {
                console.log('Icons data available, processing...');

                // Check if iconsData is an object with community_groups array
                if (typeof iconsData === 'object' && iconsData !== null && Array.isArray(iconsData.community_groups)) {
                    console.log('Icons data contains community_groups array with length:', iconsData.community_groups.length);

                    // Store icons data by group ID for easy lookup
                    iconsData.community_groups.forEach(group => {
                        if (group.group_id && group.icon_url) {
                            console.log(`Adding icon for group: ${group.group_name} (${group.group_id})`);
                            groupIcons[group.group_id] = {
                                url: group.icon_url,
                                tags: group.tags || []
                            };
                        }
                    });
                } else if (Array.isArray(iconsData)) {
                    console.log('Icons data is a direct array with length:', iconsData.length);
                    // Store icons data by group ID for easy lookup
                    iconsData.forEach(icon => {
                        if (icon.group_id && icon.icon_url) {
                            groupIcons[icon.group_id] = icon.icon_url;
                        }
                    });
                } else if (typeof iconsData === 'object' && iconsData !== null) {
                    console.log('Icons data is an object with keys:', Object.keys(iconsData));
                    // If it's an object, iterate through its properties
                    for (const key in iconsData) {
                        if (iconsData.hasOwnProperty(key) && iconsData[key] && iconsData[key].icon_url) {
                            groupIcons[key] = iconsData[key].icon_url;
                        }
                    }
                }

                console.log('Group icons collected:', Object.keys(groupIcons).length);
            } else {
                console.log('No icons data available, using empty groupIcons object');
            }

            // Now process the leaderboard data
            console.log('Calling processLeaderboardData with data and groupIcons');
            processLeaderboardData(leaderboardData, podiumContainer, listEntriesContainer, groupIcons);
            return true; // Return a simple value instead of the result of processLeaderboardData
        })
        .catch(error => {
            console.error('Error processing data:', error);

            // Display user-friendly error message
            const errorMessage = `<div class="error-message">Failed to load data: ${error.message}</div>`;
            podiumContainer.innerHTML = errorMessage;
            listEntriesContainer.innerHTML = errorMessage;

            // Add a retry button
            const retryButton = document.createElement('button');
            retryButton.className = 'nav-button';
            retryButton.textContent = 'Retry';
            retryButton.style.marginTop = '20px';
            retryButton.addEventListener('click', () => {
                window.location.reload();
            });

            podiumContainer.appendChild(retryButton);
            listEntriesContainer.appendChild(retryButton.cloneNode(true));
        });
});

// Function to handle the RAT FISH logo and social embeds
function processRatFishLogoAndSocials(data, groupIcons) {
    console.log('Processing RAT FISH logo and social embeds');

    const ratFishLogo = document.getElementById('rat-fish-logo');
    if (!ratFishLogo) {
        console.warn('RAT FISH logo element not found');
        return;
    }

    // Load the RAT FISH logo using the group ID
    const ratFishGroupId = ratFishLogo.dataset.groupId;
    console.log('RAT FISH group ID:', ratFishGroupId);

    if (ratFishGroupId && groupIcons && groupIcons[ratFishGroupId]) {
        // Get the icon URL from the groupIcons object
        const iconData = groupIcons[ratFishGroupId];
        console.log('Found icon data for RAT FISH:', iconData);

        if (typeof iconData === 'object' && iconData.url) {
            console.log('Using URL from object:', iconData.url);
            ratFishLogo.src = iconData.url;
        } else if (typeof iconData === 'string') {
            console.log('Using URL from string:', iconData);
            ratFishLogo.src = iconData;
        }
    } else {
        // Fallback to local image if not found in groupIcons
        console.log('Using fallback image for RAT FISH logo');
        ratFishLogo.src = 'images/rat_fish.png';
        // Add error handling in case the local image also fails
        ratFishLogo.onerror = function() {
            console.error('Failed to load RAT FISH logo fallback image');
            this.src = 'images/fish_known.png'; // Ultimate fallback
        };
    }

    // Add error handling to the image
    addImageErrorHandling(ratFishLogo);

    // Get global settings for social links
    let globalSettings = null;

    // Check if data has the new structure with global_settings at the top
    if (data && typeof data === 'object' && data.global_settings) {
        console.log('Found global settings in new data structure');
        globalSettings = data.global_settings;
    } else if (Array.isArray(data)) {
        // Try to find global_settings in the array (old format)
        const settingsEntry = data.find(entry => entry.global_settings);
        if (settingsEntry && settingsEntry.global_settings) {
            console.log('Found global settings in old data structure');
            globalSettings = settingsEntry.global_settings;
        }
    } else {
        console.log('No global settings found in data');
    }

    // Check if we have valid global settings with at least one social link
    const hasSocialLinks = globalSettings &&
        ((globalSettings.twitter_link && globalSettings.twitter_link.trim() !== '') ||
         (globalSettings.youtube_link && globalSettings.youtube_link.trim() !== ''));

    if (hasSocialLinks) {
        // Add social media embeds if available
        const socialEmbedsContainer = document.getElementById('rat-fish-social-embeds');
        if (socialEmbedsContainer) {
            // Clear any existing embeds
            socialEmbedsContainer.innerHTML = '';

            // Add Twitter embed if available and not empty
            if (globalSettings.twitter_link && globalSettings.twitter_link.trim() !== '') {
                // Handle Twitter/X embed
                try {
                    const twitterEmbed = document.createElement('div');
                    twitterEmbed.className = 'social-embed twitter-embed';

                    // Convert x.com URLs to twitter.com for better compatibility with the widget
                    let tweetUrl = globalSettings.twitter_link;
                    if (tweetUrl.includes('x.com')) {
                        tweetUrl = tweetUrl.replace('x.com', 'twitter.com');
                        console.log('Converted X URL to Twitter URL:', tweetUrl);
                    }

                    // Use a simpler approach for Twitter embeds without the View on Twitter link
                    twitterEmbed.innerHTML = `
                        <blockquote class="twitter-tweet" data-theme="dark" data-width="560">
                            <a href="${tweetUrl}"></a>
                        </blockquote>
                    `;

                    // Create and append the Twitter script separately
                    // Check if the script is already on the page
                    if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
                        const twitterScript = document.createElement('script');
                        twitterScript.async = true;
                        twitterScript.src = "https://platform.twitter.com/widgets.js";
                        twitterScript.charset = "utf-8";
                        document.body.appendChild(twitterScript);

                        // Force Twitter widgets to load
                        twitterScript.onload = function() {
                            if (window.twttr && window.twttr.widgets) {
                                window.twttr.widgets.load();
                                console.log('Twitter widgets loaded');
                            }
                        };
                    } else {
                        // If script already exists, try to force load
                        if (window.twttr && window.twttr.widgets) {
                            window.twttr.widgets.load();
                            console.log('Twitter widgets reloaded');
                        }
                    }

                    socialEmbedsContainer.appendChild(twitterEmbed);
                    console.log('Twitter embed added with URL:', tweetUrl);
                } catch (e) {
                    console.error('Error creating Twitter embed:', e);
                }
            }

            // Add YouTube embed if available and not empty
            if (globalSettings.youtube_link && globalSettings.youtube_link.trim() !== '') {
                // Extract YouTube video ID or channel ID from URL
                let youtubeId = '';
                let isChannel = false;

                try {
                    const youtubeUrl = new URL(globalSettings.youtube_link);

                    if (youtubeUrl.hostname.includes('youtube.com')) {
                        if (youtubeUrl.pathname.includes('/channel/')) {
                            // Channel URL
                            youtubeId = youtubeUrl.pathname.split('/channel/')[1].split('/')[0];
                            isChannel = true;
                        } else if (youtubeUrl.pathname.includes('/watch')) {
                            // Video URL
                            youtubeId = youtubeUrl.searchParams.get('v');
                        }
                    } else if (youtubeUrl.hostname === 'youtu.be') {
                        // Short URL
                        youtubeId = youtubeUrl.pathname.substring(1);
                    }
                } catch (e) {
                    console.error('Invalid YouTube URL:', globalSettings.youtube_link);
                }

                if (youtubeId) {
                    const youtubeEmbed = document.createElement('div');
                    youtubeEmbed.className = 'social-embed youtube-embed';

                    if (isChannel) {
                        // Channel embed (using latest video from channel)
                        youtubeEmbed.innerHTML = `
                            <iframe
                                width="560"
                                height="315"
                                src="https://www.youtube.com/embed?listType=user_uploads&list=${youtubeId}&autoplay=1"
                                frameborder="0"
                                allowfullscreen>
                            </iframe>
                        `;
                    } else {
                        // Video embed
                        youtubeEmbed.innerHTML = `
                            <iframe
                                width="560"
                                height="315"
                                src="https://www.youtube.com/embed/${youtubeId}?&autoplay=1"
                                frameborder="0"
                                allowfullscreen>
                            </iframe>
                        `;
                    }

                    socialEmbedsContainer.appendChild(youtubeEmbed);
                    console.log('YouTube embed added with ID:', youtubeId);
                }
            }
        }
    }

    // Log that processing is complete
    console.log('RAT FISH logo and social embeds processing complete');
}
// Fix for the extra closing bracket
// Create podium with top 3 entries
function createPodium(sortedData, podiumContainer, groupIcons = {}) {
    const podiumEntries = sortedData.slice(0, 3);

    // Calculate max height and font sizes based on win counts
    const maxWins = Math.max(...podiumEntries.map(entry => entry.wins));
    const baseHeight = 300; // Maximum height in pixels
    const minHeight = 100;  // Minimum height in pixels

    // Calculate heights for each position
    const calculateHeight = (wins) => {
        return Math.max(minHeight, (wins / maxWins) * baseHeight);
    };

    // No longer calculating dynamic font sizes - using fixed sizes instead
    const calculateFontSize = (wins) => {
        return 1; // Return 1 as multiplier to keep the base font size - never change this
    };

    // Second place (left)
    if (podiumEntries.length > 1) {
        const secondPlace = document.createElement('div');
        secondPlace.className = 'podium-entry';

        const secondBar = document.createElement('div');
        secondBar.className = 'podium-bar';
        secondBar.style.height = `${calculateHeight(podiumEntries[1].wins)}px`;

        const secondIcon = document.createElement('img');
        secondIcon.className = 'group-icon';
        secondIcon.style.backgroundColor = 'transparent'; // Ensure transparent background
        secondIcon.style.display = 'flex';
        secondIcon.style.alignItems = 'center';
        secondIcon.style.justifyContent = 'center';
        const secondIconData = getGroupIconUrl(podiumEntries[1].groupId, podiumEntries[1].groupName, groupIcons);
        secondIcon.src = secondIconData.url;
        secondIcon.alt = podiumEntries[1].groupName;
        if (secondIconData.tags && secondIconData.tags.length > 0) {
            secondIcon.dataset.groupTag = secondIconData.tags.join(',');
        }
        addImageErrorHandling(secondIcon);

        const secondWins = document.createElement('div');
        secondWins.className = 'wins-label';

        // Create a container for the "Wins:" text and number
        const winsContainer = document.createElement('div');
        winsContainer.className = 'wins-container';
        winsContainer.style.position = 'absolute';
        winsContainer.style.top = '0';
        winsContainer.style.left = '0';
        winsContainer.style.right = '0';
        winsContainer.style.bottom = '0';
        winsContainer.style.margin = 'auto';
        winsContainer.style.width = '100%';
        winsContainer.style.height = '100%';
        winsContainer.style.display = 'flex';
        winsContainer.style.flexDirection = 'column';
        winsContainer.style.alignItems = 'center';
        winsContainer.style.justifyContent = 'center';

        // Create the "Wins:" label
        const winsText = document.createElement('div');
        winsText.className = 'wins-text';
        winsText.textContent = 'Wins:';
        winsText.style.fontSize = '0.7em';
        winsText.style.marginBottom = '5px';
        winsText.style.textAlign = 'center';
        winsText.style.position = 'relative';

        // Create the number element
        const winsNumber = document.createElement('div');
        winsNumber.className = 'wins-number';
        winsNumber.textContent = podiumEntries[1].wins;
        winsNumber.style.fontSize = '1.2em !important';
        winsNumber.style.fontWeight = 'bold';
        winsNumber.style.display = 'flex';
        winsNumber.style.alignItems = 'center';
        winsNumber.style.justifyContent = 'center';
        winsNumber.style.position = 'relative';
        winsNumber.style.margin = '0 auto';
        winsNumber.style.width = '100%';
        winsNumber.style.height = '100%';

        // Add both elements to the container
        winsContainer.appendChild(winsText);
        winsContainer.appendChild(winsNumber);

        // Add the container to the wins label
        secondWins.appendChild(winsContainer);
        secondWins.style.fontSize = `${calculateFontSize(podiumEntries[1].wins)}em`;

        secondBar.appendChild(secondWins);
        secondPlace.appendChild(secondIcon);
        secondPlace.appendChild(secondBar);
        podiumContainer.appendChild(secondPlace);
    }

    // First place (middle)
    if (podiumEntries.length > 0) {
        const firstPlace = document.createElement('div');
        firstPlace.className = 'podium-entry';

        const firstBar = document.createElement('div');
        firstBar.className = 'podium-bar';
        firstBar.style.height = `${calculateHeight(podiumEntries[0].wins)}px`;

        // Create crown emoji for first place
        const crown = document.createElement('div');
        crown.className = 'crown-emoji';
        crown.textContent = '👑';
        crown.style.top = '-40px'; // Ensure proper positioning

        const firstIcon = document.createElement('img');
        firstIcon.className = 'group-icon';
        firstIcon.style.backgroundColor = 'transparent'; // Ensure transparent background
        firstIcon.style.display = 'flex';
        firstIcon.style.alignItems = 'center';
        firstIcon.style.justifyContent = 'center';
        const firstIconData = getGroupIconUrl(podiumEntries[0].groupId, podiumEntries[0].groupName, groupIcons);
        firstIcon.src = firstIconData.url;
        firstIcon.alt = podiumEntries[0].groupName;
        if (firstIconData.tags && firstIconData.tags.length > 0) {
            firstIcon.dataset.groupTag = firstIconData.tags.join(',');
        }
        addImageErrorHandling(firstIcon);

        const firstWins = document.createElement('div');
        firstWins.className = 'wins-label';

        // Create a container for the "Wins:" text and number
        const winsContainer = document.createElement('div');
        winsContainer.className = 'wins-container';
        winsContainer.style.position = 'absolute';
        winsContainer.style.top = '0';
        winsContainer.style.left = '0';
        winsContainer.style.right = '0';
        winsContainer.style.bottom = '0';
        winsContainer.style.margin = 'auto';
        winsContainer.style.width = '100%';
        winsContainer.style.height = '100%';
        winsContainer.style.display = 'flex';
        winsContainer.style.flexDirection = 'column';
        winsContainer.style.alignItems = 'center';
        winsContainer.style.justifyContent = 'center';

        // Create the "Wins:" label
        const winsText = document.createElement('div');
        winsText.className = 'wins-text';
        winsText.textContent = 'Wins:';
        winsText.style.fontSize = '0.7em';
        winsText.style.marginBottom = '5px';
        winsText.style.textAlign = 'center';
        winsText.style.position = 'relative';

        // Create the number element
        const winsNumber = document.createElement('div');
        winsNumber.className = 'wins-number';
        winsNumber.textContent = podiumEntries[0].wins;
        winsNumber.style.fontSize = '1.2em !important';
        winsNumber.style.fontWeight = 'bold';
        winsNumber.style.display = 'flex';
        winsNumber.style.alignItems = 'center';
        winsNumber.style.justifyContent = 'center';
        winsNumber.style.position = 'relative';
        winsNumber.style.margin = '0 auto';
        winsNumber.style.width = '100%';
        winsNumber.style.height = '100%';

        // Add both elements to the container
        winsContainer.appendChild(winsText);
        winsContainer.appendChild(winsNumber);

        // Add the container to the wins label
        firstWins.appendChild(winsContainer);
        firstWins.style.fontSize = `${calculateFontSize(podiumEntries[0].wins)}em`;

        // Create a container for the icon and crown
        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        // Add crown to the icon container
        iconContainer.appendChild(crown);
        iconContainer.appendChild(firstIcon);
        firstBar.appendChild(firstWins);
        firstPlace.appendChild(iconContainer);
        firstPlace.appendChild(firstBar);
        podiumContainer.appendChild(firstPlace);
    }

    // Third place (right)
    if (podiumEntries.length > 2) {
        const thirdPlace = document.createElement('div');
        thirdPlace.className = 'podium-entry';

        const thirdBar = document.createElement('div');
        thirdBar.className = 'podium-bar';
        thirdBar.style.height = `${calculateHeight(podiumEntries[2].wins)}px`;

        const thirdIcon = document.createElement('img');
        thirdIcon.className = 'group-icon';
        thirdIcon.style.backgroundColor = 'transparent'; // Ensure transparent background
        thirdIcon.style.display = 'flex';
        thirdIcon.style.alignItems = 'center';
        thirdIcon.style.justifyContent = 'center';
        const thirdIconData = getGroupIconUrl(podiumEntries[2].groupId, podiumEntries[2].groupName, groupIcons);
        thirdIcon.src = thirdIconData.url;
        thirdIcon.alt = podiumEntries[2].groupName;
        if (thirdIconData.tags && thirdIconData.tags.length > 0) {
            thirdIcon.dataset.groupTag = thirdIconData.tags.join(',');
        }
        addImageErrorHandling(thirdIcon);

        const thirdWins = document.createElement('div');
        thirdWins.className = 'wins-label';

        // Create a container for the "Wins:" text and number
        const winsContainer = document.createElement('div');
        winsContainer.className = 'wins-container';
        winsContainer.style.position = 'absolute';
        winsContainer.style.top = '0';
        winsContainer.style.left = '0';
        winsContainer.style.right = '0';
        winsContainer.style.bottom = '0';
        winsContainer.style.margin = 'auto';
        winsContainer.style.width = '100%';
        winsContainer.style.height = '100%';
        winsContainer.style.display = 'flex';
        winsContainer.style.flexDirection = 'column';
        winsContainer.style.alignItems = 'center';
        winsContainer.style.justifyContent = 'center';

        // Create the "Wins:" label
        const winsText = document.createElement('div');
        winsText.className = 'wins-text';
        winsText.textContent = 'Wins:';
        winsText.style.fontSize = '0.7em';
        winsText.style.marginBottom = '5px';
        winsText.style.textAlign = 'center';
        winsText.style.position = 'relative';

        // Create the number element
        const winsNumber = document.createElement('div');
        winsNumber.className = 'wins-number';
        winsNumber.textContent = podiumEntries[2].wins;
        winsNumber.style.fontSize = '1.2em !important';
        winsNumber.style.fontWeight = 'bold';
        winsNumber.style.display = 'flex';
        winsNumber.style.alignItems = 'center';
        winsNumber.style.justifyContent = 'center';
        winsNumber.style.position = 'relative';
        winsNumber.style.margin = '0 auto';
        winsNumber.style.width = '100%';
        winsNumber.style.height = '100%';

        // Add both elements to the container
        winsContainer.appendChild(winsText);
        winsContainer.appendChild(winsNumber);

        // Add the container to the wins label
        thirdWins.appendChild(winsContainer);
        thirdWins.style.fontSize = `${calculateFontSize(podiumEntries[2].wins)}em`;

        thirdBar.appendChild(thirdWins);
        thirdPlace.appendChild(thirdIcon);
        thirdPlace.appendChild(thirdBar);
        podiumContainer.appendChild(thirdPlace);
    }
}

// Process the leaderboard data
function processLeaderboardData(data, podiumContainer, listEntriesContainer, groupIcons = {}) {
    // Debug: Log the leaderboard data structure
    console.log('Leaderboard data structure:', JSON.stringify(data).substring(0, 500) + '...');

    // Clear loading messages immediately to show progress
    podiumContainer.innerHTML = '<div class="loading-message">Processing data...</div>';
    listEntriesContainer.innerHTML = '<div class="loading-message">Processing data...</div>';

    let leaderboardEntries = [];
    let globalSettings = null;

    try {
        // Check if data has the new structure with global_settings
        if (data && typeof data === 'object' && data.global_settings && Array.isArray(data.leaderboard)) {
            // New structure with global_settings at the top
            console.log('Using new data structure with global_settings');
            leaderboardEntries = data.leaderboard;
            globalSettings = data.global_settings;
        } else if (Array.isArray(data)) {
            // Old structure (just an array of entries)
            console.log('Using old data structure (array only)');
            leaderboardEntries = data;

            // Try to find global_settings in the array (old format)
            const settingsEntry = data.find(entry => entry.global_settings);
            if (settingsEntry && settingsEntry.global_settings) {
                globalSettings = settingsEntry.global_settings;
            }
        } else {
            console.error('Leaderboard data is not in a recognized format. Type:', typeof data);
            throw new Error('Leaderboard data is not in the expected format');
        }

        // Process the RAT FISH logo and social embeds
        processRatFishLogoAndSocials(data, groupIcons);
    } catch (error) {
        console.error('Error processing leaderboard data structure:', error);
        podiumContainer.innerHTML = `<div class="error-message">Error processing data: ${error.message}</div>`;
        listEntriesContainer.innerHTML = `<div class="error-message">Error processing data: ${error.message}</div>`;
        return;
    }

    try {
        // Sort data by wins in descending order
        console.log('Sorting leaderboard entries, count:', leaderboardEntries.length);
        const sortedData = leaderboardEntries.sort((a, b) => b.wins - a.wins);
        console.log('Sorted data length:', sortedData.length);

        if (sortedData.length === 0) {
            podiumContainer.innerHTML = '<div class="error-message">No race data available.</div>';
            listEntriesContainer.innerHTML = '<div class="error-message">No race data available.</div>';
            return;
        }

        // Clear loading messages
        podiumContainer.innerHTML = '';
        listEntriesContainer.innerHTML = '';

        // Create podium (top 3)
        console.log('Creating podium with top entries');
        createPodium(sortedData, podiumContainer, groupIcons);

        // Create list entries (for page 2)
        console.log('Creating list entries for page 2');
        createListEntries(sortedData, listEntriesContainer, groupIcons);

        console.log('Leaderboard rendering complete');
    } catch (error) {
        console.error('Error rendering leaderboard:', error);
        podiumContainer.innerHTML = `<div class="error-message">Error rendering leaderboard: ${error.message}</div>`;
        listEntriesContainer.innerHTML = `<div class="error-message">Error rendering leaderboard: ${error.message}</div>`;
    }
}

// Create list entries for page 2
function createListEntries(sortedData, listEntriesContainer, groupIcons = {}) {
    // Clear the container first
    listEntriesContainer.innerHTML = '';

    // Calculate entry width and height based on number of entries
    const totalEntries = sortedData.length;
    let entryWidth = '100%';  // Default to full width
    let entryHeight = '60px'; // Default height

    // Adjust entry width based on number of entries
    if (totalEntries <= 5) {
        entryWidth = '100%';  // Very few entries - full width
        entryHeight = '60px'; // Consistent height
    } else if (totalEntries <= 10) {
        entryWidth = '90%';   // Few entries - slightly narrower
        entryHeight = '60px'; // Consistent height
    } else if (totalEntries <= 20) {
        entryWidth = '80%';   // Medium number of entries
        entryHeight = '60px'; // Consistent height
    } else {
        entryWidth = '70%';   // Many entries - more compact
        entryHeight = '60px'; // Consistent height
    }

    console.log(`Total entries: ${totalEntries}, setting entry width to ${entryWidth}`);

    // Create a container for all entries
    const entriesWrapper = document.createElement('div');
    entriesWrapper.className = 'entries-wrapper';
    listEntriesContainer.appendChild(entriesWrapper);

    // Show all entries on page 2
    sortedData.forEach((item, index) => {
        const entry = document.createElement('div');
        entry.className = 'list-entry';

        // Create icon container to allow for crown positioning
        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';
        iconContainer.style.display = 'flex';
        iconContainer.style.alignItems = 'center';
        iconContainer.style.justifyContent = 'center';
        iconContainer.style.height = '100%';

        // Add crown to first place
        if (index === 0) {
            const crownElement = document.createElement('div');
            crownElement.className = 'crown';
            crownElement.textContent = '👑';
            iconContainer.appendChild(crownElement);
        }

        const iconElement = document.createElement('img');
        iconElement.className = 'entry-icon';
        iconElement.style.margin = 'auto 0'; // Center vertically
        iconElement.style.backgroundColor = 'transparent'; // Ensure transparent background
        iconElement.style.display = 'flex';
        iconElement.style.alignItems = 'center';
        iconElement.style.justifyContent = 'center';
        const iconData = getGroupIconUrl(item.groupId, item.groupName, groupIcons);
        iconElement.src = iconData.url;
        iconElement.alt = item.groupName;
        if (iconData.tags && iconData.tags.length > 0) {
            iconElement.dataset.groupTag = iconData.tags.join(',');
        }
        addImageErrorHandling(iconElement);

        iconContainer.appendChild(iconElement);

        const barElement = document.createElement('div');
        barElement.className = 'entry-bar';
        barElement.style.width = '100%';
        barElement.style.display = 'flex';
        barElement.style.justifyContent = 'center';
        barElement.style.alignItems = 'center';
        barElement.style.height = '100%'; // Ensure full height
        barElement.style.position = 'relative'; // Ensure proper positioning

        // Adjust bar width based on the number value
        const wins = item.wins;
        const maxWins = sortedData[0].wins; // Highest number of wins
        const minWidthPercent = 75; // Higher minimum width percentage for more consistent appearance
        const maxWidthPercent = 100; // Maximum width percentage

        // Calculate width as a percentage of the maximum wins
        const widthPercentage = minWidthPercent + ((wins / maxWins) * (maxWidthPercent - minWidthPercent));

        // Apply the width to the entry itself
        entry.style.width = `${widthPercentage}%`;
        entry.style.maxWidth = '100%';

        const winsElement = document.createElement('div');
        winsElement.className = 'entry-wins';
        winsElement.style.fontSize = '1.2em !important'; // Fixed font size with !important
        winsElement.style.fontFamily = 'Arial, sans-serif !important'; // Ensure consistent font
        winsElement.style.display = 'flex';
        winsElement.style.alignItems = 'center';
        winsElement.style.justifyContent = 'center';
        winsElement.style.height = '100%';
        winsElement.style.position = 'absolute';
        winsElement.style.top = '0';
        winsElement.style.left = '0';
        winsElement.style.right = '0';
        winsElement.style.bottom = '0';
        winsElement.style.margin = 'auto';

        // Create a container for the "Wins:" text and number
        const winsContainer = document.createElement('div');
        winsContainer.className = 'wins-container';
        winsContainer.style.position = 'absolute';
        winsContainer.style.top = '0';
        winsContainer.style.left = '0';
        winsContainer.style.right = '0';
        winsContainer.style.bottom = '0';
        winsContainer.style.margin = 'auto';
        winsContainer.style.width = '100%';
        winsContainer.style.height = '100%';
        winsContainer.style.display = 'flex';
        winsContainer.style.flexDirection = 'column';
        winsContainer.style.alignItems = 'center';
        winsContainer.style.justifyContent = 'center';

        // Create the "Wins:" label
        const winsText = document.createElement('div');
        winsText.className = 'wins-text';
        winsText.textContent = 'Wins:';
        winsText.style.fontSize = '0.7em';
        winsText.style.marginBottom = '5px';
        winsText.style.textAlign = 'center';
        winsText.style.position = 'relative';

        // Create the number element
        const winsNumber = document.createElement('div');
        winsNumber.className = 'wins-number';
        winsNumber.textContent = item.wins;
        winsNumber.style.display = 'flex'; // Use flex for better centering
        winsNumber.style.alignItems = 'center';
        winsNumber.style.justifyContent = 'center';
        winsNumber.style.fontSize = '1.2em !important'; // Reduced font size with !important
        winsNumber.style.fontWeight = 'bold'; // Make it bold
        winsNumber.style.lineHeight = '1'; // Improve vertical alignment
        winsNumber.style.margin = '0 auto'; // Center horizontally
        winsNumber.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)'; // Add shadow for better visibility
        winsNumber.style.width = '100%'; // Full width
        winsNumber.style.height = '100%'; // Full height
        winsNumber.style.position = 'relative'; // Use relative positioning
        winsNumber.style.margin = '0 auto';
        // Add data attribute to mark this as fixed size
        winsNumber.setAttribute('data-fixed-size', 'true');

        // Add both elements to the container
        winsContainer.appendChild(winsText);
        winsContainer.appendChild(winsNumber);

        // Add the container to the wins element
        winsElement.appendChild(winsContainer);

        // Add social media links if available
        if (item.twitter_link || item.youtube_link) {
            const socialLinks = document.createElement('div');
            socialLinks.className = 'social-links';
            socialLinks.style.margin = '0';
            socialLinks.style.position = 'absolute';
            socialLinks.style.right = '10px';
            socialLinks.style.top = '50%';
            socialLinks.style.transform = 'translateY(-50%)';

            if (item.twitter_link) {
                const twitterLink = document.createElement('a');
                twitterLink.href = item.twitter_link;
                twitterLink.className = 'social-link twitter';
                twitterLink.target = '_blank';
                twitterLink.rel = 'noopener noreferrer';
                twitterLink.innerHTML = '<i class="fab fa-twitter"></i>';
                twitterLink.title = 'Twitter';
                twitterLink.style.width = '30px';
                twitterLink.style.height = '30px';
                socialLinks.appendChild(twitterLink);
            }

            if (item.youtube_link) {
                const youtubeLink = document.createElement('a');
                youtubeLink.href = item.youtube_link;
                youtubeLink.className = 'social-link youtube';
                youtubeLink.target = '_blank';
                youtubeLink.rel = 'noopener noreferrer';
                youtubeLink.innerHTML = '<i class="fab fa-youtube"></i>';
                youtubeLink.title = 'YouTube';
                youtubeLink.style.width = '30px';
                youtubeLink.style.height = '30px';
                socialLinks.appendChild(youtubeLink);
            }

            barElement.appendChild(socialLinks);
        }

        barElement.appendChild(winsElement);
        entry.appendChild(iconContainer);
        entry.appendChild(barElement);

        entriesWrapper.appendChild(entry);
    });
}
