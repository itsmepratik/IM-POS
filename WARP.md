# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Next.js 15** Point of Sale (POS) system designed specifically for "HNS Automotive Oil change & Service Center". The application manages inventory, processes sales transactions, and provides analytics for an automotive service business with specialized features for oil products and multi-branch operations.

## Core Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router and React Server Components
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS with custom Formula 1 fonts
- **Database**: PostgreSQL with Drizzle ORM (configured but using mock data in development)
- **Authentication**: Supabase Authentication
- **State Management**: React Context API for global state, custom hooks for feature-specific state
- **UI Components**: Custom component library based on Radix UI primitives and shadcn/ui
- **Runtime**: Bun (with npm/yarn fallbacks)

### Application Structure
- **`/app`**: Next.js App Router pages and layouts with nested route structure
- **`/components`**: Reusable UI components organized by feature and complexity
- **`/lib`**: Utility functions, database client configuration, and service layer
- **`/hooks`**: Custom React hooks for state management and data fetching
- **`/doc-ref`**: Documentation including PRD, design system, and technical specifications

### Context Architecture
The app uses a layered context system:
1. **UserProvider**: Authentication and user role management
2. **BranchProvider**: Multi-branch operations and branch selection
3. **NotificationProvider**: Toast notifications and system messages
4. **ItemsProvider**: Inventory management with mock data switching

### Key Features
- **Branch-specific inventory management** with real-time stock tracking
- **Oil-specific features**: Volume-based pricing, bottle states (open/closed), partial volume sales
- **Point of Sale interface** with transaction processing
- **Multi-device responsive design** with dedicated mobile interfaces
- **Advanced filtering and search** across inventory items

## Development Commands

### Running the Application
```bash
# Development server (primary)
bun dev
# OR
npm run dev

# Production build
bun run build
npm run build

# Start production server
bun start
npm start
```

### Database Operations (Drizzle)
```bash
# Generate database migrations
bun run db:generate
npm run db:generate

# Apply database migrations
bun run db:migrate
npm run db:migrate

# Open Drizzle Studio for database inspection
bun run db:studio
npm run db:studio
```

### Code Quality
```bash
# Run ESLint (with build-time errors ignored)
bun run lint
npm run lint

# TypeScript checking (build errors ignored in config)
npx tsc --noEmit
```

### Testing
The project includes test pages for component verification:
- `/test` - Notification system testing
- `/date-picker-test` - Date picker component testing

## Database Schema & Business Logic

### Core Business Entities
The system is designed around automotive service operations:

**Items**: Products with specialized oil handling
- Standard products: Parts, filters, accessories
- Oil products: Multiple volumes per product, bottle state tracking
- Batch tracking: Cost price, quantities, expiration dates

**Branches**: Multi-location inventory management
- Independent inventory per branch
- Inventory transfers between branches
- Branch-specific stock levels

**Sales**: Transaction processing
- Multi-item sales with discounts
- Payment method tracking
- Automatic inventory adjustments

### Special Oil Product Logic
Oil products have unique business rules:
- **Volume-based pricing**: Same oil type sold in 1L, 4L, 5L with different prices
- **Bottle states**: Tracks "open" vs "closed" bottles for inventory accuracy
- **Partial volume sales**: Can sell partial amounts from larger containers
- **FIFO inventory**: Prioritizes older opened bottles first

## Component Architecture

### Design System
Based on comprehensive design tokens defined in `/doc-ref/design.md`:
- **Spacing**: Tailwind scale with custom responsive utilities
- **Typography**: Custom Formula 1 fonts with system fallbacks
- **Colors**: HSL-based design tokens supporting light/dark themes
- **Components**: Consistent patterns for buttons, forms, modals

### UI Component Patterns
```tsx
// Standard component structure
<Button variant="primary" size="default">Action</Button>
<Card className="shadow">
  <CardHeader>Title</CardHeader>
  <CardContent>Body content</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>
```

### Mobile-First Responsive Design
- **Breakpoints**: Mobile (default), tablet (`md:`), desktop (`lg:`, `xl:`)
- **Layout patterns**: `flex-col md:flex-row` for auto-stacking
- **Component variants**: Dedicated mobile components for complex interfaces

## Development Patterns

### Data Flow Architecture
1. **Context Providers**: Global state management in `app/layout.tsx`
2. **Service Layer**: API abstraction in `/lib/services/`
3. **Mock Data Switching**: Development uses comprehensive mock data
4. **Custom Hooks**: Feature-specific state management (e.g., `useBranchInventoryMockData`)

### Component Organization
- **UI Primitives**: `/components/ui/` - Basic reusable components
- **Feature Components**: `/components/` - Domain-specific components
- **Page Components**: `/app/[feature]/` - Route-specific implementations
- **Layout Components**: Navigation, sidebars, page structure

