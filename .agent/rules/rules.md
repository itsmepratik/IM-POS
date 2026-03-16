---
trigger: always_on
---

# IM-POS Project Rules

## ⚡ AI Behavior
- Do **only** what is explicitly asked. Nothing more.
- Always propose the **senior/production-level** solution unless told otherwise.
- Use available MCPs for all operations (Supabase MCP for DB, Ref MCP for context).
- **Block the task** and ask for clarification if a security flaw or footgun is detected.
- Criticize any code or pattern that feels "v1" or "MVP" quality.

---

## 🔴 Pre-Flight (Do This Before Writing Any Code)
Before generating code, you must:
1. **Read the target file** if modifying existing code. Never assume its current structure.
2. **Identify all data types** involved. Check the Drizzle schema for the exact shape.
3. **Confirm the rendering context**: Server Component, Client Component, Server Action, or Route Handler.
4. **List edge cases**: What happens if the query returns null? If the action fails mid-write? If the user is unauthenticated?
5. **Check for an existing abstraction** before creating a new one (hook, utility, component).

---

## ✅ Self-Review (Do This Before Outputting Code)
Before presenting code, mentally verify:
- [ ] No `any` types. No `// @ts-ignore`. No `// @ts-expect-error` without a comment explaining why.
- [ ] Every `async` function has `await` on all async calls.
- [ ] No unused imports or variables.
- [ ] All nullable values from DB queries are guarded before use.
- [ ] Every mutation revalidates the relevant cache (`revalidatePath` / `revalidateTag`).
- [ ] No secrets, keys, or tokens are referenced client-side.
- [ ] `loading.tsx` and `error.tsx` exist or are proposed for any new route.
- [ ] TypeScript would compile without errors given strict mode.

---

## 🚫 Never Violate
- NEVER expose `service_role` key to the client.
- NEVER skip RLS on any table.
- NEVER use `console.log` in production — use structured logging.
- NEVER use the `any` type — use `unknown` and narrow it, or derive types from the Drizzle schema.
- NEVER use `// @ts-ignore` silently — if unavoidable, explain why in a comment.
- NEVER skip Zod validation on API inputs, env vars, or form data.
- NEVER assume a DB record exists — always handle the null/undefined case explicitly.
- NEVER write a multi-table mutation outside of a `db.transaction()`.
- NEVER import server-only modules (`server-only`, `drizzle`, `supabase admin`) in a Client Component.

---

## 📦 Stack
| Layer | Package | Version |
|---|---|---|
| Runtime | Bun | 1.3.3+ |
| Framework | Next.js (App Router) | 15.5.9 |
| UI Library | React | 19.x |
| Database | Supabase / PostgreSQL | latest |
| ORM | Drizzle ORM + Drizzle Kit | latest |
| Styling | Tailwind CSS | 4.x |
| Auth | @supabase/ssr | latest |
| Validation | Zod | latest |
| Icons | Phosphor Icons / Lucide | latest |
| Components | Shadcn UI (Radix) | latest |

---

## ⚠️ Next.js 15 Breaking Changes (Active Gotchas)
- **`params` and `searchParams` are async Promises.** Always `await` them.
  ```ts
  // ✅ Correct
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```
- **`cookies()` and `headers()` are async** in Server Components. Always `await` them.
- **`fetch` defaults to `no-store`** — explicitly opt into caching where needed.
- **Route Handlers** must use `NextRequest` / `NextResponse`, not `Request` / `Response`.

## ⚠️ React 19 Patterns (Use These)
- Use `useActionState` (not the deprecated `useFormState`) for Server Action form state.
- Use `useFormStatus` for pending states inside forms tied to Server Actions.
- Use `useOptimistic` for all critical POS mutations (add to cart, void item, etc.).
- Use the `use()` hook to unwrap promises and context in Client Components.

## ⚠️ Drizzle Patterns
- Derive all TypeScript types from the schema. Never define them manually:
  ```ts
  type Product = typeof products.$inferSelect;
  type NewProduct = typeof products.$inferInsert;
  ```
- Use `.returning()` after inserts/updates to get the resulting record.
- Use `db.transaction(async (tx) => { ... })` for any operation touching more than one table.
- Run `bun db:migrate` locally before pushing schema changes.

---

## 🏗 Architecture
- **Default to Server Components.** Use `"use client"` only for interactivity or browser APIs.
- Use **Server Actions** for all mutations. Always include error handling and `revalidatePath`/`revalidateTag`.
- Use **parallel/intercepting routes** for modals and dashboard layouts.
- Include the **Metadata API** on every page.
- Use `useOptimistic` for POS actions that need instant feedback.

---

## 🔐 Auth & Database
- Use `@supabase/ssr` for all session handling in Server Components and Middleware.
- `service_role` key is server-only — never referenced outside server utilities.
- Every table must have RLS policies defined before any data operation is written against it.

---

## 🧹 Code Quality
- **SOLID / DRY / KISS.** Flag any file exceeding 300 lines for refactoring.
- All function parameters and return types must be **explicitly typed** — no inferred `any` from untyped boundaries.
- Use `const` over `let` unless reassignment is required.
- Use **semantic HTML** with proper ARIA labels and landmarks.
- Prefer server-side solutions over client-side libraries for data fetching and heavy computation.
- Every route must have a `loading.tsx` skeleton and an `error.tsx` boundary.