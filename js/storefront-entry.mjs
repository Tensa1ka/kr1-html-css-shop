import './main.js';
import { setupCartPage } from './cart-page.mjs';
import { setupCatalog } from './catalog.js';
import { setupProductPage } from './product-page.mjs';

if (document.querySelector('[data-cart-items]')) setupCartPage();
if (document.querySelector('.catalog-filters__form')) setupCatalog();
if (document.querySelector('.product')) setupProductPage();
