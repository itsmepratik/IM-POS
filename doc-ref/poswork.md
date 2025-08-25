# POS Page Architecture Specification

## Overview

This document outlines the architecture for a modular POS (Point of Sale) system that will be ready for future database integration. The system should be built with clear separation of concerns, reusable components, and maintainable code structure.

## Current Implementation Status

✅ **Completed:**

- Main POS page functionality exists in `app/pos/page.tsx`
- Required hooks (`usePOSCatalog`, `usePOSMockData`) are implemented
- Modal components for different product types are available
- Tab-based navigation is implemented

⚠️ **Issues Found:**

- All functionality is contained in a single large component (~3600 lines)
- Category components are not separated as specified
- Tab naming inconsistency resolved: "Oil" → "Lubricants" ✅
- Missing "Batteries" category
- No `useCategory` hook exists

## Recommended Architecture

### 1. Main POS Page Component

**File:** `app/pos/page.tsx`

**Responsibilities:**

- Serve as the main container and layout component
- Handle global state (cart, customer info, payment)
- Render category tabs and conditionally display active category
- Manage cart operations and checkout flow
- Handle payment processing and receipt generation

**Current Status:** ✅ Implemented (but monolithic)

### 2. Category-Specific Components

Create separate components for each product category:

#### OilCategory Component

**File:** `app/pos/components/categories/OilCategory.tsx`

**Workflow:**

1. Primary view displays list of lubricant brands
2. When brand is selected → Display all products under that brand
3. When product is selected → Show volume selection modal (5L, 4L, 2L, 1L, 0.5L)
4. After volume selection → Show bottle type selection (Open/Closed Bottle)

**Data Source:** `usePOSCatalog` hook for lubricant products

#### FiltersCategory Component

**File:** `app/pos/components/categories/FiltersCategory.tsx`

**Workflow:**

1. Primary view displays filter types (Oil Filter, Cabin Filter, Air Filter, etc.)
2. When filter type is selected → Display available brands for that type
3. When brand is selected → Display final list of products
4. Product selection → Add to cart

**Data Source:** `usePOSCatalog` hook for filter products

#### PartsCategory Component

**File:** `app/pos/components/categories/PartsCategory.tsx`

**Workflow:**

1. Primary view displays part types/categories (including batteries)
2. When part type is selected → Display available brands
3. When brand is selected → Display final list of products
4. Product selection → Add to cart

**Special Features:**

- Includes battery products with special handling (A5 bill generation)
- Trade-in functionality for batteries
- Different receipt handling for batteries vs. regular parts
- Unified interface for all parts and batteries

**Data Source:** `usePOSCatalog` hook for parts and battery products

#### AdditivesFluidsCategory Component

**File:** `app/pos/components/categories/AdditivesFluidsCategory.tsx`

**Workflow:**

1. Primary view displays list of brands
2. When brand is selected → Display all products under that brand
3. Direct product selection → Add to cart (no volume selection)

**Data Source:** `usePOSCatalog` hook for additives & fluids products

### 3. Shared Components & Modals

#### VolumeModal

**File:** `app/pos/components/VolumeModal.tsx` ✅ **Exists**

**Usage:** Lubricants category for volume selection

#### FilterModal

**File:** `app/pos/components/FilterModal.tsx` ✅ **Exists**

**Usage:** Filters category for product selection

#### PartsModal

**File:** `app/pos/components/PartsModal.tsx` ✅ **Exists**

**Usage:** Parts category for product selection

#### ProductModal

**File:** `app/pos/components/ProductModal.tsx` ✅ **Exists**

**Usage:** General product selection with variants

### 4. Data Layer

#### usePOSCatalog Hook

**File:** `lib/hooks/data/usePOSCatalog.ts` ✅ **Exists**

**Responsibilities:**

- Aggregate data from inventory sources
- Provide categorized product data
- Handle data transformation for POS-specific needs

#### usePOSMockData Hook

**File:** `lib/hooks/data/usePOSMockData.ts` ✅ **Exists**

**Responsibilities:**

- Provide mock data for development/testing
- Maintain compatibility with POS component expectations

### 5. State Management

#### Category Context (Recommended)

**File:** `app/pos/context/CategoryContext.tsx` ❌ **Missing**

**Purpose:** Manage active category state and provide it to child components

#### Cart Context (Recommended)

**File:** `app/pos/context/CartContext.tsx` ❌ **Missing**

**Purpose:** Centralized cart state management

## Implementation Priority

### Phase 1: Code Organization

1. Extract category-specific logic into separate components
2. Create shared interfaces and types
3. Implement proper component composition

### Phase 2: State Management

1. Create CategoryContext for managing active tab
2. Create CartContext for centralized cart operations
3. Implement proper data flow between components

### Phase 3: Component Optimization

1. Add proper loading states
2. Implement error boundaries
3. Add accessibility features
4. Optimize re-renders with memoization

### Phase 4: Testing & Documentation

1. Add unit tests for each category component
2. Add integration tests for complete workflows
3. Update documentation with actual implementation details

## Benefits of This Architecture

1. **Maintainability:** Each category has its own component with clear responsibilities
2. **Reusability:** Shared components can be reused across categories
3. **Testability:** Individual components can be tested in isolation
4. **Scalability:** Easy to add new categories or modify existing ones
5. **Database Integration Ready:** Clear separation makes it easy to swap mock data for real API calls

## Migration Strategy

1. **Start Small:** Extract one category component at a time
2. **Maintain Compatibility:** Ensure existing functionality continues to work
3. **Gradual Refactor:** Move logic incrementally rather than all at once
4. **Test Frequently:** Validate each component as it's extracted

## Updated Tab Naming Convention

To match current implementation and be more accurate:

- "Oil" (current) → "Lubricants" (more descriptive)
- "Filters" ✅ (matches current)
- "Parts" ✅ (matches current)
- "Additives & Fluids" ✅ (matches current)
- Add "Batteries" as separate category (currently part of Parts)

## File Structure Recommendation

```
app/pos/
├── components/
│   ├── categories/
│   │   ├── LubricantCategory.tsx
│   │   ├── FiltersCategory.tsx
│   │   ├── PartsCategory.tsx (includes batteries)
│   │   └── AdditivesFluidsCategory.tsx
│   ├── modals/
│   │   ├── VolumeModal.tsx
│   │   ├── FilterModal.tsx
│   │   ├── PartsModal.tsx
│   │   └── ProductModal.tsx
│   └── shared/
│       ├── BrandCard.tsx
│       ├── ProductCard.tsx
│       └── SelectionModal.tsx
├── context/
│   ├── CategoryContext.tsx
│   └── CartContext.tsx
├── hooks/
│   ├── useCategory.tsx
│   └── useCart.tsx
└── page.tsx (simplified main component)
```
