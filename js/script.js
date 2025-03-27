document.addEventListener('DOMContentLoaded', function() {

    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('cal-month-year');
    const prevMonthButton = document.getElementById('cal-prev-month');
    const nextMonthButton = document.getElementById('cal-next-month');
    const gotoTodayButton = document.getElementById('cal-goto-today');
    const weekdaysContainer = document.getElementById('calendar-weekdays');
    const startSunButton = document.getElementById('cal-start-sun');
    const startMonButton = document.getElementById('cal-start-mon');

    const countdownTimerDisplay = document.getElementById('countdown-timer');
    const countdownDayLabel = document.getElementById('countdown-day-label');

    const targetDate = new Date(Date.UTC(2023, 6, 20)); // Note: Month is 0-indexed (6 = July)
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    let currentMonth = today.getUTCMonth();
    let currentYear = today.getUTCFullYear();
    let startDayOfWeekSetting = 1; // Default to Monday (0=Sun, 1=Mon)

    // Load saved start day preference
    const savedStartDay = localStorage.getItem('calendarStartDay');
    if (savedStartDay && (savedStartDay === '0' || savedStartDay === '1')) {
        startDayOfWeekSetting = parseInt(savedStartDay, 10);
    }

    // Locations for each day of the week (0=Sunday, 1=Monday, ..., 6=Saturday)
    // Ensure this order matches VRChat day logic if it's different from standard JS Date.getUTCDay()
    const locations = [ "YES?", "LUXURY TRASH", "The Fishing Mall", "Retrocubic Nexus", "Cunks Coughing City", "YES?", "YES?" ];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // World IDs mapped to the day of the week (0=Monday, ..., 6=Sunday) - ADJUST if your week mapping differs
    const WORLD_IDS = {
        0: "wrld_b0812b34-cd7c-44b8-9b29-4f921a9e4d5a",  // Monday
        1: "wrld_9806f25c-0644-4ed7-a3b9-404763bd7dbc",  // Tuesday
        2: "wrld_a1caec89-3313-42d3-977a-3f8ac819a5a9",  // Wednesday
        3: "wrld_94d6eb87-7246-4dd8-81c0-cb1f468f096a",  // Thursday
        4: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355",  // Friday
        5: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355",  // Saturday
        6: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355"   // Sunday
    };


    function getOrdinalSuffix(num) {
         if (num === null || typeof num === 'undefined') return "";
         const n = Number(num);
         if (isNaN(n) || n < 0) return ""; // Handle invalid input
        const j = n % 10, k = n % 100;
        if (j == 1 && k != 11) return "st";
        if (j == 2 && k != 12) return "nd";
        if (j == 3 && k != 13) return "rd";
        return "th";
    }

    function calculateDailyVrchatDay(date) {
         // Ensure we are comparing dates only, ignoring time
         const normalizedDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
         if (normalizedDate < targetDate) return null; // Event hasn't started yet for this date

         const oneDay = 24 * 60 * 60 * 1000;
         // Calculate difference in days from the target start date
         const dayDifference = Math.floor((normalizedDate - targetDate) / oneDay);
         // Return the day number (0 for the first day, 1 for the second, etc.)
         return (dayDifference >= 0) ? dayDifference : null;
    }

    function renderCalendar(month, year) {
        if (!calendarGrid || !monthYearDisplay || !weekdaysContainer) {
             console.error("Calendar base elements (grid, month/year display, or weekdays container) missing!"); return;
        }

        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        // --- Render Weekday Headers ---
        weekdaysContainer.innerHTML = ''; // Clear previous headers
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
        // --- End Render Weekday Headers ---

        calendarGrid.innerHTML = ''; // Clear previous days

        // Calculate calendar grid details
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const lastDayOfPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

        // Calculate the day of the week for the 1st of the month (0=Sun, 1=Mon, ...)
        const firstDayIndex = firstDayOfMonth.getUTCDay();

        // Calculate offset needed for the first day based on the startDayOfWeekSetting
        // (firstDayIndex - startDayOfWeekSetting + 7) % 7 gives the number of previous month days to show
        let startingDayOffset = (firstDayIndex - startDayOfWeekSetting + 7) % 7;

        // Render previous month's days
        for (let i = 0; i < startingDayOffset; i++) {
            const day = lastDayOfPrevMonth - startingDayOffset + 1 + i;
            calendarGrid.appendChild(createDayCell(day, true)); // true indicates 'other-month'
        }

        // Render current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(Date.UTC(year, month, day));
            // Check if this day is today (UTC)
            const isToday = (year === todayUTC.getUTCFullYear() && month === todayUTC.getUTCMonth() && day === todayUTC.getUTCDate());
            calendarGrid.appendChild(createDayCell(day, false, cellDate, isToday)); // false indicates not 'other-month'
        }

        // Render next month's days to fill the grid
        const totalCellsRendered = startingDayOffset + daysInMonth;
        const remainingCells = (7 - (totalCellsRendered % 7)) % 7; // Use modulo 7 to handle full weeks
        for (let i = 0; i < remainingCells; i++) {
            calendarGrid.appendChild(createDayCell(i + 1, true)); // true indicates 'other-month'
        }
    }

    function createDayCell(dayNumber, isOtherMonth, cellDate = null, isToday = false) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');

        // Create the span for the day number - always present
        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.classList.add('day-number');
        dayNumberSpan.textContent = dayNumber;

        if (isOtherMonth) {
            dayCell.classList.add('other-month');
            dayCell.appendChild(dayNumberSpan); // Other month cells just show the number
        } else if (cellDate) {
            // Calculate event details for valid days
            const dailyDay = calculateDailyVrchatDay(cellDate);

            if (dailyDay !== null) { // Is it a day with a DAILY VRCHAT event?
                const suffix = getOrdinalSuffix(dailyDay);
                const instanceId = dailyDay; // Use the calculated day number as instance ID

                // Determine the correct day index for WORLD_IDS (0=Mon...6=Sun)
                const dayOfWeekForWorld = (cellDate.getUTCDay() + 6) % 7; // Converts Sun=0..Sat=6 to Mon=0..Sun=6
                const worldId = WORLD_IDS[dayOfWeekForWorld];

                // Determine the correct day index for locations (0=Sun...6=Sat)
                const dayOfWeekForLocation = cellDate.getUTCDay();
                const locationName = locations[dayOfWeekForLocation];

                // Construct VRChat launch link
                const baseUrl = "https://vrchat.com/home/launch?worldId=" + worldId + "&instanceId=";
                const instanceParams = `~group(grp_2b910dc4-e984-4fd5-813c-877edcea29d2)~groupAccessType(public)~region(eu)`; // Add your actual group ID
                const vrchatLink = baseUrl + instanceId + instanceParams;

                // Create link element
                const dayLink = document.createElement('a');
                dayLink.href = vrchatLink;
                dayLink.target = "_blank"; // Open in new tab
                dayLink.rel = "noopener noreferrer"; // Security best practice
                dayLink.title = `Join Daily VRChat #${dailyDay}${suffix}`; // Tooltip

                // === MODIFIED ORDER FOR APPENDING ===
                dayLink.appendChild(dayNumberSpan); // 1. Append Day number (Top)

                const eventNumSpan = document.createElement('span'); // 2. Append Event Number (Middle)
                eventNumSpan.classList.add('daily-event-num');
                eventNumSpan.textContent = `${dailyDay}${suffix}`;
                dayLink.appendChild(eventNumSpan);

                if (locationName) { // 3. Append Location (Bottom), if it exists
                    const locationSpan = document.createElement('span');
                    locationSpan.classList.add('event-location');
                    locationSpan.textContent = locationName;
                    dayLink.appendChild(locationSpan);
                }
                // === END MODIFIED ORDER ===

                dayCell.appendChild(dayLink); // Add the link containing the ordered elements to the cell

            } else {
                // Day is in the current month but before the event started or calculation failed
                dayCell.appendChild(dayNumberSpan);
            }

            // Highlight today's date
            if (isToday) {
                dayCell.classList.add('today');
            }
        } else {
             // Fallback for safety, though should be covered by isOtherMonth
             dayCell.appendChild(dayNumberSpan);
        }

        return dayCell;
    }


    function updateCountdown() {
        // Check if elements exist before proceeding
        if (!countdownTimerDisplay || !countdownDayLabel) {
            // Log error only once to avoid console spam
            if (!window.countdownElementsMissingLogged) {
                 console.error("Countdown timer or day label element is missing!");
                 window.countdownElementsMissingLogged = true; // Set flag
            }
            return; // Stop execution if elements are missing
        }

        try {
            const nowUTC = new Date(); // Current time in UTC
            const nowUTCMillis = nowUTC.getTime();

            // Set target event time to 9 PM (21:00) UTC today
            let nextEventUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 21, 0, 0, 0));
            let nextEventMillis = nextEventUTC.getTime();

            // If current time is already past today's 9 PM UTC, set the target to tomorrow's 9 PM UTC
            if (nowUTCMillis >= nextEventMillis) {
                nextEventUTC.setUTCDate(nextEventUTC.getUTCDate() + 1);
                nextEventMillis = nextEventUTC.getTime();
            }

            // Calculate the DAILY VRCHAT day number for the *next* event
            const nextDailyDayNumber = calculateDailyVrchatDay(nextEventUTC);
            const nextDaySuffix = getOrdinalSuffix(nextDailyDayNumber);

            // Update the day label (e.g., "591st")
            countdownDayLabel.textContent = (nextDailyDayNumber !== null) ? `${nextDailyDayNumber}${nextDaySuffix}` : "---";

            // Calculate the time difference in milliseconds
            const difference = nextEventMillis - nowUTCMillis;

            if (difference <= 0) {
                // Event time has passed or is happening now
                countdownTimerDisplay.textContent = "Starting soon / In Progress!";
            } else {
                // Calculate remaining days, hours, minutes, seconds
                const days = Math.floor(difference / (1000 * 60 * 60 * 24)); // Milliseconds in a day
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); // Milliseconds in an hour
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)); // Milliseconds in a minute
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                // Format the countdown string
                let countdownString = "";
                if (days > 0) {
                    countdownString += `${days}d `;
                }
                // Always show hours, minutes, seconds, padded with zeros
                countdownString += `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

                countdownTimerDisplay.textContent = countdownString.trim();
            }
        } catch (error) {
             console.error("Error in updateCountdown:", error);
             // Display error state in the UI
             if (countdownTimerDisplay) countdownTimerDisplay.textContent = "Error calculating";
             if (countdownDayLabel) countdownDayLabel.textContent = "Err";
        }
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

         // Update button active states visually
         if (startSunButton) startSunButton.classList.toggle('active', newStartDay === 0);
         if (startMonButton) startMonButton.classList.toggle('active', newStartDay === 1);

         // Re-render the calendar with the new setting
         renderCalendar(currentMonth, currentYear);
     }

     // --- Event Listeners ---
    // Add checks to ensure buttons exist before adding listeners
    if (prevMonthButton) prevMonthButton.addEventListener('click', goToPrevMonth); else console.warn("Previous month button not found.");
    if (nextMonthButton) nextMonthButton.addEventListener('click', goToNextMonth); else console.warn("Next month button not found.");
    if (gotoTodayButton) gotoTodayButton.addEventListener('click', goToToday); else console.warn("Go to Today button not found.");
    if (startSunButton) startSunButton.addEventListener('click', () => updateStartDaySelection(0)); else console.warn("Start Sunday button not found.");
    if (startMonButton) startMonButton.addEventListener('click', () => updateStartDaySelection(1)); else console.warn("Start Monday button not found.");

    // --- Initial Setup ---
    // Check if all *essential* elements for the initial render are present
    if (!calendarGrid || !monthYearDisplay || !countdownTimerDisplay || !countdownDayLabel || !startSunButton || !startMonButton || !weekdaysContainer) {
         console.error("One or more essential elements for calendar/countdown initialization are missing!");
         // Optionally display a user-facing error message on the page
         const container = document.querySelector('.container') || document.body;
         if (container && !document.getElementById('init-error-msg')) { // Prevent multiple error messages
            const errorMsg = document.createElement('p');
            errorMsg.id = 'init-error-msg';
            errorMsg.style.color = 'red';
            errorMsg.style.fontWeight = 'bold';
            errorMsg.style.textAlign = 'center';
            errorMsg.style.marginTop = '20px';
            errorMsg.textContent = 'Error: Failed to initialize the calendar and countdown timer. Please check the browser console for details.';
            const calendarSection = document.querySelector('section[aria-labelledby="daily-event-heading"]');
            if (calendarSection) {
                // Insert before the calendar container if possible
                calendarSection.parentNode.insertBefore(errorMsg, calendarSection);
            } else {
                // Fallback: insert at the top of the main container
                container.insertBefore(errorMsg, container.firstChild);
            }
         }
         return; // Stop further execution if essential elements are missing
    }

    // Set initial active state for start day buttons
    startSunButton.classList.toggle('active', startDayOfWeekSetting === 0);
    startMonButton.classList.toggle('active', startDayOfWeekSetting === 1);

    // Initial render and countdown start
    renderCalendar(currentMonth, currentYear);
    updateCountdown(); // Run once immediately
    setInterval(updateCountdown, 1000); // Update countdown every second

});