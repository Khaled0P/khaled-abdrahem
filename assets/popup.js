// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('product-popup');
  const closeBtn = document.getElementById('popup-close');
  const titleEl = document.getElementById('popup-title');
  const priceEl = document.getElementById('popup-price');
  const descEl = document.getElementById('popup-description');
  const variantsEl = document.getElementById('popup-variants');
  const addBtn = document.getElementById('popup-add');

  let currentProduct = null;

  // attach open logic to product buttons
  document.querySelectorAll('[data-product-popup]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const handle = btn.dataset.productPopup;

      // fetch product from shopify API
      const res = await fetch(`/products/${handle}.js`);
      const product = await res.json();
      currentProduct = product;
      console.log(product);

      // populate popup fields
      titleEl.textContent = product.title;
      priceEl.textContent = formatMoney(product.price);
      descEl.innerHTML = product.description;

      //render variant selectors
      variantsEl.innerHTML = '';
      product.options.forEach((opt, idx) => {
        const select = document.createElement('select');
        select.dataset.index = idx;

        opt.values.forEach((v) => {
          const optionsEl = document.createElement('option');
          optionsEl.value = v;
          optionsEl.textContent = v;
          select.appendChild(optionsEl);
          console.log(select);
          console.log(v);
        });
        variantsEl.appendChild(select);
      });
      popup.classList.remove('hidden');
    });
  });

  // close popup
  closeBtn.addEventListener('click', () => {
    popup.classList.add('hidden');
  });

  // Add to cart
  addBtn.addEventListener('click', async () => {
    if (!currentProduct) return;

    // find selected variant
    const selectedOptions = Array.from(
      variantsEl.querySelectorAll('select')
    ).map((s) => s.value);

    const variant = currentProduct.variants.find((v) => {
      return v.options.every((opt, idx) => opt === selectedOptions[idx]);
    });

    if (!variant) {
      alert('Please select a valid variant');
      return;
    }

    //Add product
    await addToCart(variant.id, 1);

    //extra rule medium + black -> auto add soft winter jacker
    if (selectedOptions.includes('Black') && selectedOptions.includes('M')) {
      const jacket = await fetch('/products/dark-winter-jacket.js').then((r) =>
        r.json()
      );
      const jacketVariant = jacket.variants[0]; // get first available variant
      console.log(jacket);
      
      await addToCart(jacketVariant, 1);
    }

    popup.classList.add('hidden'); // close popup after adding
  });

  //Shopify money formatting
  function formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CAD',
    }).format(cents / 100);
  }

  // Add to cart logic
  async function addToCart(variantId, qty) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: variantId, quantity: qty }),
    });
  }
});
