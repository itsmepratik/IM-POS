import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Use useId for consistent IDs across renders
    const id = React.useId()
    
    // Add client-side only rendering with useEffect
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
      setMounted(true)
    }, [])

    // Filter out data attributes that might cause hydration mismatches
    const safeProps = React.useMemo(() => {
      const filtered: Record<string, any> = {}
      Object.entries(props).forEach(([key, value]) => {
        if (!key.startsWith('data-')) {
          filtered[key] = value
        }
      })
      return filtered
    }, [props])

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        id={mounted ? props.id : id}
        {...(mounted ? props : safeProps)}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
