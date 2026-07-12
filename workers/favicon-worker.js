export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
      return new Response(JSON.stringify({ icon: '' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      const page = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'CloudflareWorker/1.0' },
      });
      let iconUrl = '';

      const rewriter = new HTMLRewriter()
        .on('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]', {
          element(el) {
            if (iconUrl) return;
            const href = el.getAttribute('href');
            if (href) {
              try { iconUrl = new URL(href, targetUrl).href; } catch { iconUrl = href; }
            }
          },
        })
        .on('meta[property="og:image"], meta[name="twitter:image"]', {
          element(el) {
            if (iconUrl) return;
            const content = el.getAttribute('content');
            if (content) {
              try { iconUrl = new URL(content, targetUrl).href; } catch { iconUrl = content; }
            }
          },
        });

      await rewriter.transform(page).text();

      return new Response(JSON.stringify({ icon: iconUrl }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ icon: '', error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
