"use client";

import { Banknote } from "lucide-react";
import { Cashier02Icon } from "hugeicons-react";
import HugeiconsIcon from "@/components/HugeiconsIcon";
import { Button } from "@/components/ui/button";
import {
  getShiftDisplayName,
  getDrawerBalance,
} from "@/lib/utils/cash-shift-display";

interface POSHeaderToolbarProps {
  /** Active cash shift, or null when no shift is open. */
  activeShift: unknown;
  currentTime: Date | null;
  onOpenCashMovement: () => void;
  onEndShift: () => void;
  onOpenDispute: () => void;
}

/**
 * Desktop (lg+) right-hand toolbar of the POS "Products" header.
 *
 * Sizing is driven by the header's own width (`@container` on CardHeader),
 * not the viewport — the cart column takes a fixed share of the screen, so
 * only the container knows how much room is really available.
 *
 * Overflow strategy (never scrolls, never wraps inside the toolbar):
 *  - Fixed controls (drawer icon, End Shift, Dispute) never shrink.
 *  - The cashier name truncates first; the clock and the Dispute label are
 *    shown only when the header is wide enough.
 */
export function POSHeaderToolbar({
  activeShift,
  currentTime,
  onOpenCashMovement,
  onEndShift,
  onOpenDispute,
}: POSHeaderToolbarProps): React.JSX.Element {
  const now = currentTime ?? new Date();

  return (
    // basis-80: the toolbar only drops below the title (header wraps) when
    // less than 20rem is left — about the width of its non-shrinking controls.
    // Above that it grows to fill the row and the cashier name truncates.
    <div className="hidden lg:flex min-w-0 flex-1 basis-80 flex-nowrap items-center justify-end gap-2">
      {activeShift !== null && activeShift !== undefined && (
        <ShiftStrip
          shift={activeShift}
          onOpenCashMovement={onOpenCashMovement}
          onEndShift={onEndShift}
        />
      )}

      <time
        dateTime={now.toISOString()}
        className="hidden @4xl:inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg bg-muted px-2.5 font-mono text-xs tabular-nums text-muted-foreground"
        suppressHydrationWarning
      >
        {now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </time>

      <Button
        variant="outline"
        className="dispute-button h-9 shrink-0 gap-2 whitespace-nowrap rounded-lg px-2.5 @3xl:px-3 transition-all duration-200 ease-in-out active:transition-none"
        onClick={onOpenDispute}
        aria-label="Dispute"
        title="Dispute"
      >
        <HugeiconsIcon
          icon={Cashier02Icon}
          size={18}
          strokeWidth={2.2}
          className="!size-[18px]"
        />
        <span className="hidden @3xl:inline text-sm font-medium">Dispute</span>
      </Button>
    </div>
  );
}

interface ShiftStripProps {
  shift: unknown;
  onOpenCashMovement: () => void;
  onEndShift: () => void;
}

function ShiftStrip({
  shift,
  onOpenCashMovement,
  onEndShift,
}: ShiftStripProps): React.JSX.Element {
  const name = getShiftDisplayName(shift);
  const balance = getDrawerBalance(shift).toFixed(3);

  return (
    <div className="flex h-9 min-w-0 shrink items-center gap-2 rounded-lg border border-border bg-muted/40 pl-3 pr-1">
      <div
        role="status"
        aria-label={`Active shift: ${name}, drawer OMR ${balance}`}
        className="flex min-w-0 items-center gap-2"
      >
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse motion-reduce:animate-none"
        />
        <span
          className="min-w-0 truncate text-xs font-semibold text-foreground"
          title={name}
        >
          {name}
        </span>
        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />
        <span className="shrink-0 whitespace-nowrap font-mono text-xs font-bold tabular-nums text-emerald-700">
          OMR {balance}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {/* Icon-only by design: the banknote + tooltip identify the action. */}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-md"
          onClick={onOpenCashMovement}
          aria-label="Cash drawer in/out or drop"
          title="Cash Drawer In/Out / Drop"
        >
          <Banknote aria-hidden="true" className="size-4 text-amber-600" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="h-7 whitespace-nowrap rounded-md px-2.5 text-xs font-semibold"
          onClick={onEndShift}
        >
          End Shift
        </Button>
      </div>
    </div>
  );
}
