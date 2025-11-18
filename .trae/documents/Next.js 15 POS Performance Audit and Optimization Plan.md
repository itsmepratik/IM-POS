## Summary

* Goal: Optimize Next.js 15 + Supabase inventory POS for faster loads, lower JS execution, and stable DB performance without breaking APIs or functionality.

* Approach: Audit and fix bottlenecks across code, DB, frontend bundles, Next.js features, and infra; validate with metrics and monitoring.

## Key Findings (Initial RCA)

* Global no-cache disables effective CDN/browser caching: `next.config.js:21–42` and meta tags `app/layout.tsx:95–101`.

* Image optimization disabled: `next.config.js:13` (`images.unoptimized: true`).

* Client-heavy rendering and fetching: 80+ client files; providers mounted globally (`app/layout.tsx:153–166`).

* N+1 inventory queries per item: `lib/services/inventoryService.ts:218–231`, `234–251`, `268–304`.

* Middleware RPC on every request adds latency: `middleware.ts:60–66`.

* Anti-pattern in context memoization: `lib/contexts/BranchContext.tsx:65` uses `JSON.stringify` inside `useMemo`.

## Audit Plan

* Codebase static analysis

  * Scan client boundaries (`"use client"`), context providers, hooks, and heavy components (POS/inventory/customers).

  * Detect render hotspots via heuristic (derived state in render, broad context values).

* Data layer review

  * Map all Supabase reads/writes vs server API usage; flag browser-side multi-round trips.

  * Identify N+1 patterns; propose consolidations.

* DB/Supabase review

  * Validate indexing (Supabase migrations show coverage) and query plans; review joins and filter columns.

  * Check connection pooling and timeouts (`lib/db/client.ts`).

* Frontend bundle analysis

  * Integrate bundle analyzer; measure vendor and route chunks; identify heavy deps (MUI, framer-motion, recharts).

* Next.js runtime review

  * App Router usage, server components coverage, caching (`revalidate`, `fetch cache`, `unstable_noStore`), streaming.

* Infra review

  * Headers/CDN, serverless function time, cold-start behavior, Vercel regions, edge middleware costs.

## Optimization Plan

* Codebase & State

  * Reduce global client footprint: move non-interactive shells to server components; keep providers only where needed.

  * Split provider tree by feature routes to limit re-renders; stabilize context values (avoid `JSON.stringify` in `useMemo`).

  * Memoize heavy lists and selection models; prefer derived data via selectors over wide contexts.

* Data Fetching

  * Migrate read-heavy flows to server fetching (RSC/route handlers) with typed responses; keep writes in API routes.

  * Replace N+1 in inventory with consolidated endpoints:

    * Single query joining `inventory + products + categories + brands + types` (already done) plus:

    * Aggregate `product_volumes`, `batches`, `open_bottle_details` via server-side joins/JSON aggregation or RPC; return per-product arrays.

  * Normalize lookups to UUID instead of name where possible; add indexes on lookup columns if missing.

* Database (Supabase/Postgres)

  * Create materialized views or RPC functions for inventory payloads; cache with `revalidate` TTL in App Router.

  * Verify and add composite indexes on high-cardinality filters (already present for inventory `(product_id, location_id)`), ensure `open_bottle_details` filters hit indexes.

  * Ensure pooled connections for server routes; keep browser Supabase for light reads only.

* Frontend Performance

  * Enable image optimization; configure remote patterns and sizes; serve responsive images.

  * Introduce route-level and component-level lazy loading where appropriate (`next/dynamic`) for heavy modals and charts.

  * Tree-shake unused libraries; replace MUI usage where trivial with existing UI components; defer framer-motion on interaction.

* Next.js Features

  * Adopt caching policy per route:

    * Static assets: long-lived cache.

    * Data pages: `revalidate` reasonable TTL; use `noStore` only for sensitive routes.

  * Expand server components coverage for read-heavy pages; use `Suspense` streaming for lists and reports.

  * Limit middleware to auth-only paths; memoize role or embed in JWT custom claims; avoid RPC per navigation.

* Infrastructure

  * Restore CDN caching headers for static and public assets; remove global no-cache.

  * Ensure serverless function regions match Supabase DB region; consider edge-only where logic is light.

  * Add observability for function latency and cold starts; tune bundle for faster boot.

## Failure Modes & Mitigations

* Stale data due to caching

  * Use `revalidate` TTLs aligned to business tolerance; invalidate via tag-based revalidation for writes.

* RSC migration breaks client interactions

  * Keep client islands for interactive components; pass serialized props from server loaders.

* RPC/view changes cause downtime

  * Deploy new views/functions alongside existing endpoints; feature-flag rollouts; fall back to existing multi-query path.

* Image optimization issues (remote domains)

  * Pre-configure `images.remotePatterns` and widths; fallback to unoptimized for edge cases.

* Middleware caching of role leads to permission drift

  * Cache short-lived; refresh on auth state change; include role in JWT claims to reduce RPC frequency.

## Metrics & Targets

* Baselines to capture

  * LCP, CLS, TBT, FID, INP per route; bundle sizes (vendor + route chunks); API latency (p50/p95), DB query time.

* Targets

  * Lighthouse scores +20% across core routes.

  * JS execution time −30% on POS/inventory pages.

  * API p95 latency −25% for inventory/checkout endpoints.

  * Time-to-interactive −25% on POS.

## Monitoring Plan

* Client

  * Use `@vercel/speed-insights` and Web Vitals; sample per route.

* Server

  * Log API timings and query counts; track N+1 elimination impact.

* DB

  * Supabase logs for slow queries; index hit rate; connection pool health.

* Release

  * Canary deployments; error rate guardrails; automatic rollback if error rates increase.

## Implementation Roadmap

* Phase 1 (Infra & easy wins)

  * Enable image optimization; fix caching headers; add bundle analyzer; measure baseline.

* Phase 2 (Data consolidation)

  * Build inventory aggregation (view/RPC) to remove N+1; shift fetching to server.

* Phase 3 (Client footprint)

  * Move non-interactive shells to server; dynamic-load heavy modals/charts; trim unused libs.

* Phase 4 (Next.js optimization)

  * Apply `revalidate`/tag-based cache; add streaming in lists; restrict middleware scope and cache role.

* Phase 5 (DB tuning & monitoring)

  * Verify indexes; add missing composites; set query timeouts; expand observability.

* Phase 6 (Validation)

  * Re-run Lighthouse/Web Vitals; confirm targets; regression tests for POS, inventory, checkout.

## Deliverables

* Performance audit report with annotated hotspots and code references.

* Prioritized optimization list with expected impact and effort.

* Implementation plan per phase with rollbacks.

* Baseline metrics and target deltas.

* Monitoring checklist and dashboards.

## Next Steps (Upon Approval)

* Integrate analyzer and metrics, adjust headers/images; draft inventory RPC/view; prepare minimal diffs for server fetch migration; schedule phased rollout with backstops.

