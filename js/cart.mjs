export const MAX_QUANTITY = 10;

const inventory = {
  'product-1': { name: 'Беспроводные наушники Pulse', price: 5990, photo: 'unsplash/pulse', page: 'product.html' },
  'product-2': { name: 'Портативная колонка Wave', price: 3490, photo: 'unsplash/wave', page: 'product-2.html' },
  'product-3': { name: 'Умные часы Fit S', price: 7190, photo: 'unsplash/fit-s', page: 'product-3.html' },
  'product-4': { name: 'Механическая клавиатура K87', price: 7490, photo: 'unsplash/k87', page: 'product-4.html' },
  'product-5': { name: 'Беспроводная мышь Glide', price: 1990, photo: 'unsplash/glide', page: 'product-5.html' },
  'product-6': { name: 'Веб-камера Full HD', price: 3990, photo: 'pexels/webcam', page: 'product-6.html' },
  'product-7': { name: 'Внешний аккумулятор 20 000 мА·ч', price: 1990, photo: 'pexels/power', page: 'product-7.html' },
  'product-8': { name: 'Игровая гарнитура Storm', price: 4490, photo: 'pexels/storm', page: 'product-8.html' },
  'product-10': { name: 'TWS-наушники Loop', price: 4290, photo: 'pexels/loop', page: 'product-10.html' },
  'product-11': { name: 'USB-C хаб Dock 6', price: 3190, photo: 'pexels/dock-6', page: 'product-11.html' },
  'product-12': { name: 'Сетевое зарядное устройство Volt 30', price: 1690, photo: 'pexels/volt-30', page: 'product-12.html' },
};

function validQuantity(quantity) {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_QUANTITY;
}

export function readCart(raw) {
  let stored;
  try {
    stored = JSON.parse(raw);
  } catch {
    return {};
  }

  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
    return {};
  }

  return Object.fromEntries(Object.entries(stored).filter(([id, quantity]) =>
    Object.hasOwn(inventory, id) && validQuantity(quantity)
  ));
}

export function setQuantity(cart, id, quantity) {
  if (!Object.hasOwn(inventory, id) || (quantity !== 0 && !validQuantity(quantity))) {
    return cart;
  }

  const next = { ...cart };
  if (quantity === 0) {
    delete next[id];
  } else {
    next[id] = quantity;
  }

  return next;
}

export function getCartItems(cart) {
  return Object.entries(cart).map(([id, quantity]) => ({ id, quantity, ...inventory[id] }));
}

export function cartTotal(items) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function getFileCartUrl(current, target, cart) {
  const page = new URL(current);
  const next = new URL(target, page);
  if (page.protocol !== 'file:' || next.protocol !== 'file:' || new URL('.', page).href !== new URL('.', next).href) {
    return null;
  }

  if (Object.keys(cart).length) {
    next.searchParams.set('basket', JSON.stringify(cart));
  } else {
    next.searchParams.delete('basket');
  }
  return next;
}
