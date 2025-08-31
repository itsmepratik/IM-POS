# Project Context for Qwen Code

## Project Overview

This is a **Next.js** project implementing a modern **Point of Sale (POS) system** for "HNS Automotive Oil change & Service Center". The application is built with **TypeScript** and styled using **Tailwind CSS**. It features a dashboard with sales metrics, user management, inventory control, order processing, and sales reporting.

Key features include:
- Dashboard with sales analytics and key metrics
- Admin panel for user and access management
- Inventory and item/category management
- POS interface for transaction processing
- Sales and inventory reporting
- Responsive design for desktop and mobile

The project uses a component-based architecture with custom UI components and leverages modern React patterns, including Context API for state management.

## Technical Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **UI Components**: Custom components, Radix UI primitives, shadcn/ui
- **Database**: PostgreSQL (via Drizzle ORM)
- **Authentication**: Supabase
- **Deployment**: Vercel

## Building and Running

### Prerequisites
- Node.js (or Bun, as `bun.lock` is present)
- PostgreSQL database (for Drizzle ORM)

### Development
To start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production
To create an optimized production build:
```bash
npm run build
# or
yarn build
# or
pnpm build
# or
bun run build
```

### Running Production Build
To start the production server:
```bash
npm run start
# or
yarn start
# or
pnpm start
# or
bun run start
```

### Database Management (Drizzle ORM)
- Generate migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Open Drizzle Studio: `npm run db:studio`

## Development Conventions

- **Component Library**: The project uses a custom component library, likely based on shadcn/ui, located in `/components`.
- **Styling**: Tailwind CSS is used extensively. Custom theme variables are defined in the Tailwind config.
- **File Structure**:
  - `/app`: Main application pages and layouts using the Next.js App Router.
  - `/components`: Reusable UI components.
  - `/hooks`: Custom React hooks.
  - `/lib`: Utility functions and database logic.
  - `/public`: Static assets (images, fonts, service workers).
- **Fonts**: The project uses custom "Formula 1" fonts, loaded via `next/font/local`.
- **Context Providers**: Application state (user, branch, notifications) is managed via React Context, initialized in the root layout (`app/layout.tsx`).

## Key Files and Directories

- `README.md`: Project description and quick start guide.
- `package.json`: Lists dependencies, scripts, and project metadata.
- `next.config.js`: Next.js configuration file.
- `tailwind.config.js`: Tailwind CSS configuration with custom theme and plugins.
- `components.json`: Configuration for shadcn/ui components.
- `app/layout.tsx`: Root layout with global providers and font loading.
- `app/page.tsx`: Entry point redirecting to the home page.
- `app/home/page.tsx`: Main dashboard page with key metrics and overview.
