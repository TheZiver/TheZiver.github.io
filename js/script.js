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
             if(calendarGrid) calendarGrid.innerHTML = "<p style='color: red; text-align: center;'>Error loading calendar grid.</p>";
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
                console.error("One or more timer display elements are missing! Timers will not function correctly.");
                 if(countdownContainer) countdownContainer.style.display = 'none';
                 if(closingCountdownContainer) closingCountdownContainer.style.display = 'none';
                 if(happeningNowContainer) happeningNowContainer.style.display = 'none';
                 window.timerElementsMissing = true; // Set flag indicating failure
            }
             window.timerElementsChecked = true; // Mark as checked
        }
        // If elements were missing on the first check, stop
        if (window.timerElementsMissing) return;

        try {
            const nowUTC = new Date();
            const nowUTCMillis = nowUTC.getTime();

            // --- Calculate and Update "Starts In" Countdown ---
            let nextStartUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 21, 0, 0, 0));
            // If current time is past or exactly at today's 21:00 UTC, target tomorrow's 21:00 UTC
            if (nowUTCMillis >= nextStartUTC.getTime()) {
                nextStartUTC.setUTCDate(nextStartUTC.getUTCDate() + 1);
            }
            const diffToStart = nextStartUTC.getTime() - nowUTCMillis;
            const startDayNumber = calculateDailyVrchatDay(nextStartUTC); // Get event number for the upcoming start
            const startDaySuffix = getOrdinalSuffix(startDayNumber);

            // Update Start Countdown Display
            countdownDayLabel.textContent = (startDayNumber !== null) ? `${startDayNumber}${startDaySuffix}` : "---";
            countdownTimerDisplay.textContent = formatTimeDifference(diffToStart);
            // *** Ensure Starts In timer is ALWAYS visible ***
            countdownContainer.style.display = 'block';


            // --- Calculate and Update "Closes In" Countdown ---
            let nextCloseUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 23, 0, 0, 0));
             // If current time is past or exactly at today's 23:00 UTC, target tomorrow's 23:00 UTC
            if (nowUTCMillis >= nextCloseUTC.getTime()) {
                nextCloseUTC.setUTCDate(nextCloseUTC.getUTCDate() + 1);
            }
            const diffToClose = nextCloseUTC.getTime() - nowUTCMillis;
            let closeEventDayUTC = new Date(nextCloseUTC);
            closeEventDayUTC.setUTCHours(21, 0, 0, 0); // Find the corresponding start date for this closing time
            const closeDayNumber = calculateDailyVrchatDay(closeEventDayUTC); // Get event number for the event that is closing
            const closeDaySuffix = getOrdinalSuffix(closeDayNumber);

            // Update Close Countdown Display
            closingCountdownDayLabel.textContent = (closeDayNumber !== null) ? `${closeDayNumber}${closeDaySuffix}` : "---";
            closingCountdownTimerDisplay.textContent = formatTimeDifference(diffToClose);
            // *** Ensure Closes In timer is ALWAYS visible ***
            closingCountdownContainer.style.display = 'block';


            // --- Determine "Happening Now" State (Controls Link Visibility) ---
            const todayStartUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 21, 0, 0, 0));
            const todayCloseUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 23, 0, 0, 0));

            // Check if current time is strictly within today's 21:00 to 23:00 UTC window
            if (nowUTCMillis >= todayStartUTC.getTime() && nowUTCMillis < todayCloseUTC.getTime()) {
                // Event is currently happening
                const currentDayNumber = calculateDailyVrchatDay(todayStartUTC);
                const currentDaySuffix = getOrdinalSuffix(currentDayNumber);
                const instanceId = currentDayNumber;

                if (instanceId !== null) {
                     // Construct the link for the *currently active* instance
                     const dayOfWeekForWorld = (todayStartUTC.getUTCDay() + 6) % 7;
                     const worldId = WORLD_IDS[dayOfWeekForWorld];
                     const baseUrl = "https://vrchat.com/home/launch?worldId=" + worldId + "&instanceId=";
                     const instanceParams = `~group(${VRC_GROUP_ID})~groupAccessType(public)~region(eu)`;
                     const vrchatLink = baseUrl + instanceId + instanceParams;

                     // Update and show the "Happening Now" container
                     happeningNowMessage.textContent = `DAILY VRCHAT (${currentDayNumber}${currentDaySuffix}) IS CURRENTLY HAPPENING`;
                     happeningNowLink.href = vrchatLink;
                     happeningNowContainer.style.display = 'block'; // SHOW the link container
                } else {
                     // Error state: hide the link container if instance ID calculation fails
                     happeningNowContainer.style.display = 'none';
                     console.error("Could not calculate instance ID during event window.");
                }
            } else {
                // Event is not happening right now
                happeningNowContainer.style.display = 'none'; // HIDE the link container
            }

        } catch (error) {
            console.error("Error in updateEventTimers:", error);
            // Modify error state to ensure main timers remain visible if possible
            displayErrorState("Error updating timers.");
        }
    }

    // --- Helper to format time difference (e.g., "01h 05m 30s") ---
    function formatTimeDifference(differenceMillis) {
        if (differenceMillis <= 0) {
            // This state might appear momentarily at the exact transition time
            return "Now / Very Soon!";
        }
        const totalSeconds = Math.max(0, Math.floor(differenceMillis / 1000)); // Ensure non-negative seconds
        const days = Math.floor(totalSeconds / (60 * 60 * 24));
        const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        let timeString = "";
        if (days > 0) { timeString += `${days}d `; } // Include days part only if > 0
        // Always show H, M, S, padded with leading zeros
        timeString += `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        return timeString.trim();
    }

    // --- Helper to display errors consistently (Ensures timers remain visible) ---
    function displayErrorState(message) {
         console.error(message); // Log detailed error to console
         // Attempt to show a user-friendly error state in the UI, keeping containers visible
         if (countdownContainer) {
             countdownContainer.style.display = 'block'; // Keep visible
             if (countdownDayLabel) countdownDayLabel.textContent = "Err";
             if (countdownTimerDisplay) countdownTimerDisplay.textContent = "Error";
         }
         if (closingCountdownContainer) {
             closingCountdownContainer.style.display = 'block'; // Keep visible
             if (closingCountdownDayLabel) closingCountdownDayLabel.textContent = "Err";
             if (closingCountdownTimerDisplay) closingCountdownTimerDisplay.textContent = "Error";
         }
         // Ensure link is hidden on error
         if (happeningNowContainer) happeningNowContainer.style.display = 'none';
    }

    // --- Calendar Navigation Functions ---
    function goToPrevMonth() { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(currentMonth, currentYear); }
    function goToNextMonth() { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(currentMonth, currentYear); }
    function goToToday() { const now = new Date(); if (currentMonth !== now.getUTCMonth() || currentYear !== now.getUTCFullYear()) { currentMonth = now.getUTCMonth(); currentYear = now.getUTCFullYear(); renderCalendar(currentMonth, currentYear); } }

    // --- Start Day Setting Function ---
    function updateStartDaySelection(newStartDay) {
        if (startDayOfWeekSetting === newStartDay) return; // No change needed
        startDayOfWeekSetting = newStartDay;
        localStorage.setItem('calendarStartDay', newStartDay.toString()); // Save preference

        // Update button visuals if they exist
        if (startSunButton) startSunButton.classList.toggle('active', newStartDay === 0);
        if (startMonButton) startMonButton.classList.toggle('active', newStartDay === 1);

        // Re-render calendar with new setting
        renderCalendar(currentMonth, currentYear);
    }

    // --- Event Listeners ---
    // Add listeners only if the buttons exist to prevent errors
    if (prevMonthButton) prevMonthButton.addEventListener('click', goToPrevMonth); else console.warn("Previous month button not found.");
    if (nextMonthButton) nextMonthButton.addEventListener('click', goToNextMonth); else console.warn("Next month button not found.");
    if (gotoTodayButton) gotoTodayButton.addEventListener('click', goToToday); else console.warn("Go to Today button not found.");
    if (startSunButton) startSunButton.addEventListener('click', () => updateStartDaySelection(0)); else console.warn("Start Sunday button not found.");
    if (startMonButton) startMonButton.addEventListener('click', () => updateStartDaySelection(1)); else console.warn("Start Monday button not found.");

    // --- NEW: Load Fish Verified Communities ---
    function loadVerifiedCommunities() {
        const listElement = document.getElementById('fish-verified-list');
        const loadingMessage = document.getElementById('verified-loading-message');
        const GIST_URL = "https://gist.githubusercontent.com/TheZiver/13fc44e6b228346750401f7fbfc995ed/raw"; // Your Gist URL

        if (!listElement) {
            console.error("Error: Target element #fish-verified-list not found.");
            return; // Stop if the target UL doesn't exist
        }

        fetch(GIST_URL)
            .then(response => {
                if (!response.ok) {
                    // Try to read response text even on error for more info
                    return response.text().then(text => {
                        throw new Error(`HTTP error! Status: ${response.status}, Body: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                // Clear loading message / existing content ONLY if fetch was successful
                listElement.innerHTML = '';

                if (!Array.isArray(data)) {
                     throw new Error("Fetched data is not a valid JSON array.");
                }

                if (data.length === 0) {
                    listElement.innerHTML = '<li><i>No verified communities listed currently.</i></li>';
                    return;
                }

                // Process and display each community
                data.forEach(community => {
                    // Basic validation for core fields
                    if (!community || typeof community.name !== 'string') {
                         console.warn("Skipping invalid community entry:", community);
                         return; // Skip this entry
                    }

                    const listItem = document.createElement('li');

                    // Basic info
                    let content = `<b>${community.name}</b>`; // Name is required now
                    if (community.description) {
                        content += ` - ${community.description}`;
                    }
                    if (community.owner) {
                        content += `<br><b>Owner:</b> ${community.owner}`;
                    }

                    // VRChat Group Link (check if property exists and has a non-empty string value)
                    if (community.vrchatGroupLink && typeof community.vrchatGroupLink === 'string' && community.vrchatGroupLink.trim() !== '') {
                        content += `<br><b>VRChat Group:</b> <a href="${community.vrchatGroupLink.trim()}" target="_blank" rel="noopener noreferrer">${community.vrchatGroupLink.trim()}</a>`;
                    }

                    // Discord Link (check if property exists and has a non-empty string value)
                    if (community.discordLink && typeof community.discordLink === 'string' && community.discordLink.trim() !== '') {
                        content += `<br><b>Discord Server:</b> <a href="${community.discordLink.trim()}" target="_blank" rel="noopener noreferrer">${community.discordLink.trim()}</a>`;
                    }

                    listItem.innerHTML = content;
                    listElement.appendChild(listItem);
                });
            })
            .catch(error => {
                console.error('Failed to load or process verified communities:', error);
                // Display error in the list area
                if (listElement) { // Check again in case it existed initially but failed mid-fetch
                    // Ensure loading message is removed before showing error
                    if(loadingMessage && loadingMessage.parentNode === listElement) {
                         listElement.removeChild(loadingMessage);
                    }
                    // Check if list is empty before adding error to avoid duplicates
                    if (!listElement.querySelector('.error-message')) {
                         const errorLi = document.createElement('li');
                         errorLi.className = 'error-message'; // Add class for potential styling
                         errorLi.innerHTML = `<i style="color: #ff6b6b;">Error loading verified communities. Details: ${error.message}. Please try refreshing.</i>`;
                         listElement.appendChild(errorLi);
                    }
                }
            });
    }
    // --- END NEW CODE ---


    // --- Initial Setup ---
    // Check essential *calendar* elements first to ensure base functionality
    if (!calendarGrid || !monthYearDisplay || !startSunButton || !startMonButton || !weekdaysContainer) {
         console.error("One or more essential elements for calendar initialization are missing! Calendar will not render.");
         // Display user-facing error related to calendar init failure
         const container = document.querySelector('.container') || document.body;
         if (container && !document.getElementById('init-error-msg')) { // Prevent multiple messages
            const errorMsg = document.createElement('p');
            errorMsg.id = 'init-error-msg';
            errorMsg.style.color = 'red';
            errorMsg.style.fontWeight = 'bold';
            errorMsg.style.textAlign = 'center';
            errorMsg.style.marginTop = '20px';
            errorMsg.textContent = 'Error: Failed to initialize the calendar component. Please check the browser console for details.';
            const calendarSection = document.querySelector('section[aria-labelledby="daily-event-heading"]');
            if (calendarSection) {
                calendarSection.parentNode.insertBefore(errorMsg, calendarSection);
            } else {
                container.insertBefore(errorMsg, container.firstChild);
            }
         }
         // Do not proceed if calendar can't initialize
         return;
    }

    // Set initial active state for start day buttons based on loaded preference
    startSunButton.classList.toggle('active', startDayOfWeekSetting === 0);
    startMonButton.classList.toggle('active', startDayOfWeekSetting === 1);

    // Initial render of the calendar
    renderCalendar(currentMonth, currentYear);

    // Start the timer loop
    updateEventTimers(); // Run the timer logic once immediately on load
    setInterval(updateEventTimers, 1000); // Update the timers every second

    // Call the function to load the verified communities
    loadVerifiedCommunities();

}); // End DOMContentLoaded wrapper