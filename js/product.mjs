const ruble = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  trailingZeroDisplay: 'stripIfInteger',
  maximumFractionDigits: 2,
});

export function formatPrice(price) {
  return ruble.format(price);
}

export function calculateDiscount(price, oldPrice) {
  if (oldPrice > 0 && price >= 0 && price < oldPrice) {
    return Math.round((oldPrice - price) / oldPrice * 100);
  }

  return 0;
}

export function getProductStatus(product) {
  return product.inStock ? 'В наличии' : 'Нет в наличии';
}

export function summarizeProduct(product) {
  const discount = calculateDiscount(product.price, product.oldPrice);
  const summary = `${product.name} — ${product.description} ${formatPrice(product.price)}. ${getProductStatus(product)}.`;

  return discount > 0 ? `${summary} Скидка ${discount}%.` : summary;
}
