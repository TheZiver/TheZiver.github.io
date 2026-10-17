"use strict";
(function () {
    const DATA_URL = "https://gist.githubusercontent.com/TheZiver/9fdd3f8c495098ffa0beceece373d382/raw";
    const FALLBACK = 'images/fish_known.png';
    const CACHE_TTL = 30 * 60 * 1000;
    const CONSENT_KEY = 'aquarium-fish-consent';
    let fish = [];
    let animId = null;
    let cache = null;
    let cacheTime = 0;
    function rand(max) { return Math.random() * max; }
    function status(tags) {
        if (!tags || !Array.isArray(tags))
            return 'FISH_KNOWN';
        if (tags.includes('FISH_VERIFIED'))
            return 'FISH_VERIFIED';
        if (tags.includes('FISH_CERTIFIED'))
            return 'FISH_CERTIFIED';
        if (tags.includes('FISH'))
            return 'FISH';
        if (tags.includes('SYSTEM'))
            return 'SYSTEM';
        return 'FISH_KNOWN';
    }
    function size(s) {
        if (s === 'FISH_VERIFIED' || s === 'SYSTEM')
            return 'size-large';
        if (s === 'FISH_CERTIFIED')
            return 'size-medium';
        return 'size-small';
    }
    async function fetchGroups() {
        const now = Date.now();
        if (cache && cache.length && now - cacheTime < CACHE_TTL)
            return cache;
        try {
            const r = await fetch(DATA_URL);
            const d = await r.json();
            cache = d.community_groups || [];
            cacheTime = now;
            return cache;
        }
        catch {
            return [];
        }
    }
    async function spawn(container) {
        container.innerHTML = '';
        fish = [];
        const groups = await fetchGroups();
        if (!groups.length)
            return;
        const sw = window.innerWidth, sh = window.innerHeight;
        const cols = Math.ceil(Math.sqrt(groups.length * (sw / sh)));
        const cw = sw / cols, ch = sh / Math.ceil(groups.length / cols);
        groups.forEach(function (g, i) {
            if (!g.icon_url)
                return;
            const el = document.createElement('img');
            el.className = 'swimming-image';
            el.alt = '＜＞＜';
            el.src = g.icon_url;
            el.onerror = function () { this.src = FALLBACK; this.onerror = null; };
            const s = status(g.tags);
            el.classList.add(size(s));
            el.classList.add('status-' + s.toLowerCase());
            const px = (i % cols) * cw + rand(cw * 0.7);
            const py = Math.floor(i / cols) * ch + rand(ch * 0.7);
            el.dataset.x = px.toString();
            el.dataset.y = py.toString();
            el.dataset.sx = (0.3 + rand(0.4)).toFixed(2);
            el.dataset.sy = (0.2 + rand(0.3)).toFixed(2);
            el.dataset.dx = (rand(1) > 0.5 ? 1 : -1).toString();
            el.dataset.dy = (rand(1) > 0.5 ? 1 : -1).toString();
            el.dataset.wo = (i * 1.5 + rand(5)).toString();
            el.style.transform = 'translate3d(' + px + 'px, ' + py + 'px, 0)';
            container.appendChild(el);
            fish.push(el);
        });
        // Measure once after appending instead of every animation frame.
        fish.forEach(function (el) {
            el.dataset.w = (el.offsetWidth || 60).toString();
            el.dataset.h = (el.offsetHeight || 60).toString();
        });
    }
    function tick() {
        if (!fish.length) {
            animId = null;
            return;
        }
        if (document.hidden) {
            if (animId !== null) {
                cancelAnimationFrame(animId);
            }
            animId = null;
            return;
        }
        const t = Date.now() / 1000;
        const sw = window.innerWidth, sh = window.innerHeight;
        for (let i = 0; i < fish.length; i++) {
            const el = fish[i];
            const w = parseFloat(el.dataset.w || '60');
            const h = parseFloat(el.dataset.h || '60');
            let x = parseFloat(el.dataset.x || '0');
            let y = parseFloat(el.dataset.y || '0');
            const sx = parseFloat(el.dataset.sx || '0.5');
            const sy = parseFloat(el.dataset.sy || '0.3');
            let dx = parseFloat(el.dataset.dx || '1');
            let dy = parseFloat(el.dataset.dy || '1');
            const wo = parseFloat(el.dataset.wo || '0');
            x += dx * sx + (dx * Math.sin((t + wo + 2) * 0.5) * 0.2);
            y += dy * sy + (Math.sin((t + wo) * 0.3) * 1.0);
            // Wrap only in the direction of travel and land exactly on the far
            // edge, so the same wrap can't re-trigger next frame. The old ±10
            // margin made a fish bounce between both edges every frame, which
            // re-rolled y each time -> visible "shaking" at the screen edge.
            if (dx > 0 && x > sw) {
                x = -w;
                y += rand(40) - 20;
            }
            else if (dx < 0 && x < -w) {
                x = sw;
                y += rand(40) - 20;
            }
            // Aim the fish inward on contact instead of just flipping dy, so the
            // sine term can't make it flip-flop while pinned to the top/bottom.
            if (y < 0) {
                y = 0;
                dy = 1;
            }
            else if (y > sh - h) {
                y = sh - h;
                dy = -1;
            }
            if (rand(1) < 0.001)
                dx *= -1;
            if (rand(1) < 0.001)
                dy *= -1;
            el.dataset.x = x.toString();
            el.dataset.y = y.toString();
            el.dataset.dx = dx.toString();
            el.dataset.dy = dy.toString();
            el.style.transform = 'translate3d(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px, 0) scaleX(' + (dx > 0 ? '1' : '-1') + ') rotate(' + (Math.sin(t + wo) * 3).toFixed(2) + 'deg)';
        }
        animId = requestAnimationFrame(tick);
    }
    function getContainer() {
        let c = document.getElementById('swimming-images-background');
        if (!c) {
            c = document.createElement('div');
            c.id = 'swimming-images-background';
            c.className = 'swimming-images-container';
            const body = document.body;
            body.insertBefore(c, body.firstChild);
        }
        return c;
    }
    function start(container) {
        spawn(container).then(function () {
            if (animId !== null)
                cancelAnimationFrame(animId);
            tick();
        });
    }
    function hasConsent() {
        try {
            return window.sessionStorage.getItem(CONSENT_KEY) === '1';
        }
        catch {
            return false;
        }
    }
    function rememberConsent() {
        try {
            window.sessionStorage.setItem(CONSENT_KEY, '1');
        }
        catch { /* ignore */ }
    }
    // Mobile-only warning: the aquarium downloads a lot of image data.
    function showConsent() {
        return new Promise(function (resolve) {
            const overlay = document.createElement('div');
            overlay.className = 'fish-consent-overlay';
            overlay.innerHTML =
                '<div class="fish-consent-modal" role="dialog" aria-modal="true" aria-labelledby="fish-consent-title">' +
                    '<h2 id="fish-consent-title" class="fish-consent-title">⚠️WARNING⚠️</h2>' +
                    '<p class="fish-consent-text">The aquarium loads many images. It may use a lot of mobile data and lag.</p>' +
                    '<div class="fish-consent-actions">' +
                    '<button type="button" class="fish-consent-btn fish-consent-accept">Continue</button>' +
                    '<button type="button" class="fish-consent-btn fish-consent-decline">Not now</button>' +
                    '</div>' +
                    '</div>';
            document.body.appendChild(overlay);
            document.body.classList.add('fish-consent-open');
            const accept = overlay.querySelector('.fish-consent-accept');
            const decline = overlay.querySelector('.fish-consent-decline');
            function close(result) {
                overlay.remove();
                document.body.classList.remove('fish-consent-open');
                resolve(result);
            }
            if (accept) {
                accept.addEventListener('click', function () { close(true); });
                accept.focus();
            }
            if (decline)
                decline.addEventListener('click', function () { close(false); });
        });
    }
    function showLoadButton(onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fish-load-button';
        btn.textContent = 'Load the fish';
        btn.addEventListener('click', function () {
            btn.remove();
            onClick();
        });
        document.body.appendChild(btn);
    }
    function init() {
        const mobile = window.innerWidth <= 768;
        // Detect via the body class (URL may be "/aquarium" without ".html").
        const aquarium = document.body.classList.contains('theme-aquarium');
        if (mobile && !aquarium)
            return;
        const c = getContainer();
        // Mobile: ask before downloading the (heavy) fish images, and remember
        // the answer so the warning only shows once.
        if (mobile) {
            if (hasConsent()) {
                start(c);
                return;
            }
            showConsent().then(function (accepted) {
                if (accepted) {
                    rememberConsent();
                    start(c);
                }
                else {
                    showLoadButton(function () {
                        rememberConsent();
                        start(c);
                    });
                }
            });
            return;
        }
        start(c);
    }
    function stopAnimation() {
        if (animId !== null) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        fish = [];
    }
    document.addEventListener('DOMContentLoaded', init);
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            if (animId !== null) {
                cancelAnimationFrame(animId);
                animId = null;
            }
        }
        else if (fish.length && animId === null) {
            tick();
        }
    });
    window.addEventListener('pagehide', function () {
        if (animId !== null) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    });
    window.addEventListener('pageshow', function (e) {
        if (e.persisted && fish.length && animId === null) {
            tick();
        }
    });
    window.addEventListener('beforeunload', function () {
        if (animId !== null) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    });
    window.__fishAnimation = {
        get isAnimating() { return animId !== null; },
        get fishCount() { return fish.length; },
        stop: stopAnimation
    };
})();
