import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"

interface CartItemProps {
  id: number
  name: string
  price: number
  quantity: number
  onQuantityChange: (id: number, change: number) => void
  onRemove: (id: number) => void
}

export function CartItem({
  id,
  name,
  price,
  quantity,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9"
          onClick={() => onQuantityChange(id, -1)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-6 text-center text-[clamp(0.875rem,2vw,1rem)]">
          {quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9"
          onClick={() => onQuantityChange(id, 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 px-3">
        <span className="font-medium text-[clamp(0.875rem,2vw,1rem)] line-clamp-1">
          {name}
        </span>
        <span className="font-medium text-[clamp(0.875rem,2vw,1rem)] whitespace-nowrap">
          OMR {(price * quantity).toFixed(2)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onRemove(id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
} 