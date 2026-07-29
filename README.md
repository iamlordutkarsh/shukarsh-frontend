# Shukarsh Frontend

Frontend for the Shukarsh e-commerce store.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Razorpay Checkout.js

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   # Optional. Shows the WhatsApp chat button. Country code, no plus sign.
   NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Deployment

### Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the environment variables:
   - `NEXT_PUBLIC_API_URL` — your Render backend URL, e.g., `https://shukarsh-backend.onrender.com`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — the support number with its country code and no
     plus sign, e.g., `919876543210`. Leave it out and the chat button stays hidden
     rather than opening a chat with nobody.
4. Deploy.
