import { MAX_QUANTITY, cartTotal, getCartItems } from './cart.mjs';
import { loadCart, onCartStorageChange } from './cart-store.mjs';
import { formatPrice } from './product.mjs';
import orderDialogTemplate from './order-dialog.html';

function setDownload(link, fields, items) {
  if (link.hasAttribute('href')) {
    URL.revokeObjectURL(link.href);
  }
  const lines = [
    'Circuit Lane — черновик заявки',
    '',
    ...items.map(item => `${item.name} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`),
    `Сумма товаров: ${formatPrice(cartTotal(items))}`,
    '',
    `Имя: ${fields.get('name')}`,
    `Телефон: ${fields.get('phone')}`,
  ];
  for (const [key, label] of [['email', 'E-mail'], ['comment', 'Комментарий']]) {
    const value = fields.get(key);
    if (value) lines.push(`${label}: ${value}`);
  }
  link.href = URL.createObjectURL(new Blob([lines.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' }));
}

// ===============================
// 1. Проверка полей формы с понятными сообщениями об ошибках
// ===============================

// Возвращает текст ошибки для поля или пустую строку, если поле заполнено верно.
function getErrorText(field) {
  const validity = field.validity;

  if (field.id === 'order-phone' && field.value && !/^(?:7|8)\d{10}$/.test(field.value.replace(/\D/g, ''))) {
    return 'Введите номер из 11 цифр, начиная с +7 или 8.';
  }

  if (validity.valid) {
    return '';
  }

  if (validity.valueMissing) {
    if (field.type === 'checkbox') {
      return 'Подтвердите, что проверили данные заявки.';
    }
    if (field.tagName === 'SELECT') {
      return 'Выберите вариант из списка.';
    }
    return 'Заполните это поле.';
  }

  if (validity.typeMismatch && field.type === 'email') {
    return 'Введите e-mail в формате name@example.com.';
  }

  if (validity.patternMismatch && field.type === 'tel') {
    return 'Введите телефон в формате +7 (900) 000-00-00.';
  }

  if (validity.tooShort) {
    return `Минимум ${field.minLength} символа.`;
  }

  if (validity.rangeUnderflow || validity.rangeOverflow) {
    return `Допустимое значение: от ${field.min} до ${field.max}.`;
  }

  return field.validationMessage;
}

// Показывает или скрывает ошибку под полем. Возвращает true, если поле заполнено верно.
function checkField(field) {
  const errorElement = document.getElementById(`${field.id}-error`);
  const errorText = getErrorText(field);

  if (errorText) {
    field.setAttribute('aria-invalid', 'true');
  } else {
    field.removeAttribute('aria-invalid');
  }

  if (errorElement) {
    errorElement.textContent = errorText;
  }

  return !errorText;
}

// Сбрасывает все ошибки формы (например, при повторном открытии окна).
function clearErrors(form) {
  Array.from(form.elements).forEach((field) => {
    field.removeAttribute('aria-invalid');
    const errorElement = document.getElementById(`${field.id}-error`);
    if (errorElement) {
      errorElement.textContent = '';
    }
  });
}

// Подключает проверку к форме. onSuccess вызывается, когда все поля верны.
function setupForm(form, onSuccess) {
  // Пока пользователь исправляет поле с ошибкой, проверяем его заново.
  ['input', 'change'].forEach((eventName) => {
    form.addEventListener(eventName, (event) => {
      if (event.target.hasAttribute('aria-invalid')) {
        checkField(event.target);
      }
    });
  });

  // Проверяем поле, когда пользователь уходит из него.
  form.addEventListener('focusout', (event) => {
    const field = event.target;
    if (field.willValidate && field.value !== '' && field.type !== 'checkbox') {
      checkField(field);
    }
  });

  // Кнопка «Очистить» убирает и сообщения об ошибках.
  form.addEventListener('reset', () => {
    clearErrors(form);
  });

  form.addEventListener('submit', (event) => {
    // Заявка формируется локально в виде файла.
    event.preventDefault();

    const fields = Array.from(form.elements).filter((field) => field.willValidate);
    const invalidFields = fields.filter((field) => !checkField(field));

    if (invalidFields.length > 0) {
      // Переводим фокус на первое поле с ошибкой.
      invalidFields[0].focus();
      return;
    }

    if (onSuccess(new FormData(form)) !== false) {
      form.reset();
    }
  });
}

// ===============================
// 2. Заказ в один клик
// ===============================
if (typeof HTMLDialogElement !== 'undefined' && document.querySelector('[data-quick-order]')) {
  document.body.insertAdjacentHTML('beforeend', orderDialogTemplate);
  const dialog = document.getElementById('order-dialog');
  const form = document.getElementById('order-form');
  const success = document.getElementById('order-dialog-success');
  const download = success.querySelector('[data-order-download]');
  const productName = document.getElementById('order-dialog-product');
  const quantity = document.getElementById('quick-quantity');
  const total = form.querySelector('[data-quick-total]');
  let productId;

  for (let value = 1; value <= MAX_QUANTITY; value += 1) {
    quantity.options.add(new Option(value, value));
  }

  const selectedItems = () => getCartItems({ [productId]: Number(quantity.value) });

  function updateTotal() {
    total.textContent = `Сумма товаров: ${formatPrice(cartTotal(selectedItems()))}`;
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('a[data-quick-order]');
    if (!trigger || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    productId = trigger.dataset.quickOrder;
    form.reset();
    productName.textContent = selectedItems()[0].name;
    updateTotal();
    form.hidden = false;
    success.hidden = true;
    dialog.showModal();
  });

  quantity.addEventListener('change', updateTotal);
  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-close-dialog]')) {
      dialog.close();
      return;
    }
    if (event.target === dialog) {
      const { left, right, top, bottom } = dialog.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
        dialog.close();
      }
    }
  });
  dialog.addEventListener('close', () => {
    if (download.hasAttribute('href')) {
      URL.revokeObjectURL(download.href);
      download.removeAttribute('href');
    }
  });

  setupForm(form, fields => {
    setDownload(download, fields, selectedItems());
    form.hidden = true;
    success.hidden = false;
    download.focus();
  });
}

