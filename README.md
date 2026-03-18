# 🛍️ Waves & Wires — Customer Store

Customer-facing e-commerce site. Deployed at **wavesandwires.com**.

## Setup
```bash
cp .env.example .env   # Fill in Supabase keys + VITE_SITE_URL=https://wavesandwires.com
npm install
npm run dev
```

## Deploy (Vercel)
```bash
vercel
# Add env vars in Vercel dashboard
```

## Deploy (Netlify)
```bash
npm run build
# Drag dist/ to netlify.com or connect GitHub repo
```

## Supabase Auth Redirect
In Supabase → Authentication → URL Configuration:
- Site URL: `https://wavesandwires.com`
- Redirect URLs: `https://wavesandwires.com/auth?verified=true`
