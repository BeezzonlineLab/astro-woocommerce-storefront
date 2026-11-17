import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

function localRuntimeConfig() {
  return {
    name: 'cloudeefy-local-runtime-config',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/runtime-config.json', (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        const env = loadEnv(server.config.mode, server.config.envDir || process.cwd(), 'PUBLIC_');
        try {
          const wordpress = new URL(env.PUBLIC_WORDPRESS_URL);
          const store = new URL(env.PUBLIC_WOOCOMMERCE_STORE_API_URL);
          if ([wordpress, store].some((url) => url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
              || wordpress.origin !== store.origin || !/^\/$/.test(wordpress.pathname)
              || !/^\/wp-json\/wc\/store\/v1\/?$/.test(store.pathname)) throw new Error('invalid endpoints');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify({ wordpressUrl: wordpress.origin, storeApiUrl: store.href.replace(/\/$/, '') }));
        } catch {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify({ error: 'Set PUBLIC_WORDPRESS_URL and PUBLIC_WOOCOMMERCE_STORE_API_URL to matching HTTPS endpoints in .env.' }));
        }
      });
    },
  };
}

export default defineConfig({
  output: 'static',
  vite: { plugins: [localRuntimeConfig()], server: { strictPort: true } },
});
