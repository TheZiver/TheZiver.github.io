(function() {
    const rawPath: string = window.location.pathname.replace(/\/$/, '') || '/';
    const currentPath: string = rawPath.replace(/\.html$/, '');

    const nav: HTMLElement | null = document.querySelector('nav.main-nav');
    if (!nav) return;

    const links: NodeListOf<HTMLAnchorElement> = nav.querySelectorAll('a');
    links.forEach(function(link: HTMLAnchorElement) {
        const linkPath: string = new URL(link.href).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/';
        if (linkPath === currentPath) {
            link.addEventListener('click', function(event: MouseEvent) {
                event.preventDefault();
            });
        }
    });
})();