export function setupCatalog() {
  const filters = document.querySelector('.catalog-filters__form');
  const productGrid = document.querySelector('.catalog-layout .products-grid');
  const products = [...productGrid.children];
  const params = new URLSearchParams(window.location.search);
  const categoryParams = params.getAll('category');
  const search = params.get('q') ?? '';

  function selectOption(name) {
    const select = filters.elements.namedItem(name);
    const value = params.get(name);
    select.value = [...select.options].some(option => option.value === value) ? value : '';
    return select.value;
  }

  function readPrice(name) {
    const field = filters.elements.namedItem(name);
    const value = params.get(name);
    const price = Number(value);
    field.value = value?.trim() && Number.isFinite(price) && price >= 0 ? price : '';
    return field.valueAsNumber;
  }

  const type = selectOption('type');
  const sort = selectOption('sort');
  const minimum = readPrice('price-from');
  const maximum = readPrice('price-to');
  const inStock = params.get('in-stock') === 'yes';
  filters.elements.namedItem('q').value = search;
  filters.elements.namedItem('in-stock').checked = inStock;

  const selectedCategories = [];
  for (const input of filters.querySelectorAll('[name="category"]')) {
    input.checked = categoryParams.includes(input.value);
    if (input.checked) {
      selectedCategories.push(input.value);
    }
  }

  const query = search.trim().toLocaleLowerCase('ru');
  const getPrice = card => Number(card.dataset.price);
  let count = 0;

  for (const card of products) {
    const price = getPrice(card);
    const available = card.dataset.inStock === 'true';
    const collection = !available && card.dataset.category === 'sale' ? '' : card.dataset.category;
    const searchable = [
      card.querySelector('.product-card__title').textContent,
      card.querySelector('.product-card__description').textContent,
    ].join(' ').toLocaleLowerCase('ru');

    const matches = (!type || card.dataset.type === type)
      && (!selectedCategories.length || selectedCategories.includes(collection))
      && (!inStock || available)
      && (Number.isNaN(minimum) || price >= minimum)
      && (Number.isNaN(maximum) || price <= maximum)
      && searchable.includes(query);

    card.hidden = !matches;
    count += Number(matches);
  }

  if (sort) {
    const direction = sort === 'price-desc' ? -1 : 1;
    products.sort((first, second) => direction * (getPrice(first) - getPrice(second)));
    productGrid.append(...products);
  }

  document.querySelector('.catalog-layout__count').textContent = `Найдено товаров: ${count}`;
  document.querySelector('.catalog-layout__empty').hidden = count > 0;

  const disclosure = document.querySelector('.catalog-filters__disclosure');
  const compactLayout = window.matchMedia('(max-width: 950px)');
  disclosure.open = !compactLayout.matches;
  compactLayout.addEventListener('change', event => {
    disclosure.open = !event.matches;
  });

  const hasFilters = type || query || selectedCategories.length || inStock
    || Number.isFinite(minimum) || Number.isFinite(maximum) || sort;
  document.querySelector('.catalog-layout__reset').hidden = !hasFilters;
}
