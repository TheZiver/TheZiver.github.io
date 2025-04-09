/**
 * Dropdown menu functionality for mobile and desktop
 * - Always opens dropdown when clicking Communities tab
 * - Prevents navigation to the current page on both mobile and desktop
 * - Adds a direct navigation link to Communities page in the dropdown
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
            document.querySelectorAll('.dropdown.active').forEach(activeDropdown => {
                if (activeDropdown !== dropdown) {
                    activeDropdown.classList.remove('active');
                }
            });

            // Show this dropdown
            dropdownContent.classList.add('show');
        }
    }

    // Process all dropdown menus to add navigation links if needed
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const toggle = dropdown.querySelector('> a');
        const dropdownContent = dropdown.querySelector('.dropdown-content');

        // Only process Communities dropdown
        if (toggle && toggle.textContent.trim() === 'COMMUNITIES' && dropdownContent) {
            // If we're not on the Communities page, add a navigation link
            if (!toggle.classList.contains('active') && !dropdownContent.querySelector('.goto-communities')) {
                // Create a separator
                const separator = document.createElement('div');
                separator.className = 'dropdown-separator';
                separator.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
                separator.style.margin = '5px 0';

                // Create the navigation link
                const navLink = document.createElement('a');
                navLink.href = toggle.getAttribute('href');
                navLink.className = 'goto-communities';
                navLink.textContent = 'Go to Communities Page';
                navLink.style.textAlign = 'center';
                navLink.style.padding = '8px 10px';
                navLink.style.display = 'block';

                // Add them to the dropdown
                dropdownContent.appendChild(separator);
                dropdownContent.appendChild(navLink);
            }
        }
    });

    // Get all dropdown toggle links
    const dropdownToggles = document.querySelectorAll('.dropdown > a');

    // Add click event listener to each dropdown toggle link
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            // Check if this is the Communities link
            if (toggle.textContent.trim().includes('COMMUNITIES')) {
                // Always prevent default for Communities link to allow dropdown toggle
                event.preventDefault();

                // Get the parent dropdown
                const dropdown = toggle.closest('.dropdown');
                toggleDropdown(dropdown);

                // Log for debugging
                console.log('Communities dropdown toggled');
            } else if (toggle.classList.contains('active')) {
                // For other active links, just toggle the dropdown
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

    // Handle touch events better on mobile
    document.addEventListener('touchstart', function(event) {
        // Check if we're touching a dropdown toggle
        const dropdownToggle = event.target.closest('.dropdown > a');
        if (dropdownToggle) {
            // If it's the Communities link, handle it specially
            if (dropdownToggle.textContent.trim().includes('COMMUNITIES')) {
                event.preventDefault();
                const dropdown = dropdownToggle.closest('.dropdown');
                toggleDropdown(dropdown);
                console.log('Communities dropdown toggled via touch');
            }
        }
        // Only close dropdowns if not touching inside a dropdown
        else if (!event.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-content.show').forEach(openDropdown => {
                openDropdown.classList.remove('show');
            });
            document.querySelectorAll('.dropdown.active').forEach(activeDropdown => {
                activeDropdown.classList.remove('active');
            });
        }
    }, {passive: false}); // Changed to non-passive to allow preventDefault
});
