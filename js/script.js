// --- START OF FINAL script.js ---
document.addEventListener('DOMContentLoaded', function() {

    // --- Helper Functions (Defined at top level scope) ---

    // Basic HTML escaping helper
    const escapeHtml = (unsafe) => {
        if (!unsafe || typeof unsafe !== 'string') return unsafe;
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

   function calculateDailyVrchatDay(date) {
        const normalizedDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        if (normalizedDate < targetDate) return null;
        const dayDifference = Math.floor((normalizedDate - targetDate) / oneDay);
        return (dayDifference >= 0) ? dayDifference : null;
   }

   function getDateFromDailyVrchatDay(dayNumber) {
       if (typeof dayNumber !== 'number' || !Number.isInteger(dayNumber) || dayNumber < 0) return null;
       try {
           const targetTimestamp = targetDate.getTime();
           const resultTimestamp = targetTimestamp + (dayNumber * oneDay);
           return new Date(resultTimestamp);
       } catch (e) {
           console.error(`Error calculating date for day ${dayNumber}:`, e);
           return null;
       }
   }

   // Helper function to get image path or null
   function getImagePath(key) {
    const filename = IMAGE_MAP[key];
    return filename ? `images/${filename}` : null;
    }

    // Helper function to generate a consistent key from a community name
    function generateCommunityImageKey(name) {
        if (!name) return null;
        let key = name.toLowerCase()
                      .replace(/＜＞＜/g, 'fish')
                      .replace(/[^a-z0-9\s_]/g, '')
                      .trim()
                      .replace(/\s+/g, '_');
        return `community_${key}`;
    }

    // --- Central Image Mapping ---
    const IMAGE_MAP = {
        // Thematic / Section Images
        about_meaning: "meaning_of_fish.png",
        communities_verified_logo: "fish_verified.png",
        communities_certified_logo: "fish_certified.png",
        daily_vrchat_logo: "daily_vrchat.png",
        rose_fish_logo: "rose_fish_spin.gif",
        store_luxury_trash_logo: "luxury_trash.png",

        // Community Logos (Keys generated from names)
        community_cheese_fish: "cheese_fish.png",
        community_vapor_fish: "vapor_fish.png",
        community_gamble_fish: "gamble_fish.png",
        community_rat_fish: "rat_fish.png",
        community_the_rusk_shack: "rusk_shack.png",
        community_avifair: "avifair.png",
        community_family_friendly_cult: "family_friendly_cult.png",
        community_portal_media: "portal_media.png",
        community_rose_fish: "rose_fish.png",
        // Add keys for certified communities if they have logos
        // Example: community_test_fish_cert_1: null,
    };


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

     // --- Image Elements ---
     const imgAboutMeaning = document.querySelector('.meaning-image');
     const imgCommunitiesVerified = document.querySelector('.fish-verified-theme .verified-image');
     const imgCommunitiesCertified = document.querySelector('.fish-certified-theme .verified-image');
     const imgDailyVRChat = document.querySelector('.community-image'); // Note: This uses a generic class, ensure it's the correct one on daily.html
     const imgRoseFish = document.querySelector('.rose-fish-theme .verified-image');
     const imgStoreLuxuryTrash = document.querySelector('.luxury-trash-theme .verified-image');

    // --- URL for Data ---
    const GIST_DATA_URL = "https://gist.githubusercontent.com/TheZiver/13fc44e6b228346750401f7fbfc995ed/raw";

    // --- Constants and State ---
    const targetDate = new Date(Date.UTC(2023, 6, 20)); // July 20, 2023 UTC (Month is 0-indexed)
    const oneDay = 24 * 60 * 60 * 1000; // Milliseconds in a day
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

    // --- Data Arrays / Maps ---
    const locations = [ "YES?", "LUXURY TRASH", "The Fishing Mall", "Retrocubic Nexus", "Cunks Coughing City", "YES?", "YES?" ]; // Sunday=0, Monday=1,...
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let specialDaysMap = new Map(); // For YYYY-MM-DD based specials
    let dailySpecialDaysMap = new Map(); // For day-number based specials

    const WORLD_IDS = {
        0: "wrld_b0812b34-cd7c-44b8-9b29-4f921a9e4d5a",  // Monday (Index corresponds to (getUTCDay() + 6) % 7)
        1: "wrld_9806f25c-0644-4ed7-a3b9-404763bd7dbc",  // Tuesday
        2: "wrld_a1caec89-3313-42d3-977a-3f8ac819a5a9",  // Wednesday
        3: "wrld_94d6eb87-7246-4dd8-81c0-cb1f468f096a",  // Thursday
        4: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355",  // Friday
        5: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355",  // Saturday
        6: "wrld_72b30439-62a0-4c0d-a0e6-b3eb7292d355"   // Sunday
    };
    const VRC_GROUP_ID = "grp_2b910dc4-e984-4fd5-813c-877edcea29d2";

    window.timerElementsChecked = false;
    window.timerElementsMissing = false;


    // --- Set Thematic Images ---
    function setThematicImages() {
        const setImageSource = (element, imageKey) => {
            if (element) {
                const imagePath = getImagePath(imageKey);
                if (imagePath) {
                    element.src = imagePath;
                } else {
                    console.warn(`Image key "${imageKey}" not found in IMAGE_MAP or has null value. Image not set.`);
                }
            } else {
                if (imageKey && IMAGE_MAP.hasOwnProperty(imageKey)) {
                    console.warn(`Image element for key "${imageKey}" not found on this page.`);
                }
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
             console.error("Calendar base elements missing! Calendar cannot render.");
             if(calendarGrid) calendarGrid.innerHTML = "<p class='error-message' style='grid-column: 1 / -1; text-align: center;'><i>Error loading calendar grid elements.</i></p>";
             return;
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

        calendarGrid.innerHTML = ''; // Clear previous grid content
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const lastDayOfPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const firstDayIndex = firstDayOfMonth.getUTCDay(); // 0=Sun, 1=Mon,...
        let startingDayOffset = (firstDayIndex - startDayOfWeekSetting + 7) % 7;

        // Previous month's days
        for (let i = 0; i < startingDayOffset; i++) {
            calendarGrid.appendChild(createDayCell(lastDayOfPrevMonth - startingDayOffset + 1 + i, true));
        }
        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(Date.UTC(year, month, day));
            const isToday = (year === todayUTC.getUTCFullYear() && month === todayUTC.getUTCMonth() && day === todayUTC.getUTCDate());
            calendarGrid.appendChild(createDayCell(day, false, cellDate, isToday));
        }
        // Next month's days
        const totalCellsRendered = startingDayOffset + daysInMonth;
        const remainingCells = (7 - (totalCellsRendered % 7)) % 7;
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
            let isHandled = false;
            const dailyDay = calculateDailyVrchatDay(cellDate);

            // --- 1. Check Daily VRChat Day Number Special ---
            if (dailyDay !== null && dailySpecialDaysMap.has(dailyDay)) {
                const dailySpecialDay = dailySpecialDaysMap.get(dailyDay);
                dayCell.classList.add('special-day');
                if (dailySpecialDay.css_class) dayCell.classList.add(dailySpecialDay.css_class);

                const linkHref = dailySpecialDay.link;
                const linkTitle = dailySpecialDay.description || dailySpecialDay.name; // Tooltip content
                const wrapperElement = document.createElement(linkHref ? 'a' : 'div');

                if (linkHref) {
                    wrapperElement.href = linkHref;
                    wrapperElement.target = "_blank";
                    wrapperElement.rel = "noopener noreferrer";
                }
                // Set title attribute for tooltip
                if (linkTitle) wrapperElement.title = linkTitle;

                wrapperElement.appendChild(dayNumberSpan); // Add day number first

                const specialNameSpan = document.createElement('span');
                specialNameSpan.classList.add('event-location'); // Reuse class

                // Handle multi-line names using innerHTML
                if (dailySpecialDay.name) {
                   specialNameSpan.innerHTML = dailySpecialDay.name.replace(/\n/g, '<br>');
                } else {
                   specialNameSpan.textContent = ''; // Handle case where name might be missing
                }

                wrapperElement.appendChild(specialNameSpan); // Add name span

                dayCell.appendChild(wrapperElement);
                isHandled = true;
            }

            // --- 2. Check YYYY-MM-DD Special Day ---
            if (!isHandled) {
                const dateStringUTC = `${cellDate.getUTCFullYear()}-${String(cellDate.getUTCMonth() + 1).padStart(2, '0')}-${String(cellDate.getUTCDate()).padStart(2, '0')}`;
                const specialDay = specialDaysMap.get(dateStringUTC);
                if (specialDay) {
                    dayCell.classList.add('special-day');
                    if (specialDay.css_class) dayCell.classList.add(specialDay.css_class);

                    const linkHref = specialDay.link;
                    const linkTitle = specialDay.description || specialDay.name; // Tooltip content
                    const wrapperElement = document.createElement(linkHref ? 'a' : 'div');

                    if (linkHref) {
                       wrapperElement.href = linkHref;
                       wrapperElement.target = "_blank";
                       wrapperElement.rel = "noopener noreferrer";
                    }
                    // Set title attribute for tooltip
                    if (linkTitle) wrapperElement.title = linkTitle;

                    wrapperElement.appendChild(dayNumberSpan); // Add day number first

                    const specialNameSpan = document.createElement('span');
                    specialNameSpan.classList.add('event-location');

                    // Handle multi-line names using innerHTML
                     if (specialDay.name) {
                        specialNameSpan.innerHTML = specialDay.name.replace(/\n/g, '<br>');
                     } else {
                        specialNameSpan.textContent = '';
                     }

                    wrapperElement.appendChild(specialNameSpan); // Add name span

                    dayCell.appendChild(wrapperElement);
                    isHandled = true;
                }
            }

            // --- 3. Check Regular Daily VRChat ---
            if (!isHandled && dailyDay !== null) {
                const suffix = getOrdinalSuffix(dailyDay);
                const instanceId = dailyDay;
                const dayOfWeekForWorld = (cellDate.getUTCDay() + 6) % 7; // Mon=0..Sun=6
                const worldId = WORLD_IDS[dayOfWeekForWorld];
                const dayOfWeekForLocation = cellDate.getUTCDay(); // Sun=0..Sat=6
                const locationName = locations[dayOfWeekForLocation];

                const baseUrl = "https://vrchat.com/home/launch?worldId=" + worldId + "&instanceId=";
                const instanceParams = `~group(${VRC_GROUP_ID})~groupAccessType(public)~region(eu)`;
                const vrchatLink = baseUrl + instanceId + instanceParams;

                const dayLink = document.createElement('a');
                dayLink.href = vrchatLink;
                dayLink.target = "_blank";
                dayLink.rel = "noopener noreferrer";
                dayLink.title = `Join Daily VRChat #${dailyDay}${suffix}`; // Tooltip for regular days

                dayLink.appendChild(dayNumberSpan);
                const eventNumSpan = document.createElement('span');
                eventNumSpan.classList.add('daily-event-num');
                eventNumSpan.textContent = `${dailyDay}${suffix}`;
                dayLink.appendChild(eventNumSpan);

                if (locationName) {
                    const locationSpan = document.createElement('span');
                    locationSpan.classList.add('event-location');
                    // No line breaks expected in default locations, use textContent
                    locationSpan.textContent = locationName;
                    dayLink.appendChild(locationSpan);
                }
                dayCell.appendChild(dayLink);
                isHandled = true;
            }

            // --- 4. Fallback: Just show number ---
            if (!isHandled) {
                dayCell.appendChild(dayNumberSpan);
            }

            // Apply 'today' class regardless of content type
            if (isToday) {
                dayCell.classList.add('today');
            }
        } else {
            // Fallback for unexpected cases (should not happen if logic is right)
            dayCell.appendChild(dayNumberSpan);
        }
        return dayCell;
    }


    // --- Timer Update Functions ---
    function updateEventTimers() {
        if (!window.timerElementsChecked) {
            if (!countdownContainer || !countdownTimerDisplay || !countdownDayLabel ||
                !closingCountdownContainer || !closingCountdownTimerDisplay || !closingCountdownDayLabel ||
                !happeningNowContainer || !happeningNowMessage || !happeningNowLink)
            {
                console.warn("One or more timer display elements are missing from this page (Expected on non-daily pages). Timers disabled.");
                 window.timerElementsMissing = true;
            }
             window.timerElementsChecked = true; // Only check once
        }
        if (window.timerElementsMissing) return; // Don't run if elements missing

        try {
            const nowUTC = new Date();
            const nowUTCMillis = nowUTC.getTime();

            // Calculate next START time (21:00 UTC)
            let nextStartUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 21, 0, 0, 0));
            if (nowUTCMillis >= nextStartUTC.getTime()) { // If current time is past today's start time
                nextStartUTC.setUTCDate(nextStartUTC.getUTCDate() + 1); // Move to tomorrow's start time
            }
            const diffToStart = nextStartUTC.getTime() - nowUTCMillis;
            const startDayNumber = calculateDailyVrchatDay(nextStartUTC);
            const startDaySuffix = getOrdinalSuffix(startDayNumber);
            countdownDayLabel.textContent = (startDayNumber !== null) ? `${startDayNumber}${startDaySuffix}` : "---";
            countdownTimerDisplay.textContent = formatTimeDifference(diffToStart);
            countdownContainer.style.display = 'block';

            // Calculate next CLOSE time (23:00 UTC)
            let nextCloseUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 23, 0, 0, 0));
            if (nowUTCMillis >= nextCloseUTC.getTime()) { // If current time is past today's close time
                nextCloseUTC.setUTCDate(nextCloseUTC.getUTCDate() + 1); // Move to tomorrow's close time
            }
            const diffToClose = nextCloseUTC.getTime() - nowUTCMillis;
            // Find the Daily VRChat day number corresponding to the *start* time of the closing event
            let closeEventDayUTC = new Date(nextCloseUTC);
            closeEventDayUTC.setUTCHours(21, 0, 0, 0); // Go back to the start time of that day's event
            const closeDayNumber = calculateDailyVrchatDay(closeEventDayUTC);
            const closeDaySuffix = getOrdinalSuffix(closeDayNumber);
            closingCountdownDayLabel.textContent = (closeDayNumber !== null) ? `${closeDayNumber}${closeDaySuffix}` : "---";
            closingCountdownTimerDisplay.textContent = formatTimeDifference(diffToClose);
            closingCountdownContainer.style.display = 'block';

            // Check if event is happening NOW (between 21:00 and 23:00 UTC today)
            const todayStartUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 21, 0, 0, 0));
            const todayCloseUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate(), 23, 0, 0, 0));

            if (nowUTCMillis >= todayStartUTC.getTime() && nowUTCMillis < todayCloseUTC.getTime()) {
                const currentDayNumber = calculateDailyVrchatDay(todayStartUTC);
                const currentDaySuffix = getOrdinalSuffix(currentDayNumber);
                const instanceId = currentDayNumber; // Instance ID is the day number

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
                     happeningNowContainer.style.display = 'none'; // Hide if error calculating ID
                     console.error("Could not calculate instance ID during event window.");
                }
            } else {
                happeningNowContainer.style.display = 'none'; // Hide if not happening now
            }
        } catch (error) {
            console.error("Error in updateEventTimers:", error);
            displayErrorState("Error updating timers.");
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

    function displayErrorState(message) {
         console.error(message);
         // Only try to update elements if they exist (i.e., not missing)
         if (!window.timerElementsMissing) {
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
    }

    // --- Calendar Navigation ---
    function goToPrevMonth() {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentMonth, currentYear);
    }
    function goToNextMonth() {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentMonth, currentYear);
    }
    function goToToday() {
        const now = new Date();
        const nowMonth = now.getUTCMonth();
        const nowYear = now.getUTCFullYear();
        if (currentMonth !== nowMonth || currentYear !== nowYear) {
            currentMonth = nowMonth;
            currentYear = nowYear;
            renderCalendar(currentMonth, currentYear);
        }
    }

    // --- Start Day Setting ---
    function updateStartDaySelection(newStartDay) {
        if (startDayOfWeekSetting === newStartDay) return; // No change needed
        // Only proceed if the buttons exist (i.e., on the daily page)
        if (startSunButton && startMonButton) {
            startDayOfWeekSetting = newStartDay;
            localStorage.setItem('calendarStartDay', newStartDay.toString());
            startSunButton.classList.toggle('active', newStartDay === 0);
            startMonButton.classList.toggle('active', newStartDay === 1);
            if (calendarGrid) renderCalendar(currentMonth, currentYear); // Re-render calendar
        }
    }

    // --- Content Loading Functions ---

    function loadMeaningAndPrinciples(jsonData) {
        try {
             // Principles List
             if (principlesListElement && jsonData?.community_principles?.principles) {
                 principlesListElement.innerHTML = ''; // Clear loading/previous
                 jsonData.community_principles.principles.forEach(principle => {
                     const li = document.createElement('li');
                     // Use innerHTML to allow bold tag
                     li.innerHTML = `<b>${escapeHtml(principle.title) || 'Principle'}</b>: ${escapeHtml(principle.description) || 'No description.'}`;
                     principlesListElement.appendChild(li);
                 });
             } else if (principlesListElement) {
                 // Only show error if element exists but data is bad/missing
                 principlesListElement.innerHTML = '<li class="error-message"><i>Could not load principles data.</i></li>';
             }

             // Principles Note
             if (principlesNoteElement && jsonData?.community_principles?.additional_note) {
                 principlesNoteElement.textContent = jsonData.community_principles.additional_note; // Assuming note doesn't contain HTML
             } else if (principlesNoteElement) {
                 principlesNoteElement.textContent = '<i>Additional note not available.</i>'; // Clear loading or show placeholder
             }

             // Meaning Explanation
             if (meaningExplanationList && jsonData?.meaning_of_fish?.explanation) {
                 meaningExplanationList.innerHTML = ''; // Clear loading/previous
                 jsonData.meaning_of_fish.explanation.forEach(item => {
                     const li = document.createElement('li');
                     const symbolText = (item.symbol === '<' || item.symbol === '＜') ? '<' : (item.symbol === '>' || item.symbol === '＞') ? '>' : (item.symbol || '?');
                     // Use innerHTML for bold tag and escape meaning
                     li.innerHTML = `<b style="font-size: 1.5em; display: inline-block; width: 20px;">${escapeHtml(symbolText)}</b> - ${escapeHtml(item.meaning) || 'No explanation.'}`;
                     meaningExplanationList.appendChild(li);
                 });
             } else if (meaningExplanationList) {
                 meaningExplanationList.innerHTML = '<li class="error-message"><i>Could not load meaning details data.</i></li>';
             }

             // Meaning Summary
             if (meaningSummaryElement && jsonData?.meaning_of_fish?.summary) {
                 // Escape summary then replace symbol with accessible span using innerHTML
                 const escapedSummary = escapeHtml(jsonData.meaning_of_fish.summary);
                 const summaryHTML = escapedSummary.replace(/＜＞＜/g, '<span aria-hidden="true">＜＞＜</span>'); // Replace after escaping
                 meaningSummaryElement.innerHTML = `<b>Summary:</b> ${summaryHTML}`;
             } else if (meaningSummaryElement) {
                 meaningSummaryElement.innerHTML = '<i>Summary data not available.</i>';
             }

        } catch (error) {
            console.error("Error loading meaning and principles:", error);
            if(principlesListElement) principlesListElement.innerHTML = '<li class="error-message"><i>Error processing principles data.</i></li>';
            if(meaningExplanationList) meaningExplanationList.innerHTML = '<li class="error-message"><i>Error processing meaning details data.</i></li>';
            if(meaningSummaryElement) meaningSummaryElement.innerHTML = '<i class="error-message">Error processing summary data.</i>';
        }
    }

    function loadFishGroups(jsonData) {
        if (!verifiedListElement && !certifiedListElement) {
            // console.debug("Community list elements not found on this page.");
            return; // Exit if neither list element is present
        }

        try {
            if (!jsonData || typeof jsonData !== 'object' || !Array.isArray(jsonData.communities)) {
                 throw new Error("JSON data structure for communities is invalid.");
            }
            const communities = jsonData.communities;

            if(verifiedListElement) verifiedListElement.innerHTML = ''; // Clear loading/previous
            if(certifiedListElement) certifiedListElement.innerHTML = ''; // Clear loading/previous

            let verifiedCount = 0;
            let certifiedCount = 0;

            communities.forEach(community => {
                if (!community || typeof community.name !== 'string') {
                     console.warn("Skipping invalid community entry:", community);
                     return;
                }

                const listItem = document.createElement('li');
                const textDiv = document.createElement('div');

                // Build text content using innerHTML for tags
                let textContentHTML = '';
                // Escape name THEN replace fish symbol
                const escapedName = escapeHtml(community.name);
                const communityNameHTML = escapedName.replace(/＜＞＜/g, '<span aria-hidden="true">＜＞＜</span>');
                textContentHTML += `<b>${communityNameHTML}</b>`;

                if (community.description) {
                    textContentHTML += `<span>${escapeHtml(community.description)}</span>`;
                }
                if (community.owner_displayname) {
                    textContentHTML += `<span><b>Owner:</b> ${escapeHtml(community.owner_displayname)}</span>`;
                }

                // Add links (ensure URLs are properly handled/validated if needed)
                const vrchatLink = community.links?.vrchat_group;
                const discordLink = community.links?.discord_server;
                if (vrchatLink && typeof vrchatLink === 'string' && vrchatLink.trim() !== '') {
                    // Simple validation
                     if (vrchatLink.startsWith('http') || vrchatLink.startsWith('vrchat://')) {
                         textContentHTML += `<a href="${escapeHtml(vrchatLink.trim())}" target="_blank" rel="noopener noreferrer">VRChat Group</a>`;
                     } else {
                         console.warn(`Skipping potentially invalid VRChat link for ${community.name}: ${vrchatLink}`);
                     }
                }
                if (discordLink && typeof discordLink === 'string' && discordLink.trim() !== '') {
                    if (discordLink.startsWith('http') || discordLink.startsWith('discord.gg/')) {
                        textContentHTML += `<a href="${escapeHtml(discordLink.trim())}" target="_blank" rel="noopener noreferrer">Discord Server</a>`;
                    } else {
                       console.warn(`Skipping potentially invalid Discord link for ${community.name}: ${discordLink}`);
                    }
                }
                textDiv.innerHTML = textContentHTML;

                // Add logo if available
                const imageKey = generateCommunityImageKey(community.name);
                const imagePath = imageKey ? getImagePath(imageKey) : null;
                if (imagePath) {
                     const img = document.createElement('img');
                     img.src = imagePath; // Path should be safe
                     img.alt = `${community.name} Logo`; // Alt text from original name
                     img.classList.add('community-logo');
                     img.loading = 'lazy'; // Defer loading off-screen images
                     listItem.appendChild(img); // Logo first
                }

                listItem.appendChild(textDiv); // Then text div

                // Append to correct list
                if (community.status === 'FISH_VERIFIED' && verifiedListElement) {
                     verifiedListElement.appendChild(listItem);
                     verifiedCount++;
                } else if (community.status === 'FISH_CERTIFIED' && certifiedListElement) {
                     certifiedListElement.appendChild(listItem);
                     certifiedCount++;
                } else {
                    if (community.status && community.status !== 'FISH_VERIFIED' && community.status !== 'FISH_CERTIFIED') {
                        console.warn(`Community "${community.name}" has unrecognized status: ${community.status}`);
                    } // Removed redundant checks for missing elements
                }
            });

            // Display message if no communities found in a specific list
            if (verifiedListElement && verifiedCount === 0) {
                verifiedListElement.innerHTML = '<li><i>No verified communities listed currently.</i></li>';
            }
            if (certifiedListElement && certifiedCount === 0) {
                certifiedListElement.innerHTML = '<li><i>No certified communities listed currently.</i></li>';
            }

        } catch (error) {
            console.error('Failed to process fish communities:', error);
            const errorMessage = `<li class="error-message"><i>Error loading communities. Details: ${escapeHtml(error.message)}.</i></li>`;
            if (verifiedListElement) verifiedListElement.innerHTML = errorMessage;
            if (certifiedListElement) certifiedListElement.innerHTML = errorMessage;
        }
    }

     function loadFishAssets(assetTypeKey, listElement, jsonData) {
         if (!listElement) {
             // console.debug(`Asset list element for '${assetTypeKey}' not found on this page.`);
             return; // Exit if list element isn't present
         }

         try {
             const assetData = jsonData?.[assetTypeKey];
             if (!jsonData || !Array.isArray(assetData)) {
                 throw new Error(`JSON data invalid or missing array for '${assetTypeKey}'.`);
             }
             listElement.innerHTML = ''; // Clear loading/previous
             let assetCount = 0;

             assetData.forEach(asset => {
                 if (!asset || typeof asset !== 'object') {
                     console.warn(`Skipping invalid entry in ${assetTypeKey}:`, asset);
                     return;
                 }

                 const listItem = document.createElement('li');
                 let contentHTML = '', link = null, id = null, name = null, author = null;
                 let idKey = '', linkKey = '', nameKey = '', authorKey = 'author';
                 let typeName = '', baseURL = '';

                 // Determine keys and base URL based on asset type
                 if (assetTypeKey === 'community_worlds') {
                     idKey = 'world_id'; linkKey = 'world_link'; nameKey = 'world_name';
                     typeName = 'World'; baseURL = 'https://vrchat.com/home/world/';
                 } else if (assetTypeKey === 'community_avatars') {
                     idKey = 'avatar_id'; linkKey = 'avatar_link'; nameKey = 'avatar_name';
                     typeName = 'Avatar'; baseURL = 'https://vrchat.com/home/avatar/';
                 } else {
                     console.warn(`Unsupported assetTypeKey: ${assetTypeKey}`);
                     return; // Skip if type is unknown
                 }

                 // Extract data
                 id = asset[idKey];
                 link = asset[linkKey];
                 name = asset[nameKey];
                 author = asset[authorKey];

                 // Build list item content using innerHTML & escaping
                 const displayName = escapeHtml(name) || escapeHtml(id) || `Unnamed ${typeName}`;
                 contentHTML = `<b>${displayName}</b>`;

                 if (author) {
                     contentHTML += ` by ${escapeHtml(author)}`;
                 } else if (name || id) { // Only show "Unknown Author" if there's a name/id
                     contentHTML += ` by <i>Unknown Author</i>`;
                 }
                 if (id && id !== name) { // Show ID if it exists and isn't the same as the name
                     contentHTML += `<br><i>ID: ${escapeHtml(id)}</i>`;
                 }

                 // Add link - prioritize explicit link, fallback to generated link from ID
                 let addedLink = false;
                 if (link && typeof link === 'string' && link.trim() !== '' && (link.startsWith('http') || link.startsWith('vrchat'))) {
                     contentHTML += `<br><a href="${escapeHtml(link.trim())}" target="_blank" rel="noopener noreferrer">View on VRChat</a>`;
                     addedLink = true;
                 } else if (id && baseURL) {
                     contentHTML += `<br><a href="${baseURL}${escapeHtml(id)}" target="_blank" rel="noopener noreferrer">View on VRChat (via ID)</a>`;
                     addedLink = true;
                 }

                 // Add item to list only if it has some identifiable info
                 if (name || id || addedLink) {
                     listItem.innerHTML = contentHTML;
                     listElement.appendChild(listItem);
                     assetCount++;
                 } else {
                     console.warn(`Skipping potentially empty asset entry in ${assetTypeKey}:`, asset);
                 }
             });

             // Display message if no assets found
             if (assetCount === 0) {
                  const assetPlural = assetTypeKey.includes('world') ? 'worlds' : 'avatars';
                  listElement.innerHTML = `<li><i>No community ${assetPlural} listed currently.</i></li>`;
             }

         } catch (error) {
             console.error(`Failed to process ${assetTypeKey}:`, error);
             const assetPlural = assetTypeKey.includes('world') ? 'worlds' : 'avatars';
             if (listElement) { // Check again just in case
                 listElement.innerHTML = `<li class="error-message"><i>Error loading community ${assetPlural}. Details: ${escapeHtml(error.message)}.</i></li>`;
             }
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
        console.log("Initializing page..."); // Log start

        // 1. Set static thematic images immediately
        setThematicImages();

        // 2. Setup initial calendar state (loading message) and timer buttons
        if (calendarGrid && monthYearDisplay && startSunButton && startMonButton && weekdaysContainer) {
            startSunButton.classList.toggle('active', startDayOfWeekSetting === 0);
            startMonButton.classList.toggle('active', startDayOfWeekSetting === 1);
            calendarGrid.innerHTML = "<div style='grid-column: 1 / -1; text-align: center; padding: 20px;'><i>Loading calendar days...</i></div>";
            monthYearDisplay.textContent = "Loading...";
            console.log("Calendar elements found and initialized.");
        } else {
             console.debug("Calendar elements missing. Calendar will not render (Expected on non-daily pages).");
        }

        // 3. Start timers (they check internally if elements exist)
        updateEventTimers(); // Initial call
        if (!window.timerElementsMissing) {
            setInterval(updateEventTimers, 1000); // Start interval only if elements exist
            console.log("Timer interval started.");
        }

        // 4. Fetch JSON data
        console.log("Fetching community data from:", GIST_DATA_URL);
        fetch(GIST_DATA_URL, { cache: "no-cache" }) // Add cache control
            .then(response => {
                console.log("Fetch response status:", response.status);
                if (!response.ok) { // Check for HTTP errors
                    return response.text().then(text => { throw new Error(`HTTP error! Status: ${response.status}. Response: ${text.substring(0,150)}...`); });
                }
                return response.json(); // Parse JSON
            })
            .then(data => { // --- Process fetched data ---
                console.log("Successfully fetched and parsed JSON data.");

                // a. Process YYYY-MM-DD Special Days
                specialDaysMap.clear();
                if (data && Array.isArray(data.special_calendar_days)) {
                    data.special_calendar_days.forEach(day => {
                        if (day && typeof day.date === 'string' && day.date.match(/^\d{4}-\d{2}-\d{2}$/) && typeof day.name === 'string') {
                            specialDaysMap.set(day.date, day);
                        } else { console.warn("Skipping invalid date-based special day:", day); }
                    });
                    console.log(`Processed ${specialDaysMap.size} date-based special days.`);
                } else { console.log("No 'special_calendar_days' array found or it was invalid in JSON."); }

                // b. Process Daily VRChat Day Number Specials
                dailySpecialDaysMap.clear();
                if (data?.daily_vrchat && Array.isArray(data.daily_vrchat.special_days)) {
                    data.daily_vrchat.special_days.forEach(item => {
                        // Validate required fields more strictly
                        if (item && typeof item.day === 'number' && Number.isInteger(item.day) && item.day >= 0 && typeof item.name === 'string' && item.name.trim() !== '') {
                            dailySpecialDaysMap.set(item.day, { // Store standardized object
                                name: item.name,
                                description: item.description, // Optional
                                link: item.link,           // Optional
                                css_class: item.css_class      // Optional
                            });
                        } else { console.warn("Skipping invalid or incomplete daily-number-based special day entry:", item); }
                    });
                    console.log(`Processed ${dailySpecialDaysMap.size} daily-number-based special days.`);
                } else { console.log("No 'daily_vrchat.special_days' array found or it was invalid in JSON."); }

                // c. Render Calendar (now with special day data available)
                if (calendarGrid) { // Check again, as data fetch is async
                    console.log("Rendering calendar with fetched data...");
                    renderCalendar(currentMonth, currentYear);
                }

                // d. Load other page content (check if elements exist before loading)
                console.log("Loading other page content...");
                if (principlesListElement || principlesNoteElement || meaningExplanationList || meaningSummaryElement) {
                     loadMeaningAndPrinciples(data);
                }
                if (verifiedListElement || certifiedListElement) {
                    loadFishGroups(data);
                }
                if (worldsListElement) {
                    loadFishAssets('community_worlds', worldsListElement, data);
                }
                 if (avatarsListElement) {
                    loadFishAssets('community_avatars', avatarsListElement, data);
                }
                console.log("Page content loading complete.");
            })
            .catch(error => { // --- Handle Fetch/Processing Errors ---
                console.error("Fatal Error: Could not fetch or process community data.", error);
                 const displayLoadError = (listEl, type) => { // Helper for list errors
                     if (listEl) { // Only update if the element exists
                          listEl.innerHTML = `<li class="error-message"><i>Critical Error: Could not load ${type} data. (${escapeHtml(error.message)})</i></li>`;
                     }
                 };
                 // Show error in calendar grid if it exists
                 if(calendarGrid) calendarGrid.innerHTML = `<div class='error-message' style='grid-column: 1 / -1; text-align: center; padding: 20px;'><i>Error loading calendar data: ${escapeHtml(error.message)}</i></div>`;
                 if(monthYearDisplay) monthYearDisplay.textContent = "Error";

                 // Display errors for other sections if their elements exist
                 displayLoadError(principlesListElement, "principles");
                 if(principlesNoteElement) principlesNoteElement.textContent = '';
                 displayLoadError(meaningExplanationList, "meaning");
                 if(meaningSummaryElement) meaningSummaryElement.innerHTML = '<i class="error-message">Error loading data.</i>';
                 displayLoadError(verifiedListElement, "verified communities");
                 displayLoadError(certifiedListElement, "certified communities");
                 displayLoadError(worldsListElement, "community worlds");
                 displayLoadError(avatarsListElement, "community avatars");
                 // Also display timer error state if timers should be present
                 displayErrorState(`Data fetch/process failed: ${error.message}`);
            });
    }

    // --- Run Initialization on Page Load ---
    initializePage();

}); // End DOMContentLoaded wrapper
// --- END OF FINAL script.js ---