// ===============================
// 3. Страница заявки order.html
// ===============================
const orderPageForm = document.getElementById('order-page-form');

if (orderPageForm) {
  const successMessage = document.getElementById('success-message');
  const download = successMessage.querySelector('[data-order-download]');
  const productSelect = document.getElementById('order-product');
  const orderQuantity = document.getElementById('order-quantity');
  const params = new URLSearchParams(window.location.search);
  const cartMode = params.get('source') === 'cart';

  const productFromUrl = params.get('product');
  if ([...productSelect.options].some(option => option.value === productFromUrl)) {
    productSelect.value = productFromUrl;
  }

  function updateCartSummary(cart) {
    const items = getCartItems(cart);
    const list = orderPageForm.querySelector('[data-order-items]');
    list.replaceChildren(...items.map(item => {
      const line = document.createElement('li');
      line.textContent = `${item.name} × ${item.quantity} — ${formatPrice(item.quantity * item.price)}`;
      return line;
    }));
    orderPageForm.querySelector('[data-order-total]').textContent = items.length
      ? `Сумма товаров: ${formatPrice(cartTotal(items))}` : '';
    orderPageForm.querySelector('[data-order-empty]').hidden = items.length > 0;
    orderPageForm.querySelector('[type="submit"]').disabled = items.length === 0;
  }

  if (cartMode) {
    orderPageForm.querySelector('[data-direct-order]').hidden = true;
    productSelect.disabled = orderQuantity.disabled = true;
    orderPageForm.querySelector('[data-order-cart]').hidden = false;
    updateCartSummary(loadCart());
    onCartStorageChange(cart => {
      updateCartSummary(cart);
      successMessage.hidden = true;
    });
  }

  setupForm(orderPageForm, fields => {
    const cart = cartMode ? loadCart() : { [productSelect.value]: Number(orderQuantity.value) };
    const items = getCartItems(cart);
    if (!items.length) {
      updateCartSummary(cart);
      return false;
    }

    setDownload(download, fields, items);
    successMessage.hidden = false;
    successMessage.focus();
  });
  orderPageForm.addEventListener('input', () => { successMessage.hidden = true; });
  orderPageForm.hidden = false;
}
