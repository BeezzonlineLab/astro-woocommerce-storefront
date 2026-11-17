const status = document.querySelector('#catalog-status');
const productsGrid = document.querySelector('#products');
const checkoutLink = document.querySelector('[data-checkout-link]');
let wordpressOrigin = '';

function showMessage(message) {
  status.textContent = message;
  status.hidden = false;
  productsGrid.hidden = true;
}

function productCard(product) {
  const card = document.createElement('article');
  card.className = 'card';
  const image = product.images?.[0];
  if (image?.src) {
    const imageUrl = new URL(image.src, window.location.href);
    if (imageUrl.protocol === 'https:' || imageUrl.protocol === 'http:') {
      const img = document.createElement('img');
      img.src = imageUrl.href;
      img.alt = image.alt || product.name || '';
      img.loading = 'lazy';
      card.append(img);
    }
  }
  const details = document.createElement('div');
  details.className = 'details';
  const name = document.createElement('h2');
  name.textContent = product.name || 'Product';
  details.append(name);
  if (product.prices?.currency_code) {
    const price = document.createElement('div');
    price.className = 'price';
    const amount = Number(product.prices.price || 0) / (10 ** Number(product.prices.currency_minor_unit || 0));
    price.textContent = new Intl.NumberFormat(undefined, { style: 'currency', currency: product.prices.currency_code }).format(amount);
    details.append(price);
  }
  try {
    const productUrl = new URL(product.permalink);
    if (productUrl.protocol === 'https:' && productUrl.origin === wordpressOrigin && !productUrl.username && !productUrl.password) {
      const productLink = document.createElement('a');
      productLink.className = 'product-link';
      productLink.href = productUrl.href;
      productLink.textContent = 'View product and add to cart';
      details.append(productLink);
    }
  } catch {
    // A malformed product URL is omitted.
  }
  card.append(details);
  return card;
}

async function loadCatalog() {
  try {
    const configResponse = await fetch('/runtime-config.json', { cache: 'no-store' });
    if (!configResponse.ok) {
      const detail = await configResponse.json().catch(() => ({}));
      throw new Error(detail.error || 'Storefront configuration is unavailable.');
    }
    const config = await configResponse.json();
    const wordpress = new URL(config.wordpressUrl);
    const store = new URL(config.storeApiUrl);
    if (wordpress.protocol !== 'https:' || store.protocol !== 'https:' || wordpress.origin !== store.origin || wordpress.username || wordpress.password || store.username || store.password) {
      throw new Error('The WordPress and Store API URLs must use the same HTTPS origin.');
    }
    wordpressOrigin = wordpress.origin;
    checkoutLink.href = wordpress.href;
    checkoutLink.textContent = 'Open store';
    checkoutLink.removeAttribute('aria-disabled');
    const response = await fetch(`${store.href.replace(/\/$/, '')}/products?per_page=12`, { credentials: 'omit' });
    if (!response.ok) throw new Error(`WooCommerce Store API returned ${response.status}.`);
    const products = await response.json();
    if (!Array.isArray(products) || products.length === 0) {
      showMessage('No products are published yet. Add products in WooCommerce to see them here.');
      return;
    }
    productsGrid.replaceChildren(...products.map(productCard));
    productsGrid.hidden = false;
    status.hidden = true;
  } catch (error) {
    showMessage(`Products are temporarily unavailable. Check the Store API URL and WordPress headless settings. ${error.message}`);
  }
}

loadCatalog();
