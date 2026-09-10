import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, DialogContent, DialogContentWithoutClose } from "./dialog";
import { AlertDialog, AlertDialogContent } from "./alert-dialog";
import { Sheet, SheetContent } from "./sheet";
import * as DialogPrimitive from "@radix-ui/react-dialog";

/**
 * Regression suite: overlay modals must NEVER dismiss on an outside tap.
 * Dismissal stays available through explicit affordances only
 * (close buttons, Cancel/Action buttons, Escape).
 *
 * Outside taps are dispatched with fireEvent (not userEvent) because Radix
 * modal dialogs intentionally set `pointer-events: none` on <body>, which
 * makes userEvent refuse the click. fireEvent still exercises the real
 * Radix DismissableLayer document-level pointerdown handling.
 */
async function tapOutside(): Promise<void> {
  // Radix attaches its document-level pointerdown listener on a macrotask
  // after mount — yield first so the tap is genuinely observed.
  await new Promise((resolve) => setTimeout(resolve, 10));
  fireEvent.pointerDown(document.body, { button: 0 });
}

describe("modal outside-tap dismissal", () => {
  it("does not close DialogContent on outside tap", async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <div data-testid="dialog-body">Checkout</div>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByTestId("dialog-body")).not.toBeNull();
    await tapOutside();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("dialog-body")).not.toBeNull();
  });

  it("does not close DialogContentWithoutClose on outside tap", async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContentWithoutClose>
          <div data-testid="dialog-body-noclose">Shift lock</div>
        </DialogContentWithoutClose>
      </Dialog>,
    );

    expect(screen.queryByTestId("dialog-body-noclose")).not.toBeNull();
    await tapOutside();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("dialog-body-noclose")).not.toBeNull();
  });

  it("does not close SheetContent on outside tap", async () => {
    const onOpenChange = vi.fn();
    render(
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent side="left">
          <div data-testid="sheet-body">Navigation</div>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.queryByTestId("sheet-body")).not.toBeNull();
    await tapOutside();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("sheet-body")).not.toBeNull();
  });

  it("does not close AlertDialogContent on outside tap", async () => {
    const onOpenChange = vi.fn();
    render(
      <AlertDialog open onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <div data-testid="alert-body">Are you sure?</div>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(screen.queryByTestId("alert-body")).not.toBeNull();
    await tapOutside();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("alert-body")).not.toBeNull();
  });

  it("still invokes a consumer-provided onPointerDownOutside handler", async () => {
    const onOpenChange = vi.fn();
    const onPointerDownOutside = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent onPointerDownOutside={onPointerDownOutside}>
          <div data-testid="dialog-body-passthrough">Void</div>
        </DialogContent>
      </Dialog>,
    );

    await tapOutside();
    expect(onPointerDownOutside).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("still closes on Escape (explicit dismissal is preserved)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <div data-testid="dialog-body-escape">Checkout</div>
        </DialogContent>
      </Dialog>,
    );

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("control: an unguarded dialog DOES close on outside tap (proves the harness observes taps)", async () => {
    const onOpenChange = vi.fn();
    render(
      <DialogPrimitive.Root open onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay />
          <DialogPrimitive.Content>
            <div data-testid="raw-body">Raw</div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>,
    );

    expect(screen.queryByTestId("raw-body")).not.toBeNull();
    await tapOutside();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
