import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDiscount, formatPrice, getProductStatus, summarizeProduct } from '../js/product.mjs';

test('formats a ruble price', () => {
  assert.match(formatPrice(7190), /^7\s190\s₽$/u);
  assert.match(formatPrice(1990.5), /^1\s990,50\s₽$/u);
});

test('calculates a rounded discount percentage', () => {
  assert.equal(calculateDiscount(7190, 8990), 20);
  assert.equal(calculateDiscount(1990, 2790), 29);
  assert.equal(calculateDiscount(100, 100), 0);
  assert.equal(calculateDiscount(100, 0), 0);
  assert.equal(calculateDiscount(110, 100), 0);
});

test('uses a boolean availability flag', () => {
  assert.equal(getProductStatus({ inStock: true }), 'В наличии');
  assert.equal(getProductStatus({ inStock: false }), 'Нет в наличии');
});

test('summarizes the product with its formatted price and available discount', () => {
  const product = { name: 'Fit S', description: 'Умные часы с GPS.', price: 7190, oldPrice: 8990, inStock: true };
  assert.match(summarizeProduct(product), /^Fit S — Умные часы с GPS\. 7\s190\s₽\. В наличии\. Скидка 20%\.$/u);
  const soldOut = { ...product, oldPrice: 0, inStock: false };
  assert.match(summarizeProduct(soldOut), /Нет в наличии\.$/u);
  assert.doesNotMatch(summarizeProduct(soldOut), /Скидка/u);
});
