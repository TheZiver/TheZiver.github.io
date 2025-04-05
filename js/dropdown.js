/**
 * Dropdown menu functionality for mobile devices
 * Prevents navigation when clicking the dropdown toggle
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get all dropdown toggle links
    const dropdownToggles = document.querySelectorAll('.dropdown > a');
    
    // Add click event listener to each dropdown toggle
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            // Check if we're on mobile (using a simple width check)
            if (window.innerWidth <= 767) {
                // Prevent the default navigation
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
