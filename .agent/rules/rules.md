---
trigger: always_on
---

# Project Standards & Best Practices (2026 Edition)

## 🛠 Main Stack & Versions
- Runtime: [Bun v1.3.3+](https://bun.sh/)
- Framework: [Next.js v15.5.9](https://nextjs.org/) (App Router standard)
- Library: [React v19.x](https://react.dev/)
- Database: [Supabase/PostgreSQL](https://supabase.com/)
- ORM: [Drizzle ORM](https://orm.drizzle.team/)
- Styling: [Tailwind CSS v4.x](https://tailwindcss.com/)
- State/Auth: [Supabase SSR Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- Icons: [Phosphor Icons](https://phosphoricons.com/) / [Lucide](https://lucide.dev/)
- Components: [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)

---

## 🚀 Next.js 15.5.9 Best Practices
- Server-First Architecture: Default to Server Components. Use `"use client"` only for interactivity or browser APIs.
- Server Actions: Use for all mutations (POST/PUT/DELETE). Ensure robust error handling and revalidation.
- Granular Caching: Note that Next.js 15 defaults `fetch` to `no-store`. Explicitly define `cache: 'force-cache'` or `revalidate` tags for static/semi-static data.
- Parallel/Intercepting Routes: Use for complex UI like modals or dashboards to maintain state and URL consistency.
- Metadata API: Use for SEO on all pages.

---

## 🔐 Supabase & Database Rules
- RLS (Row Level Security): MANDATORY for every table. No exceptions.
- Server-Side Auth: Use `@supabase/ssr` to handle sessions in Server Components and Middleware.
- Service Role Secrets: NEVER expose the `service_role` key to the client. Keep it server-only for administrative tasks.
- Drizzle Integration: Maintain SQL migrations via Drizzle Kit. Ensure `db:migrate` is run locally before pushing.

---

## 👔 Senior-Level Coding Standards
### 1. Failure Point Awareness
- Trust No Input: Use [Zod](https://zod.dev/) for all data validation (API inputs, environment variables, form data).
- Graceful Degradation: Always provide `loading.tsx` skeletons and `error.tsx` boundaries.
- Null-Safety: Use optional chaining and nullish coalescing proactively. Never assume a record exists.

### 2. Clean Code Principles
- SOLID/DRY/KISS: Keep components small and focused. If a file exceeds 300 lines, evaluate for refactoring.
- Composition over Inheritance: Use React component composition for flexible layouts.
- Semantic HTML: Prioritize accessibility (ARIA labels, proper landmarks).

### 3. Proactive Criticism & Efficiency
- Efficiency First: If there's a more performant or cleaner way (e.g., using a built-in Next.js hook instead of custom logic), call it out.
- Performance: Monitor bundle sizes. Avoid heavy client-side libraries when server-side solutions exist.
- Production Grade: No `console.log` in production-ready code. Use structured logging/error reporting.

### 4. Real-time & Synchronization
- Optimistic Updates: For critical POS actions (e.g., adding to cart), use `useOptimistic` to ensure an "instant" feel.
- Sync Reliability: Ensure database transactions are used for multi-table updates (e.g., checkout) to prevent partial failures.

---

## 🗣 Proactive Communication
- You are encouraged to criticize any code or design that feels "v1" or "MVP". 
- You are to always use mcps like supabase mcp for all database operations and other respectfully availaible mcps for other respectfull operations to improve efficiency.
- Always propose the Senior/Production-level path unless explicitly told otherwise.
- If you spot a potential security flaw or a "foot-gun" in a proposed change, block the task until clarified.