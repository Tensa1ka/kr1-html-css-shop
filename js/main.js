// Скрипт подключён на главной (модальное окно) и на странице заявки,
// поэтому перед работой с элементом проверяем, что он есть на странице.

// ===============================
// 1. Проверка полей формы с понятными сообщениями об ошибках
// ===============================

// Возвращает текст ошибки для поля или пустую строку, если поле заполнено верно.
function getErrorText(field) {
  const validity = field.validity;

  if (validity.valid) {
    return '';
  }

  if (validity.valueMissing) {
    if (field.type === 'checkbox') {
      return 'Нужно согласие на обработку данных.';
    }
    if (field.tagName === 'SELECT') {
      return 'Выберите вариант из списка.';
    }
    return 'Заполните это поле.';
  }

  if (validity.typeMismatch && field.type === 'email') {
    return 'Введите e-mail в формате name@example.ru.';
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
    // Backend пока не подключён, поэтому отменяем стандартную отправку.
    event.preventDefault();

    const fields = Array.from(form.elements).filter((field) => field.willValidate);
    const invalidFields = fields.filter((field) => !checkField(field));

    if (invalidFields.length > 0) {
      // Переводим фокус на первое поле с ошибкой.
      invalidFields[0].focus();
      return;
    }

    onSuccess();
    form.reset();
  });
}

// ===============================
// 2. Модальное окно заявки (главная страница)
// ===============================
const orderDialog = document.getElementById('order-dialog');

if (orderDialog) {
  const orderForm = document.getElementById('order-form');
  const orderButtons = document.querySelectorAll('.product-card__button');
  const closeButtons = orderDialog.querySelectorAll('[data-close-dialog]');
  const selectedProductInput = document.getElementById('selected-product');
  const dialogProduct = document.getElementById('order-dialog-product');
  const dialogSuccess = document.getElementById('order-dialog-success');

  // Открываем окно: подставляем товар, показываем чистую форму.
  orderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const productName = button.dataset.product;

      selectedProductInput.value = productName;
      dialogProduct.textContent = productName;

      orderForm.reset();
      clearErrors(orderForm);
      orderForm.hidden = false;
      dialogSuccess.hidden = true;

      orderDialog.showModal();
    });
  });

  // Все кнопки с атрибутом data-close-dialog закрывают окно.
  closeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      orderDialog.close();
    });
  });

  // Закрываем окно по клику на затемнённый фон вокруг него.
  orderDialog.addEventListener('click', (event) => {
    if (event.target === orderDialog) {
      orderDialog.close();
    }
  });

  // После успешной отправки вместо формы показываем сообщение.
  setupForm(orderForm, () => {
    orderForm.hidden = true;
    dialogSuccess.hidden = false;
    dialogSuccess.querySelector('button').focus();
  });
}

// ===============================
// 3. Страница заявки order.html
// ===============================
const orderPageForm = document.getElementById('order-page-form');

if (orderPageForm) {
  const successMessage = document.getElementById('success-message');
  const productSelect = document.getElementById('order-product');

  // Если пришли по ссылке order.html?product=product-3, выбираем этот товар.
  const productFromUrl = new URLSearchParams(window.location.search).get('product');
  const hasProduct = Array.from(productSelect.options).some((option) => option.value === productFromUrl);

  if (hasProduct) {
    productSelect.value = productFromUrl;
  }

  setupForm(orderPageForm, () => {
    successMessage.hidden = false;
    successMessage.focus();
  });
}
