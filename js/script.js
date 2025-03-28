// --- START OF script.js ---
document.addEventListener('DOMContentLoaded', function() {

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
     const worldsListElement = document.getElementById('fish-worlds-list'); // Added
     const avatarsListElement = document.getElementById('fish-avatars-list'); // Added

    // --- URL for Data ---
    // Assuming the Gist URL contains data matching the provided JSON structure
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

    // World IDs mapped to the day of the week (Index 0=Monday, ..., 6=Sunday)
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

    // Flags for error logging
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
         if (normalizedDate < targetDate) return null; // Date is before the first event day
         const oneDay = 24 * 60 * 60 * 1000;
         // Calculate difference in days (0 for the first day, 1 for second, etc.)
         const dayDifference = Math.floor((normalizedDate - targetDate) / oneDay);
         return (dayDifference >= 0) ? dayDifference : null;
    }

    // --- Calendar Rendering Functions ---

    function renderCalendar(month, year) {
        // Check for essential calendar elements
        if (!calendarGrid || !monthYearDisplay || !weekdaysContainer) {
             console.error("Calendar base elements (grid, month/year display, or weekdays container) missing!");
             if(calendarGrid) calendarGrid.innerHTML = "<p class='error-message' style='text-align: center;'><i>Error loading calendar grid.</i></p>";
             return;
        }

        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        // Render Weekday Headers
        weekdaysContainer.innerHTML = '';
        const weekdayNamesShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // Standard order
        let orderedWeekdays = [];

        if (startDayOfWeekSetting === 1) { // Monday start
            orderedWeekdays = weekdayNamesShort;
        } else { // Sunday start (0)
            orderedWeekdays = [...weekdayNamesShort.slice(6), ...weekdayNamesShort.slice(0, 6)]; // Rotate: Sun, Mon, Tue...
        }

        orderedWeekdays.forEach(dayName => {
            const weekdayCell = document.createElement('div');
            weekdayCell.classList.add('weekday-header');
            weekdayCell.textContent = dayName;
            weekdaysContainer.appendChild(weekdayCell);
        });

        // Render Calendar Grid
        calendarGrid.innerHTML = '';

        const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const lastDayOfPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const firstDayIndex = firstDayOfMonth.getUTCDay(); // 0=Sun, 1=Mon,...
        let startingDayOffset = (firstDayIndex - startDayOfWeekSetting + 7) % 7;

        // Previous month's days
        for (let i = 0; i < startingDayOffset; i++) {
            const day = lastDayOfPrevMonth - startingDayOffset + 1 + i;
            calendarGrid.appendChild(createDayCell(day, true));
        }

        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(Date.UTC(year, month, day));
            const isToday = (year === todayUTC.getUTCFullYear() && month === todayUTC.getUTCMonth() && day === todayUTC.getUTCDate());
            calendarGrid.appendChild(createDayCell(day, false, cellDate, isToday));
        }

        // Next month's days
        const totalCellsRendered = startingDayOffset + daysInMonth;
        const remainingCells = (7 - (totalCellsRendered % 7)) % 7; // Fill remaining grid cells
        for (let i = 0; i < remainingCells; i++) {
            calendarGrid.appendChild(createDayCell(i + 1, true));
        }
    }

    function createDayCell(dayNumber, isOtherMonth, cellDate = null, isToday = false) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');

        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.classList.add('day-number');
        dayNumberSpan.textContent = dayNumber;

        if (isOtherMonth) {
            dayCell.classList.add('other-month');
            dayCell.appendChild(dayNumberSpan);
        } else if (cellDate) {
            const dailyDay = calculateDailyVrchatDay(cellDate); // Get event number for this date

            if (dailyDay !== null) { // If it's a valid event day
                const suffix = getOrdinalSuffix(dailyDay);
                const instanceId = dailyDay; // Use event number as instance ID
                const dayOfWeekForWorld = (cellDate.getUTCDay() + 6) % 7; // Convert UTC day (Sun=0) to Mon=0..Sun=6 index for WORLD_IDS
                const worldId = WORLD_IDS[dayOfWeekForWorld];
                const dayOfWeekForLocation = cellDate.getUTCDay(); // Keep original UTC day for location array (Sun=0..Sat=6)
                const locationName = locations[dayOfWeekForLocation];

                // Construct VRChat launch link
                const baseUrl = "https://vrchat.com/home/launch?worldId=" + worldId + "&instanceId=";
                const instanceParams = `~group(${VRC_GROUP_ID})~groupAccessType(public)~region(eu)`; // Use const for Group ID
                const vrchatLink = baseUrl + instanceId + instanceParams;

                // Create link element to wrap content
                const dayLink = document.createElement('a');
                dayLink.href = vrchatLink;
                dayLink.target = "_blank";
                dayLink.rel = "noopener noreferrer";
                dayLink.title = `Join Daily VRChat #${dailyDay}${suffix}`;

                dayLink.appendChild(dayNumberSpan); // 1. Append Day number

                const eventNumSpan = document.createElement('span'); // 2. Append Event Number (Ordinal)
                eventNumSpan.classList.add('daily-event-num');
                eventNumSpan.textContent = `${dailyDay}${suffix}`;
                dayLink.appendChild(eventNumSpan);

                if (locationName) { // 3. Append Location (if defined)
                    const locationSpan = document.createElement('span');
                    locationSpan.classList.add('event-location');
                    locationSpan.textContent = locationName;
                    dayLink.appendChild(locationSpan);
                }

                dayCell.appendChild(dayLink); // Add the link containing the ordered elements

            } else {
                // Day is in current month but before the first event day
                dayCell.appendChild(dayNumberSpan);
            }

            // Highlight today's date
            if (isToday) {
                dayCell.classList.add('today');
            }
        } else {
             // Fallback (shouldn't happen with current logic)
             dayCell.appendChild(dayNumberSpan);
        }

        return dayCell;
    }

    // --- Combined Timer Update Function ---
    function updateEventTimers() {
        // Check if all required timer elements exist (log error only once)
        if (!window.timerElementsChecked) {
            if (!countdownContainer || !countdownTimerDisplay || !countdownDayLabel ||
                !closingCountdownContainer || !closingCountdownTimerDisplay || !closingCountdownDayLabel ||
                !happeningNowContainer || !happeningNowMessage || !happeningNowLink)
            {
                console.warn("One or more timer display elements are missing! Timers may not function as expected (This is normal on pages other than daily.html).");
                 // Don't hide elements globally, just don't update them if missing
                 window.timerElementsMissing = true; // Set flag indicating missing elements
            }
             window.timerElementsChecked = true; // Mark as checked
        }
        // If elements were missing on the first check, stop trying to update them
        if (window.timerElementsMissing) return;

        try {
            const nowUTC = new Date();
            const nowUTCMillis = nowUTC.getTime();

            // --- Calculate and Update "Starts In" Countdown ---
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


            // --- Calculate and Update "Closes In" Countdown ---
            let nextCloseUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 23, 0, 0, 0));
            if (nowUTCMillis >= nextCloseUTC.getTime()) {
                nextCloseUTC.setUTCDate(nextCloseUTC.getUTCDate() + 1);
            }
            const diffToClose = nextCloseUTC.getTime() - nowUTCMillis;
            let closeEventDayUTC = new Date(nextCloseUTC);
            closeEventDayUTC.setUTCHours(21, 0, 0, 0); // Set to event start time to calculate correct day number
            const closeDayNumber = calculateDailyVrchatDay(closeEventDayUTC);
            const closeDaySuffix = getOrdinalSuffix(closeDayNumber);
            closingCountdownDayLabel.textContent = (closeDayNumber !== null) ? `${closeDayNumber}${closeDaySuffix}` : "---";
            closingCountdownTimerDisplay.textContent = formatTimeDifference(diffToClose);
            closingCountdownContainer.style.display = 'block';


            // --- Determine "Happening Now" State ---
            const todayStartUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 21, 0, 0, 0));
            const todayCloseUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 23, 0, 0, 0));

            if (nowUTCMillis >= todayStartUTC.getTime() && nowUTCMillis < todayCloseUTC.getTime()) {
                const currentDayNumber = calculateDailyVrchatDay(todayStartUTC);
                const currentDaySuffix = getOrdinalSuffix(currentDayNumber);
                const instanceId = currentDayNumber;
                if (instanceId !== null) {
                     const dayOfWeekForWorld = (todayStartUTC.getUTCDay() + 6) % 7; // Mon=0..Sun=6
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
            displayErrorState("Error updating timers.");
        }
    }

    // --- Helper to format time difference ---
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

    // --- Helper to display errors ---
    function displayErrorState(message) {
         console.error(message);
         // Only update if elements exist
         if (countdownContainer && countdownDayLabel && countdownTimerDisplay) {
             countdownContainer.style.display = 'block';
             countdownDayLabel.textContent = "Err";
             countdownTimerDisplay.textContent = "Error";
         }
         if (closingCountdownContainer && closingCountdownDayLabel && closingCountdownTimerDisplay) {
             closingCountdownContainer.style.display = 'block';
             closingCountdownDayLabel.textContent = "Err";
             closingCountdownTimerDisplay.textContent = "Error";
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
        // Only render calendar if it exists
        if (calendarGrid) renderCalendar(currentMonth, currentYear);
    }


    // --- Content Loading Functions (using fetched data) ---

    function loadMeaningAndPrinciples(jsonData) {
        try {
             // Load Principles
             if (principlesListElement && jsonData?.community_principles?.principles) {
                 principlesListElement.innerHTML = ''; // Clear loading message
                 jsonData.community_principles.principles.forEach(principle => {
                     const li = document.createElement('li');
                     li.innerHTML = `<b>${principle.title || 'Principle'}</b>: ${principle.description || 'No description.'}`;
                     principlesListElement.appendChild(li);
                 });
             } else if (principlesListElement) { // Only show error if element exists but data doesn't
                 console.warn("Principles data missing in JSON.");
                 principlesListElement.innerHTML = '<li class="error-message"><i>Could not load principles data.</i></li>';
             }
             if (principlesNoteElement && jsonData?.community_principles?.additional_note) {
                 const noteText = jsonData.community_principles.additional_note;
                 principlesNoteElement.textContent = noteText;
             } else if (principlesNoteElement) { // Only clear if element exists but data doesn't
                  console.warn("Principles note data missing in JSON.");
                  principlesNoteElement.textContent = ''; // Clear placeholder
             }

             // Load Meaning
             if (meaningExplanationList && jsonData?.meaning_of_fish?.explanation) {
                 meaningExplanationList.innerHTML = ''; // Clear loading message
                 jsonData.meaning_of_fish.explanation.forEach(item => {
                     const li = document.createElement('li');
                     const symbolText = (item.symbol === '<' || item.symbol === '＜') ? '<' : (item.symbol === '>' || item.symbol === '＞') ? '>' : (item.symbol || '?');
                     li.innerHTML = `<b style="font-size: 1.5em; display: inline-block; width: 20px;">${symbolText}</b> - ${item.meaning || 'No explanation.'}`;
                     meaningExplanationList.appendChild(li);
                 });
             } else if (meaningExplanationList) { // Only show error if element exists but data doesn't
                 console.warn("Meaning explanation data missing in JSON.");
                 meaningExplanationList.innerHTML = '<li class="error-message"><i>Could not load meaning details data.</i></li>';
             }
             if (meaningSummaryElement && jsonData?.meaning_of_fish?.summary) {
                 meaningSummaryElement.innerHTML = `<b>Summary:</b> ${jsonData.meaning_of_fish.summary.replace(/＜＞＜/g, '<span aria-hidden="true">＜＞＜</span>')}`;
             } else if (meaningSummaryElement) { // Only update if element exists but data doesn't
                  console.warn("Meaning summary data missing in JSON.");
                  meaningSummaryElement.innerHTML = '<i>Summary data not available.</i>';
             }
        } catch (error) {
            console.error("Error loading meaning and principles:", error);
            // Display errors only if the corresponding element exists
            if(principlesListElement) principlesListElement.innerHTML = '<li class="error-message"><i>Error processing principles data.</i></li>';
            if(meaningExplanationList) meaningExplanationList.innerHTML = '<li class="error-message"><i>Error processing meaning details data.</i></li>';
            if(meaningSummaryElement) meaningSummaryElement.innerHTML = '<i class="error-message">Error processing summary data.</i>';
        }
    }

    function loadFishGroups(jsonData) {
        // Only proceed if list elements exist on the current page
        if (!verifiedListElement && !certifiedListElement) {
            return; // No elements to populate
        }

        // Get loading message elements to remove them later (only if parent exists)
        const verifiedLoadingMessage = verifiedListElement?.querySelector('#verified-loading-message');
        const certifiedLoadingMessage = certifiedListElement?.querySelector('#certified-loading-message');

        try {
            if (!jsonData || typeof jsonData !== 'object' || !Array.isArray(jsonData.communities)) {
                 throw new Error("JSON data structure is invalid. Expected an object with a 'communities' array.");
            }
            const communities = jsonData.communities;

            // Mapping from community name to logo filename (primarily for Verified)
            const communityLogos = {
                 "CHEESE ＜＞＜": "cheese_fish.png",
                 "VAPOR ＜＞＜": "vapor_fish.png",
                 "GAMBLE ＜＞＜": "gamble_fish.png",
                 "RAT ＜＞＜": "rat_fish.png",
                 "The Rusk Shack": "rusk_shack.png",
                 "AVIFAIR": "avifair.png",
                 "Family Friendly Cult": "family_friendly_cult.png",
                 "Portal Media": "portal_media.png"
                 // Add certified communities here if they get logos
                 // e.g., "GITHUB ＜＞＜": "github_fish.png" (if image exists)
            };


            // Clear loading messages before populating (only if elements exist)
            if(verifiedListElement) verifiedListElement.innerHTML = '';
            if(certifiedListElement) certifiedListElement.innerHTML = '';

            let verifiedCount = 0;
            let certifiedCount = 0;

            communities.forEach(community => {
                if (!community || typeof community.name !== 'string') {
                     console.warn("Skipping invalid community entry:", community);
                     return;
                }

                const listItem = document.createElement('li');
                const textDiv = document.createElement('div'); // Div to hold text content

                // Build text content HTML (safe handling of names)
                let textContentHTML = '';
                const communityName = community.name.replace(/</g, '<').replace(/>/g, '>').replace(/＜＞＜/g, '<span aria-hidden="true">＜＞＜</span>');
                textContentHTML += `<b>${communityName}</b>`;
                if (community.description) {
                     textContentHTML += `<span>${community.description}</span>`;
                }
                if (community.owner_displayname) {
                    textContentHTML += `<span><b>Owner:</b> ${community.owner_displayname}</span>`;
                }
                const vrchatLink = community.links?.vrchat_group;
                const discordLink = community.links?.discord_server;
                if (vrchatLink && typeof vrchatLink === 'string' && vrchatLink.trim() !== '') {
                    textContentHTML += `<a href="${vrchatLink.trim()}" target="_blank" rel="noopener noreferrer">VRChat Group</a>`;
                }
                if (discordLink && typeof discordLink === 'string' && discordLink.trim() !== '') {
                    textContentHTML += `<a href="${discordLink.trim()}" target="_blank" rel="noopener noreferrer">Discord Server</a>`;
                }
                textDiv.innerHTML = textContentHTML;


                // Prepend logo if Verified and logo exists
                if (community.status === 'FISH_VERIFIED') {
                     const logoFilename = communityLogos[community.name];
                     if (logoFilename) {
                         const img = document.createElement('img');
                         img.src = `images/${logoFilename}`;
                         img.alt = `${community.name} Logo`;
                         img.classList.add('community-logo');
                         img.loading = 'lazy';
                         listItem.appendChild(img); // Logo first
                     }
                }

                listItem.appendChild(textDiv); // Then text div

                // Append to the correct list (only if the list element exists)
                if (community.status === 'FISH_VERIFIED' && verifiedListElement) {
                     verifiedListElement.appendChild(listItem);
                     verifiedCount++;
                } else if (community.status === 'FISH_CERTIFIED' && certifiedListElement) {
                     certifiedListElement.appendChild(listItem);
                     certifiedCount++;
                } else {
                     console.warn(`Community "${community.name}" has unrecognized status or target list is missing: ${community.status}`);
                }
            });

            // Add "No communities" message if lists exist but are empty after processing
            if (verifiedListElement && verifiedCount === 0) {
                verifiedListElement.innerHTML = '<li><i>No verified communities listed currently.</i></li>';
            }
            if (certifiedListElement && certifiedCount === 0) {
                certifiedListElement.innerHTML = '<li><i>No certified communities listed currently.</i></li>';
            }

        } catch (error) {
            console.error('Failed to process fish communities:', error);
            const errorMessage = `<li class="error-message"><i>Error loading communities. Details: ${error.message}.</i></li>`;
            // Show error message only if the list elements exist
            if (verifiedListElement) verifiedListElement.innerHTML = errorMessage;
            if (certifiedListElement) certifiedListElement.innerHTML = errorMessage;
        }
    }

     function loadFishAssets(assetTypeKey, listElement, jsonData) {
         // Only proceed if list element exists on the current page
         if (!listElement) {
             // console.log(`Skipping asset loading: Element for ${assetTypeKey} not found on this page.`);
             return;
         }

         const loadingMessageElement = listElement.querySelector('li[id$="-loading-message"]');

         try {
             const assetData = jsonData?.[assetTypeKey];

             if (!jsonData || !Array.isArray(assetData)) {
                 throw new Error(`JSON data structure is invalid or missing for '${assetTypeKey}'. Expected an array.`);
             }

             listElement.innerHTML = ''; // Clear loading message
             let assetCount = 0;

             assetData.forEach(asset => {
                 if (!asset || typeof asset !== 'object') {
                     console.warn(`Skipping invalid entry in ${assetTypeKey}:`, asset);
                     return;
                 }

                 const listItem = document.createElement('li');
                 let content = '';
                 let link = null;
                 let id = null;
                 let name = null;
                 let author = null;
                 let idKey = '';
                 let linkKey = '';
                 let nameKey = '';
                 let authorKey = 'author';
                 let typeName = '';
                 let baseURL = '';

                 if (assetTypeKey === 'community_worlds') {
                     idKey = 'world_id'; linkKey = 'world_link'; nameKey = 'world_name';
                     typeName = 'World'; baseURL = 'https://vrchat.com/home/world/';
                 } else if (assetTypeKey === 'community_avatars') {
                     idKey = 'avatar_id'; linkKey = 'avatar_link'; nameKey = 'avatar_name';
                     typeName = 'Avatar'; baseURL = 'https://vrchat.com/home/avatar/';
                 } else { return; } // Skip unknown types

                 id = asset[idKey]; link = asset[linkKey]; name = asset[nameKey]; author = asset[authorKey];

                 content = `<b>${name || id || `Unnamed ${typeName}`}</b>`;
                 if (author) { content += ` by ${author}`; } else if (name || id) { content += ` by <i>Unknown Author</i>`; }
                 if (id && id !== name) { content += `<br><i>ID: ${id}</i>`; }
                 if (link && typeof link === 'string' && link.trim() !== '') {
                     content += `<br><a href="${link.trim()}" target="_blank" rel="noopener noreferrer">View on VRChat</a>`;
                 } else if (id && baseURL) {
                     content += `<br><a href="${baseURL}${id}" target="_blank" rel="noopener noreferrer">View on VRChat (via ID)</a>`;
                 }

                 if (name || id || link) {
                     listItem.innerHTML = content;
                     listElement.appendChild(listItem);
                     assetCount++;
                 } else { console.warn(`Skipping empty asset entry in ${assetTypeKey}:`, asset); }
             });

             if (assetCount === 0) {
                  const assetPlural = assetTypeKey.includes('world') ? 'worlds' : 'avatars';
                  listElement.innerHTML = `<li><i>No community ${assetPlural} listed currently.</i></li>`;
             }

         } catch (error) {
             console.error(`Failed to process ${assetTypeKey}:`, error);
             const assetPlural = assetTypeKey.includes('world') ? 'worlds' : 'avatars';
             // Display error only if list element exists
             if (listElement) {
                 listElement.innerHTML = `<li class="error-message"><i>Error loading community ${assetPlural}. Details: ${error.message}.</i></li>`;
             }
         } finally {
              // Ensure loading message is removed even on error (only if parent list exists)
              if (listElement && loadingMessageElement && loadingMessageElement.parentNode === listElement) {
                  listElement.removeChild(loadingMessageElement);
              }
         }
     }


    // --- Event Listeners (Check if elements exist before adding listeners) ---
    if (prevMonthButton) prevMonthButton.addEventListener('click', goToPrevMonth);
    if (nextMonthButton) nextMonthButton.addEventListener('click', goToNextMonth);
    if (gotoTodayButton) gotoTodayButton.addEventListener('click', goToToday);
    if (startSunButton) startSunButton.addEventListener('click', () => updateStartDaySelection(0));
    if (startMonButton) startMonButton.addEventListener('click', () => updateStartDaySelection(1));


    // --- Initial Setup & Data Fetch ---
    function initializePage() {
        // Check essential calendar elements first for calendar-specific setup
        if (!calendarGrid || !monthYearDisplay || !startSunButton || !startMonButton || !weekdaysContainer) {
            // ONLY log to console if calendar elements are missing, DO NOT add page error msg
            console.warn("One or more essential elements for calendar initialization are missing! Calendar will not render (This is expected on pages other than daily.html).");
        } else {
             // Set initial calendar state ONLY if elements exist
            startSunButton.classList.toggle('active', startDayOfWeekSetting === 0);
            startMonButton.classList.toggle('active', startDayOfWeekSetting === 1);
            renderCalendar(currentMonth, currentYear);
        }


        // Start timers (check for elements internally - will fail gracefully if elements not found)
        updateEventTimers(); // Run once immediately
        // Only set interval if timer elements actually exist
        if (!window.timerElementsMissing) {
            setInterval(updateEventTimers, 1000);
        }


        // Fetch data and then load dynamic content sections (Runs on all pages)
        fetch(GIST_DATA_URL)
            .then(response => {
                if (!response.ok) {
                    // Try to get more info from the response body on error
                    return response.text().then(text => {
                         throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}. Response: ${text.substring(0, 100)}...`);
                         });
                }
                return response.json();
            })
            .then(data => {
                // Call functions to populate sections with fetched data
                // These functions already check if the target elements exist on the current page
                loadMeaningAndPrinciples(data);
                loadFishGroups(data); // Loads both Verified and Certified
                 // Load Worlds and Avatars, checking if elements exist
                loadFishAssets('community_worlds', worldsListElement, data);
                loadFishAssets('community_avatars', avatarsListElement, data);
            })
            .catch(error => {
                console.error("Fatal Error: Could not fetch or process community data.", error);
                // Display a more prominent error message for critical data failure in relevant sections
                 const displayLoadError = (listEl, type) => {
                     // Only attempt to display error if list element exists on the current page
                     if (listEl) {
                          // Clear potential loading message first
                          const loadingMsg = listEl.querySelector('li[id$="-loading-message"]');
                          if(loadingMsg) listEl.innerHTML = ''; // Clear only if loading message exists
                          else listEl.innerHTML = ''; // Clear anyway if no specific loading message found

                          // Add error message
                          const errorLi = document.createElement('li');
                          errorLi.classList.add('error-message');
                          errorLi.innerHTML = `<i>Critical Error: Could not load ${type} data. Please try refreshing. (${error.message})</i>`;
                          listEl.appendChild(errorLi);
                     }
                 }
                 // Show errors in dynamic sections IF the elements exist on the page
                 displayLoadError(principlesListElement, "principles");
                 if(principlesNoteElement) principlesNoteElement.textContent = ''; // Clear note
                 displayLoadError(meaningExplanationList, "meaning");
                 if(meaningSummaryElement) meaningSummaryElement.innerHTML = '<i class="error-message">Error loading data.</i>';
                 displayLoadError(verifiedListElement, "verified communities");
                 displayLoadError(certifiedListElement, "certified communities");
                 displayLoadError(worldsListElement, "community worlds");
                 displayLoadError(avatarsListElement, "community avatars");
            });
    }

    initializePage(); // Run the initialization function

}); // End DOMContentLoaded wrapper
// --- END OF script.js ---