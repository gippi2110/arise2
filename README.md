# Shadow System

A personal Solo Leveling-inspired real-life RPG for a single Player (Jangopi). Real-world activity (training, running, reading, study, code, hydration, sleep) drives an RPG progression: XP, levels, E→National ranks, attributes, dungeons with boss fights, a Red Gate survival mode, a Shadow Army, skills, inventory and achievements, all wrapped in a cinematic System interface with voice, synthesized sound and generated artwork.

## Stack
- Vite + React 18 + TypeScript + Tailwind + Framer Motion, installable PWA (offline-capable).
- Netlify Functions (`netlify/functions/api.mts`, `voice.mts`) for auth, cloud save, event log and optional premium voice.
- Netlify Database (Postgres via Drizzle, schema in `db/schema.ts`, migrations in `netlify/database/migrations/`).
- Web Audio API for all sound effects, generative music and the System voice presence layer.
- Original artwork generated through Netlify AI Gateway at build time, stored in `public/art/`.

## Sign-in
Email + one-time code. The first email verified claims the System permanently (or set `OWNER_EMAIL`). Codes are delivered with Resend (`RESEND_API_KEY`, optional `RESEND_FROM`). Without a key, the code is written to the `api` function log so you can still sign in.

## Connectors / environment variables
| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Sends the sign-in code by email (required for normal sign-in). |
| `OWNER_EMAIL` | Locks the System to one address. Optional; otherwise first verified email claims it. |
| `RESEND_FROM` | Sender address, e.g. `Shadow System <system@yourdomain.com>`. Defaults to Resend's onboarding sender (only delivers to the Resend account owner). |
| `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` | Optional studio-grade System voice. Lines are cached in Netlify Blobs. Without it the built-in deep voice engine is used. |

## Develop
```
npm install
netlify dev --port 8889
```
Schema changes: edit `db/schema.ts`, then `npx drizzle-kit generate --name <change>`. Never apply migrations manually; Netlify applies them on deploy.

## Themes
Two themes live in `src/index.css`: **Shadow Monarch** (black / midnight navy / electric blue / violet / orange accents) and **Ember Gate** (orange and black). Switch in Settings.
