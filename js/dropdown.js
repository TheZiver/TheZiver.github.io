/**
 * Dropdown menu functionality for mobile and desktop
 * - Allows navigation to Communities page when clicking the Communities tab
 * - Opens dropdown only when clicking the dropdown toggle button
 * - Works on both mobile and desktop devices
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.main-nav a');

    // Get the Communities link specifically
    const communitiesLink = document.querySelector('.main-nav a[href="communities.html"]');

    // Get the Communities dropdown toggle button
    const communitiesToggle = document.querySelector('.dropdown-toggle');

    // Check if we're on mobile
    const isMobile = window.innerWidth <= 767;

    // Check if we're on the aquarium page
    const isAquariumPage = window.location.pathname.includes('aquarium.html');

    // Skip dropdown functionality if we're on the aquarium page
    if (isAquariumPage) {
        console.log('Aquarium page detected - dropdown functionality disabled');
        return;
    }

    // Add a mobile-specific button for the dropdown if on mobile
    if (isMobile) {
        // For all dropdown menus, not just Communities
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            const link = dropdown.querySelector('a');
            if (!link) return;

            // Create a mobile-specific button
            const mobileButton = document.createElement('span');
            mobileButton.className = 'mobile-dropdown-toggle';
            mobileButton.textContent = '▼';
            mobileButton.setAttribute('aria-label', 'Toggle dropdown menu');
            mobileButton.style.padding = '8px';
            mobileButton.style.marginLeft = '5px';

            // Insert the button after the link
            link.parentNode.insertBefore(mobileButton, link.nextSibling);

            // Add click handler to the mobile button
            mobileButton.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();

                // Toggle dropdown visibility
                dropdown.classList.toggle('active');
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                if (dropdownContent) {
                    dropdownContent.classList.toggle('show');
                    console.log('Dropdown toggled via mobile button');
                }
            });

            // Add touch handler to the mobile button
            mobileButton.addEventListener('touchstart', function(event) {
                event.preventDefault();
                event.stopPropagation();

                // Toggle dropdown visibility
                dropdown.classList.toggle('active');
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                if (dropdownContent) {
                    dropdownContent.classList.toggle('show');
                    console.log('Dropdown toggled via mobile button touch');
                }
            }, {passive: false});
        });
    }

    // Add a dropdown toggle button to each dropdown menu
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const link = dropdown.querySelector('a');
        if (!link) return;

        // Create the toggle button if it doesn't exist
        if (!dropdown.querySelector('.dropdown-toggle')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'dropdown-toggle';
            toggleBtn.innerHTML = '▼';
            toggleBtn.setAttribute('aria-label', 'Toggle dropdown menu');
            toggleBtn.setAttribute('type', 'button');

            // Insert the toggle button after the link
            dropdown.insertBefore(toggleBtn, link.nextSibling);
        }
    });

    // Update the Communities toggle button reference
    const communitiesToggle = document.querySelector('.dropdown:has(a[href="communities.html"]) .dropdown-toggle');

    // Add a specific touch handler for mobile toggle button
    if (communitiesToggle) {
        communitiesToggle.addEventListener('touchend', function(event) {
            // Prevent default to avoid navigation
            event.preventDefault();

            // Find the dropdown parent
            const dropdown = communitiesToggle.closest('.dropdown');
            if (dropdown) {
                // Check if dropdown is already active
                const isActive = dropdown.classList.contains('active');

                // Toggle this dropdown
                dropdown.classList.toggle('active');
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                if (dropdownContent) {
                    dropdownContent.classList.toggle('show');
                    console.log('Communities dropdown toggled via toggle touchend, was ' + (isActive ? 'open' : 'closed'));
                }
            }
        }, {passive: false});
    }

    // Prevent navigation to current page for all links
    // This is the main handler that prevents clicking on the current page link
    document.addEventListener('click', function(event) {
        // Check if the clicked element is a link
        let target = event.target;

        // If we clicked on something inside a link (like an icon), find the parent link
        while (target && target !== document && target.tagName !== 'A') {
            target = target.parentNode;
        }

        // If we found a link and it has the active class, prevent navigation
        if (target && target.tagName === 'A' && target.classList.contains('active')) {
            event.preventDefault();
            console.log('Prevented navigation to current page');

            // If it's a dropdown link, toggle the dropdown
            const dropdown = target.closest('.dropdown');
            if (dropdown) {
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                if (dropdownContent) {
                    dropdown.classList.toggle('active');
                    dropdownContent.classList.toggle('show');
                }
            }
        }
    }, true); // Use capture phase to ensure this runs before other handlers

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

    // Get all dropdown toggle buttons
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    // Add click event listener to each dropdown toggle button
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            // Always prevent default for toggle buttons
            event.preventDefault();

            // Get the parent dropdown
            const dropdown = toggle.closest('.dropdown');
            toggleDropdown(dropdown);

            // Log for debugging
            console.log('Dropdown toggled via toggle button');
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

    // Add specific touch handler for the dropdown toggle button on mobile
    if (communitiesToggle) {
        communitiesToggle.addEventListener('touchstart', function(event) {
            // Always prevent default for touch on toggle button
            event.preventDefault();
            event.stopPropagation();

            // Find the dropdown parent
            const dropdown = communitiesToggle.closest('.dropdown');
            if (dropdown) {
                // Toggle dropdown visibility
                dropdown.classList.toggle('active');
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                if (dropdownContent) {
                    dropdownContent.classList.toggle('show');
                    console.log('Communities dropdown toggled via toggle button touch');
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
