/**
 * Dropdown menu functionality for mobile and desktop
 * - Allows navigation to the communities page when clicking the main link
 * - When on the communities page, clicking the tab toggles the dropdown menu
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

    // Function to toggle dropdown visibility
    function toggleDropdown(dropdown) {
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

    // Get all dropdown toggle links
    const dropdownToggles = document.querySelectorAll('.dropdown > a');

    // Add click event listener to each dropdown toggle link
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            // If this is the active link (we're on that page), toggle the dropdown
            if (toggle.classList.contains('active')) {
                event.preventDefault();

                // Get the parent dropdown
                const dropdown = toggle.closest('.dropdown');
                toggleDropdown(dropdown);
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
