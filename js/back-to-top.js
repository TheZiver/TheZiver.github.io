"use strict";
(function () {
    function init() {
        const btn = document.getElementById('back-to-top');
        if (!btn)
            return;
        const el = btn;
        function toggle() {
            if (window.scrollY > 300) {
                el.classList.add('show');
            }
            else {
                el.classList.remove('show');
            }
        }
        toggle();
        window.addEventListener('scroll', toggle, { passive: true });
        el.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    }
    else {
        init();
    }
})();
