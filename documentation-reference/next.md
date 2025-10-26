# Next.js 15 + React 19 Coding Standards & Rules (LLM Context)

> **Purpose**: This document is optimized to guide Large Language Models (LLMs) to generate **correct, modern, production‑ready** code for Next.js 15 (App Router) and React 19. Prefer **Server Components**, **Server Actions**, **streaming**, and **type‑safe** patterns by default.

---

## 0) High‑Level Principles

1. **Server‑first**: Prefer React Server Components (RSC) for UI and data access. Use Client Components only when you need interactivity, browser APIs, or local state that can’t be on the server.
2. **Minimal client JS**: Keep bundles small. Move logic to server where possible. Avoid heavy client state unless required.
3. **Type safety**: Use TypeScript everywhere. No `any`. Add explicit return types to public functions.
4. **Data flows**: Fetch data in **RSC** with `async`/`await` and `fetch`. Mutations use **Server Actions**. Cache deliberately.
5. **Streaming UX**: Use `Suspense` and streaming for fast first paint. Defer non‑critical content.
6. **Deterministic layouts**: Use the App Router with well‑structured `layout.tsx` and route groups.
7. **Security by default**: Validate inputs on the server, sanitize user content, and follow least‑privilege for secrets.
8. **Accessibility**: Follow WAI‑ARIA and semantic HTML. Keyboard and screen reader support is mandatory.
9. **Performance**: Measure and enforce budgets. Optimize images, fonts, and queries. Avoid over‑fetching.
10. **Observability & tests**: Log, trace, and test. Unit + integration tests for critical paths; use e2e for flows.

---

## 1) Project Structure (App Router)

```
app/
  (marketing)/
    layout.tsx
    page.tsx
  (app)/
    layout.tsx
    page.tsx
    dashboard/
      layout.tsx
      page.tsx
      loading.tsx
      error.tsx
      @activity/  // parallel route for streaming widgets
    api/
      route.ts     // edge/runtime APIs if needed
components/
  ui/
lib/
  db/
  auth/
  validators/
  utils/
public/
scripts/
styles/
```

**Rules**

- Use **route groups** `(group)` to organize URLs without affecting paths.
- Use `loading.tsx` for route‑level skeletons/spinners and `error.tsx` for boundaries.
- Put framework‑agnostic logic in `lib/`. Keep server‑only code server‑side.
- Co‑locate component styles and tests when helpful.

---

## 2) TypeScript Standards

- `"strict": true` in `tsconfig.json`. No `any` or implicit `any`.
- Prefer **type aliases** and **interfaces** for public shapes; export them from `lib/`.
- Use **discriminated unions** for state machines and server action results.
- Don’t cast to bypass types. Fix types instead.

