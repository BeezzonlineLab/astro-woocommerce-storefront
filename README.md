# Astro + WooCommerce headless storefront

A small, static Astro storefront starter for WooCommerce's public Store API. Cloudeefy deploys this frontend separately from WordPress; product and checkout administration stays in WordPress.

## Configuration

Set these deployment environment variables:

| Variable | Example | Purpose |
| --- | --- | --- |
| `PUBLIC_WORDPRESS_URL` | `https://cms.example.com` | WordPress site and checkout base URL |
| `PUBLIC_WOOCOMMERCE_STORE_API_URL` | `https://cms.example.com/wp-json/wc/store/v1` | Public WooCommerce Store API base URL |

The container writes them into a public runtime configuration file when it starts, so you can change backend URLs without rebuilding the Astro site. These values are public. Never put WooCommerce consumer secrets, payment credentials, or private API keys in them.

In WordPress, install and configure WooCommerce, enable the Store API, and allow the storefront origin with credentialed requests. Expose the `Nonce` response header and allow the `Nonce` and `Content-Type` request headers. The starter uses the WooCommerce Store API to load products and add simple products to the cart, then sends customers to the WordPress checkout. Verify cart cookies, CORS, and the selected payment provider in your headless configuration before launch.

## Local development

```sh
npm install
cp .env.example .env
npm run dev
```

Set both URLs in `.env` to the HTTPS origin of the same WooCommerce store.
Open `http://localhost:4321` and add that exact origin in WordPress under
**WooCommerce → Headless Storefront**. The WordPress image must support local
origins. Local access expires after eight hours; save the origin again to renew
it. Restart the dev server after changing `.env`.

The browser connects to the selected store directly. With a production store,
cart and checkout tests can create real orders, reserve stock and send emails.
Coordinate test orders with the merchant and never use a real payment for a test.
Remove the localhost origin from WordPress when it is no longer needed: any
site running on that local origin can use the allowed Store API in any visitor's browser.
Cookie restrictions vary by browser, so verify that the cart follows the user
to WordPress checkout before relying on the flow.

Build the static site with `npm run build`. The generated files are in `dist/`. The browser loads products from the configured Store API after the container starts; WordPress must allow requests from the storefront origin.

## Scope

This starter demonstrates product browsing and adding simple products to the WooCommerce cart before sending customers to checkout. It does not contain payment credentials or replace WooCommerce's order, tax, shipping, or checkout configuration. Configure those in WordPress Admin and validate the chosen payment provider before launch.
