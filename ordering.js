(() => {
  const shop = globalThis.EmberShop;
  const { items, pizzaOptions } = globalThis.EmberMenu;

  const byId = new Map(items.map(item => [item.id, item]));
  const money = cents => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
  const zoneFor = postcode => shop.delivery.zones.find(zone => zone.postcode === postcode);
  const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeParts = new Intl.DateTimeFormat('en-AU', {
    timeZone: shop.timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const minutes = time => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };
  function displayTime(time) {
    const [hour, minute] = time.split(':').map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 || hour === 24 ? 'am' : 'pm'}`;
  }
  function storeAvailability(now = new Date()) {
    const parts = Object.fromEntries(timeParts.formatToParts(now).map(({ type, value }) => [type, value]));
    const day = week.indexOf(parts.weekday);
    const current = Number(parts.hour) * 60 + Number(parts.minute);
    const today = shop.hours[week[day]] ?? [];
    const yesterday = shop.hours[week[(day + 6) % 7]] ?? [];
    const open = today.some(([start, end]) => current >= minutes(start) && (minutes(end) < minutes(start) || current < minutes(end)))
      || yesterday.some(([start, end]) => minutes(end) < minutes(start) && current < minutes(end));
    if (open) return { open, next: '' };
    for (let offset = 0; offset <= 7; offset += 1) {
      const weekday = week[(day + offset) % 7];
      const next = (shop.hours[weekday] ?? []).map(([start]) => start).sort().find(start => offset || minutes(start) > current);
      if (next) return { open, next: `${offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : weekday} at ${displayTime(next)}` };
    }
    return { open, next: '' };
  }

  function eligiblePizzas(item) {
    return item.bundle.eligible.map(id => byId.get(id)).filter(pizza => pizza?.pizza && pizza.available !== false);
  }

  function resolveLine(line) {
    const item = byId.get(line?.id);
    if (!item || item.available === false || !Number.isInteger(line.qty) || line.qty < 1 || line.qty > 99) return null;
    let price = item.price;
    let details = [];
    if (item.pizza) {
      const size = pizzaOptions.sizes.find(option => option.id === line.size);
      const crust = pizzaOptions.crusts.find(option => option.id === line.crust);
      const extras = Array.isArray(line.extras) ? [...new Set(line.extras)] : [];
      const extraOptions = pizzaOptions.extras.filter(option => extras.includes(option.id) && (!item.extras || item.extras.includes(option.id)));
      if (!size || !crust || extraOptions.length !== extras.length) return null;
      price += size.price + crust.price + extraOptions.reduce((total, option) => total + option.price, 0);
      details = [size.name, crust.name, ...extraOptions.map(option => option.name)];
      return { item, price, details, selection: { id: item.id, size: size.id, crust: crust.id, extras: extraOptions.map(option => option.id) } };
    }
    if (item.bundle) {
      const allowed = eligiblePizzas(item);
      const choices = Array.isArray(line.choices) ? line.choices.map(id => allowed.find(pizza => pizza.id === id)) : [];
      if (choices.length !== item.bundle.count || choices.some(pizza => !pizza)) return null;
      details = [item.bundle.size, ...choices.map(pizza => pizza.name), item.bundle.includes].filter(Boolean);
      return { item, price, details, selection: { id: item.id, choices: choices.map(pizza => pizza.id) } };
    }
    return { item, price, details, selection: { id: item.id } };
  }

  function orderTotals(cart, mode, postcode) {
    const subtotal = cart.reduce((sum, line) => sum + (resolveLine(line)?.price ?? 0) * line.qty, 0);
    const zone = mode === 'delivery' ? zoneFor(postcode) : null;
    const fee = zone?.fee ?? 0;
    const shortfall = mode === 'delivery' ? Math.max(0, shop.delivery.minimum - subtotal) : 0;
    return { subtotal, zone, fee, shortfall, total: subtotal + fee };
  }

  function providerFor(mode) {
    return (mode === 'delivery' ? shop.ordering.deliveryUrl : shop.ordering.pickupUrl) || shop.ordering.url;
  }

  globalThis.EmberOrdering = { byId, money, week, displayTime, storeAvailability, eligiblePizzas, resolveLine, zoneFor, orderTotals, providerFor };
})();
