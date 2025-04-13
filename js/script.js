/**
 * FISH COMMUNITY WEBSITE SCRIPTS
 * Main JavaScript file for the FISH community website
 *
 * === CUSTOMIZATION GUIDE ===
 * - To modify website content: Edit the data files in the 'data' folder
 * - To change theme colors: Edit the CSS variables in style.css
 * - To add new pages: Create HTML files following the existing structure
 */

document.addEventListener('DOMContentLoaded', function() {
    // All fish animation logic has been moved to swimming-fish.js

    const escapeHtml = (unsafe) => {
        if (!unsafe || typeof unsafe !== 'string') return unsafe === 0 ? '0' : (unsafe || '');
        return unsafe
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/'/g, "'");
    };

    function getOrdinalSuffix(num) {
        if (num === null || typeof num === 'undefined') return "";
        const n = Number(num);
        if (isNaN(n) || n < 0) return "";
       const j = n % 10, k = n % 100;
       if (j == 1 && k != 11) return "st";
       if (j == 2 && k != 12) return "nd";
       if (j == 3 && k != 13) return "rd";
       return "th";
   }

   const targetDate = new Date(Date.UTC(2023, 6, 20)); // July 20, 2023 UTC
   const oneDay = 24 * 60 * 60 * 1000;
   function calculateDailyVrchatDay(date) {
        const normalizedDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        if (normalizedDate < targetDate) return null;
        const dayDifference = Math.floor((normalizedDate - targetDate) / oneDay);
        return (dayDifference >= 0) ? dayDifference : null;
   }

   // --- Image Mapping ---
    const IMAGE_MAP = {
        community_cheese_fish: "cheese_fish.png",
        community_vapor_fish: "vapor_fish.png",
        community_gamble_fish: "gamble_fish.png",
        community_rat_fish: "rat_fish.png",
        community_the_rusk_shack: "rusk_shack.png",
        community_avifair: "avifair.png",
        community_family_friendly_cult: "family_friendly_cult.png",
        community_portal_media: "portal_media.png",
        community_rose_fish: "rose_fish.png",
    };
    function getImagePath(key) {
        const filename = IMAGE_MAP[key];
        return filename ? `images/${filename}` : null;
    }
    function generateCommunityImageKey(name) {
        if (!name) return null;
        let key = name.toLowerCase()
                      .replace(/＜＞＜/g, 'fish')
                      .replace(/[^a-z0-9\s_]/g, '')
                      .trim()
                      .replace(/\s+/g, '_');
        return `community_${key}`;
    }

    // --- Global Data Store ---

    // --- Constants and State (Calendar/Timers) ---
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    let currentMonth = today.getUTCMonth();
    let currentYear = today.getUTCFullYear();
    let startDayOfWeekSetting = 1;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const WORLD_IDS = {
        0: "wrld_b0812b34-cd7c-44b8-9b29-4f921a9e4d5a", 1: "wrld_9806f25c-0644-4ed7-a3b9-404763bd7dbc",
        2: "wrld_a1caec89-3313-42d3-977a-3f8ac819a5a9", 3: "wrld_94d6eb87-7246-4dd8-81c0-cb1f468f096a",
        4: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355", 5: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355",
        6: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355" };
    const VRC_GROUP_ID = "grp_2b910dc4-e984-4fd5-813c-877edcea29d2";
    const locations = [ "YES?", "LUXURY TRASH", "The Fishing Mall", "Retrocubic Nexus", "Cunks Coughing City", "YES?", "YES?" ];
    let specialDaysMap = new Map();
    let dailySpecialDaysMap = new Map();
    window.timerElementsChecked = false;
    window.timerElementsMissing = false;

    // --- URLs for Data ---
    const PRIMARY_DATA_URL = "https://gist.githubusercontent.com/TheZiver/13fc44e6b228346750401f7fbfc995ed/raw"; // For special days and products
    const COMMUNITY_DATA_URL = "https://gist.githubusercontent.com/TheZiver/9fdd3f8c495098ffa0beceece373d382/raw"; // Specifically for community lists/info
    const ROSE_FISH_MEMBERS_URL = "https://gist.githubusercontent.com/TheZiver/9b85c8b8b6c1b4caa17dda8d37dc18ac/raw"; // For Rose Fish members list

    // Log the URLs for debugging
    console.log("PRIMARY_DATA_URL:", PRIMARY_DATA_URL);
    console.log("COMMUNITY_DATA_URL:", COMMUNITY_DATA_URL);
    console.log("ROSE_FISH_MEMBERS_URL:", ROSE_FISH_MEMBERS_URL);

    // --- Element Selectors (Placeholders) ---
    let introElement, /* meaningElement removed */ principlesListElement, principlesNoteElement,
        calendarGrid, monthYearDisplay, weekdaysContainer, dailyInfoElement, dailyDescElement,
        dailyWarnElement, dailyRulesElement, countdownContainer, countdownTimerDisplay,
        countdownDayLabel, closingCountdownContainer, closingCountdownTimerDisplay,
        closingCountdownDayLabel, happeningNowContainer, happeningNowMessage, happeningNowLink,
        verifiedInfoElement, certifiedInfoElement, verifiedListElement, certifiedListElement,
        rosefishInfoElement, rosefishVoteInfoElement, rosefishGuidelinesElement,
        rosefishMembersListElement, luxuryMottoElement, luxuryProductsListElement,
        prevMonthButton, nextMonthButton, gotoTodayButton, startSunButton, startMonButton;

    // Function to get references to all elements after DOM is ready
    function getAllElements() {
        introElement = document.getElementById('community-intro');
        // meaningElement removed
        principlesListElement = document.getElementById('principles-list');
        principlesNoteElement = document.getElementById('principles-additional-note');
        calendarGrid = document.getElementById('calendar-grid');
        monthYearDisplay = document.getElementById('cal-month-year');
        weekdaysContainer = document.getElementById('calendar-weekdays');
        dailyInfoElement = document.getElementById('daily-extra-info');
        dailyDescElement = document.getElementById('daily-description');
        dailyWarnElement = document.getElementById('daily-warning');
        dailyRulesElement = document.getElementById('daily-rules');
        countdownContainer = document.getElementById('countdown-container');
        countdownTimerDisplay = document.getElementById('countdown-timer');
        countdownDayLabel = document.getElementById('countdown-day-label');
        closingCountdownContainer = document.getElementById('closing-countdown-container');
        closingCountdownTimerDisplay = document.getElementById('closing-countdown-timer');
        closingCountdownDayLabel = document.getElementById('closing-countdown-day-label');
        happeningNowContainer = document.getElementById('happening-now-container');
        happeningNowMessage = document.getElementById('happening-now-message');
        happeningNowLink = document.getElementById('happening-now-link');
        verifiedInfoElement = document.getElementById('verified-info');
        certifiedInfoElement = document.getElementById('certified-info');
        knownInfoElement = document.getElementById('known-info'); // Added selector for known info
        verifiedListElement = document.getElementById('fish-verified-list');
        certifiedListElement = document.getElementById('fish-certified-list');
        knownListElement = document.getElementById('fish-known-list');
        fishStatusListElement = document.getElementById('fish-status-list'); // Added selector for FISH status list
        rosefishInfoElement = document.getElementById('rosefish-info');
        rosefishVoteInfoElement = document.getElementById('rosefish-vote-info');
        rosefishGuidelinesElement = document.getElementById('rosefish-guidelines');
        rosefishMembersListElement = document.getElementById('rosefish-members-list'); // Keep this selector
        luxuryMottoElement = document.getElementById('luxury-motto');
        luxuryProductsListElement = document.getElementById('luxury-products-list');
        prevMonthButton = document.getElementById('cal-prev-month');
        nextMonthButton = document.getElementById('cal-next-month');
        gotoTodayButton = document.getElementById('cal-goto-today');
        startSunButton = document.getElementById('cal-start-sun');
        startMonButton = document.getElementById('cal-start-mon');
    }


    // --- Loading Functions ---

    function loadIntro(data) {
        if (!introElement || !data?.info?.intro) return;
        introElement.textContent = data.info.intro;
    }

    function loadMeaningAndPrinciples(data) {
        // Principles List
        if (principlesListElement && data?.info?.community_principles?.principles) {
            principlesListElement.innerHTML = '';
            data.info.community_principles.principles.forEach(principle => {
                const li = document.createElement('li');
                li.innerHTML = `<b>${escapeHtml(principle.title) || 'Principle'}</b>: ${escapeHtml(principle.description) || 'No description.'}`;
                principlesListElement.appendChild(li);
            });
        } else if (principlesListElement) {
            principlesListElement.innerHTML = '<li class="error-message"><i>Could not load principles data.</i></li>';
        }

        // Principles Note (Keep this part)
        if (principlesNoteElement && data?.info?.community_principles?.note) {
            principlesNoteElement.textContent = data.info.community_principles.note;
        } else if (principlesNoteElement) {
            principlesNoteElement.textContent = '<i>Additional note not available.</i>';
        }
    }

    function loadDailyInfo(data) {
        if (dailyInfoElement && data?.daily_vrchat?.daily_vrchat_info?.extra_info) {
             dailyInfoElement.innerHTML = `<p>${escapeHtml(data.daily_vrchat.daily_vrchat_info.extra_info).replace(/\n/g, '<br>')}</p>`;
        } else if (dailyInfoElement) {
             dailyInfoElement.innerHTML = '<p><i>Event details not available.</i></p>';
        }

        if (dailyDescElement && data?.daily_vrchat?.daily_vrchat_info?.description) {
             dailyDescElement.innerHTML = `<p>${escapeHtml(data.daily_vrchat.daily_vrchat_info.description).replace(/\n/g, '<br>')}</p>`;
        } else if (dailyDescElement) {
            dailyDescElement.innerHTML = '<p><i>Description not available.</i></p>';
        }

        if (dailyRulesElement && data?.daily_vrchat?.daily_vrchat_info?.rules) {
             dailyRulesElement.innerHTML = data.daily_vrchat.daily_vrchat_info.rules;
        } else if (dailyRulesElement) {
             dailyRulesElement.innerHTML = '<i>Rules not available.</i>';
        }

        if (dailyWarnElement && data?.daily_vrchat?.daily_vrchat_info?.warning) {
             dailyWarnElement.innerHTML = `<p class="warning">${escapeHtml(data.daily_vrchat.daily_vrchat_info.warning).replace(/\n/g, '<br>')}</p>`;
        } else if (dailyWarnElement) {
             dailyWarnElement.innerHTML = '<p class="warning"><i>Warning not available.</i></p>';
        }
    }

    function loadCommunityInfo(data) {
        if (verifiedInfoElement && data?.fish_communities?.verified_info) {
            verifiedInfoElement.innerHTML = `<p>${escapeHtml(data.fish_communities.verified_info).replace(/\n/g, '<br>')}</p>`;
        } else if (verifiedInfoElement) {
             verifiedInfoElement.innerHTML = '<p><i>Verification info not available.</i></p>';
        }

        // Skip loading certified info from JSON if it's already populated in HTML
        if (certifiedInfoElement && certifiedInfoElement.innerHTML.trim() === '') {
            if (data?.fish_communities?.certified_info && data.fish_communities.certified_info.trim() !== '') {
                certifiedInfoElement.innerHTML = `<p>${escapeHtml(data.fish_communities.certified_info).replace(/\n/g, '<br>')}</p>`;
            } else {
                certifiedInfoElement.innerHTML = '<p><i>Certification info not available.</i></p>';
            }
        }

       // Add handling for known_info
       if (knownInfoElement && data?.fish_communities?.known_info) {
           knownInfoElement.innerHTML = `<p>${escapeHtml(data.fish_communities.known_info).replace(/\n/g, '<br>')}</p>`;
       } else if (knownInfoElement) {
            knownInfoElement.innerHTML = '<p><i>Known community info not available.</i></p>';
       }
   }

   function loadFishGroups(data) {
        console.log("loadFishGroups called with data:", data);

        // Use the correct path from the JSON: data.community_groups
        const communities = data?.community_groups;
        console.log("communities extracted from data:", communities);

        // Check if ANY of the relevant list elements exist on the page
        console.log("List elements exist? verifiedListElement:", !!verifiedListElement,
                   "certifiedListElement:", !!certifiedListElement,
                   "knownListElement:", !!knownListElement,
                   "fishStatusListElement:", !!fishStatusListElement);

        if (!verifiedListElement && !certifiedListElement && !knownListElement && !fishStatusListElement) {
            console.log("No list elements found on page, returning early");
            return;
        }

        if (!Array.isArray(communities)) {
             // Keep error message generic, or specify path mismatch
             console.error("Community groups data is not an array or is missing at data.community_groups. Structure received:", data);
             console.log("Data keys:", Object.keys(data || {}));

             if(verifiedListElement) verifiedListElement.innerHTML = '<li class="error-message"><i>Could not load communities data (invalid structure).</i></li>';
             if(certifiedListElement) certifiedListElement.innerHTML = '<li class="error-message"><i>Could not load communities data (invalid structure).</i></li>';
             if(knownListElement) knownListElement.innerHTML = '<li class="error-message"><i>Could not load communities data (invalid structure).</i></li>';
             if(fishStatusListElement) fishStatusListElement.innerHTML = '<li class="error-message"><i>Could not load communities data (invalid structure).</i></li>';
             return;
        }

        // Clear any existing content
        if(verifiedListElement) verifiedListElement.innerHTML = '';
        if(certifiedListElement) certifiedListElement.innerHTML = '';
        if(knownListElement) knownListElement.innerHTML = '';
        if(fishStatusListElement) fishStatusListElement.innerHTML = ''; // Clear FISH status list

        let verifiedCount = 0;
        let certifiedCount = 0;
        let knownCount = 0;
        let fishStatusCount = 0; // Counter for FISH status groups

        communities.forEach(community => {
            // Check the actual property name: 'group_name'
            if (!community || typeof community.group_name !== 'string') {
                 console.warn("Skipping community item due to missing or invalid group_name:", community);
                 return;
            }

            // Skip communities with SYSTEM tag
            if (community.tags && Array.isArray(community.tags) && community.tags.includes('SYSTEM')) {
                console.log(`Skipping SYSTEM-tagged community: ${community.group_name}`);
                return;
            }

            const listItem = document.createElement('li');
            const textDiv = document.createElement('div');
            let textContentHTML = '';
            const escapedName = escapeHtml(community.group_name); // Use actual 'group_name'
            // Removed the span wrapper for ＜＞＜, rely only on escapeHtml
            textContentHTML += `<b>${escapedName}</b>`;
            // Add owner if available in JSON (it is: 'owner')
            if (community.owner) textContentHTML += `<span>${escapeHtml(community.owner)}</span>`; // Removed "Owner:" label

            textDiv.innerHTML = textContentHTML; // Set initial text content (name, owner)

            // Create a container for all icon links
            const linksContainer = document.createElement('div');
            linksContainer.classList.add('community-links-container'); // New class for styling the row

            // Add VRChat Group Link as an icon (only for FISH_VERIFIED and FISH_CERTIFIED)
            const vrchatLink = community.group_link;
            const isKnownGroup = community.tags && Array.isArray(community.tags) && community.tags.includes('FISH_KNOWN');
            const isVerifiedOrCertified = community.tags && Array.isArray(community.tags) &&
                (community.tags.includes('FISH_VERIFIED') || community.tags.includes('FISH_CERTIFIED'));

            // Only add VRChat icon link for FISH_VERIFIED and FISH_CERTIFIED groups
            // FISH_KNOWN groups will only have the image clickable, not this icon
            if (isVerifiedOrCertified && vrchatLink && (vrchatLink.startsWith('http') || vrchatLink.startsWith('vrchat://'))) {
                const a = document.createElement('a');
                a.href = escapeHtml(vrchatLink.trim());
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.classList.add('community-link-icon');
                a.title = 'VRChat Group';
                a.innerHTML = '<i class="fas fa-vr-cardboard fa-fw"></i>';
                linksContainer.appendChild(a);
            }

            // External group links (only for FISH_VERIFIED and FISH_CERTIFIED)
            // FISH_KNOWN groups will only have the image clickable, not these external links
            if (isVerifiedOrCertified && Array.isArray(community.group_links) && community.group_links.length > 0) {
                community.group_links.forEach(link => {
                    if (typeof link === 'string' && link.trim() !== '') {
                        const a = document.createElement('a');
                        a.href = escapeHtml(link.trim());
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.classList.add('community-link-icon');

                        // Determine icon class and title
                        let iconClass = 'fas fa-link fa-fw';
                        let iconTitle = 'External Link';
                        try {
                            const url = new URL(link);
                            const hostname = url.hostname.replace(/^www\./, '');
                            iconTitle = hostname;

                            if (hostname.includes('discord.gg')) { iconClass = 'fab fa-discord fa-fw'; iconTitle = 'Discord'; }
                            else if (hostname.includes('twitter.com')) { iconClass = 'fab fa-x-twitter fa-fw'; iconTitle = 'Twitter/X'; }
                            else if (hostname.includes('patreon.com')) { iconClass = 'fab fa-patreon fa-fw'; iconTitle = 'Patreon'; }
                            else if (hostname.includes('ko-fi.com')) { iconClass = 'fas fa-mug-saucer fa-fw'; iconTitle = 'Ko-fi'; }
                            else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) { iconClass = 'fab fa-youtube fa-fw'; iconTitle = 'YouTube'; }
                            else if (hostname.includes('booth.pm')) { iconClass = 'fas fa-store fa-fw'; iconTitle = 'Booth'; }
                            else if (hostname.includes('github.com')) { iconClass = 'fab fa-github fa-fw'; iconTitle = 'GitHub'; }
                            else if (hostname.includes('twitch.tv')) { iconClass = 'fab fa-twitch fa-fw'; iconTitle = 'Twitch'; }
                            else if (hostname.includes('github.io') || url.pathname.length > 1) { iconClass = 'fas fa-globe fa-fw'; iconTitle = 'Website'; }
                            else { iconClass = 'fas fa-globe fa-fw'; iconTitle = hostname; }
                        } catch (e) {
                            iconClass = 'fas fa-link fa-fw';
                            console.warn(`Could not parse URL for icon: ${link}`, e);
                        }
                        const prefix = iconClass.startsWith('fa-brands') || iconClass.startsWith('fab') ? 'fab' : 'fas';
                        const iconName = iconClass.split(' ')[1];
                        a.innerHTML = `<i class="${prefix} ${iconName} fa-fw"></i>`;
                        a.title = escapeHtml(iconTitle);
                        linksContainer.appendChild(a);
                    }
                });
            }
            // Append the whole links container if it has links
            if (linksContainer.hasChildNodes()) {
                 textDiv.appendChild(linksContainer);
            }

            // Add member count below links if available
            if (typeof community.member_count === 'number') {
                const memberCountSpan = document.createElement('span');
                memberCountSpan.classList.add('community-member-count'); // Class for styling
                memberCountSpan.innerHTML = `<b>Members:</b> ${escapeHtml(community.member_count.toLocaleString())}`; // Format with commas
                textDiv.appendChild(memberCountSpan); // Append after links container
            }

            // --- Community Logo Handling (with Link and Fallback) ---
            const img = document.createElement('img');
            img.alt = `${community.group_name} Logo`;
            img.classList.add('community-logo');
            img.loading = 'lazy';

            let imageSource = null;
            let addErrorFallback = false;

            // 1. Try icon_url from JSON
            if (community.icon_url) {
                imageSource = escapeHtml(community.icon_url);
                addErrorFallback = true; // Use fallback if this URL fails
            } else {
                // 2. Try local image mapping
                const imageKey = generateCommunityImageKey(community.group_name);
                const mappedPath = imageKey ? getImagePath(imageKey) : null;
                if (mappedPath) {
                    imageSource = mappedPath;
                } else {
                    // 3. Use fish_known.png as the final fallback
                    imageSource = 'images/fish_known.png';
                    console.warn(`No icon_url or local mapping for ${community.group_name}, using fallback.`);
                }
            }

            img.src = imageSource;

            // Add error handler ONLY if we attempted to load icon_url
            if (addErrorFallback) {
                img.onerror = () => {
                    console.warn(`Failed to load image from icon_url: ${img.src}. Using fallback.`);
                    img.src = 'images/fish_known.png';
                    // Remove the error handler to prevent infinite loops if fallback also fails
                    img.onerror = null;
                };
            } else {
                 // Add a simpler error handler for local/fallback images
                 img.onerror = () => {
                     console.error(`Failed to load local/fallback image: ${img.src}`);
                     img.style.display = 'none'; // Hide if even fallback fails
                 };
            }

            // Add image link for all communities with VRChat group links
            // FISH_KNOWN groups only get this link, no other links
            if (vrchatLink && (vrchatLink.startsWith('http') || vrchatLink.startsWith('vrchat://'))) {
                const linkWrapper = document.createElement('a');
                linkWrapper.href = escapeHtml(vrchatLink.trim());
                linkWrapper.target = '_blank';
                linkWrapper.rel = 'noopener noreferrer';
                linkWrapper.title = `VRChat Group: ${community.group_name}`;
                linkWrapper.classList.add('community-logo-link');

                linkWrapper.appendChild(img);
                listItem.appendChild(linkWrapper);
            } else {
                listItem.appendChild(img); // Append the image directly if no link
            }

            listItem.appendChild(textDiv); // Append the text content div after the image/link

            // Check tags array and append to the correct list
            if (community.tags && Array.isArray(community.tags)) {
                console.log(`Processing community ${community.group_name} with tags:`, community.tags);

                // Check for specific tags in priority order
                if (community.tags.includes('FISH_VERIFIED') && verifiedListElement) {
                    console.log(`Adding ${community.group_name} to verified list`);
                    verifiedListElement.appendChild(listItem);
                    verifiedCount++;
                } else if (community.tags.includes('FISH_CERTIFIED') && certifiedListElement) {
                    console.log(`Adding ${community.group_name} to certified list`);
                    certifiedListElement.appendChild(listItem);
                    certifiedCount++;
                } else if (community.tags.includes('FISH_KNOWN') && knownListElement) {
                    console.log(`Adding ${community.group_name} to known list`);
                    knownListElement.appendChild(listItem);
                    knownCount++;
                } else if (community.tags.includes('FISH') && fishStatusListElement) { // Handle FISH status
                    console.log(`Adding ${community.group_name} to FISH status list`);
                    // Need to clone the listItem because it might be appended elsewhere if status changes
                    fishStatusListElement.appendChild(listItem.cloneNode(true));
                    fishStatusCount++;
                } else {
                    console.log(`Community ${community.group_name} has tags but none match our categories:`, community.tags);
                }
                // Removed SYSTEM tag handling - these groups are now skipped
            } else if (community.status) {
                // Fallback for old status property for backward compatibility
                console.log(`Processing community ${community.group_name} with status: ${community.status}`);

                if (community.status === 'FISH_VERIFIED' && verifiedListElement) {
                    console.log(`Adding ${community.group_name} to verified list (status)`);
                    verifiedListElement.appendChild(listItem);
                    verifiedCount++;
                } else if (community.status === 'FISH_CERTIFIED' && certifiedListElement) {
                    console.log(`Adding ${community.group_name} to certified list (status)`);
                    certifiedListElement.appendChild(listItem);
                    certifiedCount++;
                } else if (community.status === 'FISH_KNOWN' && knownListElement) {
                    console.log(`Adding ${community.group_name} to known list (status)`);
                    knownListElement.appendChild(listItem);
                    knownCount++;
                } else if (community.status === 'FISH' && fishStatusListElement) {
                    console.log(`Adding ${community.group_name} to FISH status list (status)`);
                    fishStatusListElement.appendChild(listItem.cloneNode(true));
                    fishStatusCount++;
                } else {
                    console.log(`Community ${community.group_name} has unrecognized status: ${community.status}`);
                }
            } else {
                console.log(`Community ${community.group_name} has neither tags nor status, adding to known list by default`);
                if (knownListElement) {
                    knownListElement.appendChild(listItem);
                    knownCount++;
                }
            }
            // Note: Communities with FISH tag are handled separately
        });

        // Add messages if lists are empty
        if (verifiedListElement && verifiedCount === 0) {
            verifiedListElement.innerHTML = '<li><i>No verified communities listed currently.</i></li>';
        }
        if (certifiedListElement && certifiedCount === 0) {
            certifiedListElement.innerHTML = '<li><i>No certified communities listed currently.</i></li>';
        }
        if (knownListElement && knownCount === 0) {
            knownListElement.innerHTML = '<li><i>No known communities listed currently.</i></li>';
        }
        if (fishStatusListElement && fishStatusCount === 0) { // Add message for empty FISH status list
            fishStatusListElement.innerHTML = '<li><i>No FISH status communities listed currently.</i></li>';
        }
    }

    function loadRoseFishInfo(data) {
        if (rosefishInfoElement && data?.rose_fish?.rose_fish_info) {
            rosefishInfoElement.innerHTML = `<p>${escapeHtml(data.rose_fish.rose_fish_info).replace(/\n/g, '<br>')}</p>`;
        } else if (rosefishInfoElement) {
            rosefishInfoElement.innerHTML = '<p><i>Rose Fish info not available.</i></p>';
        }

        if (rosefishVoteInfoElement && data?.rose_fish?.vote_info) {
            rosefishVoteInfoElement.innerHTML = `<p>${escapeHtml(data.rose_fish.vote_info).replace(/\n/g, '<br>')}</p>`;
        } else if (rosefishVoteInfoElement) {
             rosefishVoteInfoElement.innerHTML = '<p><i>Voting info not available.</i></p>';
        }

        if (rosefishGuidelinesElement && data?.rose_fish?.avatar_guidelines) {
            let guidelinesHtml = escapeHtml(data.rose_fish.avatar_guidelines)
                                  .replace(/\n/g, '<br>')
                                  .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            rosefishGuidelinesElement.innerHTML = `<p>${guidelinesHtml}</p>`;
        } else if (rosefishGuidelinesElement) {
            rosefishGuidelinesElement.innerHTML = '<p><i>Guidelines not available.</i></p>';
        }
    }

    function loadRoseFishMembers() {
        if (!rosefishMembersListElement) return; // Ensure the element exists

        fetch(ROSE_FISH_MEMBERS_URL)
            .then(handleResponse) // Use the common response handler
            .then(text => {
                // Directly insert the raw fetched text, wrapped in <pre> for formatting.
                // Escape HTML to prevent potential XSS issues from the source data.
                // Styling (text-align, color) will be handled by CSS.
                rosefishMembersListElement.innerHTML = `<pre style="white-space: pre-wrap;">${escapeHtml(text)}</pre>`;
            })
            .catch(error => {
                 console.error('Error loading Rose Fish members:', error);
                 if (rosefishMembersListElement) {
                     // Display error within the list element itself
                     rosefishMembersListElement.innerHTML = '<li class="error-message"><i>Could not load members list.</i></li>';
                 }
            });
    }

    function handleResponse(response) {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text();
    }

    function parseMemberLines(nameLine, infoLine) {
        const tagRegex = /<size=\d+>\s*(.*?)\s*<\/size>/;
        const nameMatch = nameLine.trim().match(tagRegex);
        const infoMatch = infoLine.trim().match(tagRegex);

        if (!nameMatch || !infoMatch) {
            console.warn(`Could not parse lines: "${nameLine}" or "${infoLine}"`);
            return [null, null];
        }
        return [nameMatch[1], infoMatch[1]];
    }

    function createMemberListItem(name, info) {
        const li = document.createElement('li');
        const nameHeading = document.createElement('h4');
        nameHeading.textContent = name;

        const infoParagraph = document.createElement('p');
        infoParagraph.textContent = info;

        li.appendChild(nameHeading);
        li.appendChild(document.createElement('br'));
        li.appendChild(infoParagraph);
        return li;
    }

    function handleMemberError(error) {
        console.error('Error loading members:', error);
        if (rosefishMembersListElement) {
            rosefishMembersListElement.innerHTML = '<li>Error loading members. Please try again later.</li>';
        }
    }

    function loadProducts(data) {
        if (!data?.store?.products || !Array.isArray(data.store.products) || !luxuryProductsListElement) {
            return;
        }

        // Clear loading message
        luxuryProductsListElement.innerHTML = '';

        // Create product grid
        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            productsContainer.innerHTML = ''; // Clear loading message

            data.store.products.forEach(product => {
                if (!product.item || !product.link) return;

                const productDiv = document.createElement('div');
                productDiv.className = 'product-item';

                const productLink = document.createElement('a');
                productLink.href = product.link;
                productLink.target = '_blank';
                productLink.rel = 'noopener noreferrer';
                productLink.className = 'product-link';
                productLink.textContent = product.item;

                const productPrice = document.createElement('div');
                productPrice.className = 'product-price';
                productPrice.textContent = product.price || '';

                productDiv.appendChild(productLink);
                productDiv.appendChild(productPrice);
                productsContainer.appendChild(productDiv);
            });
        }
    }

    // --- Calendar Rendering Functions ---

    function processSpecialDays(data) {
        specialDaysMap.clear();
        dailySpecialDaysMap.clear();

        if (data?.daily_vrchat && Array.isArray(data.daily_vrchat.special_days)) {
            data.daily_vrchat.special_days.forEach(item => {
                if (item && typeof item.day === 'number' && Number.isInteger(item.day) && item.day >= 0 && typeof item.name === 'string' && item.name.trim() !== '') {
                    dailySpecialDaysMap.set(item.day, {
                        name: item.name,
                        description: item.description,
                        link: item.link,
                        css_class: item.css_class
                    });
                } else { console.warn("Skipping invalid daily-number-based special day entry:", item); }
            });
            console.log(`Processed ${dailySpecialDaysMap.size} daily-number-based special days.`);
        } else { console.log("No 'daily_vrchat.special_days' array found or it was invalid in JSON."); }
    }

    function renderCalendar(month, year) {
        if (!calendarGrid || !monthYearDisplay || !weekdaysContainer) {
             console.error("Calendar elements not found when trying to render!");
             if(calendarGrid) calendarGrid.innerHTML = "<p class='error-message' style='grid-column: 1 / -1; text-align: center;'><i>Error: Calendar elements missing.</i></p>";
             return;
        }

       // Removed check for window.communityData as processSpecialDays handles data dependency now.
       // if (!window.communityData) { ... }

       // Check if the map is populated, processSpecialDays should have run before this.
       if (dailySpecialDaysMap.size === 0) {
            console.warn("Special days map is empty when trying to render calendar. Data might be missing or processing failed.");
            // Optionally, display an error or attempt reprocessing if feasible, but avoid reprocessing with non-existent global data.
            // processSpecialDays(window.communityData); // DO NOT REPROCESS WITH GLOBAL DATA
        }

        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
        weekdaysContainer.innerHTML = '';
        const weekdayNamesShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        let orderedWeekdays = (startDayOfWeekSetting === 1)
            ? weekdayNamesShort
            : [...weekdayNamesShort.slice(6), ...weekdayNamesShort.slice(0, 6)];

        orderedWeekdays.forEach(dayName => {
            const weekdayCell = document.createElement('div');
            weekdayCell.classList.add('weekday-header');
            weekdayCell.textContent = dayName;
            weekdaysContainer.appendChild(weekdayCell);
        });

        calendarGrid.innerHTML = '';
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const lastDayOfPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const firstDayIndex = firstDayOfMonth.getUTCDay();
        let startingDayOffset = (firstDayIndex - startDayOfWeekSetting + 7) % 7;

        try {
            for (let i = 0; i < startingDayOffset; i++) {
                calendarGrid.appendChild(createDayCell(lastDayOfPrevMonth - startingDayOffset + 1 + i, true));
            }
            for (let day = 1; day <= daysInMonth; day++) {
                const cellDate = new Date(Date.UTC(year, month, day));
                const isToday = (year === todayUTC.getUTCFullYear() && month === todayUTC.getUTCMonth() && day === todayUTC.getUTCDate());
                calendarGrid.appendChild(createDayCell(day, false, cellDate, isToday));
            }
            const totalCellsRendered = startingDayOffset + daysInMonth;
            const remainingCells = (7 - (totalCellsRendered % 7)) % 7;
            for (let i = 0; i < remainingCells; i++) {
                calendarGrid.appendChild(createDayCell(i + 1, true));
            }
        } catch (error) {
            console.error("Error occurred while creating calendar day cells:", error);
            calendarGrid.innerHTML = `<p class='error-message' style='grid-column: 1 / -1; text-align: center;'><i>Error generating calendar days: ${escapeHtml(error.message)}</i></p>`;
        }
    }

    function createDayCell(dayNumber, isOtherMonth, cellDate = null, isToday = false) {
        // Create wrapper to maintain aspect ratio
        const wrapper = document.createElement('div');
        wrapper.classList.add('calendar-day-wrapper');

        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.classList.add('day-number');
        dayNumberSpan.textContent = dayNumber;

        if (isOtherMonth) {
            dayCell.classList.add('other-month');
            dayCell.appendChild(dayNumberSpan);
        } else if (cellDate) {
            let isHandled = false;
            const dailyDay = calculateDailyVrchatDay(cellDate);

            if (dailyDay !== null && dailySpecialDaysMap.has(dailyDay)) {
                const dailySpecialDay = dailySpecialDaysMap.get(dailyDay);
                dayCell.classList.add('special-day');
                if (dailySpecialDay.css_class) dayCell.classList.add(dailySpecialDay.css_class);
                const linkHref = dailySpecialDay.link;
                const linkTitle = dailySpecialDay.description || dailySpecialDay.name;
                const wrapperElement = document.createElement(linkHref ? 'a' : 'div');
                if (linkHref) {
                    wrapperElement.href = linkHref;
                    wrapperElement.target = "_blank";
                    wrapperElement.rel = "noopener noreferrer";
                }
                if (linkTitle) wrapperElement.title = linkTitle;
                wrapperElement.appendChild(dayNumberSpan);
                const specialNameSpan = document.createElement('span');
                specialNameSpan.classList.add('event-location');
                if (dailySpecialDay.name) {
                   specialNameSpan.innerHTML = escapeHtml(dailySpecialDay.name).replace(/\n/g, '<br>');
                } else {
                   specialNameSpan.textContent = '';
                }
                wrapperElement.appendChild(specialNameSpan);
                dayCell.appendChild(wrapperElement);
                isHandled = true;
            }

            if (!isHandled && dailyDay !== null) {
                const suffix = getOrdinalSuffix(dailyDay);
                const instanceId = dailyDay;
                const dayOfWeekForWorld = (cellDate.getUTCDay() + 6) % 7;
                const worldId = WORLD_IDS[dayOfWeekForWorld];
                const dayOfWeekForLocation = cellDate.getUTCDay();
                const locationName = locations[dayOfWeekForLocation];
                const baseUrl = "https://vrchat.com/home/launch?worldId=" + worldId + "&instanceId=";
                const instanceParams = `~group(${VRC_GROUP_ID})~groupAccessType(public)~region(eu)`;
                const vrchatLink = baseUrl + instanceId + instanceParams;
                const dayLink = document.createElement('a');
                dayLink.href = vrchatLink;
                dayLink.target = "_blank";
                dayLink.rel = "noopener noreferrer";
                dayLink.title = `Join Daily VRChat #${dailyDay}${suffix}`;
                dayLink.appendChild(dayNumberSpan);
                const eventNumSpan = document.createElement('span');
                eventNumSpan.classList.add('daily-event-num');
                eventNumSpan.textContent = `${dailyDay}${suffix}`;
                dayLink.appendChild(eventNumSpan);
                if (locationName) {
                    const locationSpan = document.createElement('span');
                    locationSpan.classList.add('event-location');
                    locationSpan.textContent = locationName;
                    dayLink.appendChild(locationSpan);
                }
                dayCell.appendChild(dayLink);
                isHandled = true;
            }

            if (!isHandled) {
                dayCell.appendChild(dayNumberSpan);
            }
            if (isToday) {
                dayCell.classList.add('today');
            }
        } else {
            dayCell.appendChild(dayNumberSpan);
        }

        // Add the day cell to the wrapper and return the wrapper
        wrapper.appendChild(dayCell);
        return wrapper;
    }


    // --- Timer Update Functions ---
    function updateEventTimers() {
         if (!window.timerElementsChecked) {
            if (!countdownContainer || !countdownTimerDisplay || !countdownDayLabel ||
                !closingCountdownContainer || !closingCountdownTimerDisplay || !closingCountdownDayLabel ||
                !happeningNowContainer || !happeningNowMessage || !happeningNowLink)
            {
                 console.warn("One or more timer display elements missing. Timers disabled for this page.");
                 window.timerElementsMissing = true;
            }
             window.timerElementsChecked = true;
        }
        if (window.timerElementsMissing) return;
        try {
            const nowUTC = new Date();
            const nowUTCMillis = nowUTC.getTime();
            let nextStartUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 21, 0, 0, 0));
            if (nowUTCMillis >= nextStartUTC.getTime()) {
                nextStartUTC.setUTCDate(nextStartUTC.getUTCDate() + 1);
            }
            const diffToStart = nextStartUTC.getTime() - nowUTCMillis;
            const startDayNumber = calculateDailyVrchatDay(nextStartUTC);
            const startDaySuffix = getOrdinalSuffix(startDayNumber);
            countdownDayLabel.textContent = (startDayNumber !== null) ? `${startDayNumber}${startDaySuffix}` : "---";
            countdownTimerDisplay.textContent = formatTimeDifference(diffToStart);
            countdownContainer.style.display = 'block';

            let nextCloseUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 23, 0, 0, 0));
            if (nowUTCMillis >= nextCloseUTC.getTime()) {
                nextCloseUTC.setUTCDate(nextCloseUTC.getUTCDate() + 1);
            }
            const diffToClose = nextCloseUTC.getTime() - nowUTCMillis;
            let closeEventDayUTC = new Date(nextCloseUTC);
            closeEventDayUTC.setUTCHours(21, 0, 0, 0);
            const closeDayNumber = calculateDailyVrchatDay(closeEventDayUTC);
            const closeDaySuffix = getOrdinalSuffix(closeDayNumber);
            closingCountdownDayLabel.textContent = (closeDayNumber !== null) ? `${closeDayNumber}${closeDaySuffix}` : "---";
            closingCountdownTimerDisplay.textContent = formatTimeDifference(diffToClose);
            closingCountdownContainer.style.display = 'block';

            const todayStartUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 21, 0, 0, 0));
            const todayCloseUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 23, 0, 0, 0));

            if (nowUTCMillis >= todayStartUTC.getTime() && nowUTCMillis < todayCloseUTC.getTime()) {
                const currentDayNumber = calculateDailyVrchatDay(todayStartUTC);
                const currentDaySuffix = getOrdinalSuffix(currentDayNumber);
                const instanceId = currentDayNumber;

                if (instanceId !== null) {
                     const dayOfWeekForWorld = (todayStartUTC.getUTCDay() + 6) % 7;
                     const worldId = WORLD_IDS[dayOfWeekForWorld];
                     const baseUrl = "https://vrchat.com/home/launch?worldId=" + worldId + "&instanceId=";
                     const instanceParams = `~group(${VRC_GROUP_ID})~groupAccessType(public)~region(eu)`;
                     const vrchatLink = baseUrl + instanceId + instanceParams;

                     happeningNowMessage.textContent = `DAILY VRCHAT (${currentDayNumber}${currentDaySuffix}) IS CURRENTLY HAPPENING`;
                     happeningNowLink.href = vrchatLink;
                     happeningNowContainer.style.display = 'block';
                } else {
                     happeningNowContainer.style.display = 'none';
                     console.error("Could not calculate instance ID during event window.");
                }
            } else {
                happeningNowContainer.style.display = 'none';
            }
        } catch (error) {
            console.error("Error in updateEventTimers:", error);
            displayTimerErrorState("Error updating timers.");
        }

    }
    function formatTimeDifference(differenceMillis) {
        if (differenceMillis <= 0) return "Now / Very Soon!";
        const totalSeconds = Math.max(0, Math.floor(differenceMillis / 1000));
        const days = Math.floor(totalSeconds / (60 * 60 * 24));
        const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;
        let timeString = "";
        if (days > 0) timeString += `${days}d `;
        timeString += `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        return timeString.trim();
    }
    function displayTimerErrorState(message) {
         console.error(message);
         if (!window.timerElementsMissing) {
             if (countdownContainer) { countdownContainer.style.display = 'block'; }
             if (countdownDayLabel) { countdownDayLabel.textContent = "Err"; }
             if (countdownTimerDisplay) { countdownTimerDisplay.textContent = "Error"; }
             if (closingCountdownContainer) { closingCountdownContainer.style.display = 'block'; }
             if (closingCountdownDayLabel) { closingCountdownDayLabel.textContent = "Err"; }
             if (closingCountdownTimerDisplay) { closingCountdownTimerDisplay.textContent = "Error"; }
             if (happeningNowContainer) { happeningNowContainer.style.display = 'none'; }
         }
    }

    // --- Calendar Navigation / Settings ---
    function goToPrevMonth() {
        currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentMonth, currentYear);
    }
    function goToNextMonth() {
        currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentMonth, currentYear);
    }
    function goToToday() {
        const now = new Date(); const nowMonth = now.getUTCMonth(); const nowYear = now.getUTCFullYear();
        if (currentMonth !== nowMonth || currentYear !== nowYear) {
            currentMonth = nowMonth; currentYear = nowYear;
            renderCalendar(currentMonth, currentYear);
        }
    }
    function updateStartDaySelection(newStartDay) {
        if (startDayOfWeekSetting === newStartDay || !startSunButton || !startMonButton) return;
        startDayOfWeekSetting = newStartDay;
        localStorage.setItem('calendarStartDay', newStartDay.toString());
        startSunButton.classList.toggle('active', newStartDay === 0);
        startMonButton.classList.toggle('active', newStartDay === 1);
        if (calendarGrid) renderCalendar(currentMonth, currentYear);
    }

    /**
     * === WEBSITE INITIALIZATION ===
     * Main function that runs when the page loads
     * - Initializes all page elements
     * - Loads data from external sources
     * - Sets up event listeners
     */
    function initializePage() {
        console.log("Initializing page...");

        // Get references to all elements needed by the script
        getAllElements();

        // Load products data immediately since it's needed for the current page
        if (luxuryProductsListElement) {
            fetch(PRIMARY_DATA_URL)
                .then(response => response.json())
                .then(data => {
                    loadProducts(data);
                })
                .catch(error => {
                    console.error('Error loading products data:', error);
                    const productsContainer = document.getElementById('products-container');
                    if (productsContainer) {
                        productsContainer.innerHTML = '<div class="loading-message">Error loading products. Please try again later.</div>';
                    }
                });
        }

        // Set up calendar start day buttons if they exist
        const savedStartDay = localStorage.getItem('calendarStartDay');
        if (savedStartDay && (savedStartDay === '0' || savedStartDay === '1')) {
            startDayOfWeekSetting = parseInt(savedStartDay, 10);
        }
        if (startSunButton && startMonButton) {
             startSunButton.classList.toggle('active', startDayOfWeekSetting === 0);
             startMonButton.classList.toggle('active', startDayOfWeekSetting === 1);
             prevMonthButton?.addEventListener('click', goToPrevMonth);
             nextMonthButton?.addEventListener('click', goToNextMonth);
             gotoTodayButton?.addEventListener('click', goToToday);
             startSunButton.addEventListener('click', () => updateStartDaySelection(0));
             startMonButton.addEventListener('click', () => updateStartDaySelection(1));
        }
        if (monthYearDisplay) monthYearDisplay.textContent = "Loading...";

        /**
         * === DATA LOADING SECTION ===
         * The website loads content from external JSON files
         * - PRIMARY_DATA_URL: Main content for all pages
         * - COMMUNITY_DATA_URL: Community-specific information
         *
         * To customize content, edit these JSON files
         */
        console.log("Fetching primary data from:", PRIMARY_DATA_URL);
        console.log("Step 1: Starting primary data fetch...");
        fetch(PRIMARY_DATA_URL, {
            cache: "no-cache"
        })
            .then(response => {
                console.log("Step 2: Received primary data response. Status:", response.status);
                console.log("Response headers:", [...response.headers.entries()]);

                if (!response.ok) {
                    return response.text().then(text => {
                         console.error("Primary data fetch failed! Status:", response.status, "Response text:", text.substring(0, 150));
                         throw new Error(`Primary data HTTP error! Status: ${response.status}. Response: ${text.substring(0, 150)}...`);
                    });
                }
                 const contentType = response.headers.get("content-type");
                 console.log("Step 3: Primary data response content type:", contentType);
                 if (contentType && contentType.indexOf("application/json") !== -1) {
                     console.log("Step 4a: Parsing primary data as JSON...");
                     return response.json();
                 } else {
                     console.log("Step 4b: Primary data content type not JSON, attempting text parse...");
                     return response.text().then(text => {
                          // console.error("Primary data fetch failed! Status:", response.status, "Response text:", text.substring(0, 150)); // Already logged in the .then above
                          console.warn("Primary data response content type was not JSON, attempting manual parse.");
                         try { return JSON.parse(text); } catch (parseError) {
                              console.error("Failed to parse primary response text as JSON:", parseError);
                              throw new Error(`Primary response was not valid JSON. Content started with: ${text.substring(0, 100)}...`);
                         }
                     });
                 }
            })
            .then(primaryData => {
                console.log("Step 5: Successfully fetched and parsed primary JSON data.");

                // Process calendar data first using primary data
                processSpecialDays(primaryData);

                // Only load products from external data
                loadProducts(primaryData);

                // Load Rose Fish members
                loadRoseFishMembers();

                // Render calendar only if its elements exist on this page
                if (calendarGrid && monthYearDisplay && weekdaysContainer) {
                    console.log("Rendering calendar...");
                    renderCalendar(currentMonth, currentYear); // Uses processed dailySpecialDaysMap
                } else {
                    console.log("Calendar elements not found on this page, skipping render.");
                }

                // Initialize timers (relies on calendar data being processed)
                updateEventTimers();
                if (!window.timerElementsMissing) {
                   setInterval(updateEventTimers, 1000); // Use 1000ms for smoother timer updates
                   console.log("Timer interval started.");
                }

                console.log("Primary content loading complete. Fetching community data...");
                console.log("Step 6: Starting community data fetch from:", COMMUNITY_DATA_URL);
                // --- Fetch Community Data ---
                return fetch(COMMUNITY_DATA_URL, {
                    cache: "no-cache"
                });
            })
            .then(response => {
                  console.log("Step 7: Received community data response. Status:", response.status);
                  console.log("Community response headers:", [...response.headers.entries()]);

                 if (!response.ok) {
                    return response.text().then(text => {
                         console.error("Community data fetch failed! Status:", response.status, "Response text:", text.substring(0, 150));
                         throw new Error(`Community data HTTP error! Status: ${response.status}. Response: ${text.substring(0, 150)}...`);
                    });
                }
                 const contentType = response.headers.get("content-type");
                 console.log("Step 8: Community data response content type:", contentType);
                 if (contentType && contentType.indexOf("application/json") !== -1) {
                     console.log("Step 9a: Parsing community data as JSON...");
                     return response.json();
                 } else {
                     console.log("Step 9b: Community data content type not JSON, attempting text parse...");
                     return response.text().then(text => {
                         console.warn("Community data response content type was not JSON, attempting manual parse.");
                         try { return JSON.parse(text); } catch (parseError) {
                              console.error("Failed to parse community response text as JSON:", parseError);
                              throw new Error(`Community response was not valid JSON. Content started with: ${text.substring(0, 100)}...`);
                         }
                     });
                 }
            })
            .then(communityData => {
                  console.log("Step 10: Successfully fetched and parsed community JSON data.");
                  console.log("Community data structure:", Object.keys(communityData));

                  if (communityData.community_groups) {
                      console.log("Number of community groups:", communityData.community_groups.length);
                      if (communityData.community_groups.length > 0) {
                          console.log("First community group:", JSON.stringify(communityData.community_groups[0]).substring(0, 200) + '...');
                          console.log("First community group tags:", communityData.community_groups[0].tags);
                      }
                  } else {
                      console.warn("No community_groups property found in the data!");
                  }

                 // --- Populate Community Content (using communityData) ---
                 // loadCommunityInfo(communityData); // MOVED: This now uses primaryData
                 loadFishGroups(communityData);    // Loads verified/certified/known lists using communityData

                 // console.log("All page content loading complete."); // Redundant with Step 11
                 console.log("Step 11: All page content loading complete.");
            })
            .catch(error => {
                console.error("Step FINAL CATCH: Fatal Error during initialization:", error);
                const errorMsg = `<i class="error-message">Error loading data: ${escapeHtml(error.message)}</i>`;
                const errorLi = `<li class="error-message"><i>Error loading data: ${escapeHtml(error.message)}</i></li>`;
                let isPrimaryError = error.message.includes("Primary data");
                let isCommunityError = error.message.includes("Community data");

                // Update placeholders with error messages based on which fetch failed (or both if general error)
                if (isPrimaryError || !isCommunityError) { // Show primary errors if primary failed OR if it's a general error
                    if(introElement) introElement.innerHTML = errorMsg;
                    if(principlesListElement) principlesListElement.innerHTML = errorLi;
                    if(principlesNoteElement) principlesNoteElement.textContent = '';
                    if(dailyInfoElement) dailyInfoElement.innerHTML = errorMsg;
                    if(dailyDescElement) dailyDescElement.innerHTML = errorMsg;
                    if(dailyRulesElement) dailyRulesElement.innerHTML = errorMsg;
                    if(dailyWarnElement) dailyWarnElement.innerHTML = errorMsg;
                    if(calendarGrid) calendarGrid.innerHTML = `<div class='error-message' style='grid-column: 1 / -1; text-align: center; padding: 20px;'>${errorMsg}</div>`;
                    if(monthYearDisplay) monthYearDisplay.textContent = "Error";
                    if(rosefishInfoElement) rosefishInfoElement.innerHTML = errorMsg;
                    if(rosefishVoteInfoElement) rosefishVoteInfoElement.innerHTML = errorMsg;
                    if(rosefishGuidelinesElement) rosefishGuidelinesElement.innerHTML = errorMsg;
                    if(rosefishMembersListElement) rosefishMembersListElement.innerHTML = errorLi;
                    if(luxuryMottoElement) luxuryMottoElement.innerHTML = errorMsg;
                    if(luxuryProductsListElement) luxuryProductsListElement.innerHTML = errorLi;
                    displayTimerErrorState(`Primary data fetch failed: ${error.message}`);
                }
                 if (isCommunityError || !isPrimaryError) { // Show community errors if community failed OR if it's a general error
                    if(verifiedInfoElement) verifiedInfoElement.innerHTML = errorMsg;
                    // Only show error for certifiedInfoElement if it's empty
                    if(certifiedInfoElement && certifiedInfoElement.innerHTML.trim() === '') {
                        certifiedInfoElement.innerHTML = errorMsg;
                    }
                    // Add known info error handling if needed: if (knownInfoElement) knownInfoElement.innerHTML = errorMsg;
                    if(verifiedListElement) verifiedListElement.innerHTML = errorLi;
                    if(certifiedListElement) certifiedListElement.innerHTML = errorLi;
                    if(knownListElement) knownListElement.innerHTML = errorLi; // Add known list error

                    // Try to load community data from a local fallback file
                    console.log("Attempting to load community data from local fallback...");
                    fetch('data/communities.json')
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log("Successfully loaded community data from local fallback.");
                            loadFishGroups(data);
                        })
                        .catch(fallbackError => {
                            console.error("Error loading community data from local fallback:", fallbackError);
                        });
                 }
            });
    }

    // --- Run Initialization ---
    initializePage();

}); // End DOMContentLoaded