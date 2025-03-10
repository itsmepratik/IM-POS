import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, Minus, Plus } from "lucide-react"

interface Volume {
  id: number
  name: string
  price: number
  quantity: number
}

interface VolumeModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedOilBrand: string | null
  selectedOilType: string | null
  volumes: Array<{ id: number; name: string; price: number }>
  selectedVolumes: Volume[]
  onVolumeClick: (volume: { id: number; name: string; price: number }) => void
  onQuantityChange: (volumeId: number, change: number) => void
  onAddToCart: () => void
  onNext: () => void
}

export function VolumeModal({
  isOpen,
  onOpenChange,
  selectedOilBrand,
  selectedOilType,
  volumes,
  selectedVolumes,
  onVolumeClick,
  onQuantityChange,
  onAddToCart,
  onNext,
}: VolumeModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open)
      }}
    >
      <DialogContent className="w-[90%] max-w-[500px] p-6 rounded-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold">
            {selectedOilBrand} - {selectedOilType}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center mb-6">
          <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] border-2 border-border rounded-lg overflow-hidden bg-muted">
            <img
              src={`/oils/${selectedOilBrand?.toLowerCase()}-${selectedOilType?.toLowerCase().replace(' ', '-')}.jpg`}
              alt={`${selectedOilBrand} ${selectedOilType}`}
              className="object-contain w-full h-full p-2"
              onError={(e) => {
                e.currentTarget.src = "/oils/default-oil.jpg"
              }}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Volume options grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {volumes.map((volume) => (
              <Button
                key={volume.id}
                variant="outline"
                className="h-auto py-3 px-4 flex flex-col items-center gap-1.5"
                onClick={() => onVolumeClick(volume)}
              >
                <div className="text-[clamp(0.875rem,2vw,1rem)] font-medium text-center line-clamp-2">
                  {volume.name}
                </div>
                <div className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-muted-foreground">
                  ${volume.price.toFixed(2)}
                </div>
              </Button>
            ))}
          </div>

          {/* Selected volumes list */}
          {selectedVolumes.length > 0 && (
            <div className="border rounded-lg">
              <ScrollArea className="h-[140px] sm:h-[160px] px-3 py-2">
                <div className="space-y-3">
                  {selectedVolumes.map((volume) => (
                    <div key={volume.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() => onQuantityChange(volume.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center text-[clamp(0.875rem,2vw,1rem)]">
                          {volume.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() => onQuantityChange(volume.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 px-3">
                        <span className="font-medium text-[clamp(0.875rem,2vw,1rem)] line-clamp-1">
                          {volume.name}
                        </span>
                        <span className="font-medium text-[clamp(0.875rem,2vw,1rem)] whitespace-nowrap">
                          ${(volume.price * volume.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <Button
              variant="outline"
              className="px-4 sm:px-6 text-[clamp(0.875rem,2vw,1rem)]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                className="px-4 sm:px-6 text-[clamp(0.875rem,2vw,1rem)]"
                onClick={onAddToCart}
                disabled={selectedVolumes.length === 0}
              >
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={onNext}
                disabled={selectedVolumes.length === 0}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 