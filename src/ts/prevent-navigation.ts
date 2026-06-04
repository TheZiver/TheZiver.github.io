(function() {
    const currentPath: string = window.location.pathname.replace(/\/$/, '') || '/';

    const nav: HTMLElement | null = document.querySelector('nav.desktop-nav, nav.mobile-nav');
    if (!nav) return;

    const links: NodeListOf<HTMLAnchorElement> = nav.querySelectorAll('a');
    links.forEach(function(link: HTMLAnchorElement) {
        const linkPath: string = new URL(link.href).pathname.replace(/\/$/, '') || '/';
        if (linkPath === currentPath) {
            link.addEventListener('click', function(event: MouseEvent) {
                event.preventDefault();
            });
        }
    });
})();