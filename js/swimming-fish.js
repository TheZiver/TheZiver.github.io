"use strict";
(function () {
    const DATA_URL = "https://gist.githubusercontent.com/TheZiver/9fdd3f8c495098ffa0beceece373d382/raw";
    const FALLBACK = 'images/fish_known.png';
    const CACHE_TTL = 30 * 60 * 1000;
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
            cache = (d.community_groups || []).slice(0, 100);
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
            el.style.left = ((i % cols) * cw + rand(cw * 0.7)) + 'px';
            el.style.top = (Math.floor(i / cols) * ch + rand(ch * 0.7)) + 'px';
            el.dataset.sx = (0.3 + rand(0.4)).toFixed(2);
            el.dataset.sy = (0.2 + rand(0.3)).toFixed(2);
            el.dataset.dx = (rand(1) > 0.5 ? 1 : -1).toString();
            el.dataset.dy = (rand(1) > 0.5 ? 1 : -1).toString();
            el.dataset.wo = (i * 1.5 + rand(5)).toString();
            container.appendChild(el);
            fish.push(el);
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
        const dims = fish.map(function (el) {
            return { w: el.offsetWidth || 60, h: el.offsetHeight || 60 };
        });
        for (let i = 0; i < fish.length; i++) {
            const el = fish[i];
            const d = dims[i];
            const w = d.w, h = d.h;
            let x = parseFloat(el.style.left) || 0;
            let y = parseFloat(el.style.top) || 0;
            const sx = parseFloat(el.dataset.sx || '0.5');
            const sy = parseFloat(el.dataset.sy || '0.3');
            let dx = parseFloat(el.dataset.dx || '1');
            let dy = parseFloat(el.dataset.dy || '1');
            const wo = parseFloat(el.dataset.wo || '0');
            x += dx * sx + (dx * Math.sin((t + wo + 2) * 0.5) * 0.2);
            y += dy * sy + (Math.sin((t + wo) * 0.3) * 1.0);
            if (x < -w) {
                x = sw + 10;
                y += rand(40) - 20;
            }
            if (x > sw + 10) {
                x = -w - 10;
                y += rand(40) - 20;
            }
            if (y < 0) {
                y = 0;
                dy *= -1;
            }
            if (y > sh - h) {
                y = sh - h;
                dy *= -1;
            }
            if (rand(1) < 0.001)
                dx *= -1;
            if (rand(1) < 0.001)
                dy *= -1;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.dataset.dx = dx.toString();
            el.dataset.dy = dy.toString();
            el.style.transform = 'scaleX(' + (dx > 0 ? '1' : '-1') + ') rotate(' + (Math.sin(t + wo) * 3) + 'deg)';
        }
        animId = requestAnimationFrame(tick);
    }
    function init() {
        const mobile = window.innerWidth <= 768;
        const aquarium = window.location.pathname.includes('aquarium.html');
        if (mobile && !aquarium)
            return;
        let c = document.getElementById('swimming-images-background');
        if (!c) {
            c = document.createElement('div');
            c.id = 'swimming-images-background';
            c.className = 'swimming-images-container';
            const body = document.body;
            body.insertBefore(c, body.firstChild);
        }
        spawn(c).then(function () {
            if (animId !== null)
                cancelAnimationFrame(animId);
            tick();
        });
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
