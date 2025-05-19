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
    // CHANGED: leaderboardUrl now points to the original TheZiver Gist link
    const leaderboardUrl = `https://gist.githubusercontent.com/TheZiver/e7848c0392ab02649af0859f56507e44/raw?_=${timestamp}`;
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

            podiumContainer.appendChild(retryButton.cloneNode(true));
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
         Object.keys(globalSettings).some(key => /^youtube_link(_\d+)?$/.test(key) && globalSettings[key] && globalSettings[key].trim() !== ''));

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

            // Add all YouTube embeds for keys matching youtube_link, youtube_link_1, youtube_link_2, ...
            let youtubeKeys = Object.keys(globalSettings).filter(key => /^youtube_link(_\d+)?$/.test(key) && globalSettings[key] && globalSettings[key].trim() !== '');
            // Sort so that the highest number is first (youtube_link_3, youtube_link_2, youtube_link_1, youtube_link)
            youtubeKeys = youtubeKeys.sort((a, b) => {
                // Extract numbers, default to 0 for 'youtube_link'
                const getNum = key => {
                    const match = key.match(/^youtube_link(?:_(\d+))?$/);
                    return match && match[1] ? parseInt(match[1], 10) : 0;
                };
                return getNum(b) - getNum(a);
            });
            youtubeKeys.forEach(youtubeKey => {
                const youtubeUrlRaw = globalSettings[youtubeKey];
                let youtubeId = '';
                let isChannel = false;
                try {
                    const youtubeUrl = new URL(youtubeUrlRaw);
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
                    console.error('Invalid YouTube URL:', youtubeUrlRaw);
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
                                src="https://www.youtube.com/embed?listType=user_uploads&list=${youtubeId}"
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
                                src="https://www.youtube.com/embed/${youtubeId}"
                                frameborder="0"
                                allowfullscreen>
                            </iframe>
                        `;
                    }
                    socialEmbedsContainer.appendChild(youtubeEmbed);
                    console.log('YouTube embed added with ID:', youtubeId);
                }
            });
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
        winsContainer.style.position = 'relative';
        winsContainer.style.width = '100%';
        winsContainer.style.height = '100%';
        winsContainer.style.display = 'flex';
        winsContainer.style.flexDirection = 'column';
        winsContainer.style.alignItems = 'center';
        winsContainer.style.justifyContent = 'center';

        // Simplified approach - use a single element with HTML
        const winsLabel = document.createElement('div');
        winsLabel.className = 'wins-label-text';
        winsLabel.innerHTML = `WINS:<br><span class="wins-number">${podiumEntries[1].wins}</span>`;
        winsLabel.style.textAlign = 'center';
        winsLabel.style.width = '100%';
        winsLabel.style.color = 'white';
        winsLabel.style.textShadow = '1px 1px 3px rgba(0, 0, 0, 0.7)';

        // Add the label to the container
        winsContainer.appendChild(winsLabel);

        // Add the text below wins
        if (podiumEntries[1].text) {
            const textDiv = document.createElement('div');
            textDiv.className = 'entry-text';
            textDiv.textContent = podiumEntries[1].text;
            textDiv.style.marginTop = '4px';
            textDiv.style.fontSize = '1em'; // Match .wins-label-text
            textDiv.style.fontWeight = 'bold';
            textDiv.style.color = 'white';
            textDiv.style.textAlign = 'center';
            textDiv.style.textShadow = '1px 1px 3px rgba(0,0,0,0.7)';
            textDiv.style.width = '100%';
            textDiv.style.overflowWrap = 'break-word';
            textDiv.style.lineHeight = '1.15';
            textDiv.style.letterSpacing = 'normal';
            textDiv.style.padding = '2px 5px';
            textDiv.style.margin = '0';
            winsContainer.appendChild(textDiv);
        }

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

        // Simplified approach - use a single element with HTML
        const winsLabel = document.createElement('div');
        winsLabel.className = 'wins-label-text';
        winsLabel.innerHTML = `WINS:<br><span class="wins-number">${podiumEntries[0].wins}</span>`;
        winsLabel.style.textAlign = 'center';
        winsLabel.style.width = '100%';
        winsLabel.style.color = 'white';
        winsLabel.style.textShadow = '1px 1px 3px rgba(0, 0, 0, 0.7)';

        // Add the label to the container
        winsContainer.appendChild(winsLabel);

        // Add the text below wins
        if (podiumEntries[0].text) {
            const textDiv = document.createElement('div');
            textDiv.className = 'entry-text';
            textDiv.textContent = podiumEntries[0].text;
            textDiv.style.marginTop = '4px';
            textDiv.style.fontSize = '1em'; // Match .wins-label-text
            textDiv.style.fontWeight = 'bold';
            textDiv.style.color = 'white';
            textDiv.style.textAlign = 'center';
            textDiv.style.textShadow = '1px 1px 3px rgba(0,0,0,0.7)';
            textDiv.style.width = '100%';
            textDiv.style.overflowWrap = 'break-word';
            textDiv.style.lineHeight = '1.15';
            textDiv.style.letterSpacing = 'normal';
            textDiv.style.padding = '2px 5px';
            textDiv.style.margin = '0';
            winsContainer.appendChild(textDiv);
        }

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

        // Simplified approach - use a single element with HTML
        const winsLabel = document.createElement('div');
        winsLabel.className = 'wins-label-text';
        winsLabel.innerHTML = `WINS:<br><span class="wins-number">${podiumEntries[2].wins}</span>`;
        winsLabel.style.textAlign = 'center';
        winsLabel.style.width = '100%';
        winsLabel.style.color = 'white';
        winsLabel.style.textShadow = '1px 1px 3px rgba(0, 0, 0, 0.7)';

        // Add the label to the container
        winsContainer.appendChild(winsLabel);

        // Add the text below wins
        if (podiumEntries[2].text) {
            const textDiv = document.createElement('div');
            textDiv.className = 'entry-text';
            textDiv.textContent = podiumEntries[2].text;
            textDiv.style.marginTop = '4px';
            textDiv.style.fontSize = '1em'; // Match .wins-label-text
            textDiv.style.fontWeight = 'bold';
            textDiv.style.color = 'white';
            textDiv.style.textAlign = 'center';
            textDiv.style.textShadow = '1px 1px 3px rgba(0,0,0,0.7)';
            textDiv.style.width = '100%';
            textDiv.style.overflowWrap = 'break-word';
            textDiv.style.lineHeight = '1.15';
            textDiv.style.letterSpacing = 'normal';
            textDiv.style.padding = '2px 5px';
            textDiv.style.margin = '0';
            winsContainer.appendChild(textDiv);
        }

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
    if (podiumContainer) {
        podiumContainer.innerHTML = '<div class="loading-message">Processing data...</div>';
    }
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
        if (podiumContainer) {
            podiumContainer.innerHTML = `<div class="error-message">Error processing data: ${error.message}</div>`;
        }
        listEntriesContainer.innerHTML = `<div class="error-message">Error processing data: ${error.message}</div>`;
        return;
    }

    try {
        // Sort data by wins in descending order
        console.log('Sorting leaderboard entries, count:', leaderboardEntries.length);
        const sortedData = leaderboardEntries.sort((a, b) => b.wins - a.wins);
        console.log('Sorted data length:', sortedData.length);

        if (sortedData.length === 0) {
            if (podiumContainer) {
                podiumContainer.innerHTML = '<div class="error-message">No race data available.</div>';
            }
            listEntriesContainer.innerHTML = '<div class="error-message">No race data available.</div>';
            return;
        }

        // Clear loading messages
        if (podiumContainer) {
            podiumContainer.innerHTML = '';
        }
        listEntriesContainer.innerHTML = '';

        // Create podium (top 3) if podium container exists
        if (podiumContainer) {
            console.log('Creating podium with top entries');
            createPodium(sortedData, podiumContainer, groupIcons);
        }

        // Create list entries (for page 2)
        console.log('Creating list entries for page 2');
        createListEntries(sortedData, listEntriesContainer, groupIcons);

        console.log('Leaderboard rendering complete');
    } catch (error) {
        console.error('Error rendering leaderboard:', error);
        if (podiumContainer) {
            podiumContainer.innerHTML = `<div class="error-message">Error rendering leaderboard: ${error.message}</div>`;
        }
        listEntriesContainer.innerHTML = `<div class="error-message">Error rendering leaderboard: ${error.message}</div>`;
    }
}

// Create list entries for page 2
function createListEntries(sortedData, listEntriesContainer, groupIcons = {}) {
    // Clear the container first
    listEntriesContainer.innerHTML = '';

    // Create a container for all entries
    const entriesWrapper = document.createElement('div');
    entriesWrapper.className = 'entries-wrapper';
    listEntriesContainer.appendChild(entriesWrapper);

    // Show all entries on page 2
    sortedData.forEach((item, index) => {
        const entry = document.createElement('div');
        entry.className = 'list-entry';

        // Create icon container
        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        // Add crown to first place
        if (index === 0) {
            const crownElement = document.createElement('div');
            crownElement.className = 'crown';
            crownElement.textContent = '👑';
            iconContainer.appendChild(crownElement);
        }

        // Create and add icon
        const iconElement = document.createElement('img');
        iconElement.className = 'entry-icon';
        iconElement.style.width = '60px';
        iconElement.style.height = '60px';
        iconElement.style.maxWidth = '70px';
        iconElement.style.maxHeight = '70px';
        iconElement.style.minWidth = '50px';
        iconElement.style.minHeight = '50px';
        const iconData = getGroupIconUrl(item.groupId, item.groupName, groupIcons);
        iconElement.src = iconData.url;
        iconElement.alt = item.groupName;
        if (iconData.tags && iconData.tags.length > 0) {
            iconElement.dataset.groupTag = iconData.tags.join(',');
        }
        addImageErrorHandling(iconElement);
        iconContainer.appendChild(iconElement);

        // Create entry bar (contains the wins text and the text below)
        const barElement = document.createElement('div');
        barElement.className = 'entry-bar';
        barElement.style.display = 'flex';
        barElement.style.flexDirection = 'column';
        barElement.style.alignItems = 'center';
        barElement.style.justifyContent = 'center';
        barElement.style.width = '100%';
        barElement.style.minHeight = '60px';
        barElement.style.height = 'auto'; // let it grow with content
        barElement.style.overflow = 'visible';
        barElement.style.boxSizing = 'border-box';
        barElement.style.padding = '8px 20px 10px 20px';

        // Create wins container
        const winsElement = document.createElement('div');
        winsElement.className = 'entry-wins';
        winsElement.style.display = 'flex';
        winsElement.style.flexDirection = 'column';
        winsElement.style.alignItems = 'center';
        winsElement.style.justifyContent = 'center';
        winsElement.style.height = 'auto';
        winsElement.style.fontSize = '1.1em';
        winsElement.style.fontWeight = 'bold';
        winsElement.style.color = 'white';
        winsElement.style.textShadow = '1px 1px 3px rgba(0,0,0,0.7)';
        winsElement.style.whiteSpace = 'nowrap';
        winsElement.style.textAlign = 'center';
        winsElement.style.margin = '0 0 2px 0';

        // Wins label (WINS: n)
        const winsLabel = document.createElement('span');
        winsLabel.className = 'wins-label-text';
        winsLabel.innerHTML = `WINS: ${item.wins}`;
        winsLabel.style.fontWeight = 'bold';
        winsLabel.style.fontSize = '1em';
        winsLabel.style.letterSpacing = '0.02em';
        winsLabel.style.margin = '0 0 2px 0';
        winsLabel.style.display = 'block';
        winsElement.appendChild(winsLabel);

        // Text below wins
        const textDiv = document.createElement('div');
        textDiv.className = 'entry-text';
        textDiv.textContent = item.text || '';
        textDiv.style.fontSize = '0.95em'; // smaller and consistent
        textDiv.style.fontWeight = 'normal';
        textDiv.style.color = 'white';
        textDiv.style.textAlign = 'center';
        textDiv.style.textShadow = '1px 1px 3px rgba(0,0,0,0.7)';
        textDiv.style.overflowWrap = 'break-word';
        textDiv.style.lineHeight = '1.2';
        textDiv.style.letterSpacing = 'normal';
        textDiv.style.padding = '0';
        textDiv.style.margin = '0';
        textDiv.style.opacity = '0.85';
        textDiv.style.whiteSpace = 'normal';
        textDiv.style.overflow = 'visible';
        textDiv.style.textOverflow = 'unset';
        textDiv.style.boxSizing = 'border-box';
        textDiv.style.width = '100%';
        winsElement.appendChild(textDiv);

        barElement.appendChild(winsElement);
        entry.appendChild(iconContainer);
        entry.appendChild(barElement);

        // Adjust width based on wins
        const wins = item.wins;
        const maxWins = sortedData[0].wins || 1;
        const minWidthPercent = 75;
        const maxWidthPercent = 100;
        const widthPercentage = minWidthPercent + ((wins / maxWins) * (maxWidthPercent - minWidthPercent));
        entry.style.width = `${widthPercentage}%`;
        entry.style.height = 'auto';
        entry.style.minHeight = '60px';
        entry.style.alignItems = 'center';
        entry.style.boxSizing = 'border-box';

        // Add to wrapper
        entriesWrapper.appendChild(entry);
    });
}
