(() => {
  const categories = [
    { id: 'deals', name: 'Deals' },
    { id: 'classic', name: 'Classic Pizzas' },
    { id: 'gourmet', name: 'Gourmet Pizzas' },
    { id: 'sides', name: 'Sides' },
    { id: 'desserts', name: 'Desserts' },
    { id: 'drinks', name: 'Drinks' },
  ];

  const pizzaOptions = {
    sizes: [
      { id: 'regular', name: 'Regular · 10″', price: 0 },
      { id: 'large', name: 'Large · 12″', price: 500 },
      { id: 'family', name: 'Family · 15″', price: 950 },
    ],
    crusts: [
      { id: 'hand', name: 'Hand-stretched', price: 0 },
      { id: 'thin', name: 'Thin & crispy', price: 0 },
      { id: 'cheese', name: 'Cheese-stuffed', price: 400 },
    ],
    extras: [
      { id: 'mozzarella', name: 'Extra mozzarella', price: 250 },
      { id: 'pepperoni', name: 'Extra pepperoni', price: 300 },
      { id: 'olives', name: 'Kalamata olives', price: 200 },
      { id: 'chilli', name: 'Chilli flakes', price: 0 },
    ],
  };

  const items = [
    { id: 'double', category: 'deals', name: 'The Double Up', description: 'Pick any two large classic pizzas. Garlic bread comes along for the ride.', price: 3890, image: 'https://images.pexels.com/photos/5017829/pexels-photo-5017829.jpeg?auto=compress&cs=tinysrgb&w=700', bundle: { count: 2, eligible: ['pepperoni', 'margherita', 'garden'], size: 'Large · 12″', includes: 'Garlic bread' } },
    { id: 'pepperoni', category: 'classic', name: 'Pepperoni', description: 'Tomato sauce, fior di latte and crisp-edged pepperoni.', price: 1850, image: 'https://images.pexels.com/photos/7813574/pexels-photo-7813574.jpeg?auto=compress&cs=tinysrgb&w=700', pizza: true, tag: 'House favourite' },
    { id: 'margherita', category: 'classic', name: 'Margherita', description: 'Tomato, fior di latte, fresh basil and a drizzle of olive oil.', price: 1690, image: 'https://images.pexels.com/photos/31596394/pexels-photo-31596394.jpeg?auto=compress&cs=tinysrgb&w=700', pizza: true },
    { id: 'garden', category: 'classic', name: 'Market Garden', description: 'Roasted capsicum, mushrooms, red onion, olives and mozzarella.', price: 1790, pizza: true },
    { id: 'mushroom', category: 'gourmet', name: 'Wild Mushroom', description: 'Roasted mushrooms, garlic cream, mozzarella and thyme.', price: 2190, pizza: true, extras: ['mozzarella', 'olives', 'chilli'] },
    { id: 'hot-honey', category: 'gourmet', name: 'Hot Honey Salami', description: 'Spicy salami, fior di latte and a drizzle of chilli honey.', price: 2290, pizza: true },
    { id: 'garlic', category: 'sides', name: 'Garlic Bread', description: 'Oven-toasted loaf with parsley and garlic butter.', price: 650 },
    { id: 'wedges', category: 'sides', name: 'Seasoned Wedges', description: 'Thick-cut potato wedges with smoky paprika and aioli.', price: 890 },
    { id: 'brownie', category: 'desserts', name: 'Chocolate Brownie', description: 'Rich dark chocolate brownie with a fudgy centre.', price: 750 },
    { id: 'tiramisu', category: 'desserts', name: 'Tiramisu Cup', description: 'Espresso-soaked sponge, mascarpone and cocoa.', price: 890, available: false },
    { id: 'cola', category: 'drinks', name: 'Cola', description: 'Chilled 375 mL can.', price: 350 },
    { id: 'lemon', category: 'drinks', name: 'Sparkling Lemon', description: 'Chilled 330 mL sparkling lemon drink.', price: 450 },
  ];

  globalThis.EmberMenu = { categories, pizzaOptions, items };
})();
