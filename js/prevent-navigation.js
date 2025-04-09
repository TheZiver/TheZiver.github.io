/**
 * Prevent Navigation to Current Page
 * - Prevents clicking on links to the current page
 * - Works with all navigation links
 * - Disables dropdown in aquarium page
 */
(function() {
    // Run when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we're on the aquarium page
        const isAquariumPage = window.location.pathname.includes('aquarium.html');

        // If we're on the aquarium page, disable the dropdown functionality
        if (isAquariumPage) {
            console.log('Aquarium page detected - disabling dropdown');
            // Remove the dropdown toggle button if it exists
            const dropdownToggle = document.querySelector('.dropdown-toggle');
            if (dropdownToggle) {
                dropdownToggle.remove();
            }

            // Prevent the dropdown from opening
            const dropdown = document.querySelector('.dropdown');
            if (dropdown) {
                // Remove event listeners by cloning and replacing the element
                const newDropdown = dropdown.cloneNode(true);
                dropdown.parentNode.replaceChild(newDropdown, dropdown);
            }
        }
        // Get the current page URL (without query parameters)
        const currentPath = window.location.pathname.split('?')[0];

        // Find all links in the document
        const allLinks = document.querySelectorAll('a');

        // Process each link
        allLinks.forEach(function(link) {
            // Get the link's href attribute
            const href = link.getAttribute('href');

            // Skip if no href or it's a hash link or javascript link
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
                return;
            }

            // Check if this link points to the current page
            if (href === currentPath ||
                currentPath.endsWith('/' + href) ||
                href === window.location.pathname) {

                // Add a special class to identify these links
                link.classList.add('current-page-link');

                // Add click event listener to prevent navigation
                link.addEventListener('click', function(event) {
                    // Prevent the default navigation
                    event.preventDefault();
                    console.log('Navigation to current page prevented');

                    // If it's in a dropdown, toggle the dropdown
                    const dropdown = link.closest('.dropdown');
                    if (dropdown) {
                        const dropdownContent = dropdown.querySelector('.dropdown-content');
                        if (dropdownContent) {
                            dropdown.classList.toggle('active');
                            dropdownContent.classList.toggle('show');
                        }
                    }
                });
            }
        });

        // Also handle dynamically added links
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        // Check if the added node is a link
                        if (node.tagName === 'A') {
                            processNewLink(node);
                        }

                        // Check for links inside the added node
                        if (node.querySelectorAll) {
                            const links = node.querySelectorAll('a');
                            links.forEach(processNewLink);
                        }
                    });
                }
            });
        });

        // Function to process newly added links
        function processNewLink(link) {
            const href = link.getAttribute('href');

            // Skip if no href or it's a hash link or javascript link
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
                return;
            }

            // Check if this link points to the current page
            if (href === currentPath ||
                currentPath.endsWith('/' + href) ||
                href === window.location.pathname) {

                // Add a special class to identify these links
                link.classList.add('current-page-link');

                // Add click event listener to prevent navigation
                link.addEventListener('click', function(event) {
                    // Prevent the default navigation
                    event.preventDefault();
                    console.log('Navigation to current page prevented (dynamic link)');

                    // If it's in a dropdown, toggle the dropdown
                    const dropdown = link.closest('.dropdown');
                    if (dropdown) {
                        const dropdownContent = dropdown.querySelector('.dropdown-content');
                        if (dropdownContent) {
                            dropdown.classList.toggle('active');
                            dropdownContent.classList.toggle('show');
                        }
                    }
                });
            }
        }

        // Start observing the document for added links
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
})();