### File Naming Conventions
- **Components**: PascalCase (e.g., `BranchInventory.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useBranchInventory.ts`)
- **Utilities**: camelCase (e.g., `formatCurrency.ts`)
- **Types**: PascalCase interfaces/types (e.g., `Item`, `Branch`)

### State Management Patterns
```tsx
// Context-based global state
const { currentBranch, selectBranch } = useBranch();

// Custom hook for feature state
const { items, filteredItems, isLoading } = useBranchInventory();

// Local component state for UI
const [isModalOpen, setIsModalOpen] = useState(false);
```

## Key Business Logic

### Inventory Management
- **Stock calculations**: Real-time updates across branches
- **Low stock alerts**: Configurable thresholds per item
- **Batch FIFO**: First-in-first-out inventory management
- **Oil bottle tracking**: Complex state management for partial containers

### Multi-Branch Operations
- **Branch selection**: Context-driven branch switching
- **Independent inventories**: Each branch maintains separate stock
- **Inter-branch transfers**: Inventory movement tracking
- **Branch-specific reporting**: Isolated analytics per location

### POS Transaction Flow
- **Cart management**: Multi-item transaction building
- **Inventory validation**: Real-time stock checking
- **Automatic adjustments**: Inventory updates on sale completion
- **Payment processing**: Multiple payment method support

## Testing & Development

### Mock Data System
Development environment uses sophisticated mock data:
- **Branch-specific inventory**: Different stock levels per branch
- **Realistic product data**: Automotive-focused inventory
- **Transaction simulation**: Complete POS workflow testing
- **API delay simulation**: Realistic loading states

### Component Testing
Use the built-in test pages:
```bash
# Navigate to test pages in browser
http://localhost:3000/test
http://localhost:3000/date-picker-test
```

### Database Development
```bash
# View schema and data in Drizzle Studio
bun run db:studio

# Reset and migrate database
bun run db:generate
bun run db:migrate
```

## Performance & Optimization

### Next.js Optimizations
- **App Router**: Server-side rendering for optimal performance
- **Image optimization**: Next.js Image component with proper sizing
- **Font optimization**: Local font loading with `font-display: swap`
- **Bundle analysis**: Tree shaking for minimal client-side JavaScript

### Component Optimizations
- **Memoization**: React.memo for expensive list components
- **Lazy loading**: Code splitting for large feature sets
- **Virtualization**: Efficient rendering for large inventory lists

### Build Configuration
- **TypeScript**: Build errors ignored for development velocity
- **ESLint**: Warnings only during development
- **Image handling**: Unoptimized for development, optimized for production

## Architecture Decisions

### Why Mock Data in Development
- **Rapid iteration**: No database dependency for frontend development
- **Complete workflows**: Full feature testing without backend complexity
- **Branch simulation**: Multi-location testing with realistic data
- **Performance testing**: Large datasets without database overhead

### Context vs Hook Patterns
- **Global state**: React Context for auth, branch, notifications
- **Feature state**: Custom hooks for complex feature logic
- **UI state**: Local useState for component-specific interactions

### Mobile-First Design
- **Progressive enhancement**: Mobile base with desktop additions
- **Touch-friendly**: Appropriate tap targets and gestures
- **Responsive data**: Different data density per device type
- **Offline considerations**: Service worker registration for PWA features

## Common Development Tasks

### Adding a New Inventory Feature
1. Create service function in `/lib/services/`
2. Add mock data handling if needed
3. Create custom hook for state management
4. Build UI components following design system
5. Add mobile-responsive variant
6. Test with branch-specific data

### Modifying Oil Product Logic
1. Update business logic in inventory service
2. Modify bottle state tracking in components
3. Test volume-based pricing calculations
4. Verify FIFO inventory consumption
5. Update mobile oil management interface

### Branch Management Changes
1. Modify branch context provider
2. Update branch-specific data hooks
3. Test inventory transfer logic
4. Verify branch isolation
5. Update branch selection UI

### Adding New Payment Methods
1. Extend POS transaction types
2. Update payment processing logic
3. Add payment method UI components
4. Test transaction completion flow
5. Update receipt generation

## Security & Authentication

### Role-Based Access
```tsx
// Component-level access control
if (currentUser?.role === "staff") {
  return <div>You don't have permission...</div>;
}
```

### Branch-Level Security
- **Inventory isolation**: Users only see assigned branch data
- **Transaction scoping**: Sales limited to current branch context
- **Admin functions**: Higher privilege requirements for system operations

This POS system prioritizes automotive service workflows with sophisticated oil product management and multi-branch operations. The architecture supports rapid development with comprehensive mock data while maintaining production-ready patterns for database integration.
