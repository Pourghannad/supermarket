A Persian RTL frontend for browsing grocery products from [azard.net](https://azard.net) API. Aggregates products from **Okala** and **Digikala Jet** based on geographic coordinates.

## API

```
GET https://azard.net/s/?latitude=35.7711&longitude=51.4322
```

Response includes:
- `total_products`, `okala_count`, `digikalajet_count`
- `products[]` — mixed Okala and Digikala Jet product objects

## Features

- Material UI with RTL (Persian) layout
- Location-based product search
- Filter by source (Okala / Digikala Jet)
- Text search by product name, store, or category
- Product cards with image, price, discount, store, delivery time, and badges
- Stats summary bar

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build

```bash
npm run build
npm run preview
```

## Notes

- Prices from the API are in **Rial** and displayed as **Toman** (÷10)
- In development, Vite proxies `/api` → `https://azard.net` to avoid CORS issues
- Default coordinates: Tehran (35.7711, 51.4322)
