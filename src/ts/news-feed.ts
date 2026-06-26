(function() {
    const FEED_URL: string = 'https://gist.githubusercontent.com/TheZiver/c526bbcc9a1cdd8892186268a4c6b244/raw/359a85e964d670d2ff05a3b0194893c11f1682f7/fish_news_feed.json';

    function escapeHtml(unsafe: unknown): string {
        if (typeof unsafe !== 'string') return String(unsafe ?? '');
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function isValidUrl(str: unknown): str is string {
        return typeof str === 'string' && /^https?:\/\/[^\s"]+$/i.test(str);
    }

    function isValidVideoId(id: unknown): id is string {
        return typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id);
    }

    function timeAgo(dateString: string): string {
        const date: Date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const now: Date = new Date();
        const seconds: number = Math.floor((now.getTime() - date.getTime()) / 1000);
        const years: number = Math.floor(seconds / 31536000);
        if (years >= 1) return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        const days: number = Math.floor(seconds / 86400);
        if (days >= 2) return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (days === 1) return '1d';
        const hours: number = Math.floor(seconds / 3600);
        if (hours >= 1) return hours + 'h';
        const minutes: number = Math.floor(seconds / 60);
        if (minutes >= 1) return minutes + 'm';
        return 'Just now';
    }

    function appendMedia(container: HTMLElement, media: NewsFeedMedia[] | undefined, tweetUrl?: string): void {
        if (!Array.isArray(media)) return;
        for (let i: number = 0; i < media.length; i++) {
            const m: NewsFeedMedia = media[i];
            if (!m || !m.url || !isValidUrl(m.url)) continue;
            if (m.type === 'image') {
                const img: HTMLImageElement = document.createElement('img');
                img.src = m.url.replace(/&amp;/g, '&');
                img.alt = 'Media';
                img.style.cssText = 'max-width:100%;height:auto;border-radius:12px;margin-top:12px;display:block';
                container.appendChild(document.createElement('br'));
                container.appendChild(img);
            } else if (m.type === 'video') {
                const video: HTMLVideoElement = document.createElement('video');
                video.controls = true;
                video.playsInline = true;
                video.preload = 'metadata';
                video.style.cssText = 'max-width:100%;height:auto;border-radius:12px;margin-top:12px;display:block';
                const source: HTMLSourceElement = document.createElement('source');
                source.src = m.url.replace(/&amp;/g, '&');
                video.appendChild(source);
                const fallback: HTMLParagraphElement = document.createElement('p');
                fallback.style.cssText = 'color:#ff6b6b;font-size:0.85em;margin-top:8px';
                fallback.style.display = 'none';
                if (tweetUrl && isValidUrl(tweetUrl)) {
                    const link: HTMLAnchorElement = document.createElement('a');
                    link.href = tweetUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.textContent = 'View on X';
                    link.style.cssText = 'color:#1d9bf0;text-decoration:underline';
                    fallback.appendChild(document.createTextNode('Video blocked. '));
                    fallback.appendChild(link);
                } else {
                    fallback.textContent = 'Video couldn\'t be loaded.';
                }
                video.appendChild(fallback);
                video.onerror = function() {
                    fallback.style.display = 'block';
                    const statusMatch: RegExpMatchArray | null = tweetUrl ? tweetUrl.match(/\/status\/(\d+)/) : null;
                    if (statusMatch) {
                        const iframe: HTMLIFrameElement = document.createElement('iframe');
                        iframe.src = 'https://platform.twitter.com/embed/Tweet.html?id=' + statusMatch[1];
                        iframe.style.cssText = 'width:100%;max-width:550px;border:none;border-radius:12px;margin-top:12px;height:500px';
                        iframe.setAttribute('scrolling', 'no');
                        iframe.setAttribute('frameborder', '0');
                        iframe.setAttribute('allowfullscreen', '');
                        video.parentNode?.insertBefore(iframe, video.nextSibling);
                    }
                };
                container.appendChild(document.createElement('br'));
                container.appendChild(video);
            }
        }
    }

    function appendYouTubeEmbeds(container: HTMLElement, html: string): void {
        const youtubeRegex: RegExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
        let match: RegExpExecArray | null;
        const seen: Record<string, boolean> = {};
        while ((match = youtubeRegex.exec(html)) !== null) {
            const videoId: string = match[1];
            if (!seen[videoId] && isValidVideoId(videoId)) {
                seen[videoId] = true;
                const wrapper: HTMLDivElement = document.createElement('div');
                wrapper.className = 'video-container';
                const iframe: HTMLIFrameElement = document.createElement('iframe');
                iframe.src = 'https://www.youtube.com/embed/' + videoId;
                iframe.title = 'YouTube video player';
                iframe.setAttribute('allowfullscreen', '');
                wrapper.appendChild(iframe);
                container.appendChild(wrapper);
            }
        }
    }

    function linkify(element: HTMLElement): void {
        const walker: TreeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
        const nodes: Text[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) {
                nodes.push(node as Text);
            }
        }
        const urlRegex: RegExp = /(https?:\/\/[^\s]+)/g;
        for (let i: number = 0; i < nodes.length; i++) {
            const textNode: Text = nodes[i];
            const parent: Node | null = textNode.parentNode;
            if (!parent) continue;
            const parentEl: HTMLElement | null = parent.parentElement;
            if (parentEl && (parentEl.closest('a') || parentEl.tagName === 'SCRIPT' || parentEl.tagName === 'STYLE')) continue;
            const text: string | null = textNode.nodeValue;
            if (text === null) continue;
            if (!urlRegex.test(text)) { urlRegex.lastIndex = 0; continue; }
            const frag: DocumentFragment = document.createDocumentFragment();
            let lastIndex: number = 0;
            let m: RegExpExecArray | null;
            urlRegex.lastIndex = 0;
            while ((m = urlRegex.exec(text)) !== null) {
                let url: string = m[0];
                while (url.length > 0 && /[.,;!\])]/.test(url.charAt(url.length - 1))) {
                    url = url.slice(0, -1);
                }
                const pre: string = text.substring(lastIndex, m.index);
                if (pre) frag.appendChild(document.createTextNode(pre));
                const a: HTMLAnchorElement = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = url;
                a.onclick = function(e: MouseEvent) { e.stopPropagation(); };
                frag.appendChild(a);
                lastIndex = m.index + m[0].length;
            }
            const rest: string = text.substring(lastIndex);
            if (rest) frag.appendChild(document.createTextNode(rest));
            parent.replaceChild(frag, textNode);
        }
    }

    interface TweetData {
        displayName: string;
        handle: string;
        avatar: string;
        dateObj: Date;
        contentHtml: string;
        media: NewsFeedMedia[];
        link: string;
    }

    function renderTweets(tweets: TweetData[]): void {
        const container: HTMLElement | null = document.getElementById('feed');
        if (!container) return;
        const loading: HTMLElement | null = document.getElementById('loading');
        if (loading && loading.parentNode) {
            loading.parentNode.removeChild(loading);
        }
        for (let i: number = 0; i < tweets.length; i++) {
            const tweet: TweetData = tweets[i];
            const timeString: string = timeAgo(tweet.dateObj.toISOString());

            const article: HTMLElement = document.createElement('article');
            article.className = 'tweet';
            article.style.cursor = 'pointer';
            article.onclick = (function(t: TweetData) {
                return function(this: GlobalEventHandlers, e: Event) {
                    const target: EventTarget | null = e.target;
                    if (target && ((target as HTMLElement).closest('a') || (target as HTMLElement).tagName === 'IFRAME' || (target as HTMLElement).tagName === 'VIDEO')) {
                        e.stopPropagation();
                        return;
                    }
                    if (t.link) { window.open(t.link, '_blank'); }
                };
            })(tweet) as ((this: GlobalEventHandlers, ev: PointerEvent) => any);

            const avatarCol: HTMLDivElement = document.createElement('div');
            avatarCol.className = 'avatar-col';

            const avatarImg: HTMLImageElement = document.createElement('img');
            const DEFAULT_AVATAR: string = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23333%22/%3E%3Ccircle cx=%2250%22 cy=%2238%22 r=%2218%22 fill=%22%23666%22/%3E%3Cellipse cx=%2250%22 cy=%2282%22 rx=%2232%22 ry=%2222%22 fill=%22%23666%22/%3E%3C/svg%3E';
            avatarImg.src = isValidUrl(tweet.avatar) ? tweet.avatar : DEFAULT_AVATAR;
            avatarImg.alt = tweet.displayName;
            avatarImg.className = 'avatar';
            avatarImg.onerror = function(this: HTMLImageElement) { this.onerror = null; this.src = DEFAULT_AVATAR; };
            avatarCol.appendChild(avatarImg);

            const contentCol: HTMLDivElement = document.createElement('div');
            contentCol.className = 'content-col';

            const header: HTMLDivElement = document.createElement('div');
            header.className = 'tweet-header';

            const nameSpan: HTMLSpanElement = document.createElement('span');
            nameSpan.className = 'display-name';
            nameSpan.textContent = tweet.displayName;
            header.appendChild(nameSpan);

            const handleSpan: HTMLSpanElement = document.createElement('span');
            handleSpan.className = 'handle';
            handleSpan.textContent = tweet.handle;
            header.appendChild(handleSpan);

            const dotSpan: HTMLSpanElement = document.createElement('span');
            dotSpan.className = 'dot';
            dotSpan.textContent = '\u00B7';
            header.appendChild(dotSpan);

            const timeSpan: HTMLSpanElement = document.createElement('span');
            timeSpan.className = 'time';
            timeSpan.textContent = timeString;
            header.appendChild(timeSpan);

            contentCol.appendChild(header);

            const tweetText: HTMLDivElement = document.createElement('div');
            tweetText.className = 'tweet-text';

            const contentDiv: HTMLDivElement = document.createElement('div');
            contentDiv.className = 'tweet-content-html';
            if (tweet.contentHtml) {
                contentDiv.innerHTML = tweet.contentHtml;
            }
            appendYouTubeEmbeds(contentDiv, tweet.contentHtml);
            appendMedia(contentDiv, tweet.media, tweet.link);
            linkify(contentDiv);

            tweetText.appendChild(contentDiv);
            contentCol.appendChild(tweetText);

            article.appendChild(avatarCol);
            article.appendChild(contentCol);
            container.appendChild(article);
        }
    }

    async function fetchAndRenderFeed(): Promise<void> {
        try {
            const response: Response = await fetch(FEED_URL, { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to fetch feed');
            const data: NewsFeedData = await response.json() as NewsFeedData;
            const accountDefaults: Record<string, string> = {
                TheRoseFish: 'https://pbs.twimg.com/profile_images/1988644928881127424/ql-Ds2HI.jpg',
                TheZiver: 'https://pbs.twimg.com/profile_images/1764321982638632960/8DuUQtQP.jpg',
                RandumUwU: 'https://pbs.twimg.com/profile_images/1919424934293692416/MPA6JH94.jpg'
            };
            const allTweets: TweetData[] = [];
            if (data && Array.isArray(data.items)) {
                for (let i: number = 0; i < data.items.length; i++) {
                    const item: NewsFeedItem = data.items[i];
                    const displayName: string = item.author || 'TheRoseFish';
                    const handle: string = '@' + displayName;
                    let avatarUrl: string = accountDefaults[displayName] || '';
                    if (!avatarUrl && item.author_avatar) {
                        avatarUrl = isValidUrl(item.author_avatar) ? item.author_avatar : '';
                    }
                    if (!avatarUrl) {
                        avatarUrl = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23333%22/%3E%3Ccircle cx=%2250%22 cy=%2238%22 r=%2218%22 fill=%22%23666%22/%3E%3Cellipse cx=%2250%22 cy=%2282%22 rx=%2232%22 ry=%2222%22 fill=%22%23666%22/%3E%3C/svg%3E';
                    }
                    allTweets.push({
                        displayName: displayName,
                        handle: handle,
                        avatar: avatarUrl,
                        dateObj: new Date(item.date),
                        contentHtml: item.html_content || '',
                        media: Array.isArray(item.media) ? item.media : [],
                        link: item.url || ''
                    });
                }
            }
            allTweets.sort(function(a: TweetData, b: TweetData) { return b.dateObj.getTime() - a.dateObj.getTime(); });
            renderTweets(allTweets);
        } catch (err: unknown) {
            const loading: HTMLElement | null = document.getElementById('loading');
            if (loading) {
                loading.textContent = '';
                const p: HTMLParagraphElement = document.createElement('p');
                p.style.cssText = 'color:#ff6b6b;text-align:center';
                const msg: string = err instanceof Error ? err.message : String(err);
                p.textContent = 'Error loading feed: ' + msg;
                loading.appendChild(p);
            }
            console.error(err);
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        fetchAndRenderFeed();
    });
})();