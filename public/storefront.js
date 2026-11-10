const status = document.querySelector('#catalog-status');
const productsGrid = document.querySelector('#products');
const checkoutLink = document.querySelector('[data-checkout-link]');

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
    price.textContent = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: product.prices.currency_code,
    }).format(amount);
    details.append(price);
  }

  card.append(details);
  return card;
}

async function loadCatalog() {
  try {
    const configResponse = await fetch('/runtime-config.json', { cache: 'no-store' });
    if (!configResponse.ok) throw new Error('Storefront configuration is unavailable.');
    const config = await configResponse.json();

    if (config.wordpressUrl) {
      checkoutLink.href = `${config.wordpressUrl.replace(/\/$/, '')}/checkout/`;
      checkoutLink.removeAttribute('aria-disabled');
    }
    if (!config.storeApiUrl) {
      showMessage('Connect the WooCommerce Store API in the deployment settings to load products.');
      return;
    }

    const response = await fetch(`${config.storeApiUrl.replace(/\/$/, '')}/products?per_page=12`);
    if (!response.ok) throw new Error(`WooCommerce Store API returned ${response.status}.`);
    const products = await response.json();
    if (!Array.isArray(products) || products.length === 0) {
      showMessage('No products are published yet. Add products in WooCommerce to see them here.');
      return;
    }

    productsGrid.replaceChildren(...products.map(productCard));
    status.hidden = true;
    productsGrid.hidden = false;
  } catch (error) {
    showMessage(`Products are temporarily unavailable. Check the Store API URL and WordPress headless settings. ${error.message}`);
  }
}

loadCatalog();
