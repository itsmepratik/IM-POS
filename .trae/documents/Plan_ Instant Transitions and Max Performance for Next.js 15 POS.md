## Objectives
- Achieve sub-100ms perceived page transitions after initial hover.
- Reduce client-side JavaScript, leverage RSC/SSR/SSG/ISR appropriately.
- Implement measurable caching, prefetching, code-splitting, and resource-loading strategies without breaking functionality.

## Prefetching Strategy
1. Sidebar and Nav links
- Audit links in `components/app-sidebar.tsx`, `components/nav-main.tsx`, `components/nav-secondary.tsx`, `components/mobile-nav.tsx`, `components/new-sidebar.tsx`, `components/custom-sidebar.tsx`.
- Ensure `next/link` uses `prefetch={true}` for all in-app navigation tabs.
- Add `onMouseEnter` hover handler (100–150ms delay) to call `useRouter().prefetch(href)` for routes: `/pos`, `/inventory`, `/customers`, `/transactions`, `/reports`, `/settings`, `/home`.
2. Dynamic import prefetch
- Wrap heavy modules with `next/dynamic` and Webpack hints `/* webpackPrefetch: true */` for modals/charts: `app/pos/components/*` (modals), `app/reports/reports-client.tsx`, `components/ui/*` where appropriate.
3. Route data prefetch on hover
- For routes with server loaders, trigger lightweight data prefetch via hidden `fetch` or router prefetch, debounced by 100ms, only when idle.

## Rendering Optimizations
1. Server Components adoption
- Convert non-interactive page shells to server components; keep client islands for interactive elements.
- Candidates: `app/inventory/main-inventory/page.tsx`, `app/reports/page.tsx`, `app/customers/page.tsx`, `app/home/page.tsx` — server-fetch data, pass as props to client widgets.
2. SSG/ISR selection
- SSG for mostly-static pages: `app/home/page.tsx` (summary) with `export const revalidate = 300`.
- ISR for dynamic lists: `app/inventory/main-inventory/page.tsx` (`revalidate = 30`), `app/reports/page.tsx` (`revalidate = 60`), `app/customers/page.tsx` (`revalidate = 60`).
- Use tag-based revalidation on writes from API routes.
3. Reduce client JS
- Remove unnecessary `"use client"` in page wrappers; lift data fetching to RSC using Supabase server client/Drizzle; keep forms/modals as client islands.

## Performance Enhancements
1. Image Optimization
- Enforce `next/image` across all media: audit files flagged via grep (e.g., `app/pos/components/*`, `app/inventory/*`).
- Provide `sizes` and explicit `width/height` to minimize CLS.
2. Static asset caching
- Confirm long-lived immutable caching for `/_next/static`, `/_next/image`, `/fonts`, `/icons`, `/images` via headers.
3. API Cache-Control
- Add standardized response headers to safe GET endpoints: `public, max-age=60, stale-while-revalidate=300` (per route), exclude sensitive endpoints.
4. Code splitting
- Convert non-critical UI (dialogs, charts, advanced filters) to dynamic imports with `ssr: true/false` per case and `loading` fallbacks.

## Resource Loading
1. Preload critical resources
- Use `<link rel="preload">` where `next/font` doesn’t already preload (fonts are configured via `localFont` preload).
- Preload above-the-fold hero images where applicable.
2. Resource hints
- Add `<link rel="preconnect">` and `dns-prefetch` for Supabase (`process.env.NEXT_PUBLIC_SUPABASE_URL` origin) and any external image/CDN hosts.
3. Font loading
- Keep `font-display: swap` (already configured via `localFont`); ensure all font faces use `display: swap`.

## Monitoring and Testing
1. Next.js Analytics & Speed Insights
- Ensure production-only analytics in `app/layout.tsx:168–173`; validate reporting coverage.
2. Lighthouse baselines and goals
- Add CI job (bun) using `@lhci/cli` to collect performance scores per route.
3. Automated performance testing
- Add Web Vitals assertions and budget thresholds; track First Contentful Paint, LCP, TBT, INP.

## Additional Optimizations
1. WebP/AVIF
- Rely on `next/image` automatic modern formats; convert large static assets in `/public/images/*` to WebP where beneficial.
2. Compression
- Ensure `next.config.js` `compress: true`; confirm hosting Brotli (Vercel defaults). Add server headers if self-hosted.
3. Partytown
- If heavy third-party scripts become necessary, offload to web worker using Partytown; audit current third-party usage (minimal).
4. Minimize CLS
- Audit all `Image` and container layout; ensure fixed dimensions or `sizes` with responsive behavior; avoid late-inserted UI.

## Rollout Strategy
- Phase 1: Prefetching and resource hints; dynamic imports for heavy components; verify no regressions.
- Phase 2: RSC/SSR migration for target pages; introduce SSG/ISR and route-level caching; add tag-based revalidation.
- Phase 3: API headers, image audits, CLS fixes; monitoring/CI Lighthouse.
- Phase 4: Fine-tune prefetch timings, streaming with `Suspense` for lists, budgets.

## Measurability
- Collect route-level Lighthouse scores before/after.
- Track bundle sizes with analyzer; aim −25–30% client JS on `pos`/`inventory`.
- Monitor navigation timings (Next.js Analytics) and confirm hover-prefetch transitions <100ms.

## Compatibility and Safety
- No breaking API/data changes; server routes maintain existing responses.
- Feature-flag RSC/ISR transitions; fall back to current client fetching during rollout.
- Strict scope: only requested optimizations; preserve developer experience (bun scripts, CI jobs, clear diffs).