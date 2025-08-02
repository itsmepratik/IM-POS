import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CartItem } from "./cart-item"

interface CartProps {
  items: Array<{
    id: number
    name: string
    price: number
    quantity: number
  }>
  onQuantityChange: (id: number, change: number) => void
  onRemove: (id: number) => void
  onCheckout: () => void
  onClear: () => void
}

export function Cart({
  items,
  onQuantityChange,
  onRemove,
  onCheckout,
  onClear,
}: CartProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold">Cart</h2>
        <Button
          variant="ghost"
          className="text-[clamp(0.875rem,2vw,1rem)] text-muted-foreground hover:text-destructive"
          onClick={onClear}
          disabled={items.length === 0}
        >
          Clear All
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {items.map((item) => (
            <CartItem
              key={item.id}
              id={item.id}
              name={item.name}
              price={item.price}
              quantity={item.quantity}
              onQuantityChange={onQuantityChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[clamp(1rem,2.5vw,1.125rem)] font-medium">Total</span>
          <span className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold">
            OMR {total.toFixed(3)}
          </span>
        </div>
        <Button
          className="w-full text-[clamp(0.875rem,2vw,1rem)]"
          size="lg"
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          Checkout
        </Button>
      </div>
    </div>
  )
}