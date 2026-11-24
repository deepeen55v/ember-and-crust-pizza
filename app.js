(() => {
  const shop = globalThis.EmberShop;
  const { categories, items, pizzaOptions } = globalThis.EmberMenu;
  const { byId, money, week, displayTime, storeAvailability, eligiblePizzas, resolveLine, zoneFor, orderTotals, providerFor } = globalThis.EmberOrdering;

  const $ = selector => document.querySelector(selector);
  const fill = (selector, value) => document.querySelectorAll(selector).forEach(node => { node.textContent = value; });
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const storageKey = 'ember-and-crust-order-v1';
  const cartDialog = $('#cart-dialog');
  const orderDialog = $('#order-dialog');
  const cartContent = $('#cart-content');
  const orderContent = $('#order-content');

  function restore() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey));
      return {
        mode: data?.mode === 'delivery' ? 'delivery' : 'pickup',
        postcode: zoneFor(data?.postcode) ? data.postcode : '',
        cart: Array.isArray(data?.cart) ? data.cart.filter(resolveLine) : [],
      };
    } catch {
      return { mode: 'pickup', postcode: '', cart: [] };
    }
  }
  const state = restore();
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* This session can still order if storage is blocked. */ }
  }
  function announce(message) { $('#announcer').textContent = message; }
  const phoneHref = shop.phone ? `tel:${shop.phone.replace(/[^+\d]/g, '')}` : '';
  const phoneLink = phoneHref ? `<a href="${escape(phoneHref)}">Call ${escape(shop.phone)}</a>` : '';
  const closedText = availability => availability.next ? `Closed · opens ${availability.next}` : 'Ordering is currently closed';
  const zoneText = zone => `Delivery to ${zone.suburbs.join(' / ')} ${zone.postcode}`;

  function renderShop() {
    document.title = `${shop.name} Pizza · ${shop.locality}`;
    $('.brand').setAttribute('aria-label', `${shop.name} home`);
    fill('[data-shop]', shop.name);
    fill('[data-locality]', shop.locality);
    $('#sample-banner').hidden = !shop.sample;
    fill('#about', shop.about);
    const hero = $('#hero-photo');
    if (shop.heroPhoto.small) hero.srcset = `${shop.heroPhoto.small} 760w, ${shop.heroPhoto.url} 1500w`;
    hero.src = shop.heroPhoto.url;
    hero.alt = shop.heroPhoto.alt;
    fill('#address', shop.address || (shop.sample ? `${shop.locality} · Sample location` : shop.locality));
    if (phoneLink) {
      $('#phone').innerHTML = phoneLink;
      $('#hero-contact').href = phoneHref;
      $('#hero-contact').textContent = shop.phone;
    } else {
      $('#phone').hidden = true;
    }
    const destination = shop.address || shop.locality;
    const directions = shop.directionsUrl || (destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : '');
    if (directions) {
      $('#directions').href = directions;
      $('#directions').hidden = false;
      $('#directions').firstChild.textContent = shop.address ? 'Get directions ' : 'Directions to suburb ';
    }
    $('#hours').innerHTML = week.map(day => {
      const spans = shop.hours[day] ?? [];
      return `<div><dt>${day}</dt><dd>${spans.map(([start, end]) => `${displayTime(start)}–${displayTime(end)}`).join(', ') || 'Closed'}</dd></div>`;
    }).join('');
    $('#zones').innerHTML = shop.delivery.zones.map(zone => `<li>${escape(zone.suburbs.join(', '))} · ${escape(zone.postcode)}</li>`).join('');
    fill('#delivery-minimum', `${money(shop.delivery.minimum)} delivery minimum`);
  }

  function renderMenu() {
    $('#categories').innerHTML = categories.map(({ id, name }, index) => `<a href="#${id}"${index === 0 ? ' aria-current="location"' : ''}>${escape(name)}</a>`).join('');
    $('#menu-sections').innerHTML = categories.map(({ id, name }) => `<section class="menu-section" id="${id}" aria-labelledby="heading-${id}"><div class="section-heading"><h3 id="heading-${id}">${id === 'deals' ? 'Featured deals' : escape(name)}</h3></div><div class="cards ${id}">${items.filter(item => item.category === id).map(card).join('')}</div></section>`).join('');
    const sections = categories.map(({ id }) => document.getElementById(id));
    const navLinks = [...$('#categories').children];
    function updateCategory() {
      const position = $('.category-nav').getBoundingClientRect().bottom + 48;
      const current = sections.findLastIndex(section => section.getBoundingClientRect().top <= position);
      const link = navLinks[Math.max(0, current)];
      if (link.hasAttribute('aria-current')) return;
      navLinks.forEach(node => node.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'location');
      const bar = $('#categories');
      const bounds = bar.getBoundingClientRect();
      const active = link.getBoundingClientRect();
      if (active.right > bounds.right || active.left < bounds.left) {
        bar.scrollLeft += active.left - bounds.left - 4;
      }
    }
    let pending = false;
    window.addEventListener('scroll', () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { updateCategory(); pending = false; });
    }, { passive: true });
    updateCategory();
  }

  function card(item) {
    const unavailable = item.available === false || (item.bundle && !eligiblePizzas(item).length);
    const image = item.image ? `<img src="${escape(item.image)}" width="700" height="394" alt="" loading="lazy">` : '';
    const label = unavailable ? 'Sold out' : item.bundle ? 'Build deal' : item.pizza ? 'Customise' : 'Add';
    return `<article class="card">${image}<div class="card-body">${item.tag ? `<p class="tag">${escape(item.tag)}</p>` : ''}<h4>${escape(item.name)}</h4><p>${escape(item.description)}</p><div class="card-bottom"><strong>${item.pizza ? 'From ' : ''}${money(item.price)}</strong><button class="button ${item.bundle ? 'primary' : 'outline'}" data-item="${escape(item.id)}" aria-label="${label} · ${escape(item.name)}"${unavailable ? ' disabled' : ''}>${label}</button></div></div></article>`;
  }

  function refreshStatus() {
    const availability = storeAvailability();
    $('#store-state').innerHTML = `<span class="store-dot ${availability.open ? '' : 'closed'}"></span>${availability.open ? 'Open now' : closedText(availability)}`;
    if (cartDialog.open) updateCartGate();
  }

  function renderSummary() {
    const { subtotal, zone, total } = orderTotals(state.cart, state.mode, state.postcode);
    fill('[data-count]', state.cart.reduce((count, line) => count + line.qty, 0));
    fill('#mobile-total', money(subtotal && zone ? total : subtotal));
    fill('#mode-details', state.mode === 'delivery' && zone ? `${money(zone.fee)} fee · ${money(shop.delivery.minimum)} minimum` : '');
    fill('#menu-mode-label', state.mode === 'delivery' ? `Delivery${zone ? ` · ${zone.postcode}` : ''}` : 'Pickup');
    save();
  }

  function scrollToMenu() { $('#menu').scrollIntoView(); }

  function showOrder(title, markup) {
    $('#order-title').textContent = title;
    orderContent.innerHTML = markup;
    if (!orderDialog.open) orderDialog.showModal();
    orderDialog.scrollTop = 0;
  }

  function deliveryForm({ resumeCart = false, browse = false } = {}) {
    showOrder('Check delivery', `<p class="help">Enter a four-digit postcode to check delivery near ${escape(shop.locality)}. Delivery minimum ${money(shop.delivery.minimum)}.</p>
      <form id="postcode-form"><p class="field"><label class="field-label" for="postcode">Delivery postcode</label>
      <input id="postcode" name="postcode" type="text" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required value="${escape(state.postcode)}" placeholder="e.g. ${escape(shop.delivery.zones[0]?.postcode ?? '')}" aria-describedby="postcode-result"></p>
      <p class="help" id="postcode-result" role="status"></p><button class="button primary full" type="submit">Check postcode</button></form>`);
    $('#postcode').focus();
    $('#postcode-form').addEventListener('submit', event => {
      event.preventDefault();
      const postcode = $('#postcode').value;
      const zone = zoneFor(postcode);
      const result = $('#postcode-result');
      const next = providerFor('delivery');
      if (!zone) {
        $('#postcode').setAttribute('aria-invalid', 'true');
        result.classList.add('problem');
        result.textContent = 'Delivery is unavailable for this postcode. Pickup is available during opening hours.';
        return;
      }
      state.mode = 'delivery';
      state.postcode = postcode;
      $('#postcode').removeAttribute('aria-invalid');
      result.classList.remove('problem');
      result.textContent = `${zoneText(zone)} · ${money(zone.fee)} fee`;
      renderSummary();
      if (resumeCart) renderCart();
      if (browse && next && storeAvailability().open) {
        window.location.assign(next);
        return;
      }
      orderDialog.close();
      announce(result.textContent);
      if (resumeCart) cartContent.querySelector('[data-cart-mode="delivery"]').focus();
      else scrollToMenu();
    });
  }

  function chooseMode() {
    showOrder('How are you ordering?', '<div class="mode-controls"><button class="button outline" data-set-mode="pickup">Pickup</button><button class="button outline" data-set-mode="delivery">Delivery</button></div>');
  }

  function start(mode) {
    if (mode === 'delivery') { deliveryForm({ browse: true }); return; }
    state.mode = 'pickup';
    renderSummary();
    const url = providerFor('pickup');
    if (url && storeAvailability().open) { window.location.assign(url); return; }
    scrollToMenu();
  }

  function optionSelect(name, label, options) {
    return `<p class="field"><label class="field-label" for="opt-${name}">${label}</label><select name="${name}" id="opt-${name}" required>${options.map(option => `<option value="${escape(option.id)}">${escape(option.name)}${option.price ? ` (+${money(option.price)})` : ''}</option>`).join('')}</select></p>`;
  }

  function customise(item) {
    let fields;
    if (item.bundle) {
      const options = [{ id: '', name: 'Choose a pizza' }, ...eligiblePizzas(item).map(pizza => ({ id: pizza.id, name: pizza.name }))];
      fields = Array.from({ length: item.bundle.count }, (_, index) => optionSelect(`pizza-${index}`, `Pizza ${index + 1} · ${escape(item.bundle.size)}`, options)).join('');
    } else {
      const extras = pizzaOptions.extras.filter(option => !item.extras || item.extras.includes(option.id));
      fields = optionSelect('size', 'Size', pizzaOptions.sizes) + optionSelect('crust', 'Crust', pizzaOptions.crusts);
      if (extras.length) fields += `<fieldset><legend>Extras</legend>${extras.map(option => `<label class="option"><input type="checkbox" name="extras" value="${escape(option.id)}"><span>${escape(option.name)}</span><span>${option.price ? `+${money(option.price)}` : 'Free'}</span></label>`).join('')}</fieldset>`;
    }
    showOrder(item.name, `<p class="help">${escape(item.description)}</p><form id="custom-form">${fields}<button class="button primary full" type="submit">Add to cart · <span id="custom-price" aria-live="polite">${money(item.price)}</span></button></form>`);
    const form = $('#custom-form');
    function selection() {
      const formData = new FormData(form);
      if (item.bundle) {
        return { id: item.id, qty: 1, choices: Array.from({ length: item.bundle.count }, (_, index) => formData.get(`pizza-${index}`)) };
      }
      return { id: item.id, qty: 1, size: formData.get('size'), crust: formData.get('crust'), extras: formData.getAll('extras') };
    }
    form.addEventListener('change', () => { fill('#custom-price', money(resolveLine(selection())?.price ?? item.price)); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!resolveLine(selection())) return;
      add(selection());
      orderDialog.close();
    });
  }

  function add(line) {
    const resolved = resolveLine(line);
    if (!resolved) return;
    const key = JSON.stringify(resolved.selection);
    const existing = state.cart.find(entry => JSON.stringify(resolveLine(entry)?.selection) === key);
    if (existing && existing.qty < 99) existing.qty += 1;
    else state.cart.push({ ...resolved.selection, qty: 1 });
    renderSummary();
    announce(`${resolved.item.name} added to your cart.`);
  }

  function updateCartGate() {
    const checkout = $('#checkout');
    if (!checkout) return;
    const { zone, shortfall } = orderTotals(state.cart, state.mode, state.postcode);
    const availability = storeAvailability();
    const message = !availability.open ? `${closedText(availability)}.` : !state.cart.length ? 'Add something from the menu to continue.'
      : state.mode === 'delivery' && !zone ? 'Check your postcode to see the full total.'
      : shortfall ? `Add ${money(shortfall)} to reach the delivery minimum.` : '';
    checkout.disabled = Boolean(message);
    const help = $('#checkout-status');
    const markup = message ? `${escape(message)}${!availability.open && phoneLink ? ` ${phoneLink}` : ''}` : '';
    if (help.innerHTML !== markup) help.innerHTML = markup;
  }

  function renderCart() {
    const { subtotal, zone, fee, total } = orderTotals(state.cart, state.mode, state.postcode);
    const isDelivery = state.mode === 'delivery';
    const provider = providerFor(state.mode);
    const orderLines = state.cart.map((line, index) => {
      const { item, price, details } = resolveLine(line);
      return `<li class="cart-line"><div class="line-main"><h3>${escape(item.name)}</h3><strong>${money(price * line.qty)}</strong></div>
        ${details.length ? `<p class="help">${escape(details.join(' · '))}</p>` : ''}
        <div class="line-controls"><div><button class="button outline quantity" data-line="${index}" data-change="-1" aria-label="Decrease ${escape(item.name)} quantity"${line.qty === 1 ? ' disabled' : ''}>−</button><span>${line.qty}</span><button class="button outline quantity" data-line="${index}" data-change="1" aria-label="Increase ${escape(item.name)} quantity"${line.qty === 99 ? ' disabled' : ''}>+</button></div><button class="text-action" data-line="${index}" data-change="remove" aria-label="Remove ${escape(item.name)}">Remove</button></div></li>`;
    }).join('');
    cartContent.innerHTML = `<div class="mode-controls"><button class="button ${isDelivery ? 'outline' : 'primary'}" data-cart-mode="pickup" aria-pressed="${!isDelivery}">Pickup</button><button class="button ${isDelivery ? 'primary' : 'outline'}" data-cart-mode="delivery" aria-pressed="${isDelivery}">Delivery</button></div>
      ${isDelivery ? `<p class="help">${zone ? escape(zoneText(zone)) : 'Delivery postcode required'} · ${money(shop.delivery.minimum)} minimum. <button class="text-action" data-cart-mode="delivery">${zone ? 'Change postcode' : 'Check postcode'}</button></p>` : `<p class="help">Pickup in ${escape(shop.locality)}</p>`}
      ${orderLines ? `<ul class="cart-list">${orderLines}</ul>` : '<p>Your cart is empty.</p>'}
      <dl class="totals"><div><dt>Subtotal</dt><dd>${money(subtotal)}</dd></div>${isDelivery ? `<div><dt>Delivery fee</dt><dd>${zone ? money(fee) : 'Pending postcode'}</dd></div>` : ''}
      <div class="total"><dt>Total</dt><dd>${isDelivery && !zone ? 'Pending postcode' : money(total)}</dd></div></dl>
      <p id="checkout-status" class="help" role="status"></p><button id="checkout" class="button primary full">${provider ? 'Continue to ordering provider' : 'Review demo order'}</button>
      <p class="help">${provider ? 'You’ll select your items again with the ordering provider.' : 'Demo checkout · No payment, personal details or order submission.'}</p>`;
    updateCartGate();
  }

  function checkout() {
    updateCartGate();
    if ($('#checkout').disabled) return;
    const next = providerFor(state.mode);
    if (next) { window.location.assign(next); return; }
    const { total, zone, subtotal, fee } = orderTotals(state.cart, state.mode, state.postcode);
    const summary = state.cart.map(line => {
      const { item, details } = resolveLine(line);
      return `<li>${line.qty} × ${escape(item.name)}${details.length ? ` <span class="help">· ${escape(details.join(' · '))}</span>` : ''}</li>`;
    }).join('');
    showOrder('Demo order review', `<p>${zone ? escape(zoneText(zone)) : `Pickup in ${escape(shop.locality)}`}</p><ul>${summary}</ul>
      <dl class="totals"><div><dt>Subtotal</dt><dd>${money(subtotal)}</dd></div>${zone ? `<div><dt>Delivery fee</dt><dd>${money(fee)}</dd></div>` : ''}<div class="total"><dt>Total (AUD)</dt><dd>${money(total)}</dd></div></dl>
      <p class="help">This is a demo checkout. No order or payment has been sent.</p><button class="button outline full" data-close>Back to cart</button>`);
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-close')) button.closest('dialog').close();
    if (button.dataset.start) start(button.dataset.start);
    if (button.id === 'menu-mode') chooseMode();
    if (button.hasAttribute('data-cart')) { renderCart(); cartDialog.showModal(); }
    if (button.id === 'checkout') checkout();
    if (button.dataset.setMode === 'pickup') {
      state.mode = 'pickup';
      renderSummary();
      orderDialog.close();
    }
    if (button.dataset.setMode === 'delivery') deliveryForm();
    if (button.dataset.cartMode === 'pickup') {
      state.mode = 'pickup';
      renderSummary();
      renderCart();
      $('[data-cart-mode="pickup"]').focus();
    }
    if (button.dataset.cartMode === 'delivery') deliveryForm({ resumeCart: true });
    if (button.dataset.item) {
      const item = byId.get(button.dataset.item);
      if (!item || item.available === false) return;
      if (item.pizza || item.bundle) customise(item);
      else add({ id: item.id, qty: 1 });
    }
    if (button.dataset.change) {
      const index = Number(button.dataset.line);
      if (button.dataset.change === 'remove') state.cart.splice(index, 1);
      else state.cart[index].qty += Number(button.dataset.change);
      renderSummary();
      renderCart();
      const replacement = cartContent.querySelector(`[data-line="${index}"][data-change="${button.dataset.change}"]:not(:disabled)`);
      (replacement ?? cartContent.querySelector(`[data-line="${index}"][data-change="remove"]`) ?? cartDialog.querySelector('[data-close]')).focus();
    }
  });

  renderShop();
  renderMenu();
  renderSummary();
  refreshStatus();
  setInterval(refreshStatus, 15000);

})();
