import assert from 'node:assert/strict';
import test from 'node:test';
import { readCart, setQuantity, getCartItems, cartTotal, getFileCartUrl } from '../js/cart.mjs';

test('restores only purchasable products and valid quantities', () => {
  assert.deepEqual(readCart('{"product-1":2,"product-3":"3","product-5":11,"product-9":1,"other":1}'), {'product-1': 2});
  for (const stored of [null, '{', '[]', 'true']) {
    assert.deepEqual(readCart(stored), {});
  }
});

test('changes quantity without mutating the original cart and removes a quantity of zero', () => {
  const original = {'product-1': 2};
  assert.deepEqual(setQuantity(original, 'product-1', 3), {'product-1': 3});
  assert.deepEqual(original, {'product-1': 2});
  assert.deepEqual(setQuantity(original, 'product-1', 0), {});
});

test('rejects unavailable products and quantities outside the supported range', () => {
  const original = {'product-1': 2};
  for (const [id, quantity] of [['product-9', 1], ['missing', 1], ['product-1', 11], ['product-1', 1.5], ['product-1', -1]]) {
    assert.equal(setQuantity(original, id, quantity), original);
  }
});

test('uses current catalog prices for the total across multiple products', () => {
  const items = getCartItems({'product-1': 2, 'product-2': 1});
  assert.equal(items[0].name, 'Беспроводные наушники Pulse');
  assert.equal(items[0].quantity, 2);
  assert.equal(cartTotal(items), 15470);
});

test('carries cart state to local HTML pages without removing checkout parameters or anchors', () => {
  const page = 'file:///shop/catalog.html';
  const next = getFileCartUrl(page, 'order.html?source=cart#main-content', {'product-1': 2});
  assert.equal(next.searchParams.get('source'), 'cart');
  assert.deepEqual(readCart(next.searchParams.get('basket')), {'product-1': 2});
  assert.equal(next.hash, '#main-content');
  assert.equal(getFileCartUrl(page, next, {}).searchParams.has('basket'), false);
  assert.equal(getFileCartUrl(page, 'https://yandex.ru/maps/', {'product-1': 2}), null);
  assert.equal(getFileCartUrl(page, '../elsewhere.html', {'product-1': 2}), null);
});