**Minimal **``** baseline**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "allowJs": false,
    "checkJs": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node"]
  }
}
```

---

## 3) React 19 Defaults

- Prefer **function components**.
- Use `` in RSC only if you need to unwrap promises in components. In client components, keep async in event handlers or effects.
- Use `` for optimistic UI with server actions.
- Prefer **Actions** for mutations (forms or imperative calls).
- Use ``boundaries to stream slow children. Add`loading.tsx` at route level.

**Do**

- Keep client components small and focused on interactivity.
- Memoize expensive client computations with `useMemo` only when profiling proves benefit.

**Don’t**

- Don’t use effects for data fetching in App Router. Fetch in RSC or via server actions.
- Don’t mutate React state derived from props without memoization rationale.

---

## 4) Next.js 15 Routing & Layouts

- Each segment gets `layout.tsx` for shared chrome; avoid prop‑drilling by rendering children.
- Use **parallel routes** (`@slot`) for streaming dashboard widgets or side panels.
- Use **intercepting routes** `(.)` to overlay modals while preserving background context.
- Global metadata via `app/layout.tsx` or `metadata` export per route.

**Example **``

```tsx
export const metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className="grid gap-6 p-6">{children}</section>;
}
```

---

## 5) Data Fetching & Caching

- Fetch in **Server Components** using `await fetch(url, { cache, next: { revalidate } })`.
- Default: cache GETs that are stable; set `revalidate` explicitly for ISR.
- Use `cache(fn)` for memoizing pure server functions. Invalidate with `revalidatePath`/`revalidateTag`.
- Use **Route Handlers** in `app/api/*/route.ts` for custom server logic where Server Actions are not suitable.

**Pattern**

```tsx
// RSC
async function getProducts() {
  const res = await fetch(`${process.env.API_URL}/products`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to load products");
  return res.json() as Promise<Product[]>;
}

export default async function Page() {
  const products = await getProducts();
  return <ProductTable data={products} />; // ProductTable can be RSC if no client APIs
}
```

---

## 6) Server Actions (Mutations)

- Use `` directive inside server modules.
- Validate inputs server‑side (zod/valibot/etc). Return typed results.
- Pair actions with **progressive enhancement** forms. Use `useOptimistic` in clients for snappy UI.

**Example**

```tsx
// app/(app)/products/actions.ts
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const ProductInput = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
});

export async function createProduct(prevState: any, formData: FormData) {
  const parsed = ProductInput.safeParse({
    name: formData.get("name"),
    price: Number(formData.get("price")),
  });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() } as const;
  }

  // Persist to DB (server‑side)
  await db.product.create(parsed.data);
  revalidatePath("/(app)/products");
  return { ok: true } as const;
}
```

**Client usage with optimistic UI**

```tsx
"use client";
import { useOptimistic, useTransition } from "react";
import { createProduct } from "./actions";

export function NewProductForm() {
  const [isPending, start] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic([], (state, item) => [
    item,
    ...state,
  ]);

  return (
    <form action={(fd) => start(() => createProduct(undefined, fd))}>
      {/* fields... */}
      <button disabled={isPending}>Create</button>
      {/* render optimistic entries */}
    </form>
  );
}
```

---

## 7) Client vs Server Components

**Use Server Components when**

- Reading from DB or services
- Rendering static/streamed HTML
- Heavy computation (can run on server)

**Use Client Components when**

- Event handlers (`onClick`, `onChange`)
- Browser APIs (`localStorage`, `IntersectionObserver`)
- WebSockets and live interactions

**File directives**

- Add `"use client"` only at the top of files that need it. Don’t add it to shared leaf components accidentally.

---

## 8) Styling & UI

- Prefer **Tailwind CSS** for utility‑first styling. Keep class lists tidy.
- Use component libraries selectively (e.g., shadcn/ui) but keep tree‑shaking effective.
- Co‑locate component styles when CSS modules are used.
- Use `next/image` for images. Provide width/height or `fill` and proper `sizes`.

**Image example**

```tsx
import Image from "next/image";

<Image
  src={product.imageUrl}
  alt={product.name}
  width={320}
  height={200}
  priority
/>;
```

---

## 9) Forms

- Prefer **server actions** for form `action` handlers.
- Use **native **`` with progressive enhancement; avoid client‑only fetch POSTs unless necessary.
- Show **field‑level errors** and **status messages** from action return values.
- Sanitize/validate on server always.

---

## 10) Error Handling & Boundaries

- Use `` per route segment for rendering friendly errors.
- Throw `notFound()` for 404s, `redirect()` for auth/flow control.
- Wrap risky subtrees in `<ErrorBoundary>` on client when needed.

**Route utilities**

```ts
import { notFound, redirect } from "next/navigation";
```

---

## 11) Suspense, Streaming & Loading States

- Wrap slow RSC children in `<Suspense>` to stream.
- Provide `loading.tsx` for route‑level fallback.
- Use **parallel routes** for independently streaming widgets.

---

## 12) Performance & Caching Rules

- Set `revalidate`/`cache` consciously. Avoid `no-store` unless required.
- Use **Edge Runtime** for latency‑sensitive endpoints that are compatible.
- Avoid oversized client bundles: keep client components lean; split by route.
- **Fonts**: use `next/font`. Avoid blocking font loads.

---

## 13) Security Standards

- Never trust client input. Validate and sanitize on the server.
- Keep secrets in environment variables; never expose them to the client.
- Use `HttpOnly`, `Secure`, `SameSite` cookies for session tokens.
- Use CSRF protections if you expose non‑idempotent HTTP to the browser outside server actions.
- Escape user content on output when rendering raw HTML.

---

## 14) Accessibility (A11y)

- Semantic elements first (`<button>`, `<nav>`, `<main>`, `<label>`).
- Provide accessible names/labels for interactive controls.
- Ensure focus management for modals and route transitions.
- Sufficient color contrast; respect reduced motion preferences.

---

## 15) Testing Strategy

- **Unit**: pure functions in `lib/` and server actions’ logic.
- **Component**: test client components with React Testing Library.
- **Integration/E2E**: use Playwright for critical flows.
- Mock network calls; avoid real services in unit tests.

---

## 16) Linting, Formatting & Git

- Use **ESLint** with Next.js plugin and React hooks rules.
- Format with **Prettier**. Enforce on CI.
- Follow **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.

``** baseline**

```js
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
};
```

---

## 17) Env & Configuration

- Store environment variables in `.env.local`, `.env.development`, `.env.production`, and `.env.test`.
- Never commit secrets to Git.
- Expose only safe values to the client via `NEXT_PUBLIC_` prefix.
- Centralize config in `lib/config.ts` with validation using `zod` or `valibot`.
- Example:

```ts
// lib/config.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_API_BASE: z.string().url(),
  SUPABASE_SERVICE_ROLE: z.string(),
});

