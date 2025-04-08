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

    // We no longer need double-click detection since we're using a direct approach

    // Add click event listener to each dropdown toggle
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            // Check if we're on mobile (using a simple width check)
            if (window.innerWidth <= 767) {
                // For all dropdown toggles, prevent default navigation first
                event.preventDefault();

                // Toggle the 'active' class on the parent dropdown
                this.parentElement.classList.toggle('active');

                // Find the dropdown content
                const dropdownContent = this.nextElementSibling;

                // Toggle visibility with a simple class
                if (dropdownContent.classList.contains('show')) {
                    dropdownContent.classList.remove('show');

                    // If the dropdown is being closed and it's the Communities link, navigate to the page
                    if (this.getAttribute('href') === 'communities.html') {
                        window.location.href = 'communities.html';
                    }
                } else {
                    // Close any other open dropdowns first
                    document.querySelectorAll('.dropdown-content.show').forEach(openDropdown => {
                        openDropdown.classList.remove('show');
                    });

                    // Show this dropdown
                    dropdownContent.classList.add('show');
                }

                // Create a separate tap/click handler for the Communities link
                if (this.getAttribute('href') === 'communities.html') {
                    // Store the timestamp of this click
                    const clickTime = new Date().getTime();

                    // If there was a recent previous click (double-tap), navigate to communities page
                    if (this.lastClickTime && (clickTime - this.lastClickTime < 500)) {
                        window.location.href = 'communities.html';
                    }

                    // Update the last click time
                    this.lastClickTime = clickTime;
                }
            } else {
                // On desktop, only prevent default if it's the current page
                if (toggle.classList.contains('active')) {
                    event.preventDefault();
                }
            }
        });
    });

    // Add click event listeners to dropdown menu items
    document.querySelectorAll('.dropdown-content a').forEach(item => {
        item.addEventListener('click', function(event) {
            // Always allow navigation for dropdown items
            // Close the parent dropdown
            const parentDropdown = this.closest('.dropdown');
            if (parentDropdown) {
                parentDropdown.classList.remove('active');
                const dropdownContent = parentDropdown.querySelector('.dropdown-content');
                if (dropdownContent) {
                    dropdownContent.classList.remove('show');
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
