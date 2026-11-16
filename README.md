# URL Keeper (React + Supabase)

## Setup
1. Create a project at supabase.com, open **SQL Editor**, and run `supabase.sql`.
2. Copy `.env.example` to `.env` and fill in the project URL and anon key (Project Settings → API).
3. `npm install && npm run dev`

## Endpoints
- `/` – lists every stored key and URL
- `/store?url=https://example.com` – generates a unique key and saves the pair
- `/get?key=abc123` – shows the URL stored under that key
