"use strict";
(function () {
    const FEED_URL = 'https://gist.githubusercontent.com/TheZiver/c526bbcc9a1cdd8892186268a4c6b244/raw/359a85e964d670d2ff05a3b0194893c11f1682f7/fish_news_feed.json';
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string')
            return String(unsafe ?? '');
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function isValidUrl(str) {
        return typeof str === 'string' && /^https?:\/\/[^\s"]+$/i.test(str);
    }
    function isValidVideoId(id) {
        return typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id);
    }
    function timeAgo(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime()))
            return '';
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        const years = Math.floor(seconds / 31536000);
        if (years >= 1)
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        const days = Math.floor(seconds / 86400);
        if (days >= 2)
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (days === 1)
            return '1d';
        const hours = Math.floor(seconds / 3600);
        if (hours >= 1)
            return hours + 'h';
        const minutes = Math.floor(seconds / 60);
        if (minutes >= 1)
            return minutes + 'm';
        return 'Just now';
    }
    function appendMedia(container, media) {
        if (!Array.isArray(media))
            return;
        for (let i = 0; i < media.length; i++) {
            const m = media[i];
            if (!m || !m.url || !isValidUrl(m.url))
                continue;
            if (m.type === 'image') {
                const img = document.createElement('img');
                img.src = m.url.replace(/&amp;/g, '&');
                img.alt = 'Media';
                img.style.cssText = 'max-width:100%;height:auto;border-radius:12px;margin-top:12px;display:block';
                container.appendChild(document.createElement('br'));
                container.appendChild(img);
            }
            else if (m.type === 'video') {
                const video = document.createElement('video');
                video.controls = true;
                video.playsInline = true;
                video.preload = 'metadata';
                video.style.cssText = 'max-width:100%;height:auto;border-radius:12px;margin-top:12px;display:block';
                const source = document.createElement('source');
                source.src = m.url.replace(/&amp;/g, '&');
                source.type = 'video/mp4';
                video.appendChild(source);
                video.appendChild(document.createTextNode('Your browser does not support the video tag.'));
                container.appendChild(document.createElement('br'));
                container.appendChild(video);
            }
        }
    }
    function appendYouTubeEmbeds(container, html) {
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
        let match;
        const seen = {};
        while ((match = youtubeRegex.exec(html)) !== null) {
            const videoId = match[1];
            if (!seen[videoId] && isValidVideoId(videoId)) {
                seen[videoId] = true;
                const wrapper = document.createElement('div');
                wrapper.className = 'video-container';
                const iframe = document.createElement('iframe');
                iframe.src = 'https://www.youtube.com/embed/' + videoId;
                iframe.title = 'YouTube video player';
                iframe.setAttribute('allowfullscreen', '');
                wrapper.appendChild(iframe);
                container.appendChild(wrapper);
            }
        }
    }
    function linkify(element) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
        const nodes = [];
        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) {
                nodes.push(node);
            }
        }
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        for (let i = 0; i < nodes.length; i++) {
            const textNode = nodes[i];
            const parent = textNode.parentNode;
            if (!parent)
                continue;
            const parentEl = parent.parentElement;
            if (parentEl && (parentEl.closest('a') || parentEl.tagName === 'SCRIPT' || parentEl.tagName === 'STYLE'))
                continue;
            const text = textNode.nodeValue;
            if (text === null)
                continue;
            if (!urlRegex.test(text)) {
                urlRegex.lastIndex = 0;
                continue;
            }
            const frag = document.createDocumentFragment();
            let lastIndex = 0;
            let m;
            urlRegex.lastIndex = 0;
            while ((m = urlRegex.exec(text)) !== null) {
                let url = m[0];
                while (url.length > 0 && /[.,;!\])]/.test(url.charAt(url.length - 1))) {
                    url = url.slice(0, -1);
                }
                const pre = text.substring(lastIndex, m.index);
                if (pre)
                    frag.appendChild(document.createTextNode(pre));
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = url;
                a.onclick = function (e) { e.stopPropagation(); };
                frag.appendChild(a);
                lastIndex = m.index + m[0].length;
            }
            const rest = text.substring(lastIndex);
            if (rest)
                frag.appendChild(document.createTextNode(rest));
            parent.replaceChild(frag, textNode);
        }
    }
    function renderTweets(tweets) {
        const container = document.getElementById('feed');
        if (!container)
            return;
        const loading = document.getElementById('loading');
        if (loading && loading.parentNode) {
            loading.parentNode.removeChild(loading);
        }
        for (let i = 0; i < tweets.length; i++) {
            const tweet = tweets[i];
            const timeString = timeAgo(tweet.dateObj.toISOString());
            const article = document.createElement('article');
            article.className = 'tweet';
            article.style.cursor = 'pointer';
            article.onclick = (function (t) {
                return function (e) {
                    const target = e.target;
                    if (target && (target.closest('a') || target.tagName === 'IFRAME' || target.tagName === 'VIDEO')) {
                        e.stopPropagation();
                        return;
                    }
                    if (t.link) {
                        window.open(t.link, '_blank');
                    }
                };
            })(tweet);
            const avatarCol = document.createElement('div');
            avatarCol.className = 'avatar-col';
            const avatarImg = document.createElement('img');
            avatarImg.src = isValidUrl(tweet.avatar) ? tweet.avatar : 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
            avatarImg.alt = tweet.displayName;
            avatarImg.className = 'avatar';
            avatarImg.onerror = function () { this.onerror = null; this.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'; };
            avatarCol.appendChild(avatarImg);
            const contentCol = document.createElement('div');
            contentCol.className = 'content-col';
            const header = document.createElement('div');
            header.className = 'tweet-header';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'display-name';
            nameSpan.textContent = tweet.displayName;
            header.appendChild(nameSpan);
            const handleSpan = document.createElement('span');
            handleSpan.className = 'handle';
            handleSpan.textContent = tweet.handle;
            header.appendChild(handleSpan);
            const dotSpan = document.createElement('span');
            dotSpan.className = 'dot';
            dotSpan.textContent = '\u00B7';
            header.appendChild(dotSpan);
            const timeSpan = document.createElement('span');
            timeSpan.className = 'time';
            timeSpan.textContent = timeString;
            header.appendChild(timeSpan);
            contentCol.appendChild(header);
            const tweetText = document.createElement('div');
            tweetText.className = 'tweet-text';
            const contentDiv = document.createElement('div');
            contentDiv.className = 'tweet-content-html';
            if (tweet.contentHtml) {
                contentDiv.innerHTML = tweet.contentHtml;
            }
            appendYouTubeEmbeds(contentDiv, tweet.contentHtml);
            appendMedia(contentDiv, tweet.media);
            linkify(contentDiv);
            tweetText.appendChild(contentDiv);
            contentCol.appendChild(tweetText);
            article.appendChild(avatarCol);
            article.appendChild(contentCol);
            container.appendChild(article);
        }
    }
    async function fetchAndRenderFeed() {
        try {
            const response = await fetch(FEED_URL, { cache: 'no-store' });
            if (!response.ok)
                throw new Error('Failed to fetch feed');
            const data = await response.json();
            const accountDefaults = {
                TheRoseFish: 'https://pbs.twimg.com/profile_images/1988644928881127424/ql-Ds2HI.jpg',
                TheZiver: 'https://pbs.twimg.com/profile_images/1764321982638632960/8DuUQtQP.jpg',
                RandumUwU: 'https://pbs.twimg.com/profile_images/1919424934293692416/MPA6JH94.jpg'
            };
            const allTweets = [];
            if (data && Array.isArray(data.items)) {
                for (let i = 0; i < data.items.length; i++) {
                    const item = data.items[i];
                    const displayName = item.author || 'TheRoseFish';
                    const handle = '@' + displayName;
                    let avatarUrl = accountDefaults[displayName] || '';
                    if (!avatarUrl && item.author_avatar) {
                        avatarUrl = isValidUrl(item.author_avatar) ? item.author_avatar : '';
                    }
                    if (!avatarUrl) {
                        avatarUrl = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
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
            allTweets.sort(function (a, b) { return b.dateObj.getTime() - a.dateObj.getTime(); });
            renderTweets(allTweets);
        }
        catch (err) {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.textContent = '';
                const p = document.createElement('p');
                p.style.cssText = 'color:#ff6b6b;text-align:center';
                const msg = err instanceof Error ? err.message : String(err);
                p.textContent = 'Error loading feed: ' + msg;
                loading.appendChild(p);
            }
            console.error(err);
        }
    }
    document.addEventListener('DOMContentLoaded', function () {
        fetchAndRenderFeed();
    });
})();
