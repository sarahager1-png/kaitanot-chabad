# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server with Turbopack on localhost:3000
npm run build        # production build
npm run typecheck    # TypeScript check (no emit)
npm run lint         # ESLint
npm run format       # Prettier (ts, tsx)
```

No test suite exists in this project.

## Environment

Required `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

## Architecture

**Stack:** Next.js 16 (App Router), Supabase (auth + postgres + storage), Tailwind CSS v4, shadcn/ui, TypeScript.

**Auth & routing:** `middleware.ts` guards all routes except `PUBLIC_PATHS` (`/login`, `/register`, `/api/register`, `/api/payments/webhook`, `/payment`). Session is maintained via Supabase SSR cookies.

**Supabase clients — two patterns:**
- `createClient()` — SSR client with cookie-based user session. Use for authenticated user operations; respects RLS.
- `createServiceClient()` — service role client, bypasses RLS. Use in API routes that need to write on behalf of the user (inserts after auth check).

**Route groups:**
- `app/(auth)/` — login page
- `app/(dashboard)/` — all protected pages (camps, registrants, finance, documents, staff, planning, services, alerts, admin, help)
- `app/register/` — public registration form for parents
- `app/api/` — all API routes

**Data flow pattern:** Pages are server components that fetch data directly via `createClient()`, then pass it as props to `*-client.tsx` components which handle all interactivity. API routes handle mutations.

**Key shared files:**
- `lib/types.ts` — all TypeScript interfaces (Registrant, ExpenseEntry, Camp, etc.)
- `lib/constants.ts` — enums: DOCUMENT_TEMPLATES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, SHIRT_SIZES, KIPPAH_SIZES, PAYMENT_STATUSES, STAFF_ROLES, SCHOOL_YEARS
- `lib/export.ts` — `exportToExcel()`, `exportToPrint()` (prints DOM element), `printDataCard()` (prints key-value object)
- `lib/utils.ts` — `cn()` only

**Styling:** Tailwind CSS v4. Brand colors: teal `#00B1AE`, salmon `#F68E75`, yellow `#F8AD1D`, navy `#333654`. RTL layout — all user-facing pages use `dir="rtl"`.

**Database schema** is in `supabase/schema.sql`. When adding columns run a migration manually via Supabase SQL Editor; migration scripts go in `supabase/migration_*.sql`.

**Storage:** Single bucket `camp-documents` (private). Documents: `{campId}/{docId}.{ext}`. Invoices: `{campId}/invoices/{expenseId}.{ext}`.

**Roles:** `שליח` (sees own camp only), `מנהל רשת` (sees all camps), `אדמין מערכת` (full access). Enforced via Supabase RLS policies and checked in UI via the user's profile row.
