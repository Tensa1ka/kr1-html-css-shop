import { calculateDiscount, formatPrice, getProductStatus, summarizeProduct } from './product.mjs';

export function setupProductPage() {
  const productSection = document.querySelector('.product');
  const product = {
    name: productSection.querySelector('.product__title').textContent.trim(),
    description: productSection.querySelector('.product__description').textContent.trim(),
    price: Number(productSection.dataset.price),
    oldPrice: Number(productSection.dataset.oldPrice ?? 0),
    inStock: productSection.dataset.inStock === 'true',
  };

  productSection.querySelector('[data-current-price]').textContent = formatPrice(product.price);
  productSection.querySelector('.product__stock').textContent = getProductStatus(product);

  const oldPrice = productSection.querySelector('.product__old-price');
  const discountBadge = productSection.querySelector('.product__badge--sale');
  if (oldPrice && discountBadge) {
    oldPrice.textContent = formatPrice(product.oldPrice);
    discountBadge.textContent = `Скидка −${calculateDiscount(product.price, product.oldPrice)}%`;
  }

  console.info(summarizeProduct(product));
}
