/**
 * Dropdown menu functionality for mobile and desktop
 * - Prevents navigation when clicking the dropdown toggle on mobile
 * - Allows navigation to the communities page with a double-click on mobile
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

    // Get all dropdown toggle links
    const dropdownToggles = document.querySelectorAll('.dropdown > a');

    // Track last click time for double-click detection
    let lastClickTime = 0;
    const doubleClickThreshold = 300; // milliseconds

    // Add click event listener to each dropdown toggle
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            // Check if we're on mobile (using a simple width check)
            if (window.innerWidth <= 767) {
                // Get current time for double-click detection
                const currentTime = new Date().getTime();
                const isDoubleClick = (currentTime - lastClickTime) < doubleClickThreshold;
                lastClickTime = currentTime;

                // If it's a double-click, allow navigation to the communities page
                if (isDoubleClick) {
                    console.log('Double-click detected, allowing navigation');
                    return; // Allow default navigation
                }

                // For single clicks, prevent navigation and toggle dropdown
                event.preventDefault();

                // Toggle the 'active' class on the parent dropdown
                this.parentElement.classList.toggle('active');

                // Find the dropdown content
                const dropdownContent = this.nextElementSibling;

                // Toggle visibility with a simple class
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
            } else {
                // On desktop, only prevent default if it's the current page
                if (toggle.classList.contains('active')) {
                    event.preventDefault();
                }
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
