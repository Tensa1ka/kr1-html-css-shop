import { MAX_QUANTITY, getCartItems, getFileCartUrl, readCart, setQuantity } from './cart.mjs';

const storageKey = 'shopproject-cart-v1';
const count = document.querySelector('[data-cart-count]');
const notice = document.querySelector('[data-cart-notice]');
const localFile = window.location.protocol === 'file:';
let fileCart = localFile ? readCart(new URLSearchParams(window.location.search).get('basket')) : null;
let noticeTimer;

function carryFileCart(event) {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const target = getFileCartUrl(window.location.href, link.href, fileCart);
  if (target) link.href = target.href;
}

if (localFile) {
  // Browsers may isolate file:// storage for each HTML file. Carry SKUs and quantities between pages.
  document.addEventListener('click', carryFileCart, true);
  document.addEventListener('auxclick', carryFileCart, true);
  const filters = document.querySelector('.catalog-filters__form');
  if (filters) {
    const basket = document.createElement('input');
    basket.name = 'basket';
    basket.type = 'hidden';
    filters.append(basket);
    filters.addEventListener('submit', () => {
      basket.value = JSON.stringify(fileCart);
      basket.disabled = !Object.keys(fileCart).length;
    });
  }
}

export function loadCart() {
  if (localFile) return fileCart;

  try {
    return readCart(localStorage.getItem(storageKey));
  } catch {
    return {};
  }
}

export function announceCart(message) {
  notice.textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.textContent = ''; }, 4200);
}

function updateCount(cart) {
  const quantity = Object.values(cart).reduce((total, value) => total + value, 0);
  count.textContent = quantity;
  count.hidden = quantity === 0;
}

export function saveCart(cart) {
  if (localFile) {
    fileCart = cart;
    const next = getFileCartUrl(window.location.href, window.location.href, cart);
    try {
      history.replaceState(history.state, '', next);
    } catch {
      // Link navigation still carries the cart in browsers that restrict file:// history.
    }
    updateCount(cart);
    return true;
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  } catch {
    announceCart('Не удалось сохранить изменения в браузере.');
    return false;
  }
  updateCount(cart);
  return true;
}

export function onCartStorageChange(callback) {
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) {
      callback(loadCart());
    }
  });
}

updateCount(loadCart());
onCartStorageChange(updateCount);

document.addEventListener('click', event => {
  const button = event.target.closest('button[data-cart-add]');
  if (!button) return;

  const cart = loadCart();
  const id = button.dataset.cartAdd;
  const quantity = cart[id] ?? 0;

  if (quantity >= MAX_QUANTITY) {
    announceCart(`В корзине уже ${MAX_QUANTITY} шт. этого товара.`);
    return;
  }

  const next = setQuantity(cart, id, quantity + 1);
  if (next !== cart && saveCart(next)) {
    const item = getCartItems({ [id]: 1 })[0];
    announceCart(`${item.name} — в корзине ${next[id]} шт.`);
  }
});
