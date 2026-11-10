const status = document.querySelector('#catalog-status');
const productsGrid = document.querySelector('#products');
const checkoutLink = document.querySelector('[data-checkout-link]');
let storeApiUrl = '';
let cartNonce = '';
let cartReady = false;

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

  const addButton = document.createElement('button');
  addButton.className = 'add-to-cart';
  addButton.type = 'button';
  addButton.textContent = 'Add to cart';
  addButton.disabled = !cartReady || !product.is_purchasable || !product.is_in_stock;
  addButton.addEventListener('click', async () => {
    addButton.disabled = true;
    addButton.textContent = 'Adding…';
    try {
      const response = await fetch(`${storeApiUrl.replace(/\/$/, '')}/cart/add-item`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Nonce: cartNonce },
        body: JSON.stringify({ id: product.id, quantity: 1 }),
      });
      if (!response.ok) throw new Error(`WooCommerce returned ${response.status}.`);
      cartNonce = response.headers.get('Nonce') || cartNonce;
      const cart = await response.json();
      const itemCount = (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      checkoutLink.textContent = itemCount ? `Checkout (${itemCount})` : 'Checkout';
      addButton.textContent = 'Added to cart';
      status.textContent = `${product.name} added to your cart.`;
      status.hidden = false;
    } catch (error) {
      status.textContent = `Could not add this product to the cart. ${error.message}`;
      status.hidden = false;
      addButton.textContent = 'Add to cart';
    } finally {
      addButton.disabled = !cartReady || !product.is_purchasable || !product.is_in_stock;
    }
  });
  details.append(addButton);

  card.append(details);
  return card;
}

async function initializeCart() {
  const response = await fetch(`${storeApiUrl.replace(/\/$/, '')}/cart`, { credentials: 'include' });
  if (!response.ok) throw new Error(`WooCommerce cart returned ${response.status}.`);
  cartNonce = response.headers.get('Nonce') || '';
  if (!cartNonce) throw new Error('The WordPress origin must expose the WooCommerce Nonce response header.');
  const cart = await response.json();
  const itemCount = (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  checkoutLink.textContent = itemCount ? `Checkout (${itemCount})` : 'Checkout';
  cartReady = true;
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
    storeApiUrl = config.storeApiUrl;
    let cartError = '';
    const cartRequest = initializeCart().catch((error) => {
      cartError = error.message;
    });

    const response = await fetch(`${storeApiUrl.replace(/\/$/, '')}/products?per_page=12`);
    if (!response.ok) throw new Error(`WooCommerce Store API returned ${response.status}.`);
    const products = await response.json();
    if (!Array.isArray(products) || products.length === 0) {
      showMessage('No products are published yet. Add products in WooCommerce to see them here.');
      return;
    }

    await cartRequest;
    productsGrid.replaceChildren(...products.map(productCard));
    productsGrid.hidden = false;
    if (cartError) {
      status.textContent = `Products are available, but the cart could not be initialized. ${cartError}`;
      status.hidden = false;
    } else {
      status.hidden = true;
    }
  } catch (error) {
    showMessage(`Products are temporarily unavailable. Check the Store API URL and WordPress headless settings. ${error.message}`);
  }
}

loadCatalog();
