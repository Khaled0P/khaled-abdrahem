// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('product-popup');
  const closeBtn = document.getElementById('popup-close');
  const titleEl = document.getElementById('popup-title');
  const priceEl = document.getElementById('popup-price');
  const imgEl = document.getElementById('popup-img')
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
      imgEl.src = product.featured_image

      //render variant selectors
      variantsEl.innerHTML = ''; //clear previous popup data
      
      product.options.forEach((opt, idx) => {
        if (opt.name.toLowerCase() === 'color') {
          // Render as buttons
          const variantTtile = document.createElement('div');
          variantTtile.textContent= opt.name;
          variantTtile.classList.add('variant-name');
          const wrapper = document.createElement('div');
          wrapper.classList.add('color-options');
          opt.values.forEach((v) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = v;
            btn.dataset.index = idx;
            btn.dataset.value = v;
            btn.classList.add('color-btn');
            btn.style.setProperty('--stripe-color', v.toLowerCase()); //set side colored stripe

            btn.addEventListener('click', () => {
              // clear previous active button in this group
              wrapper
                .querySelectorAll('.color-btn')
                .forEach((b) => b.classList.remove('active'));
              btn.classList.add('active');
            });

            wrapper.appendChild(btn);
          });
          variantsEl.appendChild(variantTtile);
          variantsEl.appendChild(wrapper);
        } else {
          // default: render as select
          const variantTitle = document.createElement('div');
          variantTitle.textContent= opt.name;
          variantTitle.classList.add('variant-name');
          const select = document.createElement('select');
          select.classList.add('default-select')
          select.dataset.index = idx;

          opt.values.forEach((v) => {
            const optionEl = document.createElement('option');
            optionEl.value = v;
            optionEl.textContent = v;
            select.appendChild(optionEl);
          });
          variantsEl.appendChild(variantTitle)
          variantsEl.appendChild(select);
        }
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
    const selectedOptions = currentProduct.options.map((opt, idx) => {
      if (opt.name.toLowerCase() === 'color') {
        const activeBtn = variantsEl.querySelector(
          `.color-btn[data-index="${idx}"].active`
        );
        return activeBtn ? activeBtn.dataset.value : null;
      } else {
        const select = variantsEl.querySelector(`select[data-index="${idx}"]`);
        return select ? select.value : null;
      }
    });

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

      await addToCart(jacketVariant.id, 1);
    }

    popup.classList.add('hidden'); // close popup after adding
  });

  //Shopify money formatting
  function formatMoney(cents) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      currencyDisplay: 'symbol'
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
