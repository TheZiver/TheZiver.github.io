/**
 * Back to Top button functionality
 * - Shows a button when user scrolls down
 * - Scrolls back to top when clicked
 * - Only appears on mobile devices
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create the back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.innerHTML = '▲';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    backToTopBtn.setAttribute('title', 'Back to top');
    document.body.appendChild(backToTopBtn);

    // Show/hide the button based on scroll position
    window.addEventListener('scroll', function() {
        // Only show after scrolling down 300px
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top when clicked
    backToTopBtn.addEventListener('click', function() {
        // Smooth scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
