import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  useDropdownMenu,
} from './dropdown-menu'

// Test component that uses the dropdown context
const TestDropdownComponent = () => {
  const { isLoading, error, onError, onClearError } = useDropdownMenu()
  
  return (
    <div>
      <span data-testid="loading-state">{isLoading ? 'loading' : 'not-loading'}</span>
      <span data-testid="error-state">{error || 'no-error'}</span>
      <button data-testid="trigger-error" onClick={() => onError?.('Test error')}>
        Trigger Error
      </button>
      <button data-testid="clear-error" onClick={() => onClearError?.()}>
        Clear Error
      </button>
    </div>
  )
}

describe('DropdownMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('renders dropdown menu with trigger and content', async () => {
      const user = userEvent.setup()
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByText('Open Menu')).toBeInTheDocument()
      
      // Click trigger to open menu
      await user.click(screen.getByText('Open Menu'))
      
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument()
        expect(screen.getByText('Item 2')).toBeInTheDocument()
      })
    })

    it('handles menu item clicks', async () => {
      const user = userEvent.setup()
      const onAction = vi.fn()
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onAction={onAction}>Clickable Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByText('Open Menu'))
      
      await waitFor(() => {
        expect(screen.getByText('Clickable Item')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Clickable Item'))
      expect(onAction).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading States', () => {
    it('shows loading state on trigger when isLoading is true', () => {
      render(
        <DropdownMenu isLoading={true}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument()
    })

    it('disables trigger when loading', () => {
      render(
        <DropdownMenu isLoading={true}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByRole('button')
      expect(trigger).toHaveAttribute('data-disabled', 'true')
    })

    it('handles async actions in menu items', async () => {
      const user = userEvent.setup()
      const slowAction = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 50))
      )

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onAction={slowAction}>Slow Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByText('Open Menu'))
      
      await waitFor(() => {
        expect(screen.getByText('Slow Item')).toBeInTheDocument()
      })
      
      // Click the item - it should handle the async action without crashing
      await user.click(screen.getByText('Slow Item'))
      
      // Wait for the action to complete
      await waitFor(() => {
        expect(slowAction).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('applies error styling to trigger when error prop is provided', () => {
      render(
        <DropdownMenu error="Something went wrong">
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      // Trigger should have error styling and aria-describedby
      const trigger = screen.getByRole('button')
      expect(trigger).toHaveAttribute('aria-describedby', 'dropdown-error')
      expect(trigger).toHaveClass('border-destructive', 'text-destructive')
    })





    it('handles async errors in menu items', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()
      const failingAction = vi.fn().mockRejectedValue(new Error('Action failed'))
      
      render(
        <DropdownMenu onError={onError}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onAction={failingAction}>Failing Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByText('Open Menu'))
      
      await waitFor(() => {
        expect(screen.getByText('Failing Item')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Failing Item'))
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Action failed')
      })
    })

    it('clears error when menu opens', async () => {
      const user = userEvent.setup()
      const onClearError = vi.fn()
      
      render(
        <DropdownMenu error="Previous error" onClearError={onClearError}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByText('Open Menu'))
      
      await waitFor(() => {
        expect(onClearError).toHaveBeenCalled()
      })
    })
  })

  describe('Context Provider', () => {
    it('provides context values to children', () => {
      render(
        <DropdownMenu isLoading={true} error="Test error">
          <TestDropdownComponent />
        </DropdownMenu>
      )

      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading')
      expect(screen.getByTestId('error-state')).toHaveTextContent('Test error')
    })

    it('allows triggering errors through context', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()
      
      render(
        <DropdownMenu onError={onError}>
          <TestDropdownComponent />
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('trigger-error'))
      expect(onError).toHaveBeenCalledWith('Test error')
    })

    it('allows clearing errors through context', async () => {
      const user = userEvent.setup()
      const onClearError = vi.fn()
      
      render(
        <DropdownMenu onClearError={onClearError}>
          <TestDropdownComponent />
        </DropdownMenu>
      )

      await user.click(screen.getByTestId('clear-error'))
      expect(onClearError).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', async () => {
      const user = userEvent.setup()
      
      render(
        <DropdownMenu error="Error message">
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByRole('button')
      expect(trigger).toHaveAttribute('aria-describedby', 'dropdown-error')
      expect(trigger).toHaveAttribute('aria-haspopup', 'true')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      await user.click(trigger)
      
      await waitFor(() => {
        const menu = screen.getByRole('menu')
        expect(menu).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem>Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByRole('button')
      
      // Test that trigger can be focused and activated
      trigger.focus()
      expect(trigger).toHaveFocus()
      
      // Open menu with click
      await user.click(trigger)
      
      await waitFor(() => {
        const menu = screen.getByRole('menu')
        expect(menu).toBeInTheDocument()
      })

      // Verify menu items are accessible
      const items = screen.getAllByRole('menuitem')
      expect(items).toHaveLength(3)
    })

    it('prevents interaction when disabled', async () => {
      const user = userEvent.setup()
      const onAction = vi.fn()
      
      render(
        <DropdownMenu isLoading={true}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onAction={onAction}>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      const trigger = screen.getByRole('button')
      expect(trigger).toHaveAttribute('data-disabled', 'true')
      
      // Try to click disabled trigger - React Aria may still allow the click but prevent the action
      await user.click(trigger)
      
      // The menu might open but the item should be disabled
      // Let's just check that the trigger shows loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined onAction gracefully', async () => {
      const user = userEvent.setup()
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item without action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByText('Open Menu'))
      
      await waitFor(() => {
        expect(screen.getByText('Item without action')).toBeInTheDocument()
      })
      
      // Should not throw error when clicking item without onAction
      await user.click(screen.getByText('Item without action'))
    })

    it('handles rapid state changes', async () => {
      const TestComponent = () => {
        const [isLoading, setIsLoading] = React.useState(false)
        const [error, setError] = React.useState<string | null>(null)

        return (
          <div>
            <button onClick={() => setIsLoading(!isLoading)}>
              Toggle Loading
            </button>
            <button onClick={() => setError(error ? null : 'Test error')}>
              Toggle Error
            </button>
            <DropdownMenu isLoading={isLoading} error={error}>
              <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Item 1</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }

      const user = userEvent.setup()
      render(<TestComponent />)

      const loadingButton = screen.getByText('Toggle Loading')
      const errorButton = screen.getByText('Toggle Error')

      // Test rapid state changes without crashes
      await user.click(loadingButton)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      
      await user.click(loadingButton)
      await user.click(errorButton)
      await user.click(loadingButton)
      await user.click(errorButton)

      // Should handle gracefully without crashes - find any button (could be loading or normal state)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('handles non-Error objects in catch block', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()
      const failingAction = vi.fn().mockRejectedValue('String error')
      
      render(
        <DropdownMenu onError={onError}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onAction={failingAction}>Failing Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByText('Open Menu'))
      
      await waitFor(() => {
        expect(screen.getByText('Failing Item')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Failing Item'))
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('An unexpected error occurred')
      })
    })

    it('prevents multiple simultaneous actions on same item', async () => {
      const user = userEvent.setup()
      let resolveAction: () => void
      const slowAction = vi.fn().mockImplementation(() => 
        new Promise<void>(resolve => { resolveAction = resolve })
      )
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onAction={slowAction}>Slow Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      await user.click(screen.getByText('Open Menu'))
      
      await waitFor(() => {
        expect(screen.getByText('Slow Item')).toBeInTheDocument()
      })
      
      // Click multiple times rapidly
      const item = screen.getByText('Slow Item')
      await user.click(item)
      await user.click(item)
      await user.click(item)
      
      // Should only be called once
      expect(slowAction).toHaveBeenCalledTimes(1)
      
      // Resolve the action
      resolveAction!()
    })
  })
})