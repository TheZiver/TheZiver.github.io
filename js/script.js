// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // console.log("DOM Loaded, Calendar Script executing...");

    // --- Calendar Elements ---
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('cal-month-year');
    const prevMonthButton = document.getElementById('cal-prev-month');
    const nextMonthButton = document.getElementById('cal-next-month');
    const gotoTodayButton = document.getElementById('cal-goto-today');
    const weekdaysContainer = document.getElementById('calendar-weekdays'); // <-- Added for weekdays
    const startSunButton = document.getElementById('cal-start-sun');
    const startMonButton = document.getElementById('cal-start-mon');

    // --- Countdown Elements ---
    const countdownTimerDisplay = document.getElementById('countdown-timer');
    const countdownDayLabel = document.getElementById('countdown-day-label');

    // --- Configuration ---
    const targetDate = new Date(Date.UTC(2023, 6, 20)); // July is month 6
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    let currentMonth = today.getUTCMonth();
    let currentYear = today.getUTCFullYear();
    let startDayOfWeekSetting = 1; // Default to Monday (0=Sun, 1=Mon)

    // Load Start Day Preference
    const savedStartDay = localStorage.getItem('calendarStartDay');
    if (savedStartDay && (savedStartDay === '0' || savedStartDay === '1')) {
        startDayOfWeekSetting = parseInt(savedStartDay, 10);
    }

    const locations = [ "YES?", "LUXURY TRASH", "The Fishing Mall", "Retrocubic Nexus", "Cunks Coughing City", "YES?", "YES?" ]; // Sunday=0 to Saturday=6
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


    // --- Calendar Helper Functions ---
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

    // --- Calendar Rendering Function ---
    function renderCalendar(month, year) {
        // Check for essential elements
        if (!calendarGrid || !monthYearDisplay || !weekdaysContainer) { // Added weekdaysContainer check
             console.error("Calendar base or weekday elements missing!"); return;
        }

        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        // --- ADDED: Render Weekday Headers ---
        weekdaysContainer.innerHTML = ''; // Clear previous headers
        const weekdayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let orderedWeekdays = [];

        if (startDayOfWeekSetting === 1) { // Monday start
            // Order: Mon, Tue, Wed, Thu, Fri, Sat, Sun
            orderedWeekdays = [...weekdayNamesShort.slice(1), weekdayNamesShort[0]];
        } else { // Sunday start (default 0)
            // Order: Sun, Mon, Tue, Wed, Thu, Fri, Sat
            orderedWeekdays = weekdayNamesShort;
        }

        orderedWeekdays.forEach(dayName => {
            const weekdayCell = document.createElement('div');
            weekdayCell.classList.add('weekday-header');
            weekdayCell.textContent = dayName;
            weekdaysContainer.appendChild(weekdayCell);
        });
        // --- END ADDED ---

        calendarGrid.innerHTML = ''; // Clear previous day cells

        // Calculate grid details
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const lastDayOfPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const firstDayIndex = firstDayOfMonth.getUTCDay();
        let startingDayOffset = (firstDayIndex - startDayOfWeekSetting + 7) % 7;

        // Render Grid
        // 1. Previous month's days
        for (let i = 0; i < startingDayOffset; i++) {
            const day = lastDayOfPrevMonth - startingDayOffset + 1 + i;
            calendarGrid.appendChild(createDayCell(day, true));
        }
        // 2. Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(Date.UTC(year, month, day));
            const isToday = (year === todayUTC.getUTCFullYear() && month === todayUTC.getUTCMonth() && day === todayUTC.getUTCDate());
            calendarGrid.appendChild(createDayCell(day, false, cellDate, isToday));
        }
        // 3. Next month's days
        const totalCellsRendered = startingDayOffset + daysInMonth;
        const remainingCells = (7 - (totalCellsRendered % 7)) % 7;
        for (let i = 0; i < remainingCells; i++) {
            calendarGrid.appendChild(createDayCell(i + 1, true));
        }
    }

    // --- Helper to Create Day Cells ---
    function createDayCell(dayNumber, isOtherMonth, cellDate = null, isToday = false) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.classList.add('day-number');
        dayNumberSpan.textContent = dayNumber;
        dayCell.appendChild(dayNumberSpan);

        if (isOtherMonth) {
            dayCell.classList.add('other-month');
        } else if (cellDate) {
            const dailyDay = calculateDailyVrchatDay(cellDate);
            if (dailyDay !== null) {
                const suffix = getOrdinalSuffix(dailyDay);
                const eventNumSpan = document.createElement('span');
                eventNumSpan.classList.add('daily-event-num');
                eventNumSpan.textContent = `${dailyDay}${suffix}`;
                dayCell.appendChild(eventNumSpan);

                const dayOfWeek = cellDate.getUTCDay();
                const locationName = locations[dayOfWeek];
                if (locationName) {
                    const locationSpan = document.createElement('span');
                    locationSpan.classList.add('event-location');
                    locationSpan.textContent = locationName;
                    dayCell.appendChild(locationSpan);
                }
            }
            if (isToday) {
                dayCell.classList.add('today');
            }
        }
        return dayCell;
    }

    // --- Countdown Timer Function ---
    function updateCountdown() {
        if (!countdownTimerDisplay || !countdownDayLabel) {
            if (!window.countdownElementsMissingLogged) { console.error("Countdown elements missing!"); window.countdownElementsMissingLogged = true; }
            return;
        }
        try {
            const nowUTC = new Date(); const nowUTCMillis = nowUTC.getTime();
            // Daily event starts at 9 PM UTC (21:00)
            let nextEventUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 21, 0, 0, 0));
            let nextEventMillis = nextEventUTC.getTime();
            // If current time is past today's 9 PM UTC, calculate for tomorrow's 9 PM UTC
            if (nowUTCMillis >= nextEventMillis) { nextEventUTC.setUTCDate(nextEventUTC.getUTCDate() + 1); nextEventMillis = nextEventUTC.getTime(); }

            const nextDailyDayNumber = calculateDailyVrchatDay(nextEventUTC);
            const nextDaySuffix = getOrdinalSuffix(nextDailyDayNumber);
            countdownDayLabel.textContent = (nextDailyDayNumber !== null) ? `${nextDailyDayNumber}${nextDaySuffix}` : "---";
            const difference = nextEventMillis - nowUTCMillis;
            if (difference <= 0) { countdownTimerDisplay.textContent = "Starting soon / In Progress!"; }
            else {
                const days = Math.floor(difference / 86400000);
                const hours = Math.floor((difference % 86400000) / 3600000);
                const minutes = Math.floor((difference % 3600000) / 60000);
                const seconds = Math.floor((difference % 60000) / 1000);
                let countdownString = "";
                if (days > 0) countdownString += `${days}d `;
                countdownString += `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
                countdownTimerDisplay.textContent = countdownString.trim();
            }
        } catch (error) {
            console.error("Error in updateCountdown:", error);
            if (countdownTimerDisplay) countdownTimerDisplay.textContent = "Error";
            if (countdownDayLabel) countdownDayLabel.textContent = "Error";
        }
    }

    // --- Event Handler Functions ---
     function goToPrevMonth() { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(currentMonth, currentYear); }
     function goToNextMonth() { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(currentMonth, currentYear); }
     function goToToday() { const now = new Date(); if (currentMonth !== now.getUTCMonth() || currentYear !== now.getUTCFullYear()) { currentMonth = now.getUTCMonth(); currentYear = now.getUTCFullYear(); renderCalendar(currentMonth, currentYear); } }
     function updateStartDaySelection(newStartDay) { if (startDayOfWeekSetting === newStartDay) return; startDayOfWeekSetting = newStartDay; localStorage.setItem('calendarStartDay', newStartDay.toString()); if (startSunButton) startSunButton.classList.toggle('active', newStartDay === 0); if (startMonButton) startMonButton.classList.toggle('active', newStartDay === 1); renderCalendar(currentMonth, currentYear); }

    // --- Event Listeners ---
    if (prevMonthButton) prevMonthButton.addEventListener('click', goToPrevMonth); else console.warn("Prev month button missing.");
    if (nextMonthButton) nextMonthButton.addEventListener('click', goToNextMonth); else console.warn("Next month button missing.");
    if (gotoTodayButton) gotoTodayButton.addEventListener('click', goToToday); else console.warn("Today button missing.");
    if (startSunButton) startSunButton.addEventListener('click', () => updateStartDaySelection(0)); else console.warn("Start Sun button missing.");
    if (startMonButton) startMonButton.addEventListener('click', () => updateStartDaySelection(1)); else console.warn("Start Mon button missing.");

    // --- Initial Setup ---
    // Check essential elements (including weekdaysContainer)
    if (!calendarGrid || !monthYearDisplay || !countdownTimerDisplay || !countdownDayLabel || !startSunButton || !startMonButton || !weekdaysContainer) { // <-- Added weekdaysContainer
         console.error("Essential elements missing for initial setup!");
         const container = document.querySelector('.container') || document.body;
         if (container && !document.getElementById('init-error-msg')) {
            const errorMsg = document.createElement('p'); errorMsg.id = 'init-error-msg'; errorMsg.style.color = 'red'; errorMsg.style.textAlign = 'center';
            errorMsg.textContent = 'Error: Calendar/Countdown init failed. Elements missing.';
            const calendarSection = document.querySelector('section[aria-labelledby="daily-event-heading"]');
            if (calendarSection) { calendarSection.parentNode.insertBefore(errorMsg, calendarSection); }
            else { container.insertBefore(errorMsg, container.firstChild); }
         } return;
    }

    // Set initial active state for start day buttons
    startSunButton.classList.toggle('active', startDayOfWeekSetting === 0);
    startMonButton.classList.toggle('active', startDayOfWeekSetting === 1);

    // Initial render and countdown start
    renderCalendar(currentMonth, currentYear);
    updateCountdown();
    setInterval(updateCountdown, 1000);

}); // End DOMContentLoaded