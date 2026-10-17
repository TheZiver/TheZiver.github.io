(function() {
    const DATA_URL: string = "https://gist.githubusercontent.com/TheZiver/9fdd3f8c495098ffa0beceece373d382/raw";
    const FALLBACK: string = 'images/fish_known.png';
    const CACHE_TTL: number = 30 * 60 * 1000;
    const CONSENT_KEY: string = 'aquarium-fish-consent';

    let fish: HTMLImageElement[] = [];
    let animId: number | null = null;
    let cache: CommunityGroup[] | null = null;
    let cacheTime: number = 0;

    function rand(max: number): number { return Math.random() * max; }

    function status(tags?: string[]): FishStatus {
        if (!tags || !Array.isArray(tags)) return 'FISH_KNOWN';
        if (tags.includes('FISH_VERIFIED')) return 'FISH_VERIFIED';
        if (tags.includes('FISH_CERTIFIED')) return 'FISH_CERTIFIED';
        if (tags.includes('FISH')) return 'FISH';
        if (tags.includes('SYSTEM')) return 'SYSTEM';
        return 'FISH_KNOWN';
    }

    function size(s: FishStatus): string {
        if (s === 'FISH_VERIFIED' || s === 'SYSTEM') return 'size-large';
        if (s === 'FISH_CERTIFIED') return 'size-medium';
        return 'size-small';
    }

    async function fetchGroups(): Promise<CommunityGroup[]> {
        const now: number = Date.now();
        if (cache && cache.length && now - cacheTime < CACHE_TTL) return cache;
        try {
            const r: Response = await fetch(DATA_URL);
            const d: CommunityGroupsResponse = await r.json() as CommunityGroupsResponse;
            cache = d.community_groups || [];
            cacheTime = now;
            return cache;
        } catch {
            return [];
        }
    }

    async function spawn(container: HTMLElement): Promise<void> {
        container.innerHTML = '';
        fish = [];
        const groups: CommunityGroup[] = await fetchGroups();
        if (!groups.length) return;

        const sw: number = window.innerWidth, sh: number = window.innerHeight;
        const cols: number = Math.ceil(Math.sqrt(groups.length * (sw / sh)));
        const cw: number = sw / cols, ch: number = sh / Math.ceil(groups.length / cols);

        groups.forEach(function(g: CommunityGroup, i: number) {
            if (!g.icon_url) return;
            const el: HTMLImageElement = document.createElement('img');
            el.className = 'swimming-image';
            el.alt = '＜＞＜';
            el.src = g.icon_url;
            el.onerror = function(this: HTMLImageElement) { this.src = FALLBACK; this.onerror = null; };

            const s: FishStatus = status(g.tags);
            el.classList.add(size(s));
            el.classList.add('status-' + s.toLowerCase());

            const px: number = (i % cols) * cw + rand(cw * 0.7);
            const py: number = Math.floor(i / cols) * ch + rand(ch * 0.7);
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
        fish.forEach(function(el: HTMLImageElement) {
            el.dataset.w = (el.offsetWidth || 60).toString();
            el.dataset.h = (el.offsetHeight || 60).toString();
        });
    }

    function tick(): void {
        if (!fish.length) { animId = null; return; }
        if (document.hidden) {
            if (animId !== null) { cancelAnimationFrame(animId); }
            animId = null;
            return;
        }

        const t: number = Date.now() / 1000;
        const sw: number = window.innerWidth, sh: number = window.innerHeight;

        for (let i: number = 0; i < fish.length; i++) {
            const el: HTMLImageElement = fish[i];
            const w: number = parseFloat(el.dataset.w || '60');
            const h: number = parseFloat(el.dataset.h || '60');

            let x: number = parseFloat(el.dataset.x || '0');
            let y: number = parseFloat(el.dataset.y || '0');
            const sx: number = parseFloat(el.dataset.sx || '0.5');
            const sy: number = parseFloat(el.dataset.sy || '0.3');
            let dx: number = parseFloat(el.dataset.dx || '1');
            let dy: number = parseFloat(el.dataset.dy || '1');
            const wo: number = parseFloat(el.dataset.wo || '0');

            x += dx * sx + (dx * Math.sin((t + wo + 2) * 0.5) * 0.2);
            y += dy * sy + (Math.sin((t + wo) * 0.3) * 1.0);

            // Wrap only in the direction of travel and land exactly on the far
            // edge, so the same wrap can't re-trigger next frame. The old ±10
            // margin made a fish bounce between both edges every frame, which
            // re-rolled y each time -> visible "shaking" at the screen edge.
            if (dx > 0 && x > sw) { x = -w; y += rand(40) - 20; }
            else if (dx < 0 && x < -w) { x = sw; y += rand(40) - 20; }

            // Aim the fish inward on contact instead of just flipping dy, so the
            // sine term can't make it flip-flop while pinned to the top/bottom.
            if (y < 0) { y = 0; dy = 1; }
            else if (y > sh - h) { y = sh - h; dy = -1; }
            if (rand(1) < 0.001) dx *= -1;
            if (rand(1) < 0.001) dy *= -1;

            el.dataset.x = x.toString();
            el.dataset.y = y.toString();
            el.dataset.dx = dx.toString();
            el.dataset.dy = dy.toString();
            el.style.transform = 'translate3d(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px, 0) scaleX(' + (dx > 0 ? '1' : '-1') + ') rotate(' + (Math.sin(t + wo) * 3).toFixed(2) + 'deg)';
        }

        animId = requestAnimationFrame(tick);
    }

    function getContainer(): HTMLElement {
        let c: HTMLElement | null = document.getElementById('swimming-images-background');
        if (!c) {
            c = document.createElement('div');
            c.id = 'swimming-images-background';
            c.className = 'swimming-images-container';
            const body: HTMLElement = document.body;
            body.insertBefore(c, body.firstChild);
        }
        return c;
    }

    function start(container: HTMLElement): void {
        spawn(container).then(function() {
            if (animId !== null) cancelAnimationFrame(animId);
            tick();
        });
    }

    function hasConsent(): boolean {
        try { return window.localStorage.getItem(CONSENT_KEY) === '1'; } catch { return false; }
    }

    function rememberConsent(): void {
        try { window.localStorage.setItem(CONSENT_KEY, '1'); } catch { /* ignore */ }
    }

    // Mobile-only warning: the aquarium downloads a lot of image data.
    function showConsent(): Promise<boolean> {
        return new Promise(function(resolve: (value: boolean) => void) {
            const overlay: HTMLDivElement = document.createElement('div');
            overlay.className = 'fish-consent-overlay';
            overlay.innerHTML =
                '<div class="fish-consent-modal" role="dialog" aria-modal="true" aria-labelledby="fish-consent-title">' +
                    '<h2 id="fish-consent-title" class="fish-consent-title">Heads up</h2>' +
                    '<p class="fish-consent-text">The aquarium loads many images. It may use a lot of mobile data and lag.</p>' +
                    '<div class="fish-consent-actions">' +
                        '<button type="button" class="fish-consent-btn fish-consent-accept">Continue</button>' +
                        '<button type="button" class="fish-consent-btn fish-consent-decline">Not now</button>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(overlay);
            document.body.classList.add('fish-consent-open');

            const accept: HTMLButtonElement | null = overlay.querySelector<HTMLButtonElement>('.fish-consent-accept');
            const decline: HTMLButtonElement | null = overlay.querySelector<HTMLButtonElement>('.fish-consent-decline');

            function close(result: boolean): void {
                overlay.remove();
                document.body.classList.remove('fish-consent-open');
                resolve(result);
            }

            if (accept) {
                accept.addEventListener('click', function() { close(true); });
                accept.focus();
            }
            if (decline) decline.addEventListener('click', function() { close(false); });
        });
    }

    function showLoadButton(onClick: () => void): void {
        const btn: HTMLButtonElement = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fish-load-button';
        btn.textContent = 'Load the fish';
        btn.addEventListener('click', function() {
            btn.remove();
            onClick();
        });
        document.body.appendChild(btn);
    }

    function init(): void {
        const mobile: boolean = window.innerWidth <= 768;
        // Detect via the body class (URL may be "/aquarium" without ".html").
        const aquarium: boolean = document.body.classList.contains('theme-aquarium');
        if (mobile && !aquarium) return;

        const c: HTMLElement = getContainer();

        // Mobile: ask before downloading the (heavy) fish images, and remember
        // the answer so the warning only shows once.
        if (mobile) {
            if (hasConsent()) {
                start(c);
                return;
            }
            showConsent().then(function(accepted: boolean) {
                if (accepted) {
                    rememberConsent();
                    start(c);
                } else {
                    showLoadButton(function() {
                        rememberConsent();
                        start(c);
                    });
                }
            });
            return;
        }

        start(c);
    }

    function stopAnimation(): void {
        if (animId !== null) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        fish = [];
    }

    document.addEventListener('DOMContentLoaded', init);
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            if (animId !== null) {
                cancelAnimationFrame(animId);
                animId = null;
            }
        } else if (fish.length && animId === null) {
            tick();
        }
    });
    window.addEventListener('pagehide', function() {
        if (animId !== null) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    });
    window.addEventListener('pageshow', function(e: PageTransitionEvent) {
        if (e.persisted && fish.length && animId === null) {
            tick();
        }
    });
    window.addEventListener('beforeunload', function() {
        if (animId !== null) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    });

    window.__fishAnimation = {
        get isAnimating(): boolean { return animId !== null; },
        get fishCount(): number { return fish.length; },
        stop: stopAnimation
    };
})();