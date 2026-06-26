"use strict";
(function () {
    const rawPath = window.location.pathname.replace(/\/$/, '') || '/';
    const currentPath = rawPath.replace(/\.html$/, '');
    const nav = document.querySelector('nav.main-nav');
    if (!nav)
        return;
    const links = nav.querySelectorAll('a');
    links.forEach(function (link) {
        const linkPath = new URL(link.href).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/';
        if (linkPath === currentPath) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
            });
        }
    });
})();
