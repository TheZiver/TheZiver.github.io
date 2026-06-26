"use strict";
(function () {
    const GIST_ID = 'c526bbcc9a1cdd8892186268a4c6b244';
    const FEED_URL = 'https://api.github.com/gists/' + GIST_ID;
    function createTweetIframe(tweetUrl) {
        const iframe = document.createElement('iframe');
        iframe.src = tweetUrl.replace('twitter.com', 'fxtwitter.com').replace('x.com', 'fixupx.com');
        iframe.style.cssText = 'width:100%;max-width:700px;border:none;border-radius:12px;margin:8px 0 8px auto;display:block;min-height:700px';
        iframe.setAttribute('frameborder', '0');
        return iframe;
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
            if (tweet.link) {
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
    document.addEventListener('DOMContentLoaded', function () {
        fetchAndRenderFeed();
    });
})();
