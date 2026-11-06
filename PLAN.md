# Plan
1. [x] App shell: mobile-first UI with two themes (Shadow Monarch + Ember Gate orange/black), persisted preference.
2. [x] Email-code sign-in (one-time code by email) restricted to the single user "Jangopi" (first claim or OWNER_EMAIL).
3. [x] Cloud-synced save file + event log (Netlify Database) via Netlify Functions so all devices see the same data; offline fallback on-device.
4. [x] Core features: awakening cinematic, dashboard, quests (daily/weekly/monthly/secret/custom), XP/levels/ranks/attributes, dungeons + boss battles, Red Gate, Shadow Army + extraction cinematic, skills, inventory/armory, achievements, analytics/history/records, training arena, notifications, settings, voice + SFX + music.
5. [ ] Connectors: RESEND_API_KEY (+ OWNER_EMAIL) for sign-in email; optional ELEVENLABS_API_KEY for premium voice. Future ideas: health/step import (Google Fit / Apple Health export), calendar reminders, push notifications for daily quest arrival.
6. [x] PWA install support (manifest, icons, service worker with offline precache).
