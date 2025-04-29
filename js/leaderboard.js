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

    // First check the raw content of the icons URL
    fetch(iconsUrl)
        .catch(error => {
            console.error('Failed to fetch icons URL:', error);
            // Continue with leaderboard data even if icons fetch fails
            return fetch(leaderboardUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error fetching leaderboard! Status: ${response.status}`);
                    }
                    return response.json().catch(error => {
                        console.error('Error parsing leaderboard JSON:', error);
                        return [];
                    });
                })
                .then(data => processLeaderboardData(data, podiumContainer, listEntriesContainer, groupIcons));
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error fetching icons! Status: ${response.status}`);
            }
            // Clone the response to use it twice
            const clonedResponse = response.clone();

            // Get the raw text to see what we're dealing with
            clonedResponse.text().then(text => {
                console.log('Raw icons data:', text.substring(0, 500) + '...');
                try {
                    // Try to parse it manually to see if it's valid JSON
                    const parsed = JSON.parse(text);
                    console.log('Manual parse successful, data type:', typeof parsed);
                } catch (e) {
                    console.error('Manual JSON parse failed:', e);
                }
            });

            // Continue with the normal flow
            return response.json().catch(error => {
                console.error('Error parsing icons JSON:', error);
                // Return an empty array as fallback
                return [];
            });
        })
        .then(iconsData => {
            // Debug: Log the actual data structure
            console.log('Icons data structure:', JSON.stringify(iconsData).substring(0, 500) + '...');

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

                console.log('Total group icons loaded:', Object.keys(groupIcons).length);
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
            } else {
                console.error('Icons data is not in expected format. Type:', typeof iconsData);
                console.error('Value:', iconsData);
            }

            console.log('Group icons collected:', Object.keys(groupIcons).length);

            // Now fetch the leaderboard data
            return fetch(leaderboardUrl);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error fetching leaderboard! Status: ${response.status}`);
            }
            return response.json().catch(error => {
                console.error('Error parsing leaderboard JSON:', error);
                // Return an empty array as fallback
                return [];
            });
        })
        .then(data => processLeaderboardData(data, podiumContainer, listEntriesContainer, groupIcons))
        .catch(error => {
            console.error('Error fetching data:', error);

            // Log more detailed information for debugging
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            }

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

    // Check if data is an array
    if (!Array.isArray(data)) {
        console.error('Leaderboard data is not an array. Type:', typeof data);
        throw new Error('Leaderboard data is not in the expected format');
    }

    // Sort data by wins in descending order
    const sortedData = data.sort((a, b) => b.wins - a.wins);
    console.log('Sorted data length:', sortedData.length);

    if (sortedData.length === 0) {
        podiumContainer.innerHTML = '<div class="error-message">No leaderboard data available.</div>';
        listEntriesContainer.innerHTML = '<div class="error-message">No leaderboard data available.</div>';
        return;
    }

    // Clear loading messages
    podiumContainer.innerHTML = '';
    listEntriesContainer.innerHTML = '';

    // Create podium (top 3)
    createPodium(sortedData, podiumContainer, groupIcons);

    // Create list entries (for page 2)
    createListEntries(sortedData, listEntriesContainer, groupIcons);
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

        barElement.appendChild(winsElement);
        entry.appendChild(iconContainer);
        entry.appendChild(barElement);

        entriesWrapper.appendChild(entry);
    });
}
