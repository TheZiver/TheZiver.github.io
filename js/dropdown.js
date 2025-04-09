/**
 * Dropdown menu functionality for mobile and desktop
 * - Adds a dropdown arrow indicator for mobile that toggles the dropdown
 * - Allows navigation to the communities page when clicking the main link
 * - Prevents navigation to the current page on both mobile and desktop
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.main-nav a');

    // Prevent navigation to current page
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Check if this link is for the current page
            if (link.classList.contains('active')) {
                // Prevent navigation to the same page
                event.preventDefault();
                console.log('Prevented navigation to current page');
            }
        });
    });

    // Create dropdown toggle indicators for mobile
    function createMobileDropdownIndicators() {
        const dropdowns = document.querySelectorAll('.dropdown');

        dropdowns.forEach(dropdown => {
            // Check if indicator already exists
            if (dropdown.querySelector('.dropdown-toggle-indicator')) return;

            // Create the indicator element
            const indicator = document.createElement('span');
            indicator.className = 'dropdown-toggle-indicator';
            indicator.innerHTML = '▼';
            indicator.setAttribute('aria-hidden', 'true');

            // Insert after the main link
            const mainLink = dropdown.querySelector('a');
            if (mainLink) {
                dropdown.insertBefore(indicator, mainLink.nextSibling);
            }
        });
    }

    // Call this function to create the indicators
    createMobileDropdownIndicators();

    // Add click event listeners to the dropdown toggle indicators
    document.addEventListener('click', function(event) {
        // Check if we clicked on a dropdown indicator
        if (event.target.classList.contains('dropdown-toggle-indicator')) {
            event.preventDefault();

            // Get the parent dropdown
            const dropdown = event.target.closest('.dropdown');
            if (!dropdown) return;

            // Toggle the active class
            dropdown.classList.toggle('active');

            // Find the dropdown content
            const dropdownContent = dropdown.querySelector('.dropdown-content');
            if (!dropdownContent) return;

            // Toggle visibility
            if (dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
            } else {
                // Close any other open dropdowns first
                document.querySelectorAll('.dropdown-content.show').forEach(openDropdown => {
                    openDropdown.classList.remove('show');
                });

                // Show this dropdown
                dropdownContent.classList.add('show');
            }
        }
    });

    // Get all dropdown toggle links (the main links, not the indicators)
    const dropdownToggles = document.querySelectorAll('.dropdown > a');

    // Add click event listener to each dropdown toggle link
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            // Only prevent navigation if it's the current page
            if (toggle.classList.contains('active')) {
                event.preventDefault();
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-content.show').forEach(openDropdown => {
                openDropdown.classList.remove('show');
            });
            document.querySelectorAll('.dropdown.active').forEach(activeDropdown => {
                activeDropdown.classList.remove('active');
            });
        }
    });
});
