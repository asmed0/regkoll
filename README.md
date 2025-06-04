# RegKoll

**RegKoll is a Swedish license plate lookup service.**

- Instantly check if a Swedish registration number (regnr) belongs to a police vehicle.
- Uses a serverless API and a curated list of police-owned plates.
- Fast, mobile-friendly, and privacy-focused.
- Built with React, Vite, and TypeScript.
- Includes Google AdSense for monetization and Vercel Analytics for privacy-friendly stats.

---

## Features

- **React + Vite** frontend
- **Serverless API** (`api/check.js`) for plate lookups
- **Google AdSense** ad slots (side and bottom, responsive)
- **Vercel Analytics** for traffic insights
- **Responsive, centered UI** for desktop and mobile

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Development (with API & Ads)

```bash
npm run dev:all
```

- Starts both the Vite frontend and Vercel serverless API locally.
- Visit [http://localhost:5173](http://localhost:5173) (frontend) and [http://localhost:3000/api/check](http://localhost:3000/api/check) (API).

### 3. Linting

```bash
npm run lint
```

---

## Deployment

Deploy to Vercel for production-ready serverless hosting:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/vercel/tree/main/examples/vite-react&template=vite-react)

---

## API Endpoint

The serverless function in `api/check.js` checks if a plate is police-owned:

```bash
curl https://<your-deployment>.vercel.app/api/check?plate=ABC123
```

Response:

```json
{ "owned": true }
```

---

## Data

- Police plates are loaded from `data/police-plates.txt` (one plate per line, uppercase).

---

## Google AdSense Integration

- The AdSense script is included in `index.html`:
  ```html
  <script
    async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5098435216044388"
    crossorigin="anonymous"
  ></script>
  ```
- Ad slots are rendered using the `AdBanner` React component (`src/AdBanner.tsx`).
- **To enable ads:** Replace `YOUR_LEFT_SLOT_ID`, `YOUR_RIGHT_SLOT_ID`, and `YOUR_BOTTOM_SLOT_ID` in `src/App.tsx` with your AdSense slot IDs.
- Side ads show only on desktop; bottom ad is always visible.

---

## Analytics

- Uses [@vercel/analytics](https://vercel.com/docs/analytics) for privacy-friendly traffic analytics.
- Analytics are enabled by default in production.

---

## Customization

- Edit `src/App.tsx` and `src/App.css` for UI changes.
- Update `data/police-plates.txt` to change the plate list.

---

## License

MIT
