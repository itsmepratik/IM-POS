# IM-POS → Electrobun Desktop Migration Plan

**Project:** [itsmepratik/IM-POS](https://github.com/itsmepratik/IM-POS)  
**Stack:** Next.js 16 · Bun · Drizzle ORM · Supabase Postgres · TypeScript  
**Target:** Native cross-platform desktop POS app using Electrobun  
**Connectivity Reality:** WiFi almost always available — rare short outages only  
**Document version:** March 2026 — v2 (fully revised)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Overview](#2-technology-overview)
3. [Current Architecture Analysis](#3-current-architecture-analysis)
4. [Target Architecture](#4-target-architecture)
5. [Migration Phases](#5-migration-phases)
   - Phase 0: Preparation
   - Phase 1: Wrap in Electrobun
   - Phase 2: Offline Safety Net
   - Phase 3: Inventory Integrity & Sync
   - Phase 4: Hardware Integration
6. [File-by-File Changes](#6-file-by-file-changes)
7. [Database Strategy](#7-database-strategy)
8. [Inventory Integrity — The Overselling Problem](#8-inventory-integrity--the-overselling-problem)
9. [Offline & Sync Strategy](#9-offline--sync-strategy)
10. [Hardware Integration](#10-hardware-integration)
11. [Deployment & Updates](#11-deployment--updates)
12. [Keeping the Web Version](#12-keeping-the-web-version)
13. [Risk Register](#13-risk-register)
14. [Decision Checkpoint](#14-decision-checkpoint)
15. [Master Checklist](#15-master-checklist)

---

## 1. Executive Summary

IM-POS is a production Next.js POS system currently deployed on Vercel and backed by Supabase Postgres via Drizzle ORM. The goal is to wrap it in **Electrobun** — a desktop framework (v1, February 2026) that uses Bun as its main process runtime and the system's native WebView for rendering — producing a native desktop application that:

- Survives the rare WiFi dropout gracefully without locking out cashiers
- Protects against overselling through an append-only inventory ledger
- Has direct access to POS hardware (receipt printers, cash drawers, barcode scanners)
- Ships tiny ~14KB delta update patches
- Retains the full existing Next.js codebase with minimal changes
- Continues to work as a web app on Vercel in parallel without any changes to that pipeline

**Connectivity context:** Since WiFi is almost always available, this is not a full offline-first build. The architecture is designed to handle **brief, rare outages** gracefully — not extended offline operation. This significantly simplifies the sync layer while still protecting data integrity.

The migration is structured into **5 phases** (0 through 4), starting with a Preparation Phase that must be completed before any code is written. Each phase delivers a working, shippable result.

---

## 2. Technology Overview

### 2.1 What is Electrobun?

Electrobun is a desktop application framework for TypeScript. Unlike Electron, it does **not** bundle Chromium:

| Component | Electrobun | Electron |
|---|---|---|
| **Main process runtime** | Bun | Node.js |
| **Frontend renderer** | System WebView (WebKit/Edge WebView2) | Bundled Chromium |
| **Bundle size** | ~14MB | ~120–200MB |
| **Startup time** | <50ms | 2–5 seconds |
| **OTA update patches** | ~14KB (delta diff) | Full binary replacement |
| **Native UI layer** | C++/Objective-C | Chromium-based |
| **TypeScript in main process** | Native via Bun | Via Node.js/transpiler |

Electrobun's main process runs in a **Bun context**, meaning `bun:sqlite`, Bun FFI, Bun's native APIs, and your existing Bun toolchain work exactly as they do today — zero adaptation needed.

### 2.2 Why Not Electron?

- Requires switching from Bun to Node.js in the main process — your entire Bun toolchain becomes incompatible
- 120–200MB bundle for a dedicated POS machine is wasteful
- 2–5 second startup is noticeable every morning when the register boots
- No native delta update system — full binary download on every update
- QZ Tray is already doing the heavy lifting of hardware integration, which Electron can't replace cleanly

### 2.3 Why Not Tauri?

- Tauri's backend requires **Rust** — every piece of your existing `lib/`, API routes, and Drizzle logic would need to be rewritten in Rust
- Electrobun's Bun main process allows your TypeScript backend to run as-is with no rewrite
- Tauri has excellent maturity but the language barrier makes it impractical for this codebase

---

## 3. Current Architecture Analysis

### 3.1 Repository Structure

```
IM-POS/
├── app/                        # Next.js App Router — pages, layouts, API routes
├── components/                 # Radix UI + shadcn/ui + MUI + custom components
├── hooks/                      # Custom React hooks
├── lib/                        # DB connection (Drizzle + Postgres), utilities
├── migrations/                 # Manual SQL migrations
├── drizzle/                    # Drizzle-generated migrations (overlaps with /migrations)
├── supabase/                   # Supabase config, edge functions, local dev setup
├── scripts/                    # Utility and maintenance scripts
├── public/                     # Static assets
├── src/test/                   # Vitest unit tests
├── testsprite_tests/           # Additional test suite
├── documentation-reference/   # Internal reference docs
├── middleware.ts               # Supabase auth middleware — runs on EVERY request
├── next.config.js              # Next.js config — no output mode set (full SSR)
├── drizzle.config.ts           # Drizzle ORM config
├── vercel.json                 # Vercel deployment config — active web deployment
├── bunfig.toml                 # Bun runtime config
└── package.json                # Dependencies
```

**Key observations:**
- Full **App Router** with SSR, Server Components, and API routes — not a static app
- Two overlapping migration folders (`/drizzle` and `/migrations`) — needs consolidation
- `middleware.ts` runs Supabase auth token refresh on **every single request** — offline-unsafe
- Live on Vercel at `im-pos-blush.vercel.app` — web version must remain unaffected
- Schema: `locations`, `categories`, `products`, `product_volumes`, `inventory`, `batches`, `transactions`
- The `batches` table already tracks stock receipts as events — exactly the right instinct for the inventory ledger approach

### 3.2 Dependencies Audit

#### ✅ Compatible — No Changes Required

| Package | Notes |
|---|---|
| `next` ^16 | Full server mode runs fine inside the embedded Bun process |
| `react` / `react-dom` ^19 | No issues |
| `drizzle-orm` + `drizzle-kit` | Works as-is; also supports `bun:sqlite` — key for Phase 3 |
| `@supabase/supabase-js` | Works online; needs offline fallback guard |
| `tailwindcss`, Radix UI, shadcn/ui | Pure CSS/JS — no issues |
| `@mui/material`, `@mui/x-date-pickers` | No issues |
| `zod`, `date-fns`, `dayjs` | No issues |
| `recharts`, `framer-motion` | No issues |
| `uuid` | No issues |
| `@ai-sdk/openai` / `ai` | Online-only by nature — handle gracefully when offline |
| `@phosphor-icons/react`, `lucide-react` | No issues |
| All Radix UI primitives | No issues |

#### ⚠️ Needs Changes

| Package | Issue | Fix |
|---|---|---|
| `qz-tray` ^2.2.5 | Separate desktop agent bridging browser to printers — redundant in native app | Keep short-term (still works as fallback); replace with native Bun ESC/POS in Phase 4 |
| `@supabase/ssr` | Auth middleware attempts Supabase token refresh on every request — fails silently offline, locking out cashiers | Add offline guard in `middleware.ts` + disk-cached session (Phase 2) |
| `pg` + `postgres` | Direct Postgres connections — every DB call fails when offline | Wrap in graceful error handling (Phase 2); route through local SQLite with PowerSync (Phase 3) |

#### ❌ Must Remove or Gate

| Package | Issue | Fix |
|---|---|---|
| `@vercel/analytics` | Makes outbound network calls to Vercel infrastructure — throws in desktop context | Gate behind `process.env.VERCEL === "1"` |
| `@vercel/speed-insights` | Same as above | Gate behind `process.env.VERCEL === "1"` |

### 3.3 Critical Issues Identified

**Issue 1 — `middleware.ts` is not offline-safe**  
Every single request passes through Supabase auth middleware which calls `supabase.auth.getUser()`. When offline, this call times out and the cashier is locked out of the POS mid-shift. This is the single most dangerous issue for a physical register.

**Issue 2 — JWT tokens expire while offline**  
Supabase JWTs expire every 1 hour by default. Even if the session is "cached", the token itself becomes invalid after an hour without a refresh round-trip to Supabase. A cashier who opens the POS at 9am and loses WiFi at 9:45am will be locked out at 10am when the token expires.

**Issue 3 — Inventory has no conflict protection**  
The current `inventory` table stores a mutable `quantity` column that gets updated on every sale. With multiple terminals, or a sale during a brief offline moment followed by a sync, two terminals can both read the same quantity, both subtract from it, and silently overwrite each other — resulting in phantom inventory and undetected oversells.

**Issue 4 — All DB calls are online-only**  
`lib/db` connects directly to Supabase Postgres. Every API route that touches the DB will throw `ECONNREFUSED` or hang on timeout during any connectivity blip.

**Issue 5 — Supabase real-time subscriptions drop silently when offline**  
If any part of the app uses Supabase real-time subscriptions for live inventory or order updates, these drop without reconnecting reliably. In desktop mode they also conflict with the PowerSync sync state.

**Issue 6 — Two migration folders**  
`/drizzle` and `/migrations` serve overlapping purposes. Before adding a SQLite migration target in Phase 3, this must be consolidated into a single canonical source of truth.

**Issue 7 — Vercel-specific environment variables**  
Scan all code for `process.env.VERCEL_URL`, `process.env.VERCEL_ENV`, `process.env.VERCEL_REGION` — these are undefined in a desktop context and any code that assumes them will behave unexpectedly.

---

## 4. Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Electrobun Shell                           │
│            (native window, menus, tray icon,                    │
│             global shortcuts, auto-updater)                     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                 Bun Main Process                       │     │
│  │                                                        │     │
│  │  • Spawns Next.js server on localhost:3422             │     │
│  │  • Manages local SQLite via bun:sqlite                 │     │
│  │  • PowerSync daemon — syncs SQLite ↔ Supabase          │     │
│  │  • Disk-cached JWT session (offline auth fallback)     │     │
│  │  • Day-start sync gate (fresh data before first sale)  │     │
│  │  • Hardware drivers:                                   │     │
│  │      - Receipt printer (ESC/POS over USB/Serial)       │     │
│  │      - Cash drawer (via printer ESC/POS port)          │     │
│  │      - Barcode scanner (HID — works Day 1)             │     │
│  │  • IPC bridge — Next.js API routes ↔ hardware layer    │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │          WebView → http://localhost:3422               │     │
│  │                                                        │     │
│  │   Your existing Next.js app — unchanged UI             │     │
│  │   (App Router, SSR, API routes, Drizzle, auth)         │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                  │ sync (when online — almost always)
                  ▼
┌─────────────────────────────────────┐
│         Supabase Postgres           │
│         (cloud source of truth)     │
│                                     │
│  • Inventory ledger validation      │
│  • Multi-terminal sync              │
│  • Reporting and analytics          │
│  • Auth token refresh               │
│  • Historical transaction records   │
└─────────────────────────────────────┘
```

**Data flow principle (given your WiFi availability):**  
The app talks to Supabase Postgres directly for most operations. Local SQLite acts as a **write buffer and read cache** during the rare brief outage — not as the primary database. PowerSync keeps them synchronised continuously when online. The inventory movements ledger protects data integrity regardless of connectivity state.

---

## 5. Migration Phases

---

### Phase 0 — Preparation
**Duration:** 2–3 days  
**Result:** Everything is ready before a single line of Electrobun code is written  
**Risk:** Skipping this phase causes problems in every subsequent phase

This phase exists specifically to de-risk the migration. All the groundwork that needs to be in place before touching the application code is done here. Nothing in Phase 0 changes how the app behaves — it only creates the foundation for everything that follows.

---

#### Step 0.1 — Create a staging Supabase project

Do **not** develop the migration against your production Supabase instance. Create a dedicated staging project that mirrors production.

1. Go to [supabase.com](https://supabase.com) → New project → name it `im-pos-staging`
2. Run your existing migrations against it:
   ```bash
   DATABASE_URL="postgres://...staging-url..." bun run db:migrate
   ```
3. Seed it with a representative subset of production data (products, categories, locations)
4. Create a `.env.staging` file:
   ```env
   DATABASE_URL="postgres://...staging-connection-string..."
   NEXT_PUBLIC_SUPABASE_URL="https://your-staging-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-staging-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-staging-service-role-key"
   RUNTIME="desktop"
   ```

All Phase 1–4 development happens against staging. Production is never touched until each phase is fully validated.

---

#### Step 0.2 — Consolidate migration folders

You have both `/drizzle` (Drizzle-generated) and `/migrations` (manual SQL). Before Phase 3 adds a third SQLite migration target, these must be merged into one canonical folder.

```bash
# 1. Audit what's in each folder
ls drizzle/
ls migrations/

# 2. Identify any SQL files in /migrations not present in /drizzle
# Manual migrations often contain things like RLS policies, triggers,
# custom functions that Drizzle doesn't generate automatically

# 3. Copy any unique /migrations content into /drizzle
# Important: preserve the timestamp ordering in filenames

# 4. Test against the staging DB
DATABASE_URL="...staging..." bunx drizzle-kit migrate

# 5. Once confirmed working, delete /migrations folder
rm -rf migrations/
```

Update `drizzle.config.ts` to point only at `/drizzle`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",             // single canonical folder
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

#### Step 0.3 — Audit and document all Supabase real-time subscriptions

Search the entire codebase for real-time usage:

```bash
grep -r "supabase.channel\|supabase.from.*subscribe\|on('postgres_changes'" app/ components/ hooks/ lib/
```

For every subscription found, document:
- Which table it subscribes to
- What it does with the data (UI update, cache invalidation, etc.)
- Whether it's used in a POS-critical flow or just a reporting/admin view

This inventory is needed in Phase 3 when real-time subscriptions are replaced with PowerSync reactive queries. Do not disable them yet — just document them.

---

#### Step 0.4 — Audit all Vercel-specific environment variable usage

```bash
grep -r "VERCEL_URL\|VERCEL_ENV\|VERCEL_REGION\|VERCEL_GIT\|process.env.VERCEL" app/ lib/ components/ middleware.ts
```

For each occurrence, wrap in a guard:

```typescript
// Before
const url = process.env.VERCEL_URL;

// After
const url = process.env.VERCEL_URL ?? process.env.APP_URL ?? "http://localhost:3422";
```

Add `APP_URL=http://localhost:3422` to `.env.staging`.

---

#### Step 0.5 — Identify all direct Postgres connection points

```bash
grep -r "drizzle\|postgres\|pg\|DATABASE_URL" app/api/ lib/ --include="*.ts" -l
```

List every API route and lib file that calls the database. This becomes the complete list of files to update in Phase 2 (error handling) and Phase 3 (SQLite routing). You need this list before you start — not while you're mid-implementation.

---

#### Step 0.6 — Set up PowerSync account

1. Go to [powersync.com](https://powersync.com) → create account
2. Create a new PowerSync instance connected to your **staging** Supabase project
3. Note the PowerSync instance URL — you'll need it in Phase 3
4. Read through their Supabase integration guide to understand sync rules (you will write these in Phase 3)

PowerSync sync rules are YAML files that define which tables sync, in which direction, and with what filters (e.g., only sync inventory for the current `location_id`). Understanding the structure before Phase 3 saves significant time.

---

#### Step 0.7 — Identify your hardware

Before Phase 4, you need to know exactly what hardware you're integrating with:

| Question | Why it matters |
|---|---|
| Receipt printer make and model? | ESC/POS command sets vary slightly between Epson, Star, Citizen, etc. |
| How does the printer connect? | USB-Serial, USB-Direct, Network (TCP/IP), or Bluetooth |
| Cash drawer connected to printer port or separate? | Affects which ESC/POS command triggers it |
| Barcode scanner model? | HID mode (works Day 1) vs. serial mode (needs driver work) |
| Card terminal model? | SumUp, Square, Stripe Terminal, Verifone — each has its own SDK |
| OS of the POS machine? | macOS = most mature Electrobun support; Windows = WebView2 required |

Document these in a `desktop/hardware.md` file. You will reference it in Phase 4.

---

#### Step 0.8 — Set up the desktop workspace

Create the `desktop/` folder structure now, empty, so it exists in the repo before any code is written:

```bash
mkdir -p desktop/src
touch desktop/src/main.ts
touch desktop/electrobun.config.ts
touch desktop/package.json
touch desktop/hardware.md
```

Add `desktop/node_modules/` and `desktop/dist/` to `.gitignore`:

```gitignore
# Electrobun desktop
desktop/node_modules/
desktop/dist/
desktop/.electrobun/
```

---

#### Step 0.9 — Create a feature branch

All migration work happens in a dedicated branch. Never on `master`.

```bash
git checkout -b feat/electrobun-desktop
git push -u origin feat/electrobun-desktop
```

Keep `master` pointing at the live Vercel deployment throughout the entire migration. Each phase gets its own sub-branch that merges into `feat/electrobun-desktop` after validation.

---

#### Step 0.10 — Define your `.env` strategy

You will have three environments:

| Environment | `.env` file | `RUNTIME` value | Database |
|---|---|---|---|
| Vercel (web) | Vercel environment variables | `web` (or unset) | Supabase Postgres directly |
| Desktop staging | `.env.staging` | `desktop` | Local SQLite + staging Supabase |
| Desktop production | `.env.production` | `desktop` | Local SQLite + production Supabase |

Add `RUNTIME` checks to all environment-dependent code from Phase 2 onward.

---

### Phase 1 — Wrap in Electrobun
**Duration:** 1–2 days  
**Result:** IM-POS running as a native desktop window, all existing features intact  
**Risk:** Low — zero changes to existing application logic  
**Prerequisite:** Phase 0 complete

---

#### Step 1.1 — Install Electrobun

```bash
cd desktop
bun init -y
bun add electrobun
```

---

#### Step 1.2 — `desktop/package.json`

```json
{
  "name": "im-pos-desktop",
  "version": "0.1.0",
  "scripts": {
    "dev": "electrobun dev",
    "build": "electrobun build",
    "start": "electrobun start"
  },
  "dependencies": {
    "electrobun": "latest"
  }
}
```

---

#### Step 1.3 — `desktop/electrobun.config.ts`

```typescript
import { defineConfig } from "electrobun";

export default defineConfig({
  app: {
    name: "IM-POS",
    identifier: "com.impos.app",
    version: "0.1.0",
  },
  build: {
    entrypoint: "./src/main.ts",
    outputDir: "./dist",
  },
  updater: {
    endpoint: "https://your-update-server.com/updates",
    // Configured properly in Phase deployment setup
  },
});
```

---

#### Step 1.4 — `desktop/src/main.ts`

```typescript
import { BrowserWindow, app } from "electrobun";
import { spawn } from "bun";
import { join } from "path";

const PORT = 3422;
const NEXT_ROOT = join(import.meta.dir, "../../"); // repo root

// ── 1. Boot the existing Next.js server ──────────────────────────────────────
const nextProcess = spawn({
  cmd: ["bun", "run", "start", "--", "-p", String(PORT)],
  cwd: NEXT_ROOT,
  env: {
    ...process.env,
    PORT: String(PORT),
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    RUNTIME: "desktop",
  },
  stdout: "pipe",
  stderr: "pipe",
});

// Forward Next.js logs for debugging
(async () => {
  for await (const chunk of nextProcess.stdout) {
    console.log("[next]", new TextDecoder().decode(chunk));
  }
})();
(async () => {
  for await (const chunk of nextProcess.stderr) {
    console.error("[next:err]", new TextDecoder().decode(chunk));
  }
})();

// ── 2. Wait for Next.js to be ready before opening the window ────────────────
async function waitForServer(
  url: string,
  maxAttempts = 40,
  intervalMs = 500
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`[electrobun] Next.js ready after ${i * intervalMs}ms`);
        return;
      }
    } catch {}
    await Bun.sleep(intervalMs);
  }
  throw new Error(
    `[electrobun] Next.js did not become ready within ${(maxAttempts * intervalMs) / 1000}s`
  );
}

await waitForServer(`http://127.0.0.1:${PORT}`);

// ── 3. Open the POS window ────────────────────────────────────────────────────
const win = new BrowserWindow({
  title: "IM-POS",
  url: `http://127.0.0.1:${PORT}`,
  width: 1280,
  height: 800,
  minWidth: 1024,
  minHeight: 700,
});

// ── 4. Cleanup when the window closes ────────────────────────────────────────
app.on("will-quit", () => {
  console.log("[electrobun] Shutting down Next.js server...");
  nextProcess.kill("SIGTERM");
});
```

---

#### Step 1.5 — Gate Vercel-specific packages

In `app/layout.tsx` (or wherever Analytics and SpeedInsights are imported):

```typescript
// Before — always loaded
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// After — only on Vercel
const isVercel = process.env.VERCEL === "1";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        {isVercel && <Analytics />}
        {isVercel && <SpeedInsights />}
      </body>
    </html>
  );
}
```

---

#### Step 1.6 — Build and run

```bash
# In repo root — build Next.js for production
bun run build

# In desktop/ — run the Electrobun app in dev mode
cd desktop
bun run dev
```

**Validation checklist for Phase 1:**
- [ ] App window opens successfully
- [ ] Login page loads and authentication works
- [ ] All POS pages navigate correctly
- [ ] Product search and selection works
- [ ] Transaction creation and completion works
- [ ] Inventory pages load
- [ ] Reports load
- [ ] No console errors related to `@vercel/analytics`

---

### Phase 2 — Offline Safety Net
**Duration:** 3–5 days  
**Result:** Cashiers are never locked out during a WiFi dropout; the app fails gracefully instead of crashing  
**Risk:** Low-Medium — changes to `middleware.ts` and API error handling only  
**Prerequisite:** Phase 1 validated

This phase does not make the app fully offline-capable. It makes the app **survive brief WiFi outages** without catastrophic failure. Given that WiFi is almost always available, this is sufficient for your connectivity reality.

---

#### Step 2.1 — Disk-cached JWT session

The root cause of the lockout problem is twofold:
1. The middleware tries to call Supabase on every request when offline
2. Even with a cached session, the JWT expires after ~1 hour

The fix is to cache the full session to disk in the Bun main process and restore it when offline.

Add to `desktop/src/main.ts`:

```typescript
import { join } from "path";

const SESSION_CACHE_PATH = join(
  app.getPath("userData"),
  "session-cache.json"
);

// IPC handler — Next.js calls this every time the session is refreshed
app.ipc.handle("cache-session", async (session: object) => {
  await Bun.write(SESSION_CACHE_PATH, JSON.stringify({
    session,
    cachedAt: Date.now(),
  }));
});

// Export for use in middleware
export async function loadCachedSession() {
  try {
    const file = Bun.file(SESSION_CACHE_PATH);
    if (!(await file.exists())) return null;
    const data = JSON.parse(await file.text());
    // Accept cached sessions up to 12 hours old — plenty for a shift
    if (Date.now() - data.cachedAt > 12 * 60 * 60 * 1000) return null;
    return data.session;
  } catch {
    return null;
  }
}
```

In your Supabase auth callback (wherever the session is set after login), add:

```typescript
// After successful auth
const { data: { session } } = await supabase.auth.getSession();
if (session && process.env.RUNTIME === "desktop") {
  // Cache to disk via IPC
  await fetch("http://127.0.0.1:3422/api/internal/cache-session", {
    method: "POST",
    body: JSON.stringify(session),
  });
}
```

---

#### Step 2.2 — Offline-safe `middleware.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Routes that never need auth (login page, static assets)
const PUBLIC_ROUTES = ["/login", "/api/auth", "/_next", "/favicon.ico"];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip auth for public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // ── In desktop mode: check connectivity before attempting Supabase call ──
  if (process.env.RUNTIME === "desktop") {
    const isOnline = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/health`,
      {
        method: "HEAD",
        signal: AbortSignal.timeout(1500), // 1.5s timeout — fast enough for UX
      }
    )
      .then(() => true)
      .catch(() => false);

    if (!isOnline) {
      // Offline: allow the request through with a header indicating offline mode
      // The app continues to work; the OfflineIndicator banner will appear
      const response = NextResponse.next({ request: req });
      response.headers.set("x-pos-offline", "true");
      return response;
    }
  }

  // ── Normal Supabase auth flow (online) ───────────────────────────────────
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  if (!user && !pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

#### Step 2.3 — Graceful DB error handling in API routes

Apply this pattern to every API route identified in Step 0.5:

```typescript
// lib/db/errors.ts
export class DatabaseOfflineError extends Error {
  constructor() {
    super("Database unavailable — connectivity issue");
    this.name = "DatabaseOfflineError";
  }
}

export function isConnectionError(error: unknown): boolean {
  const msg = String(error).toLowerCase();
  return (
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("connection terminated") ||
    msg.includes("connection refused") ||
    msg.includes("network error") ||
    msg.includes("fetch failed")
  );
}

export function offlineResponse(details?: string) {
  return Response.json(
    {
      error: "Database temporarily unavailable",
      offline: true,
      details: details ?? "Please check your connection",
    },
    { status: 503 }
  );
}
```

Apply to every API route:

```typescript
// Example: app/api/products/route.ts
import { isConnectionError, offlineResponse } from "@/lib/db/errors";

export async function GET() {
  try {
    const products = await db.select().from(productsTable);
    return Response.json(products);
  } catch (error) {
    if (isConnectionError(error)) {
      return offlineResponse("Products could not be loaded");
    }
    console.error("[api/products]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

#### Step 2.4 — Offline indicator component

```typescript
// components/offline-indicator.tsx
"use client";
import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showRecovered, setShowRecovered] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowRecovered(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowRecovered(true);
        setTimeout(() => setShowRecovered(false), 4000);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [wasOffline]);

  if (showRecovered) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white
                      text-center py-2 text-sm font-medium">
        ✓ Connection restored — data is syncing
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white
                      text-center py-2 text-sm font-medium">
        ⚠️ No internet connection — some features may be unavailable
      </div>
    );
  }

  return null;
}
```

Add `<OfflineIndicator />` to `app/layout.tsx`.

---

#### Step 2.5 — Disable Supabase real-time in desktop mode

Find all subscriptions from Step 0.3 and gate them:

```typescript
// Before
const subscription = supabase
  .channel("inventory-changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "inventory" }, handler)
  .subscribe();

// After — real-time only in web/Vercel mode
// Desktop mode will use PowerSync reactive queries in Phase 3
if (process.env.RUNTIME !== "desktop") {
  const subscription = supabase
    .channel("inventory-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "inventory" }, handler)
    .subscribe();
}
```

This prevents silent subscription failures and state conflicts when running offline.

---

### Phase 3 — Inventory Integrity & Sync
**Duration:** 2–4 weeks  
**Result:** Inventory is protected from overselling and phantom stock; brief outages don't corrupt data  
**Risk:** Medium — data model change to inventory, but additive (no destructive migrations)  
**Prerequisite:** Phase 2 validated; PowerSync account set up (Step 0.6)

This is the most important phase for data correctness. It introduces the **inventory movements ledger** (Option C) and the **local SQLite + PowerSync** sync layer.

See [Section 8](#8-inventory-integrity--the-overselling-problem) for the full conceptual explanation of why this approach was chosen.

---

#### Step 3.1 — Add the `inventory_movements` table

This is an **additive migration** — it does not modify or drop any existing tables. Your current `inventory` table is kept and repurposed as a fast-read cache.

```typescript
// lib/db/schema.ts — add to existing schema

export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  locationId: uuid("location_id").references(() => locations.id).notNull(),

  // The change in quantity — negative for sales/adjustments, positive for restocks
  quantityChange: integer("quantity_change").notNull(),

  // What caused this movement
  reason: text("reason", {
    enum: ["sale", "restock", "return", "adjustment", "opening_count", "waste"],
  }).notNull(),

  // Links back to the transaction that caused this movement (nullable for non-sale movements)
  transactionId: uuid("transaction_id").references(() => transactions.id),

  // Which terminal/register created this movement
  terminalId: text("terminal_id").notNull(),

  // Monotonic sequence number within this terminal — ensures sync ordering
  // See Section 9.4 for why this matters
  localSequence: bigint("local_sequence", { mode: "number" }).notNull(),

  // null = not yet confirmed by Supabase; timestamp = confirmed
  syncedAt: timestamp("synced_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Index for fast current-stock queries
// CREATE INDEX idx_movements_product_location ON inventory_movements(product_id, location_id);
```

Generate and apply the migration:

```bash
bunx drizzle-kit generate
DATABASE_URL="...staging..." bun run db:migrate
```

---

#### Step 3.2 — Update the sale flow to write movements

The sale API route currently updates `inventory.quantity` directly. Change it to insert a movement instead:

```typescript
// app/api/transactions/route.ts — updated sale handler

import { db } from "@/lib/db";
import { inventoryMovements, transactions, inventory } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await request.json();
  const { items, locationId, paymentType, terminalId } = body;

  // ── Get next local sequence number for this terminal ─────────────────────
  // This monotonic counter ensures movements sync in the correct order
  const lastSeq = await db
    .select({ seq: sql<number>`MAX(local_sequence)` })
    .from(inventoryMovements)
    .where(eq(inventoryMovements.terminalId, terminalId));

  let sequence = (lastSeq[0]?.seq ?? 0) + 1;

  // ── Create the transaction ────────────────────────────────────────────────
  const [transaction] = await db
    .insert(transactions)
    .values({
      locationId,
      paymentType,
      total: items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0),
      status: "completed",
    })
    .returning();

  // ── Insert a movement row for every item sold ─────────────────────────────
  // This is the core of Option C — we NEVER update inventory.quantity directly
  await db.insert(inventoryMovements).values(
    items.map((item: any) => ({
      productId: item.productId,
      locationId,
      quantityChange: -Math.abs(item.quantity),  // always negative for sales
      reason: "sale" as const,
      transactionId: transaction.id,
      terminalId,
      localSequence: sequence++,
      syncedAt: null,  // will be set by Supabase after sync confirmation
    }))
  );

  // ── Optimistically update the inventory cache for instant UI feedback ─────
  // This is just a display cache — Supabase recalculates the true total after sync
  for (const item of items) {
    await db
      .update(inventory)
      .set({
        quantity: sql`quantity - ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventory.productId, item.productId),
          eq(inventory.locationId, locationId)
        )
      );
  }

  return Response.json({ success: true, transactionId: transaction.id });
}
```

---

#### Step 3.3 — Supabase validation stored procedure

In Supabase, create a stored procedure that validates inventory movements and recalculates true stock when a sync arrives. This runs **server-side** after each movement is uploaded.

Run this in Supabase SQL editor (staging first):

```sql
-- Function that validates a movement and updates the true inventory quantity
CREATE OR REPLACE FUNCTION validate_inventory_movement()
RETURNS TRIGGER AS $$
DECLARE
  true_quantity INTEGER;
BEGIN
  -- Calculate true stock from the full ledger
  SELECT COALESCE(SUM(quantity_change), 0)
  INTO true_quantity
  FROM inventory_movements
  WHERE product_id = NEW.product_id
    AND location_id = NEW.location_id;

  -- If stock has gone negative, flag the movement for manager review
  -- Do NOT block the transaction — flag it and let the manager handle it
  IF true_quantity < 0 THEN
    INSERT INTO inventory_alerts (
      product_id,
      location_id,
      alert_type,
      details,
      created_at
    ) VALUES (
      NEW.product_id,
      NEW.location_id,
      'oversell',
      jsonb_build_object(
        'movement_id', NEW.id,
        'transaction_id', NEW.transaction_id,
        'terminal_id', NEW.terminal_id,
        'calculated_quantity', true_quantity
      ),
      NOW()
    );
  END IF;

  -- Update the inventory cache with the true calculated quantity
  UPDATE inventory
  SET
    quantity = true_quantity,
    updated_at = NOW()
  WHERE product_id = NEW.product_id
    AND location_id = NEW.location_id;

  -- Mark the movement as synced
  NEW.synced_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: runs after each new movement is inserted (including from sync upload)
CREATE TRIGGER after_inventory_movement_insert
AFTER INSERT ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION validate_inventory_movement();
```

Also create the `inventory_alerts` table:

```sql
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  location_id UUID REFERENCES locations(id),
  alert_type TEXT NOT NULL, -- 'oversell', 'low_stock', 'negative_stock'
  details JSONB,
  resolved_at TIMESTAMP,
  resolved_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Add this to your Drizzle schema as well and generate a migration.

---

#### Step 3.4 — Set up local SQLite with PowerSync

Install the correct packages. Note: `@powersync/web` is the **browser** package (uses IndexedDB). For a Bun/Node.js server context you need `@powersync/node`:

```bash
# In repo root
bun add @powersync/node @powersync/drizzle-driver
```

Create `lib/db/sqlite.ts`:

```typescript
import { PowerSyncDatabase } from "@powersync/node";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema-sqlite";

// Path to local SQLite file — stored in the Electrobun user data directory
const DB_PATH = process.env.SQLITE_PATH ?? "./im-pos-local.db";

export const sqliteDb = new Database(DB_PATH);
export const localDb = drizzle(sqliteDb, { schema });

// PowerSync wraps the same SQLite file for sync management
export const powerSync = new PowerSyncDatabase({
  database: sqliteDb,
  schema: AppSchema, // defined in schema-sqlite.ts
});
```

Create `lib/db/supabase-connector.ts`:

```typescript
import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  CrudEntry,
} from "@powersync/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      endpoint: process.env.POWERSYNC_URL!,
      token: session?.access_token ?? "",
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        await this.uploadOperation(op);
      }
      await transaction.complete();
    } catch (error) {
      console.error("[PowerSync] Upload failed:", error);
      // Do not call complete() — transaction will retry on next sync cycle
    }
  }

  private async uploadOperation(op: CrudEntry) {
    const table = supabase.from(op.table);

    if (op.op === "PUT") {
      const { error } = await table.upsert(op.opData!);
      if (error) throw error;
    } else if (op.op === "PATCH") {
      const { error } = await table.update(op.opData!).eq("id", op.id);
      if (error) throw error;
    } else if (op.op === "DELETE") {
      const { error } = await table.delete().eq("id", op.id);
      if (error) throw error;
    }
  }
}
```

---

#### Step 3.5 — PowerSync sync rules

In your PowerSync dashboard (staging), create sync rules that define what syncs to each device. Create `supabase/powersync-rules.yaml`:

```yaml
bucket_definitions:
  # Products and categories — sync everything to all terminals
  global_catalog:
    data:
      - SELECT * FROM products
      - SELECT * FROM categories
      - SELECT * FROM product_volumes
      - SELECT * FROM locations

  # Inventory — sync only the location this terminal is assigned to
  location_inventory:
    parameters:
      - SELECT location_id FROM terminal_assignments WHERE terminal_id = token_parameters.terminal_id
    data:
      - SELECT * FROM inventory WHERE location_id = bucket.location_id
      - SELECT * FROM inventory_movements WHERE location_id = bucket.location_id
      - SELECT * FROM batches WHERE location_id = bucket.location_id

  # Transactions — sync last 30 days only (keep the local DB small)
  recent_transactions:
    parameters:
      - SELECT location_id FROM terminal_assignments WHERE terminal_id = token_parameters.terminal_id
    data:
      - SELECT * FROM transactions
          WHERE location_id = bucket.location_id
          AND created_at > NOW() - INTERVAL '30 days'

  # Alerts — sync unresolved alerts for this location
  inventory_alerts:
    parameters:
      - SELECT location_id FROM terminal_assignments WHERE terminal_id = token_parameters.terminal_id
    data:
      - SELECT * FROM inventory_alerts
          WHERE location_id = bucket.location_id
          AND resolved_at IS NULL
```

---

#### Step 3.6 — Update `lib/db/index.ts` to switch between Postgres and SQLite

```typescript
// lib/db/index.ts
import { drizzle as drizzlePG } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Desktop mode — import from sqlite.ts
// Web mode — use Postgres directly
// This switch is controlled by the RUNTIME environment variable

let db: ReturnType<typeof drizzlePG>;

if (process.env.RUNTIME === "desktop") {
  // Dynamic import to avoid bundling SQLite in web builds
  const { localDb } = await import("./sqlite");
  db = localDb as any;
} else {
  const client = postgres(process.env.DATABASE_URL!);
  db = drizzlePG(client);
}

export { db };
```

---

#### Step 3.7 — Day-start sync gate in Electrobun main process

Before opening the POS window each morning, ensure the local SQLite has a fresh sync from Supabase:

```typescript
// Add to desktop/src/main.ts — before the BrowserWindow is created

import { powerSync } from "./sync";

async function waitForInitialSync(timeoutMs = 12000): Promise<boolean> {
  console.log("[electrobun] Waiting for initial sync...");

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn("[electrobun] Sync timeout — proceeding with cached data");
      resolve(false);
    }, timeoutMs);

    powerSync.registerListener({
      statusChanged(status) {
        if (status.dataFlowStatus.downloadCompleted) {
          clearTimeout(timeout);
          console.log("[electrobun] Initial sync complete");
          resolve(true);
        }
      },
    });

    powerSync.connect(new SupabaseConnector());
  });
}

// Show a splash/loading screen while sync happens
const splashWin = new BrowserWindow({
  title: "IM-POS — Starting...",
  url: "data:text/html,<body style='background:#1a1a2e;display:flex;align-items:center;justify-content:center;height:100vh'><p style='color:white;font-family:sans-serif;font-size:18px'>Syncing latest data...</p></body>",
  width: 400,
  height: 200,
  frame: false,
});

const syncedSuccessfully = await waitForInitialSync();

splashWin.close();

// Open the main POS window regardless of sync outcome
// If sync failed, the user gets cached data with an offline indicator
const win = new BrowserWindow({
  title: "IM-POS",
  url: `http://127.0.0.1:${PORT}`,
  width: 1280,
  height: 800,
  minWidth: 1024,
  minHeight: 700,
});

if (!syncedSuccessfully) {
  console.warn("[electrobun] Running on cached data — sync will resume when online");
}
```

---

### Phase 4 — Hardware Integration
**Duration:** 1–2 weeks  
**Result:** Direct native printer and cash drawer control without QZ Tray  
**Risk:** Low-Medium — additive only; QZ Tray remains as fallback until fully replaced  
**Prerequisite:** Phase 3 validated; hardware identified (Step 0.7)

---

#### Step 4.1 — Detect hardware on startup

```typescript
// desktop/src/hardware/detect.ts
import { readdirSync } from "fs";

export interface HardwareConfig {
  printerPort: string | null;
  platform: NodeJS.Platform;
}

export function detectHardware(): HardwareConfig {
  const platform = process.platform;

  let printerPort: string | null = null;

  if (platform === "darwin") {
    // macOS — USB serial devices appear as /dev/tty.usbserial-* or /dev/cu.usb*
    const ports = readdirSync("/dev").filter(
      (p) => p.startsWith("tty.usb") || p.startsWith("cu.usbserial")
    );
    printerPort = ports[0] ? `/dev/${ports[0]}` : null;
  } else if (platform === "win32") {
    // Windows — POS printers commonly appear on COM3/COM4
    // TODO: enumerate properly via Windows registry in a future iteration
    printerPort = "COM3";
  } else if (platform === "linux") {
    // Linux — USB serial or /dev/usb/lp0 for USB direct
    const ports = readdirSync("/dev").filter((p) => p.startsWith("ttyUSB"));
    printerPort = ports[0] ? `/dev/${ports[0]}` : "/dev/usb/lp0";
  }

  console.log(`[hardware] Platform: ${platform}, Printer port: ${printerPort ?? "not found"}`);
  return { printerPort, platform };
}
```

---

#### Step 4.2 — ESC/POS receipt printer

```typescript
// desktop/src/hardware/printer.ts

// Standard ESC/POS commands
const ESC = 0x1b;
const GS  = 0x1d;

const COMMANDS = {
  INIT:           Buffer.from([ESC, 0x40]),
  ALIGN_CENTER:   Buffer.from([ESC, 0x61, 0x01]),
  ALIGN_LEFT:     Buffer.from([ESC, 0x61, 0x00]),
  BOLD_ON:        Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF:       Buffer.from([ESC, 0x45, 0x00]),
  FONT_LARGE:     Buffer.from([GS,  0x21, 0x11]),
  FONT_NORMAL:    Buffer.from([GS,  0x21, 0x00]),
  FEED_LINES:     (n: number) => Buffer.from([ESC, 0x64, n]),
  PARTIAL_CUT:    Buffer.from([ESC, 0x69]),
  FULL_CUT:       Buffer.from([GS,  0x56, 0x00]),
};

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  date: string;
  transactionId: string;
  items: Array<{ name: string; qty: number; unitPrice: number; total: number }>;
  subtotal: number;
  tax?: number;
  total: number;
  paymentType: string;
  cashier?: string;
}

export async function printReceipt(
  receiptData: ReceiptData,
  printerPort: string
): Promise<void> {
  const chunks: Buffer[] = [];

  const write = (data: Buffer | string) => {
    chunks.push(typeof data === "string" ? Buffer.from(data, "utf8") : data);
  };

  const line = (text = "") => write(text + "\n");
  const divider = () => line("─".repeat(32));

  write(COMMANDS.INIT);
  write(COMMANDS.ALIGN_CENTER);
  write(COMMANDS.BOLD_ON);
  write(COMMANDS.FONT_LARGE);
  line(receiptData.storeName);
  write(COMMANDS.FONT_NORMAL);
  write(COMMANDS.BOLD_OFF);

  if (receiptData.storeAddress) line(receiptData.storeAddress);
  line(receiptData.date);
  line(`TXN: ${receiptData.transactionId.slice(-8).toUpperCase()}`);

  write(COMMANDS.ALIGN_LEFT);
  divider();
  line("ITEM                    QTY   TOTAL");
  divider();

  for (const item of receiptData.items) {
    const name = item.name.padEnd(20).slice(0, 20);
    const qty = String(item.qty).padStart(3);
    const total = `${item.total.toFixed(3)} OMR`.padStart(9);
    line(`${name} ${qty}  ${total}`);
  }

  divider();
  write(COMMANDS.ALIGN_RIGHT ?? COMMANDS.ALIGN_LEFT);
  line(`SUBTOTAL:    ${receiptData.subtotal.toFixed(3)} OMR`);
  if (receiptData.tax !== undefined) line(`TAX:         ${receiptData.tax.toFixed(3)} OMR`);

  write(COMMANDS.BOLD_ON);
  line(`TOTAL:       ${receiptData.total.toFixed(3)} OMR`);
  write(COMMANDS.BOLD_OFF);
  line(`PAYMENT:     ${receiptData.paymentType}`);

  if (receiptData.cashier) line(`CASHIER:     ${receiptData.cashier}`);
  write(COMMANDS.ALIGN_CENTER);
  line();
  line("Thank you for your purchase!");
  line();

  write(COMMANDS.FEED_LINES(4));
  write(COMMANDS.PARTIAL_CUT);

  // Write all chunks to the printer port
  const data = Buffer.concat(chunks);
  await Bun.write(printerPort, data);
}
```

---

#### Step 4.3 — Cash drawer

```typescript
// desktop/src/hardware/cash-drawer.ts

// ESC/POS cash drawer open commands
// Pin 2 and Pin 5 variants — try both if one doesn't work with your drawer
const OPEN_DRAWER_PIN2 = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);
const OPEN_DRAWER_PIN5 = Buffer.from([0x1b, 0x70, 0x01, 0x19, 0xfa]);

export async function openCashDrawer(printerPort: string): Promise<void> {
  // Cash drawers are wired to the printer's DK port
  // Opening the drawer = sending a command to the printer
  await Bun.write(printerPort, OPEN_DRAWER_PIN2);
}
```

---

#### Step 4.4 — IPC bridge — expose hardware to Next.js API routes

Register IPC handlers in `desktop/src/main.ts`:

```typescript
import { printReceipt } from "./hardware/printer";
import { openCashDrawer } from "./hardware/cash-drawer";
import { detectHardware } from "./hardware/detect";

const hardware = detectHardware();

// IPC: print a receipt
app.ipc.handle("print-receipt", async (receiptData) => {
  if (!hardware.printerPort) {
    throw new Error("No printer detected");
  }
  await printReceipt(receiptData, hardware.printerPort);
  return { success: true };
});

// IPC: open cash drawer
app.ipc.handle("open-cash-drawer", async () => {
  if (!hardware.printerPort) {
    throw new Error("No printer/drawer detected");
  }
  await openCashDrawer(hardware.printerPort);
  return { success: true };
});

// IPC: get hardware status
app.ipc.handle("hardware-status", () => ({
  printerPort: hardware.printerPort,
  printerDetected: !!hardware.printerPort,
  platform: hardware.platform,
}));
```

Create Next.js API routes that call IPC (desktop) or QZ Tray (web):

```typescript
// app/api/hardware/print/route.ts
export async function POST(request: Request) {
  const receiptData = await request.json();

  if (process.env.RUNTIME === "desktop") {
    // Desktop: call Electrobun IPC
    const { ipc } = await import("electrobun/renderer");
    await ipc.invoke("print-receipt", receiptData);
    return Response.json({ success: true });
  }

  // Web fallback: existing QZ Tray logic remains unchanged
  // QZ Tray is removed only when all terminals have migrated to desktop
  return Response.json({ error: "Printing requires the desktop app" }, { status: 400 });
}

// app/api/hardware/cash-drawer/route.ts
export async function POST() {
  if (process.env.RUNTIME === "desktop") {
    const { ipc } = await import("electrobun/renderer");
    await ipc.invoke("open-cash-drawer");
    return Response.json({ success: true });
  }
  return Response.json({ error: "Cash drawer requires the desktop app" }, { status: 400 });
}
```

---

#### Step 4.5 — Barcode scanner note

Most barcode scanners in **HID keyboard emulation mode** work in Phase 1 with zero driver work. The scanner types the barcode string into whatever input has focus, exactly like a keyboard. If your scanner is already working in the browser today, it will work in the Electrobun WebView identically.

If your scanner is in **serial mode** (raw serial output, not keyboard emulation), you'll need to read the serial port from the Bun main process — the same way the printer is accessed.

---

#### Step 4.6 — Remove QZ Tray (when all terminals are on desktop)

```bash
bun remove qz-tray
```

Remove QZ Tray initialization from `app/layout.tsx` and any components that configure it. Only do this when every terminal has been migrated to the Electrobun desktop app and the web version no longer needs to print.

---

## 6. File-by-File Changes

| File | Change | Phase | Notes |
|---|---|---|---|
| `.gitignore` | Modify | 0 | Add `desktop/node_modules/`, `desktop/dist/` |
| `drizzle.config.ts` | Modify | 0 | Single canonical output folder `/drizzle` |
| `migrations/` | Delete | 0 | After consolidating into `/drizzle` |
| `middleware.ts` | Modify | 2 | Offline guard + skip Supabase call when offline |
| `app/layout.tsx` | Modify | 1, 2 | Gate Vercel packages; add `OfflineIndicator` |
| `lib/db/index.ts` | Modify | 3 | Switch between Postgres and SQLite via `RUNTIME` env |
| `lib/db/schema.ts` | Modify | 3 | Add `inventoryMovements`, `inventoryAlerts` tables |
| `lib/db/schema-sqlite.ts` | Create | 3 | SQLite version of schema for local DB |
| `lib/db/sqlite.ts` | Create | 3 | `bun:sqlite` + PowerSync setup |
| `lib/db/supabase-connector.ts` | Create | 3 | PowerSync upload adapter |
| `lib/db/errors.ts` | Create | 2 | Shared error helpers for offline handling |
| `app/api/transactions/route.ts` | Modify | 3 | Write `inventory_movements` instead of updating quantity |
| `app/api/hardware/print/route.ts` | Create | 4 | IPC → print receipt |
| `app/api/hardware/cash-drawer/route.ts` | Create | 4 | IPC → open cash drawer |
| `components/offline-indicator.tsx` | Create | 2 | Offline/online banner |
| `drizzle.sqlite.config.ts` | Create | 3 | Drizzle config targeting SQLite |
| `supabase/powersync-rules.yaml` | Create | 3 | PowerSync sync rules |
| `desktop/package.json` | Create | 0 | Desktop workspace init |
| `desktop/electrobun.config.ts` | Create | 1 | Electrobun build config |
| `desktop/src/main.ts` | Create | 1 | Entry point — spawns Next.js, opens window |
| `desktop/src/hardware/detect.ts` | Create | 4 | Hardware auto-detection |
| `desktop/src/hardware/printer.ts` | Create | 4 | ESC/POS receipt printing |
| `desktop/src/hardware/cash-drawer.ts` | Create | 4 | Cash drawer command |
| `desktop/hardware.md` | Create | 0 | Hardware inventory document |
| `next.config.js` | Modify | Deployment | Add `output: "standalone"` for smaller bundle |
| `vercel.json` | No change | — | Vercel deployment unaffected |

---

## 7. Database Strategy

### Current State

```
Next.js API routes → Drizzle ORM → postgres.js → Supabase Postgres (cloud only)
                                                    ↑ all reads and writes online
                                                    ↑ fails completely when offline
```

### Phase 2 State

```
Next.js API routes → Drizzle ORM → postgres.js → Supabase Postgres
                                                    ↑ fails when offline
                                            (graceful 503 response returned to UI)
```

### Phase 3 Target State

```
Next.js API routes → Drizzle ORM → bun:sqlite → Local SQLite DB
                                                    ↕ (PowerSync — continuous)
                                               Supabase Postgres (cloud truth)
```

### Table sync strategy

| Table | Sync direction | Conflict strategy | Notes |
|---|---|---|---|
| `products` | Supabase → Local | Last-write-wins | Managed from admin; read-only on terminal |
| `categories` | Supabase → Local | Last-write-wins | Read-only on terminal |
| `product_volumes` | Supabase → Local | Last-write-wins | Read-only on terminal |
| `locations` | Supabase → Local | Last-write-wins | Read-only on terminal |
| `inventory` | Supabase → Local | Supabase recalculates from ledger | Cache only — never write directly |
| `inventory_movements` | Local → Supabase | Append-only; no conflicts possible | Core of Option C |
| `inventory_alerts` | Supabase → Local | Supabase-owned | Generated by trigger |
| `batches` | Bidirectional | Last-write-wins (restocking is infrequent) | Existing batch receipts |
| `transactions` | Local → Supabase | Append-only; each has UUID | Never edit after creation |

---

## 8. Inventory Integrity — The Overselling Problem

### Why the current approach is fragile

Your current `inventory` table stores a `quantity` column that gets updated (decremented) on every sale. With a single terminal and reliable internet this works fine. But it creates a **race condition** in two scenarios:

1. **Two terminals online simultaneously**: Both read `quantity = 2`. Both sell one unit. Both write back `quantity = 1`. You've sold two units but show one remaining.
2. **One terminal offline briefly**: Terminal reads `quantity = 2`. WiFi drops. Another terminal sells the last unit while the first is offline. First terminal completes its sale against the stale `quantity = 2`. Both write back. Stock is now -1 but shows as 1 in the cache.

### Option C — The Append-Only Inventory Ledger

Instead of storing a single mutable quantity, every stock change is recorded as an **immutable movement entry**. Nothing is ever overwritten. The true quantity is always the sum of all movements.

Think of it as a notebook where every entry is permanent. No erasing. No overwriting. Every sale adds a line like `-1 (sold, terminal A)`. Every restock adds a line like `+24 (batch received)`. The current stock is just the sum of all lines.

```
inventory_movements for "Pepsi 330ml" at Location 1:

id    | change | reason   | terminal | sequence | synced
------|--------|----------|----------|----------|-------
001   | +24    | restock  | admin    | 1        | ✓
002   | -1     | sale     | term-A   | 1        | ✓
003   | -1     | sale     | term-B   | 1        | ✓   ← term-B was offline; synced later
004   | -1     | sale     | term-A   | 2        | ✓
005   | +12    | restock  | admin    | 2        | ✓

Current stock = 24 - 1 - 1 - 1 + 12 = 33
```

Even if terminal B wrote row 003 while offline and synced it after terminal A had already recorded more sales, **there is no conflict**. Both terminals appended their own rows. No overwriting occurred. The true stock is always calculable.

### Why your `batches` table is already thinking this way

Your existing `batches` table records stock receipts as events rather than just bumping the quantity. That's the same instinct. Option C simply extends this pattern to sales as well, making the entire inventory system append-only and auditable.

### What happens if there's an oversell?

If a very brief outage causes both terminals to sell the last unit, the inventory_movements ledger will show a true quantity of -1 after sync. The Supabase trigger (Step 3.3) detects this and inserts an `inventory_alert` row. The manager sees the alert on the dashboard and reconciles. The transaction is never silently voided — it's flagged for human review.

This is the correct behaviour for a POS: **audit and reconcile** rather than silently block or silently corrupt.

### The bonus: full audit trail for free

Because nothing is ever deleted or overwritten, you get a complete history of every stock movement forever:

- "Why do we only have 3 units when we received 24 yesterday?" → query `inventory_movements`
- "Which terminal sold the last bottle of X?" → filter by `product_id`, order by `created_at`
- "What was our stock level at 2pm on Saturday?" → sum movements where `created_at < '2026-03-14 14:00'`

This kind of reporting is typically an expensive add-on feature in commercial POS systems. With this architecture, it's a free consequence of the design.

---

## 9. Offline & Sync Strategy

### 9.1 Connectivity reality

WiFi is almost always available. The architecture is designed for **brief, rare outages** (seconds to a few minutes) — not extended offline operation. This means:

- The primary database remains Supabase Postgres
- Local SQLite is a write buffer and read cache, not the primary store
- The sync gap during an outage is measured in minutes, not hours
- The oversell risk from a brief outage is low but must still be handled correctly (see Section 8)

### 9.2 What happens during a WiFi dropout

| Event | System behaviour |
|---|---|
| WiFi drops | `OfflineIndicator` banner appears within seconds |
| Auth middleware call | Detects offline in 1.5s, allows request through with cached session |
| New sale processed | Writes movement to local SQLite immediately — transaction completes normally |
| Page reload | Serves from local SQLite cache — no errors shown |
| Product price change on admin | Not reflected until WiFi returns and sync completes |
| Inventory display | Shows locally cached quantity — may be slightly stale |

### 9.3 What happens when WiFi returns

| Event | System behaviour |
|---|---|
| Connection restored | `OfflineIndicator` shows "✓ Connection restored — data is syncing" |
| PowerSync upload cycle starts | Queued `inventory_movements` and `transactions` uploaded to Supabase |
| Supabase trigger runs | Validates movements, recalculates true inventory, creates alerts if needed |
| PowerSync download cycle | Fresh product/category/inventory data pulled from Supabase |
| Sync complete | Local SQLite now matches Supabase; all caches refreshed |

### 9.4 Sync ordering — why `localSequence` matters

Movements must arrive at Supabase **in the order they were created**. Consider this without ordering:

```
Terminal A creates: txn_001 (sells 1 of X, sequence 1)
Terminal A creates: txn_002 (sells 1 of X, sequence 2)
-- brief offline moment --
Terminal A syncs: txn_002 uploads first (wrong)
Terminal A syncs: txn_001 uploads second (wrong)
```

If `txn_001` and `txn_002` together exhaust stock to 0, but they arrive in the wrong order, the trigger might fire in a state that creates a false alert. The `localSequence` column ensures the upload function in `supabase-connector.ts` always processes movements in creation order per terminal:

```typescript
// In uploadData():
const pending = await database.execute(`
  SELECT * FROM inventory_movements
  WHERE synced_at IS NULL
  AND terminal_id = ?
  ORDER BY local_sequence ASC   -- ← ORDER IS CRITICAL
`, [terminalId]);
```

### 9.5 Day-start sync gate

Each morning when the POS machine boots, a 12-second window is given for an initial sync before the main window opens. If sync completes: cashier gets fresh data. If sync times out (e.g., WiFi not up yet): cashier gets yesterday's cached data with the offline banner visible. The register never fails to open.

### 9.6 Session and JWT management

Supabase JWTs expire every ~1 hour. The disk-cached session in `desktop/src/main.ts` stores the full session object (including refresh token) with a 12-hour validity window. During an outage the middleware skips the Supabase call entirely — no JWT validation is attempted, so expiry is irrelevant while offline. When connectivity returns, the next request triggers a normal refresh cycle and the new session is re-cached to disk.

---

## 10. Hardware Integration

### Supported hardware

| Device | Protocol | Connection | Phase | Notes |
|---|---|---|---|---|
| Thermal receipt printer | ESC/POS | USB Serial or USB Direct | 4 | Epson, Star, Citizen — all supported |
| Cash drawer | ESC/POS via printer | Via printer DK port | 4 | Pin 2 or Pin 5 trigger |
| Barcode scanner (HID mode) | Keyboard emulation | USB | Works in Phase 1 | No driver needed |
| Barcode scanner (serial mode) | Raw serial | USB Serial | 4 | Needs serial port reading |
| Card terminal (SumUp/Square) | TCP or USB SDK | USB or Network | 4 | Vendor-specific SDK |

### Printer auto-detection

The `detectHardware()` function in `desktop/src/hardware/detect.ts` runs at startup and locates the printer port automatically. For macOS this works reliably. For Windows, the port may need to be configured manually (stored in app settings) if auto-detection doesn't find it.

### Barcode scanner in Phase 1

Most scanners in HID mode emulate a keyboard and press Enter after the barcode string. Your existing product search inputs in the POS UI will receive these keystrokes exactly as they do in a browser today. Test this on Day 1 of Phase 1 — it very likely works with zero changes.

### QZ Tray transition

QZ Tray remains active and functional throughout all phases until Step 4.6. It is only removed when every terminal is running the Electrobun desktop app. The `RUNTIME === "desktop"` gates in the hardware API routes ensure web users (if any remain) still print via QZ Tray while desktop users print via native ESC/POS.

---

## 11. Deployment & Updates

### Next.js build for desktop

Update `next.config.js` to use standalone output — this copies only the required files and reduces the bundle significantly:

```javascript
const nextConfig = {
  output: "standalone",  // ADD THIS
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Build commands

```bash
# Step 1 — Build Next.js
bun run build

# Step 2 — Build the Electrobun desktop app
cd desktop
bun run build
# → desktop/dist/IM-POS.app       (macOS)
# → desktop/dist/IM-POS-Setup.exe (Windows)
```

### Auto-updates

Electrobun generates delta patches between versions (~14KB) rather than full binary downloads. Configure the updater endpoint in `desktop/electrobun.config.ts`. The simplest approach is GitHub Releases:

1. Tag each release: `git tag v0.2.0 && git push --tags`
2. Create a GitHub Release and upload the built app
3. Electrobun's updater checks the release endpoint on startup
4. If a newer version exists, it downloads only the diff and applies it

For a dedicated update server, a simple Bun HTTP file server pointing at a build artifact bucket (S3 or Cloudflare R2) is sufficient.

---

## 12. Keeping the Web Version

The web version on Vercel continues to work exactly as it does today. Nothing in this migration affects it.

| Concern | Answer |
|---|---|
| Does merging `feat/electrobun-desktop` break Vercel? | No — all new files are in `desktop/` which Vercel ignores; all code changes are guarded by `RUNTIME === "desktop"` |
| Does `output: "standalone"` affect Vercel? | Vercel detects and handles `standalone` mode correctly |
| Does the `RUNTIME` env var need to be set on Vercel? | No — it's unset on Vercel, which means all `RUNTIME === "desktop"` guards evaluate to false |
| Does removing `@vercel/analytics` gating break Vercel? | No — the gate is `process.env.VERCEL === "1"` which Vercel sets automatically |
| Can the web and desktop versions use the same Supabase project? | Yes — they share the same data; the desktop app's local SQLite syncs via PowerSync to the same Supabase instance |

The only shared infrastructure is Supabase. Supabase is already multi-client by design.

---

## 13. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Electrobun v1 introduces breaking changes | Medium | High | Pin to exact version in `desktop/package.json`; review release notes before any update |
| Next.js 16 + Bun compatibility regression | Low | High | Keep `bun.lock` committed; don't update Bun or Next.js versions mid-migration |
| PowerSync `@powersync/node` instability | Low | Medium | PowerSync's Supabase connector is their primary use case; well-maintained |
| Inventory trigger causes performance issues at scale | Low | Medium | Add index on `(product_id, location_id)` on `inventory_movements` from day one |
| ESC/POS command differences between printer models | Medium | Low | ESC/POS is standardised; minor command variants documented per manufacturer |
| Windows WebView2 rendering differences from WebKit | Medium | Low | Test all POS flows on Windows before shipping; Edge WebView2 is highly compatible |
| Migration consolidation of `/drizzle` + `/migrations` loses a migration | Low | High | Full backup before consolidation; test against staging DB completely before deleting |
| JWT cache becomes stale on very long offline periods | Low | Low | 12-hour cache window covers any realistic shift; manager can re-authenticate |
| Oversell during outage not caught immediately | Low | Medium | Supabase trigger creates alert immediately on sync; manager reviews alerts dashboard daily |
| QZ Tray conflict with native printing during transition | Low | Low | Both are gated by `RUNTIME` — they never run simultaneously |
| PowerSync sync rules misconfigured — wrong data on terminal | Medium | High | Test sync rules thoroughly on staging; verify each table gets correct data per location |

---

## 14. Decision Checkpoint

Before committing to the full migration, validate these questions:

### Do you need a desktop app, or just a locked-down browser?

If the only requirements are:
- Offline resilience during brief WiFi drops
- The cashier can't accidentally navigate away
- The app starts on boot

Then **Chrome kiosk mode** pointed at a locally-running Next.js server is faster to ship:

```bash
# Start Next.js on boot (via systemd / launchd / Task Scheduler)
bun run start

# Open Chrome in kiosk mode
google-chrome --kiosk --app=http://localhost:3000
```

You get offline resilience (the server is local), a locked UI, and auto-start — without any Electrobun work. Choose this path if hardware access (native printing, cash drawer) is not required.

### Do you need Electrobun specifically?

If desktop wrapping is needed but maturity matters more than bundle size, **Electron** with the same embedded Bun server approach is more battle-tested:
- 10+ years of production POS deployments
- Massive ecosystem
- Well-documented hardware integration via Node.js serial libraries
- Trade-off: 150MB+ bundle, 2–5s startup, no delta updates

Electrobun is the right call if: startup speed matters, bundle size matters, you're on macOS primarily, and you're comfortable being an early adopter of a v1 framework.

### Platform target?

- **macOS only** → Electrobun is fully mature here. Recommended.
- **Windows only** → Electrobun works but Windows support is newer. Test WebView2 rendering carefully.
- **Both** → Supported. Build and test both platforms before shipping to production terminals.

---

## 15. Master Checklist

### Phase 0 — Preparation (Days 1–3)
- [ ] Create staging Supabase project and populate with test data
- [ ] Create `.env.staging` with all required variables
- [ ] Audit `/drizzle` vs `/migrations` — document all unique files in each
- [ ] Consolidate migrations into `/drizzle` — test against staging before deleting `/migrations`
- [ ] Update `drizzle.config.ts` to point only at `/drizzle`
- [ ] Run `grep` for all Supabase real-time subscriptions — document each one
- [ ] Run `grep` for all Vercel-specific env vars — add guards to each
- [ ] Run `grep` for all direct Postgres connection points — list every affected API route
- [ ] Create PowerSync account and connect to staging Supabase
- [ ] Read PowerSync sync rules documentation
- [ ] Identify and document all POS hardware (printer model, connection type, OS)
- [ ] Create `desktop/` folder structure with empty files
- [ ] Add `desktop/node_modules/` and `desktop/dist/` to `.gitignore`
- [ ] Create feature branch `feat/electrobun-desktop`

### Phase 1 — Wrap in Electrobun (Days 4–5)
- [ ] `cd desktop && bun init -y && bun add electrobun`
- [ ] Write `desktop/package.json`
- [ ] Write `desktop/electrobun.config.ts`
- [ ] Write `desktop/src/main.ts` with Next.js spawn + readiness polling + window open
- [ ] Gate `@vercel/analytics` and `@vercel/speed-insights` in `app/layout.tsx`
- [ ] Fix all Vercel env var usages found in Phase 0 audit
- [ ] `bun run build` in repo root
- [ ] `bun run dev` in `desktop/`
- [ ] Validate: window opens, login works, all POS flows work
- [ ] Test barcode scanner (very likely works already)

### Phase 2 — Offline Safety Net (Days 6–10)
- [ ] Add disk-cached session IPC handler in `desktop/src/main.ts`
- [ ] Add session caching call in auth callback
- [ ] Rewrite `middleware.ts` with 1.5s connectivity check and offline passthrough
- [ ] Create `lib/db/errors.ts` with `isConnectionError()` and `offlineResponse()`
- [ ] Apply graceful error handling to every API route in the Phase 0 list
- [ ] Create `components/offline-indicator.tsx`
- [ ] Add `<OfflineIndicator />` to `app/layout.tsx`
- [ ] Gate all Supabase real-time subscriptions behind `RUNTIME !== "desktop"`
- [ ] Test: pull network cable mid-session — cashier must not be locked out
- [ ] Test: complete a transaction while offline — must succeed
- [ ] Test: reconnect — offline indicator must clear

### Phase 3 — Inventory Integrity & Sync (Weeks 2–5)
- [ ] Add `inventoryMovements` table to `lib/db/schema.ts`
- [ ] Add `inventoryAlerts` table to `lib/db/schema.ts`
- [ ] Generate and apply migration: `bunx drizzle-kit generate && bun run db:migrate`
- [ ] Create `validate_inventory_movement()` stored procedure in Supabase (staging first)
- [ ] Create after-insert trigger on `inventory_movements` in Supabase
- [ ] Update transaction/sale API route to insert movements instead of updating quantity
- [ ] Add `localSequence` generation logic to sale route
- [ ] Install `@powersync/node` and `@powersync/drizzle-driver`
- [ ] Create `lib/db/schema-sqlite.ts` (SQLite mirror of Postgres schema)
- [ ] Create `lib/db/sqlite.ts` (PowerSync + bun:sqlite setup)
- [ ] Create `lib/db/supabase-connector.ts` (upload adapter with ordered sync)
- [ ] Create `drizzle.sqlite.config.ts`
- [ ] Write `supabase/powersync-rules.yaml` and deploy to staging PowerSync
- [ ] Update `lib/db/index.ts` to switch DB based on `RUNTIME` env
- [ ] Add day-start sync gate + splash screen to `desktop/src/main.ts`
- [ ] Set `RUNTIME=desktop` in desktop env before spawning Next.js
- [ ] Test: complete 10 transactions while offline — all must sync correctly after reconnect
- [ ] Test: oversell scenario — alert must appear in dashboard
- [ ] Test: `localSequence` ordering — movements must arrive at Supabase in order
- [ ] Test: day-start sync gate — splash must show, then POS must open
- [ ] Apply to production Supabase only after full staging validation

### Phase 4 — Hardware Integration (Weeks 6–7)
- [ ] Confirm hardware from `desktop/hardware.md` is available for testing
- [ ] Write `desktop/src/hardware/detect.ts`
- [ ] Write `desktop/src/hardware/printer.ts` with receipt format matching your store
- [ ] Write `desktop/src/hardware/cash-drawer.ts`
- [ ] Register all IPC handlers in `desktop/src/main.ts`
- [ ] Create `app/api/hardware/print/route.ts`
- [ ] Create `app/api/hardware/cash-drawer/route.ts`
- [ ] Test printer: print a full test receipt — check formatting, cut, font sizes
- [ ] Test cash drawer: open on each payment completion
- [ ] Test barcode scanner serial mode (if applicable)
- [ ] Update `next.config.js` with `output: "standalone"`
- [ ] Run full `desktop` build and test the `.app` / `.exe` artifact
- [ ] Once all terminals are on desktop: `bun remove qz-tray`
- [ ] Set up GitHub Releases or update server for Electrobun auto-updates
- [ ] Ship to first production terminal — monitor for 1 week before rolling out to all

---

*Document prepared March 2026 — v2 fully revised.*  
*Electrobun v1 released February 6, 2026. Always check [electrobun.dev](https://electrobun.dev) for API changes.*  
*PowerSync Supabase integration docs: [docs.powersync.com/integration-guides/supabase](https://docs.powersync.com/integration-guides/supabase)*
