// --- START OF script.js (with Image Management Refactor) ---
document.addEventListener('DOMContentLoaded', function() {

    // --- Central Image Mapping ---
    // Maps logical identifiers to image filenames (assumed to be in 'images/')
    const IMAGE_MAP = {
        // Thematic / Section Images
        about_meaning: "meaning_of_fish.png",
        communities_verified_logo: "fish_verified.png",
        communities_certified_logo: "fish_certified.png", // Even if styled differently, manage src here
        daily_vrchat_logo: "daily_vrchat.png",
        rose_fish_logo: "rose_fish_spin.gif", // Use the GIF
        store_luxury_trash_logo: "luxury_trash.png",

        // Community Logos (Use lowercase, underscore keys for consistency)
        // Use the exact names from the JSON as a basis for the keys
        community_cheese_fish: "cheese_fish.png",
        community_vapor_fish: "vapor_fish.png",
        community_gamble_fish: "gamble_fish.png",
        community_rat_fish: "rat_fish.png",
        community_the_rusk_shack: "rusk_shack.png",
        community_avifair: "avifair.png",
        community_family_friendly_cult: "family_friendly_cult.png",
        community_portal_media: "portal_media.png",
        community_rose_fish: "rose_fish.png",
        // Add certified communities here if they have logos
        community_github_fish: null, // Example: no specific logo file yet
        community_something_else: null // Example: another certified community
        // Add more community logo mappings here as needed...
    };

    // Helper function to get image path or null
    function getImagePath(key) {
        const filename = IMAGE_MAP[key];
        return filename ? `images/${filename}` : null;
    }

    // Helper function to generate a consistent key from a community name
    function generateCommunityImageKey(name) {
        if (!name) return null;
        // Normalize: lowercase, replace symbols/spaces with underscores, handle edge cases
        let key = name.toLowerCase()
                      .replace(/＜＞＜/g, 'fish') // Replace fish symbol if present
                      .replace(/[^a-z0-9\s_]/g, '') // Remove disallowed chars (keep spaces/underscores)
                      .trim()
                      .replace(/\s+/g, '_'); // Replace spaces with underscores
        return `community_${key}`;
    }


    // --- Calendar Elements ---
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('cal-month-year');
    const prevMonthButton = document.getElementById('cal-prev-month');
    const nextMonthButton = document.getElementById('cal-next-month');
    const gotoTodayButton = document.getElementById('cal-goto-today');
    const weekdaysContainer = document.getElementById('calendar-weekdays');
    const startSunButton = document.getElementById('cal-start-sun');
    const startMonButton = document.getElementById('cal-start-mon');

    // --- Timer Elements ---
    const countdownContainer = document.getElementById('countdown-container');
    const countdownTimerDisplay = document.getElementById('countdown-timer');
    const countdownDayLabel = document.getElementById('countdown-day-label');

    const closingCountdownContainer = document.getElementById('closing-countdown-container');
    const closingCountdownTimerDisplay = document.getElementById('closing-countdown-timer');
    const closingCountdownDayLabel = document.getElementById('closing-countdown-day-label');

    const happeningNowContainer = document.getElementById('happening-now-container');
    const happeningNowMessage = document.getElementById('happening-now-message');
    const happeningNowLink = document.getElementById('happening-now-link');

     // --- Content Elements ---
     const principlesListElement = document.getElementById('principles-list');
     const principlesNoteElement = document.getElementById('principles-additional-note');
     const meaningExplanationList = document.getElementById('meaning-explanation-list');
     const meaningSummaryElement = document.getElementById('meaning-summary');
     const verifiedListElement = document.getElementById('fish-verified-list');
     const certifiedListElement = document.getElementById('fish-certified-list');
     const worldsListElement = document.getElementById('fish-worlds-list');
     const avatarsListElement = document.getElementById('fish-avatars-list');

     // --- Image Elements (Get references to thematic images) ---
     const imgAboutMeaning = document.querySelector('.meaning-image'); // Use class selector
     const imgCommunitiesVerified = document.querySelector('.fish-verified-theme .verified-image'); // More specific selector
     const imgCommunitiesCertified = document.querySelector('.fish-certified-theme .verified-image'); // More specific selector
     const imgDailyVRChat = document.querySelector('.community-image'); // Assumes only one on daily page
     const imgRoseFish = document.querySelector('.rose-fish-theme .verified-image'); // More specific selector
     const imgStoreLuxuryTrash = document.querySelector('.luxury-trash-theme .verified-image'); // More specific selector


    // --- URL for Data ---
    const GIST_DATA_URL = "https://gist.githubusercontent.com/TheZiver/13fc44e6b228346750401f7fbfc995ed/raw";


    // --- Constants and State ---
    const targetDate = new Date(Date.UTC(2023, 6, 20)); // July 20, 2023 UTC (Month is 0-indexed)
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    let currentMonth = today.getUTCMonth();
    let currentYear = today.getUTCFullYear();
    let startDayOfWeekSetting = 1; // Default: Monday (0=Sun, 1=Mon)

    // Load saved start day preference
    const savedStartDay = localStorage.getItem('calendarStartDay');
    if (savedStartDay && (savedStartDay === '0' || savedStartDay === '1')) {
        startDayOfWeekSetting = parseInt(savedStartDay, 10);
    }

    // --- Data Arrays ---
    const locations = [ "YES?", "LUXURY TRASH", "The Fishing Mall", "Retrocubic Nexus", "Cunks Coughing City", "YES?", "YES?" ]; // Index 0=Sunday, 1=Monday,...
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const WORLD_IDS = {
        0: "wrld_b0812b34-cd7c-44b8-9b29-4f921a9e4d5a",  // Monday
        1: "wrld_9806f25c-0644-4ed7-a3b9-404763bd7dbc",  // Tuesday
        2: "wrld_a1caec89-3313-42d3-977a-3f8ac819a5a9",  // Wednesday
        3: "wrld_94d6eb87-7246-4dd8-81c0-cb1f468f096a",  // Thursday
        4: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355",  // Friday
        5: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355",  // Saturday
        6: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355"   // Sunday
    };
    const VRC_GROUP_ID = "grp_2b910dc4-e984-4fd5-813c-877edcea29d2"; // Fish Group ID

    window.timerElementsChecked = false;
    window.timerElementsMissing = false;

    // --- Helper Functions ---

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

    function calculateDailyVrchatDay(date) {
         const normalizedDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
         if (normalizedDate < targetDate) return null;
         const oneDay = 24 * 60 * 60 * 1000;
         const dayDifference = Math.floor((normalizedDate - targetDate) / oneDay);
         return (dayDifference >= 0) ? dayDifference : null;
    }

    // --- Set Thematic Images ---
    function setThematicImages() {
        const setImageSource = (element, imageKey) => {
            if (element) {
                const imagePath = getImagePath(imageKey);
                if (imagePath) {
                    element.src = imagePath;
                    // console.log(`Set image for ${imageKey}: ${imagePath}`);
                } else {
                    console.warn(`Image key "${imageKey}" not found in IMAGE_MAP or has null value. Image not set.`);
                    // Optional: Set a placeholder or hide the image
                    // element.src = 'images/placeholder.png';
                    // element.style.display = 'none';
                }
            } else {
                // console.log(`Image element not found on this page for key: ${imageKey}`);
            }
        };

        setImageSource(imgAboutMeaning, 'about_meaning');
        setImageSource(imgCommunitiesVerified, 'communities_verified_logo');
        setImageSource(imgCommunitiesCertified, 'communities_certified_logo');
        setImageSource(imgDailyVRChat, 'daily_vrchat_logo');
        setImageSource(imgRoseFish, 'rose_fish_logo');
        setImageSource(imgStoreLuxuryTrash, 'store_luxury_trash_logo');
    }


    // --- Calendar Rendering Functions ---

    function renderCalendar(month, year) {
        if (!calendarGrid || !monthYearDisplay || !weekdaysContainer) {
             console.error("Calendar base elements missing!");
             if(calendarGrid) calendarGrid.innerHTML = "<p class='error-message' style='text-align: center;'><i>Error loading calendar grid.</i></p>";
             return;
        }

        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
        weekdaysContainer.innerHTML = '';
        const weekdayNamesShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        let orderedWeekdays = [];
        if (startDayOfWeekSetting === 1) { orderedWeekdays = weekdayNamesShort; }
        else { orderedWeekdays = [...weekdayNamesShort.slice(6), ...weekdayNamesShort.slice(0, 6)]; }
        orderedWeekdays.forEach(dayName => {
            const weekdayCell = document.createElement('div');
            weekdayCell.classList.add('weekday-header'); weekdayCell.textContent = dayName;
            weekdaysContainer.appendChild(weekdayCell);
        });

        calendarGrid.innerHTML = '';
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const lastDayOfPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const firstDayIndex = firstDayOfMonth.getUTCDay();
        let startingDayOffset = (firstDayIndex - startDayOfWeekSetting + 7) % 7;

        for (let i = 0; i < startingDayOffset; i++) { calendarGrid.appendChild(createDayCell(lastDayOfPrevMonth - startingDayOffset + 1 + i, true)); }
        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(Date.UTC(year, month, day));
            const isToday = (year === todayUTC.getUTCFullYear() && month === todayUTC.getUTCMonth() && day === todayUTC.getUTCDate());
            calendarGrid.appendChild(createDayCell(day, false, cellDate, isToday));
        }
        const totalCellsRendered = startingDayOffset + daysInMonth;
        const remainingCells = (7 - (totalCellsRendered % 7)) % 7;
        for (let i = 0; i < remainingCells; i++) { calendarGrid.appendChild(createDayCell(i + 1, true)); }
    }

    function createDayCell(dayNumber, isOtherMonth, cellDate = null, isToday = false) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.classList.add('day-number');
        dayNumberSpan.textContent = dayNumber;

        if (isOtherMonth) {
            dayCell.classList.add('other-month'); dayCell.appendChild(dayNumberSpan);
        } else if (cellDate) {
            const dailyDay = calculateDailyVrchatDay(cellDate);
            if (dailyDay !== null) {
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
                dayLink.href = vrchatLink; dayLink.target = "_blank"; dayLink.rel = "noopener noreferrer";
                dayLink.title = `Join Daily VRChat #${dailyDay}${suffix}`;
                dayLink.appendChild(dayNumberSpan);
                const eventNumSpan = document.createElement('span');
                eventNumSpan.classList.add('daily-event-num'); eventNumSpan.textContent = `${dailyDay}${suffix}`;
                dayLink.appendChild(eventNumSpan);
                if (locationName) {
                    const locationSpan = document.createElement('span');
                    locationSpan.classList.add('event-location'); locationSpan.textContent = locationName;
                    dayLink.appendChild(locationSpan);
                }
                dayCell.appendChild(dayLink);
            } else { dayCell.appendChild(dayNumberSpan); }
            if (isToday) { dayCell.classList.add('today'); }
        } else { dayCell.appendChild(dayNumberSpan); }
        return dayCell;
    }

    // --- Combined Timer Update Function ---
    function updateEventTimers() {
        if (!window.timerElementsChecked) {
            if (!countdownContainer || !countdownTimerDisplay || !countdownDayLabel ||
                !closingCountdownContainer || !closingCountdownTimerDisplay || !closingCountdownDayLabel ||
                !happeningNowContainer || !happeningNowMessage || !happeningNowLink)
            {
                console.warn("One or more timer display elements are missing! (Expected on non-daily pages)");
                 window.timerElementsMissing = true;
            }
             window.timerElementsChecked = true;
        }
        if (window.timerElementsMissing) return;

        try {
            const nowUTC = new Date(); const nowUTCMillis = nowUTC.getTime();
            let nextStartUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 21, 0, 0, 0));
            if (nowUTCMillis >= nextStartUTC.getTime()) { nextStartUTC.setUTCDate(nextStartUTC.getUTCDate() + 1); }
            const diffToStart = nextStartUTC.getTime() - nowUTCMillis;
            const startDayNumber = calculateDailyVrchatDay(nextStartUTC); const startDaySuffix = getOrdinalSuffix(startDayNumber);
            countdownDayLabel.textContent = (startDayNumber !== null) ? `${startDayNumber}${startDaySuffix}` : "---";
            countdownTimerDisplay.textContent = formatTimeDifference(diffToStart);
            countdownContainer.style.display = 'block';

            let nextCloseUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 23, 0, 0, 0));
            if (nowUTCMillis >= nextCloseUTC.getTime()) { nextCloseUTC.setUTCDate(nextCloseUTC.getUTCDate() + 1); }
            const diffToClose = nextCloseUTC.getTime() - nowUTCMillis;
            let closeEventDayUTC = new Date(nextCloseUTC); closeEventDayUTC.setUTCHours(21, 0, 0, 0);
            const closeDayNumber = calculateDailyVrchatDay(closeEventDayUTC); const closeDaySuffix = getOrdinalSuffix(closeDayNumber);
            closingCountdownDayLabel.textContent = (closeDayNumber !== null) ? `${closeDayNumber}${closeDaySuffix}` : "---";
            closingCountdownTimerDisplay.textContent = formatTimeDifference(diffToClose);
            closingCountdownContainer.style.display = 'block';

            const todayStartUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 21, 0, 0, 0));
            const todayCloseUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 23, 0, 0, 0));
            if (nowUTCMillis >= todayStartUTC.getTime() && nowUTCMillis < todayCloseUTC.getTime()) {
                const currentDayNumber = calculateDailyVrchatDay(todayStartUTC); const currentDaySuffix = getOrdinalSuffix(currentDayNumber);
                const instanceId = currentDayNumber;
                if (instanceId !== null) {
                     const dayOfWeekForWorld = (todayStartUTC.getUTCDay() + 6) % 7; const worldId = WORLD_IDS[dayOfWeekForWorld];
                     const baseUrl = "https://vrchat.com/home/launch?worldId=" + worldId + "&instanceId=";
                     const instanceParams = `~group(${VRC_GROUP_ID})~groupAccessType(public)~region(eu)`;
                     const vrchatLink = baseUrl + instanceId + instanceParams;
                     happeningNowMessage.textContent = `DAILY VRCHAT (${currentDayNumber}${currentDaySuffix}) IS CURRENTLY HAPPENING`;
                     happeningNowLink.href = vrchatLink; happeningNowContainer.style.display = 'block';
                } else { happeningNowContainer.style.display = 'none'; console.error("Could not calculate instance ID during event window."); }
            } else { happeningNowContainer.style.display = 'none'; }
        } catch (error) { console.error("Error in updateEventTimers:", error); displayErrorState("Error updating timers."); }
    }

    function formatTimeDifference(differenceMillis) {
        if (differenceMillis <= 0) return "Now / Very Soon!";
        const totalSeconds = Math.max(0, Math.floor(differenceMillis / 1000));
        const days = Math.floor(totalSeconds / (60 * 60 * 24));
        const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;
        let timeString = "";
        if (days > 0) { timeString += `${days}d `; }
        timeString += `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        return timeString.trim();
    }

    function displayErrorState(message) {
         console.error(message);
         if (countdownContainer && countdownDayLabel && countdownTimerDisplay) {
             countdownContainer.style.display = 'block'; countdownDayLabel.textContent = "Err"; countdownTimerDisplay.textContent = "Error";
         }
         if (closingCountdownContainer && closingCountdownDayLabel && closingCountdownTimerDisplay) {
             closingCountdownContainer.style.display = 'block'; closingCountdownDayLabel.textContent = "Err"; closingCountdownTimerDisplay.textContent = "Error";
         }
         if (happeningNowContainer) happeningNowContainer.style.display = 'none';
    }

    // --- Calendar Navigation ---
    function goToPrevMonth() { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(currentMonth, currentYear); }
    function goToNextMonth() { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(currentMonth, currentYear); }
    function goToToday() { const now = new Date(); if (currentMonth !== now.getUTCMonth() || currentYear !== now.getUTCFullYear()) { currentMonth = now.getUTCMonth(); currentYear = now.getUTCFullYear(); renderCalendar(currentMonth, currentYear); } }

    // --- Start Day Setting ---
    function updateStartDaySelection(newStartDay) {
        if (startDayOfWeekSetting === newStartDay) return;
        startDayOfWeekSetting = newStartDay;
        localStorage.setItem('calendarStartDay', newStartDay.toString());
        if (startSunButton) startSunButton.classList.toggle('active', newStartDay === 0);
        if (startMonButton) startMonButton.classList.toggle('active', newStartDay === 1);
        if (calendarGrid) renderCalendar(currentMonth, currentYear);
    }


    // --- Content Loading Functions ---

    function loadMeaningAndPrinciples(jsonData) {
        try {
             if (principlesListElement && jsonData?.community_principles?.principles) {
                 principlesListElement.innerHTML = '';
                 jsonData.community_principles.principles.forEach(principle => {
                     const li = document.createElement('li');
                     li.innerHTML = `<b>${principle.title || 'Principle'}</b>: ${principle.description || 'No description.'}`;
                     principlesListElement.appendChild(li);
                 });
             } else if (principlesListElement) { principlesListElement.innerHTML = '<li class="error-message"><i>Could not load principles data.</i></li>'; }

             if (principlesNoteElement && jsonData?.community_principles?.additional_note) {
                 principlesNoteElement.textContent = jsonData.community_principles.additional_note;
             } else if (principlesNoteElement) { principlesNoteElement.textContent = ''; }

             if (meaningExplanationList && jsonData?.meaning_of_fish?.explanation) {
                 meaningExplanationList.innerHTML = '';
                 jsonData.meaning_of_fish.explanation.forEach(item => {
                     const li = document.createElement('li');
                     const symbolText = (item.symbol === '<' || item.symbol === '＜') ? '<' : (item.symbol === '>' || item.symbol === '＞') ? '>' : (item.symbol || '?');
                     li.innerHTML = `<b style="font-size: 1.5em; display: inline-block; width: 20px;">${symbolText}</b> - ${item.meaning || 'No explanation.'}`;
                     meaningExplanationList.appendChild(li);
                 });
             } else if (meaningExplanationList) { meaningExplanationList.innerHTML = '<li class="error-message"><i>Could not load meaning details data.</i></li>'; }

             if (meaningSummaryElement && jsonData?.meaning_of_fish?.summary) {
                 meaningSummaryElement.innerHTML = `<b>Summary:</b> ${jsonData.meaning_of_fish.summary.replace(/＜＞＜/g, '<span aria-hidden="true">＜＞＜</span>')}`;
             } else if (meaningSummaryElement) { meaningSummaryElement.innerHTML = '<i>Summary data not available.</i>'; }

        } catch (error) {
            console.error("Error loading meaning and principles:", error);
            if(principlesListElement) principlesListElement.innerHTML = '<li class="error-message"><i>Error processing principles data.</i></li>';
            if(meaningExplanationList) meaningExplanationList.innerHTML = '<li class="error-message"><i>Error processing meaning details data.</i></li>';
            if(meaningSummaryElement) meaningSummaryElement.innerHTML = '<i class="error-message">Error processing summary data.</i>';
        }
    }

    function loadFishGroups(jsonData) {
        if (!verifiedListElement && !certifiedListElement) { return; }

        const verifiedLoadingMessage = verifiedListElement?.querySelector('#verified-loading-message');
        const certifiedLoadingMessage = certifiedListElement?.querySelector('#certified-loading-message');

        try {
            if (!jsonData || typeof jsonData !== 'object' || !Array.isArray(jsonData.communities)) {
                 throw new Error("JSON data structure is invalid.");
            }
            const communities = jsonData.communities;

            // REMOVED: Old hardcoded communityLogos map

            if(verifiedListElement) verifiedListElement.innerHTML = '';
            if(certifiedListElement) certifiedListElement.innerHTML = '';

            let verifiedCount = 0; let certifiedCount = 0;

            communities.forEach(community => {
                if (!community || typeof community.name !== 'string') {
                     console.warn("Skipping invalid community entry:", community); return;
                }

                const listItem = document.createElement('li');
                const textDiv = document.createElement('div');

                let textContentHTML = '';
                const communityName = community.name.replace(/</g, '<').replace(/>/g, '>').replace(/＜＞＜/g, '<span aria-hidden="true">＜＞＜</span>');
                textContentHTML += `<b>${communityName}</b>`;
                if (community.description) { textContentHTML += `<span>${community.description}</span>`; }
                if (community.owner_displayname) { textContentHTML += `<span><b>Owner:</b> ${community.owner_displayname}</span>`; }
                const vrchatLink = community.links?.vrchat_group; const discordLink = community.links?.discord_server;
                if (vrchatLink && typeof vrchatLink === 'string' && vrchatLink.trim() !== '') { textContentHTML += `<a href="${vrchatLink.trim()}" target="_blank" rel="noopener noreferrer">VRChat Group</a>`; }
                if (discordLink && typeof discordLink === 'string' && discordLink.trim() !== '') { textContentHTML += `<a href="${discordLink.trim()}" target="_blank" rel="noopener noreferrer">Discord Server</a>`; }
                textDiv.innerHTML = textContentHTML;


                // --- Dynamic Logo Insertion ---
                const imageKey = generateCommunityImageKey(community.name); // Generate key from name
                const imagePath = imageKey ? getImagePath(imageKey) : null; // Look up in centralized map

                if (imagePath) { // If a logo path is found in the map
                     const img = document.createElement('img');
                     img.src = imagePath;
                     img.alt = `${community.name} Logo`; // Use original name for alt text
                     img.classList.add('community-logo');
                     img.loading = 'lazy';
                     listItem.appendChild(img); // Logo first
                } else if (community.status === 'FISH_VERIFIED') {
                    // Optional: Log if a verified community is missing a logo in the map
                    // console.log(`Logo not found in IMAGE_MAP for verified community: ${community.name} (key: ${imageKey})`);
                }
                // --- End Dynamic Logo Insertion ---

                listItem.appendChild(textDiv); // Then text div

                if (community.status === 'FISH_VERIFIED' && verifiedListElement) {
                     verifiedListElement.appendChild(listItem); verifiedCount++;
                } else if (community.status === 'FISH_CERTIFIED' && certifiedListElement) {
                     certifiedListElement.appendChild(listItem); certifiedCount++;
                } else { console.warn(`Community "${community.name}" has unrecognized status or target list missing: ${community.status}`); }
            });

            if (verifiedListElement && verifiedCount === 0) { verifiedListElement.innerHTML = '<li><i>No verified communities listed currently.</i></li>'; }
            if (certifiedListElement && certifiedCount === 0) { certifiedListElement.innerHTML = '<li><i>No certified communities listed currently.</i></li>'; }

        } catch (error) {
            console.error('Failed to process fish communities:', error);
            const errorMessage = `<li class="error-message"><i>Error loading communities. Details: ${error.message}.</i></li>`;
            if (verifiedListElement) verifiedListElement.innerHTML = errorMessage;
            if (certifiedListElement) certifiedListElement.innerHTML = errorMessage;
        }
    }

     function loadFishAssets(assetTypeKey, listElement, jsonData) {
         if (!listElement) { return; }
         const loadingMessageElement = listElement.querySelector('li[id$="-loading-message"]');

         try {
             const assetData = jsonData?.[assetTypeKey];
             if (!jsonData || !Array.isArray(assetData)) { throw new Error(`JSON data invalid/missing for '${assetTypeKey}'.`); }
             listElement.innerHTML = ''; let assetCount = 0;

             assetData.forEach(asset => {
                 if (!asset || typeof asset !== 'object') { console.warn(`Skipping invalid entry in ${assetTypeKey}:`, asset); return; }
                 const listItem = document.createElement('li');
                 let content = '', link = null, id = null, name = null, author = null;
                 let idKey = '', linkKey = '', nameKey = '', authorKey = 'author';
                 let typeName = '', baseURL = '';

                 if (assetTypeKey === 'community_worlds') {
                     idKey = 'world_id'; linkKey = 'world_link'; nameKey = 'world_name';
                     typeName = 'World'; baseURL = 'https://vrchat.com/home/world/';
                 } else if (assetTypeKey === 'community_avatars') {
                     idKey = 'avatar_id'; linkKey = 'avatar_link'; nameKey = 'avatar_name';
                     typeName = 'Avatar'; baseURL = 'https://vrchat.com/home/avatar/';
                 } else { return; }

                 id = asset[idKey]; link = asset[linkKey]; name = asset[nameKey]; author = asset[authorKey];

                 content = `<b>${name || id || `Unnamed ${typeName}`}</b>`;
                 if (author) { content += ` by ${author}`; } else if (name || id) { content += ` by <i>Unknown Author</i>`; }
                 if (id && id !== name) { content += `<br><i>ID: ${id}</i>`; }
                 if (link && typeof link === 'string' && link.trim() !== '') { content += `<br><a href="${link.trim()}" target="_blank" rel="noopener noreferrer">View on VRChat</a>`; }
                 else if (id && baseURL) { content += `<br><a href="${baseURL}${id}" target="_blank" rel="noopener noreferrer">View on VRChat (via ID)</a>`; }

                 if (name || id || link) { listItem.innerHTML = content; listElement.appendChild(listItem); assetCount++; }
                 else { console.warn(`Skipping empty asset entry in ${assetTypeKey}:`, asset); }
             });

             if (assetCount === 0) {
                  const assetPlural = assetTypeKey.includes('world') ? 'worlds' : 'avatars';
                  listElement.innerHTML = `<li><i>No community ${assetPlural} listed currently.</i></li>`;
             }
         } catch (error) {
             console.error(`Failed to process ${assetTypeKey}:`, error);
             const assetPlural = assetTypeKey.includes('world') ? 'worlds' : 'avatars';
             if (listElement) { listElement.innerHTML = `<li class="error-message"><i>Error loading community ${assetPlural}. Details: ${error.message}.</i></li>`; }
         } finally {
              if (listElement && loadingMessageElement && loadingMessageElement.parentNode === listElement) { listElement.removeChild(loadingMessageElement); }
         }
     }


    // --- Event Listeners ---
    if (prevMonthButton) prevMonthButton.addEventListener('click', goToPrevMonth);
    if (nextMonthButton) nextMonthButton.addEventListener('click', goToNextMonth);
    if (gotoTodayButton) gotoTodayButton.addEventListener('click', goToToday);
    if (startSunButton) startSunButton.addEventListener('click', () => updateStartDaySelection(0));
    if (startMonButton) startMonButton.addEventListener('click', () => updateStartDaySelection(1));


    // --- Initial Setup & Data Fetch ---
    function initializePage() {
        // Set thematic images FIRST (uses the map, doesn't need fetched data)
        setThematicImages();

        // Calendar Setup (only if elements exist)
        if (!calendarGrid || !monthYearDisplay || !startSunButton || !startMonButton || !weekdaysContainer) {
            console.warn("Calendar elements missing! Calendar will not render (Expected on non-daily pages).");
        } else {
            startSunButton.classList.toggle('active', startDayOfWeekSetting === 0);
            startMonButton.classList.toggle('active', startDayOfWeekSetting === 1);
            renderCalendar(currentMonth, currentYear);
        }

        // Start timers (checks internally)
        updateEventTimers();
        if (!window.timerElementsMissing) { setInterval(updateEventTimers, 1000); }

        // Fetch JSON data and load dynamic content
        fetch(GIST_DATA_URL)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(`HTTP error! ${response.status}. ${text.substring(0,100)}`); });
                }
                return response.json();
            })
            .then(data => {
                // Load content dependent on fetched data
                loadMeaningAndPrinciples(data);
                loadFishGroups(data); // Now uses IMAGE_MAP for logos
                loadFishAssets('community_worlds', worldsListElement, data);
                loadFishAssets('community_avatars', avatarsListElement, data);
            })
            .catch(error => {
                console.error("Fatal Error: Could not fetch/process community data.", error);
                 const displayLoadError = (listEl, type) => {
                     if (listEl) {
                          listEl.innerHTML = ''; // Clear existing content/loading
                          const errorLi = document.createElement('li');
                          errorLi.classList.add('error-message');
                          errorLi.innerHTML = `<i>Critical Error: Could not load ${type} data. (${error.message})</i>`;
                          listEl.appendChild(errorLi);
                     }
                 }
                 displayLoadError(principlesListElement, "principles");
                 if(principlesNoteElement) principlesNoteElement.textContent = '';
                 displayLoadError(meaningExplanationList, "meaning");
                 if(meaningSummaryElement) meaningSummaryElement.innerHTML = '<i class="error-message">Error loading data.</i>';
                 displayLoadError(verifiedListElement, "verified communities");
                 displayLoadError(certifiedListElement, "certified communities");
                 displayLoadError(worldsListElement, "community worlds");
                 displayLoadError(avatarsListElement, "community avatars");
            });
    }

    initializePage(); // Run initialization

}); // End DOMContentLoaded wrapper
// --- END OF script.js (with Image Management Refactor) ---