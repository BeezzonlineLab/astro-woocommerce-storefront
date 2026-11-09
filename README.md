# Astro + WooCommerce headless storefront

A small, static Astro storefront starter for WooCommerce's public Store API. Cloudeefy deploys this frontend separately from WordPress; product and checkout administration stays in WordPress.

## Configuration

Set these build-time variables in the deployment environment:

| Variable | Example | Purpose |
| --- | --- | --- |
| `PUBLIC_WORDPRESS_URL` | `https://cms.example.com` | WordPress site and checkout base URL |
| `PUBLIC_WOOCOMMERCE_STORE_API_URL` | `https://cms.example.com/wp-json/wc/store/v1` | Public WooCommerce Store API base URL |

These are public values embedded in browser code. Never put WooCommerce consumer secrets, payment credentials, or private API keys in `PUBLIC_*` variables.

In WordPress, install and configure WooCommerce, enable the Store API, configure the headless plugin/settings for the storefront origin, and verify that checkout returns to the WordPress checkout. The Store API supports public catalog browsing; cart and checkout behavior can depend on cookie, nonce, CORS, and payment-provider configuration.

## Local development

```sh
npm install
cp .env.example .env
npm run dev
```

Build the static site with `npm run build`. The generated files are in `dist/`.

## Scope

This starter demonstrates catalog browsing and links customers to the WooCommerce checkout. It does not contain payment credentials or attempt to replace WooCommerce's order, tax, payment, or checkout configuration. Configure those in WordPress Admin and validate the chosen payment provider before launch.
