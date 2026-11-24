globalThis.EmberShop = {
  name: 'Ember & Crust',
  locality: 'Campsie, NSW',
  heroPhoto: { url: 'https://images.pexels.com/photos/4109073/pexels-photo-4109073.jpeg?auto=compress&cs=tinysrgb&w=1500', small: 'https://images.pexels.com/photos/4109073/pexels-photo-4109073.jpeg?auto=compress&cs=tinysrgb&w=760', alt: 'Close-up of a freshly baked pepperoni pizza' },
  address: '', // Enter the full street address, suburb, state and postcode.
  phone: '', // Enter the public shop phone number, e.g. in +61 format.
  directionsUrl: '',
  sample: true,
  timeZone: 'Australia/Sydney',
  hours: {
    Mon: [], Tue: [['16:30', '21:00']], Wed: [['16:30', '21:00']],
    Thu: [['16:30', '21:00']], Fri: [['16:30', '22:00']],
    Sat: [['16:30', '22:00']], Sun: [['16:30', '21:00']],
  },
  delivery: {
    minimum: 3000,
    zones: [
      { postcode: '2194', suburbs: ['Campsie', 'Clemton Park'], fee: 500 },
      { postcode: '2193', suburbs: ['Canterbury', 'Ashbury'], fee: 600 },
      { postcode: '2206', suburbs: ['Earlwood'], fee: 650 },
    ],
  },
  ordering: { url: '', pickupUrl: '', deliveryUrl: '' },
  about: 'Ember & Crust is a sample neighbourhood pizza shop inspired by dinner on Beamish Street: familiar toppings, crisp edges and a box to share.',
};
