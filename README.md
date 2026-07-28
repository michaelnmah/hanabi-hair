# Hanami Hair

Luxury hair e-commerce storefront with a split deployment architecture:

- **Frontend:** React + Vite on Vercel
- **Backend:** Express on Render
- **Database:** Supabase Postgres with RLS
- **Payments:** Stripe Checkout and signed webhooks

## Local development

```bash
npm install
cp .env.example apps/api/.env
cp .env.example apps/web/.env
npm run dev:api
npm run dev:web
```

The storefront can be browsed without credentials. Checkout and newsletter
signup activate after the backend environment variables are configured.

## Supabase

Apply `supabase/migrations/20260728010000_create_hanami_commerce.sql` to the
selected Supabase project. The migration:

- creates and seeds the catalogue;
- keeps orders, order items and subscribers server-only;
- enables RLS on every public table;
- exposes only active product reads to public clients.

Set these private Render variables:

```text
SUPABASE_URL=https://zmvkhjifsjdmsqkczsab.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Never expose the service-role key to Vercel or any `VITE_` variable.

## Stripe

Create a Stripe webhook endpoint pointing to:

```text
https://hanami-hair-api.onrender.com/api/webhooks/stripe
```

Listen for `checkout.session.completed`, then set these private Render
variables:

```text
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Prices are resolved on the backend from Supabase, not accepted from the
browser.

## Vercel

Import the repository and keep the repository root as the project root.
`vercel.json` installs the workspace, builds `@hanami/web`, and publishes
`apps/web/dist`.

Set:

```text
VITE_API_URL=https://hanami-hair-api.onrender.com
```

## Render

Create a Blueprint from this repository. `render.yaml` builds only the API
workspace, starts the Express service, and checks `/health`.

Set:

```text
CLIENT_URL=https://hanabi-hair.vercel.app
ALLOWED_ORIGINS=https://hanabi-hair.vercel.app
```

## Production

- Storefront: https://hanabi-hair.vercel.app
- API: https://hanami-hair-api.onrender.com
- Health check: https://hanami-hair-api.onrender.com/health

## Brand assets

Generated campaign photography lives in `apps/web/public/images`. The supplied
Hanami monogram is preserved there as both the original and a navigation crop.

The supplied Parfumerie Script Text and Regular font files are bundled locally;
see `apps/web/public/fonts/README.md`.
