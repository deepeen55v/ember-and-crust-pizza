# YADAV Pizza

A static, mobile-first pizza takeaway site. The sample shop is in Campsie, NSW. Menu items, prices, hours and delivery areas are illustrative.

## Run locally

Open `index.html` in a browser, or serve the folder over HTTP:

```sh
python3 -m http.server 8000 --directory .
```

Open [http://localhost:8000](http://localhost:8000). Serving over HTTP gives the cart a stable browser storage origin. Browsers can handle storage for local files differently. Deploy the repository files to any static host.

## Update the shop

| File | Edit |
| --- | --- |
| `data/shop.js` | Shop name, suburb, address, phone, directions, About text, hero photo, Australia/Sydney hours, delivery areas, fees and minimum. Set `sample: false` when the real details are ready. |
| `data/menu.js` | Categories, ingredients, photos, prices, sold-out status, pizza options and bundle rules. |
| `assets/mark.svg` | Shop logo mark and favicon. |
| `index.html` | Hero copy and search description. |

Prices, extras, minimums and fees are integer cents. For instance, `1850` is AUD $18.50. Weekly hours use 24-hour local time. A closed day is an empty array. Multiple intervals and hours that end after midnight are supported. Delivery matches exact four-digit postcodes. Update the listed suburbs and postcode-level fees to match the shop’s real coverage. Omitted phone and street address leave click-to-call hidden and directions pointed at the configured suburb.

## Turn on live ordering

In `data/shop.js`, set `ordering.url` to the provider’s live HTTPS URL. Use `pickupUrl` and `deliveryUrl` for mode-specific links where available. When the link is configured and the shop is open, the matching hero action hands off to the provider. Delivery checks the configured postcode first. Provider links open the provider's independent order flow. Cart transfer requires a provider-specific integration and is currently disabled. With blank links, checkout is a demo review that collects only a delivery postcode where relevant and never sends an order or collects payment or contact details.

## Sample photography

The sample images are loaded from Pexels under the [Pexels licence](https://www.pexels.com/license/). Update the image URLs in the data files to use your own photos. For local files, place them under `assets/` and use a relative URL such as `assets/hero.jpg`.

- [Hero photo](https://www.pexels.com/photo/close-up-shot-of-pepperoni-pizza-4109073/)
- [Deal photo](https://www.pexels.com/photo/pepperoni-pizza-in-close-up-photography-5017829/)
- [Pepperoni photo](https://www.pexels.com/photo/close-up-of-a-pepperoni-pizza-7813574/)
- [Margherita photo](https://www.pexels.com/photo/delicious-margherita-pizza-with-fresh-toppings-31596394/)

## Demo checks

Use `2194` for available delivery ($5 fee, $30 minimum) and `2000` for an unavailable postcode. The Double Up requires two pizza selections. Tiramisu Cup demonstrates a sold-out item. Outside opening hours, the sample store shows its next opening and keeps order review disabled. The shop leaves the cart available for editing while closed.
