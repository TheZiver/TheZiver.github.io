"use strict";
(function () {
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const nav = document.querySelector('nav.desktop-nav, nav.mobile-nav');
    if (!nav)
        return;
    const links = nav.querySelectorAll('a');
    links.forEach(function (link) {
        const linkPath = new URL(link.href).pathname.replace(/\/$/, '') || '/';
        if (linkPath === currentPath) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
            });
        }
    });
})();
