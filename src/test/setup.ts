import '@testing-library/jest-dom'
import React from 'react'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => 
    React.createElement('div', { 'data-testid': 'loader2-icon', className }),
  ChevronDown: ({ className }: { className?: string }) => 
    React.createElement('div', { 'data-testid': 'chevron-down-icon', className }),
  MoreHorizontal: ({ className }: { className?: string }) => 
    React.createElement('div', { 'data-testid': 'more-horizontal-icon', className }),
}))

// Mock CSS modules and styles
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))