export const env = envSchema.parse(process.env);
```

- Access env in **Server Components** or **Server Actions** only. For **Client Components**, only use variables with `NEXT_PUBLIC_`.

---

## 18) Database (Supabase & Drizzle)

- Use **Drizzle ORM** for schema and queries; keep schema in `lib/db/schema.ts`.
- Run migrations via Drizzle; avoid manual DB edits.
- Server-only access: fetch or mutate via Server Components or Server Actions.
- Always type queries; avoid raw SQL unless necessary.
- Supabase auth: use server helpers (`createServerClient`) to read session.

**Example Drizzle schema:**

```ts
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  stock: integer("stock").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Example query:**

```ts
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";

export async function getProducts() {
  return db.select().from(products).orderBy(products.createdAt);
}
```

---

## 19) Authentication & Authorization

- Use Supabase Auth or NextAuth with JWTs.
- Keep secrets server-side.
- Read sessions in **Server Components**; redirect unauthorized users using `redirect()`.
- Role-based access control (RBAC): define roles (`admin`, `shop`, etc.) in DB.
- Never rely on client-side role checks for security.

**Middleware example:**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const session = req.cookies.get("sb:token");
  if (!session) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}
```

---

## 20) Domain-Specific (POS & Inventory)

- **Products**: `id`, `name`, `price`, `stock`, `createdAt`, `updatedAt`.
- Inventory updates: always in **transactions**; deduct stock atomically.
- Audit logs: write every stock mutation to `inventory_logs`.
- Roles:
  - `admin@company.com`: full privileges
  - `shop@company.com`: limited to their location
- Enforce role checks **server-side**.

**Inventory transaction example:**

```ts
await db.transaction(async (tx) => {
  const product = await tx
    .select()
    .from(products)
    .where(eq(products.id, id))
    .forUpdate();
  if (product.stock < qty) throw new Error("Out of stock");
  await tx
    .update(products)
    .set({ stock: product.stock - qty })
    .where(eq(products.id, id));
  await tx
    .insert(inventoryLogs)
    .values({ productId: id, change: -qty, reason: "order" });
});
```

---

## 21) CI/CD & Deployment

- Use **Vercel** or compatible platform.
- CI should run: lint, type-check, tests, and build.
- Preview deployments for feature branches.
- Protect `main` branch with PR reviews and checks.

---

## 22) Monitoring & Logging

- Structured logging (`pino`, JSON logs) on server.
- Capture errors with Sentry or Logtail.
- Add API health checks.
- Instrument critical flows with traces (OpenTelemetry).

---

## 23) Do’s & Don’ts

**Do** ✅

- Use Server Components for data-heavy pages.
- Validate all inputs server-side.
- Keep client JS lean.
- Write type-safe queries and server actions.
- Enforce role checks on server.
- Test critical flows with Playwright.

**Don’t** ❌

- Fetch in `useEffect` in App Router.
- Expose secrets to client.
- Mutate DB without transactions.
- Bypass type checks.
- Rely on client-side auth for security.

---
