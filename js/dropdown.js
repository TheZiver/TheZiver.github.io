/**
 * Dropdown menu functionality for mobile and desktop
 * - Always opens dropdown when clicking Communities tab
 * - Prevents navigation to the current page on both mobile and desktop
 * - Adds a direct navigation link to Communities page in the dropdown
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.main-nav a');

    // Get the Communities link specifically
    const communitiesLink = document.querySelector('.main-nav a[href="communities.html"]');

    // Check if we're on mobile
    const isMobile = window.innerWidth <= 767;

    // Add a mobile-specific button for the dropdown if on mobile
    if (isMobile && communitiesLink) {
        // Create a mobile-specific button
        const mobileButton = document.createElement('span');
        mobileButton.className = 'mobile-dropdown-toggle';
        mobileButton.textContent = '▼';
        mobileButton.setAttribute('aria-label', 'Toggle dropdown menu');

        // Insert the button after the Communities link
        communitiesLink.parentNode.insertBefore(mobileButton, communitiesLink.nextSibling);

        // Add click handler to the mobile button
        mobileButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            // Find the dropdown parent
            const dropdown = mobileButton.closest('.dropdown');
            if (dropdown) {
                // Toggle dropdown visibility
                dropdown.classList.toggle('active');
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                if (dropdownContent) {
                    dropdownContent.classList.toggle('show');
                    console.log('Communities dropdown toggled via mobile button');
                }
            }
        });

        // Add touch handler to the mobile button
        mobileButton.addEventListener('touchstart', function(event) {
            event.preventDefault();
            event.stopPropagation();

            // Find the dropdown parent
            const dropdown = mobileButton.closest('.dropdown');
            if (dropdown) {
                // Toggle dropdown visibility
                dropdown.classList.toggle('active');
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                if (dropdownContent) {
                    dropdownContent.classList.toggle('show');
                    console.log('Communities dropdown toggled via mobile button touch');
                }
            }
        }, {passive: false});
    }

    // Add a direct click handler to the Communities link
    if (communitiesLink) {
        communitiesLink.addEventListener('click', function(event) {
            // Always prevent default navigation for Communities link
            event.preventDefault();

            // Find the dropdown parent
            const dropdown = communitiesLink.closest('.dropdown');
            if (dropdown) {
                // Toggle dropdown visibility
                dropdown.classList.toggle('active');
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                if (dropdownContent) {
                    dropdownContent.classList.toggle('show');
                    console.log('Communities dropdown toggled directly');
                }
            }
        });
    }

    // Prevent navigation to current page
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Skip the Communities link as it's handled separately
            if (link === communitiesLink) return;

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

    // Add specific touch handler for the Communities link on mobile
    if (communitiesLink) {
        communitiesLink.addEventListener('touchstart', function(event) {
            // Always prevent default for touch on Communities link
            event.preventDefault();
            event.stopPropagation();

            // Find the dropdown parent
            const dropdown = communitiesLink.closest('.dropdown');
            if (dropdown) {
                // Toggle dropdown visibility
                dropdown.classList.toggle('active');
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                if (dropdownContent) {
                    dropdownContent.classList.toggle('show');
                    console.log('Communities dropdown toggled via direct touch');
                }
            }
        }, {passive: false});
    }

    // Handle touch events for closing dropdowns
    document.addEventListener('touchstart', function(event) {
        // Only close dropdowns if not touching inside a dropdown or the Communities link
        if (!event.target.closest('.dropdown') && event.target !== communitiesLink) {
            document.querySelectorAll('.dropdown-content.show').forEach(openDropdown => {
                openDropdown.classList.remove('show');
            });
            document.querySelectorAll('.dropdown.active').forEach(activeDropdown => {
                activeDropdown.classList.remove('active');
            });
        }
    }, {passive: true});
});
