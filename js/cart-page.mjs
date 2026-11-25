import { MAX_QUANTITY, cartTotal, getCartItems, setQuantity } from './cart.mjs';
import { announceCart, loadCart, onCartStorageChange, saveCart } from './cart-store.mjs';
import { formatPrice } from './product.mjs';

export function setupCartPage() {
  const list = document.querySelector('[data-cart-items]');
  const content = document.querySelector('[data-cart-content]');
  const empty = document.querySelector('[data-cart-empty]');
  const template = document.querySelector('#cart-item');
  const total = document.querySelector('[data-cart-total]');
  const quantity = document.querySelector('[data-cart-units]');

  function updateSummary(items) {
    content.hidden = items.length === 0;
    empty.hidden = items.length > 0;
    total.textContent = formatPrice(cartTotal(items));
    quantity.textContent = `${items.reduce((sum, item) => sum + item.quantity, 0)} шт.`;
  }

  function createRow(item) {
    const row = template.content.firstElementChild.cloneNode(true);
    row.dataset.id = item.id;
    const link = row.querySelector('[data-item-link]');
    link.href = item.page;
    link.textContent = item.name;
    row.querySelector('img').src = `images/${item.photo}-320.webp`;
    row.querySelector('[data-item-price]').textContent = `${formatPrice(item.price)} за шт.`;
    row.querySelector('[data-item-subtotal]').textContent = formatPrice(item.price * item.quantity);

    const select = row.querySelector('select');
    select.setAttribute('aria-label', `Количество — ${item.name}`);
    for (let value = 1; value <= MAX_QUANTITY; value += 1) {
      select.options.add(new Option(value, value, false, value === item.quantity));
    }

    row.querySelector('button').setAttribute('aria-label', `Удалить — ${item.name}`);
    return row;
  }

  function renderCart(cart) {
    const items = getCartItems(cart);
    list.replaceChildren(...items.map(createRow));
    updateSummary(items);
  }

  list.addEventListener('change', event => {
    const select = event.target.closest('select');
    if (!select) return;

    const row = select.closest('[data-id]');
    const cart = loadCart();
    const id = row.dataset.id;
    if (!cart[id]) {
      renderCart(cart);
      return;
    }
    const next = setQuantity(cart, id, Number(select.value));
    if (!saveCart(next)) {
      select.value = cart[id];
      return;
    }

    const items = getCartItems(next);
    const item = items.find(product => product.id === id);
    row.querySelector('[data-item-subtotal]').textContent = formatPrice(item.price * item.quantity);
    updateSummary(items);
    announceCart(`Итого: ${formatPrice(cartTotal(items))}.`);
  });

  list.addEventListener('click', event => {
    const remove = event.target.closest('button');
    if (!remove) return;

    const row = remove.closest('[data-id]');
    const cart = setQuantity(loadCart(), row.dataset.id, 0);
    if (!saveCart(cart)) return;

    const nextRow = row.nextElementSibling ?? row.previousElementSibling;
    row.remove();
    updateSummary(getCartItems(cart));
    (nextRow?.querySelector('button') ?? empty.querySelector('a')).focus();
    announceCart('Товар удалён из корзины.');
  });

  renderCart(loadCart());
  onCartStorageChange(renderCart);
}
