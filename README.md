# Shukarsh Frontend

Frontend for the Shukarsh e-commerce store.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
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
3. Add the environment variable:
   - `NEXT_PUBLIC_API_URL` — your Render backend URL, e.g., `https://shukarsh-backend.onrender.com`
4. Deploy.
