(function() {
    function init(): void {
        const btn = document.getElementById('back-to-top') as HTMLButtonElement | null;
        if (!btn) return;
        function toggle(): void {
            if (window.scrollY > 300) {
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
            }
        }
        toggle();
        window.addEventListener('scroll', toggle, { passive: true });
        btn.addEventListener('click', function(): void {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
