# ThirstyClub999 — Laptop 1 Snapshot

> **Branch:** `laptop-1`
> **Date:** July 22, 2026
> **Source:** MacBook — primary development machine
> **Live URL:** https://thirsty.guava.earth

---

## What's in this branch

This is a full snapshot of the ThirstyClub999 PWA as developed on **Laptop 1**. It includes:

### Core Features
- **Auth system** — Login/Signup with ThirstyID or email (Supabase Auth)
- **Dashboard** — Admin panel with user management, analytics widgets
- **Community** — Feed (signals), Events, Leaderboard, Games (Trivia, Treasure Hunt)
- **Shop** — E-commerce with cart, checkout flow, product categories
- **Profile** — User profile with Composio integrations (Spotify, Twitter/X)

### Recent Changes (this laptop)
- ✅ Push notifications backend (`api/send-push.js`) + service worker
- ✅ Composio OAuth proxy (`api/composio-link.js`) — updated to v3 API
- ✅ Mobile responsiveness fixes (iOS input focus, touch targets, fluid typography)
- ✅ Cache version bumped to `v22`
- ✅ Dialog `tabindex` fix for iOS Safari
- ✅ Cursor glow hidden on touch devices

### Tech Stack
- **Frontend:** Vanilla HTML/CSS/JS (PWA with Service Worker)
- **Backend:** Supabase (Auth, Database, Storage)
- **Serverless:** Vercel (API routes)
- **Integrations:** Composio (OAuth), Mailchimp/Mandrill (email)

### Deployment
- **Hosting:** Vercel — aliased to `thirsty.guava.earth`
- **Database:** Supabase (cloud-hosted, shared across all laptops)

---

## ⚠️ Important Notes

1. **Database is cloud-hosted** — Supabase data is NOT in this repo. All laptops share the same database. UI changes won't affect data.
2. **Env vars are NOT committed** — API keys live in `.env.local` (gitignored) and Vercel environment variables.
3. **This branch may conflict with other laptop branches** — each laptop had independent development. Use GitHub's compare feature to review differences before merging.

---

## How to run locally

```bash
# Clone and checkout this branch
git clone https://github.com/Richmondeke/Thirsty.git
cd Thirsty
git checkout laptop-1

# Install dependencies (for Vercel serverless functions)
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: COMPOSIO_API_KEY, SUPABASE_SERVICE_ROLE_KEY, MANDRILL_API_KEY, etc.

# Run with any static server
npx serve .
# Or deploy to Vercel
npx vercel --prod
```

## Comparing branches

```bash
# See differences between laptop versions
git diff laptop-1..laptop-2
git diff laptop-1..laptop-3

# Use GitHub UI: github.com/Richmondeke/Thirsty/compare/laptop-1...laptop-2
```
