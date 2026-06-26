"use strict";
(function () {
    const GIST_ID = 'c526bbcc9a1cdd8892186268a4c6b244';
    const FEED_URL = 'https://api.github.com/gists/' + GIST_ID;
    function getTweetStatusId(tweetUrl) {
        const match = tweetUrl.match(/\/status\/(\d+)/);
        return match ? match[1] : null;
    }
    function createTweetIframe(tweetUrl) {
        const iframe = document.createElement('iframe');
        const statusId = getTweetStatusId(tweetUrl);
        iframe.src = 'https://platform.twitter.com/embed/Tweet.html?theme=dark&id=' + statusId;
        iframe.style.cssText = 'width:100%;max-width:700px;border:none;border-radius:12px;margin:8px 0 8px auto;display:block;min-height:700px';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', '');
        if (statusId) {
            iframe.dataset.statusId = statusId;
        }
        return iframe;
    }
    function handleTwitterResize(e) {
        if (e.origin !== 'https://platform.twitter.com')
            return;
        let height;
        try {
            const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            if (data?.twttr?.embed?.height) {
                height = data.twttr.embed.height;
            }
        }
        catch (_) {
            return;
        }
        if (!height || height < 100)
            return;
        const iframes = document.querySelectorAll('iframe[data-status-id]');
        for (let i = 0; i < iframes.length; i++) {
            if (iframes[i].contentWindow === e.source) {
                iframes[i].style.height = height + 'px';
                iframes[i].style.minHeight = 'auto';
                break;
            }
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
        const feed = container;
        let i = 0;
        function renderNext() {
            if (i >= tweets.length)
                return;
            const tweet = tweets[i];
            if (tweet.link && getTweetStatusId(tweet.link)) {
                feed.appendChild(createTweetIframe(tweet.link));
            }
            i++;
            requestAnimationFrame(renderNext);
        }
        renderNext();
    }
    async function fetchAndRenderFeed() {
        try {
            const response = await fetch(FEED_URL);
            if (!response.ok)
                throw new Error('Failed to fetch feed');
            const gistData = await response.json();
            const raw = gistData?.files?.['fish_news_feed.json']?.content;
            if (!raw)
                throw new Error('Feed content not found');
            const data = JSON.parse(raw);
            const allTweets = [];
            if (data && Array.isArray(data.items)) {
                for (let i = 0; i < data.items.length; i++) {
                    const item = data.items[i];
                    allTweets.push({
                        link: item.url || '',
                        dateObj: new Date(item.date)
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
    window.addEventListener('message', handleTwitterResize);
    document.addEventListener('DOMContentLoaded', function () {
        fetchAndRenderFeed();
    });
})();
