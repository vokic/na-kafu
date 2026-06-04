# na kafu?

Faithful 1:1 rebuild of the `na-kafu-klarna.html` prototype in **Next.js (App Router) + TypeScript**.
Frontend phase: the whole flow works end-to-end on the client (localStorage). The backend
(Supabase + API routes + Resend + SSR/OG) plugs in behind the existing seams (see `HANDOVER.md`).

## Run

```bash
npm install
npm run dev      # http://localhost:3000 (or next free port)
npm run build    # production build (dev tools are stripped)
npm start        # serve the production build
```

## Routes

| Route | What |
|---|---|
| `/` | Sender flow: home → build → sent (one step machine) |
| `/sent` | Confirmation (reads the last created invite; refresh-safe) |
| `/p/[token]` | Recipient: receive → reveal (friend) → accept / decline → result |
| `/m/[token]` | Sender's status/manage page + events timeline |
| `/privacy`, `/terms` | Static legal (draft copy) |

## How it's wired

- **CSS**: the prototype `<style>` is copied **verbatim** into `src/app/globals.css` (all 6 themes,
  holo/aurora animated backgrounds, heart motion). Only edits: font-family → `next/font` vars, plus a
  cross-device normalization + responsive block (full-bleed on mobile, 404px phone-card on desktop).
- **Themes**: `data-theme` on the `.phone` shell, switched via `src/state/ThemeProvider.tsx`. Default `light`.
- **Data layer** (`src/lib/data/`): `InviteStore` interface shaped like the future REST API
  (`HANDOVER.md` §7.3). FE impl = `LocalInviteStore` (localStorage, client token gen, friend-mode privacy
  stripping, status + events). Swap one line in `src/lib/data/index.ts` for the API impl later.
- **i18n** (`src/lib/i18n/`): all Serbian copy centralized (`sr.ts` + mode-aware `copy.ts`). Locale-ready.
- **Dev tools**: the `⚡` prefill and `demo` stepper are gated behind `isDev` (`src/lib/devFlag.ts`) and
  excluded from production builds. The 20-tap easter egg stays in prod.

## Backend handoff (next phase)

Swap `LocalInviteStore` → `ApiInviteStore`; server token gen; `/p` + `/m` become SSR (+ dynamic OG for `/p`);
image upload replaces base64; Resend emails on create/respond. The UI components need no changes.
See `HANDOVER.md` §6–§8, §12.
