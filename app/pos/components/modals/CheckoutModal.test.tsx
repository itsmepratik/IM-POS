import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutModal } from "./CheckoutModal";

/**
 * TDD RED — checkout must show Card / Credit / On-hold WITHOUT an
 * "Other" gate, plus a Cash + Card split.
 *
 * Contract under test (CheckoutModal does not satisfy this yet):
 * - Card, Credit, on-hold are visible immediately (no click on Other).
 * - There is NO "Other" button anymore.
 * - A split toggle reveals cash + card amount inputs bound to `total`.
 * - Complete is disabled until a valid single method OR a valid split
 *   (cash + card == total) is entered.
 */
function renderModal(overrides: Partial<React.ComponentProps<typeof CheckoutModal>> = {}) {
  const props: React.ComponentProps<typeof CheckoutModal> = {
    isOpen: true,
    onOpenChange: vi.fn(),
    selectedPaymentMethod: null,
    setSelectedPaymentMethod: vi.fn(),
    showOtherOptions: false,
    setShowOtherOptions: vi.fn(),
    isOnHoldMode: false,
    setIsOnHoldMode: vi.fn(),
    carPlateNumber: "",
    setCarPlateNumber: vi.fn(),
    paymentRecipient: null,
    setPaymentRecipient: vi.fn(),
    total: 6.5,
    cart: [],
    cartContainsAnyBatteries: () => false,
    staffMembers: [],
    onPaymentComplete: vi.fn(),
    showSuccess: false,
    ...overrides,
  };
  render(<CheckoutModal {...props} />);
  return props;
}

describe("CheckoutModal - all methods visible, no Other gate", () => {
  it("shows Mobile Pay, Cash, Card, Credit, and on-hold immediately", () => {
    renderModal();
    expect(screen.getByRole("button", { name: /mobile pay/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^cash$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^card$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /credit/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /on-hold/i })).toBeDefined();
  });

  it("has no Other button", () => {
    renderModal();
    expect(screen.queryByRole("button", { name: /^other$/i })).toBeNull();
  });

  it("selects Card directly without expanding anything", async () => {
    const user = userEvent.setup();
    const setSelectedPaymentMethod = vi.fn();
    renderModal({ setSelectedPaymentMethod });
    await user.click(screen.getByRole("button", { name: /^card$/i }));
    expect(setSelectedPaymentMethod).toHaveBeenCalledWith("card");
  });
});

describe("CheckoutModal - cash/card split", () => {
  it("offers a split option labeled exactly 'Split'", () => {
    renderModal();
    expect(
      screen.getByRole("button", { name: "Split" }),
    ).toBeDefined();
    expect(screen.queryByText(/cash \+ card/i)).toBeNull();
  });

  it("reveals cash and card amount inputs when split is selected", async () => {
    const user = userEvent.setup();
    function SplitHarness() {
      const [method, setMethod] =
        React.useState<React.ComponentProps<typeof CheckoutModal>["selectedPaymentMethod"]>(null);
      return (
        <CheckoutModal
          isOpen
          onOpenChange={vi.fn()}
          selectedPaymentMethod={method}
          setSelectedPaymentMethod={setMethod}
          showOtherOptions={false}
          setShowOtherOptions={vi.fn()}
          isOnHoldMode={false}
          setIsOnHoldMode={vi.fn()}
          carPlateNumber=""
          setCarPlateNumber={vi.fn()}
          paymentRecipient={null}
          setPaymentRecipient={vi.fn()}
          total={6.5}
          cart={[]}
          cartContainsAnyBatteries={() => false}
          staffMembers={[]}
          onPaymentComplete={vi.fn()}
          showSuccess={false}
        />
      );
    }
    render(<SplitHarness />);
    await user.click(
      screen.getByRole("button", { name: "Split" }),
    );
    expect(screen.getByLabelText(/cash amount/i)).toBeDefined();
    expect(screen.getByLabelText(/card amount/i)).toBeDefined();
  });

  it("Split evenly always sums exactly to the total (no rounding residue)", async () => {
    const user = userEvent.setup();
    function OddTotalHarness() {
      const [method, setMethod] =
        React.useState<React.ComponentProps<typeof CheckoutModal>["selectedPaymentMethod"]>(null);
      return (
        <CheckoutModal
          isOpen
          onOpenChange={vi.fn()}
          selectedPaymentMethod={method}
          setSelectedPaymentMethod={setMethod}
          showOtherOptions={false}
          setShowOtherOptions={vi.fn()}
          isOnHoldMode={false}
          setIsOnHoldMode={vi.fn()}
          carPlateNumber=""
          setCarPlateNumber={vi.fn()}
          paymentRecipient={null}
          setPaymentRecipient={vi.fn()}
          total={6.555}
          cart={[]}
          cartContainsAnyBatteries={() => false}
          staffMembers={[]}
          onPaymentComplete={vi.fn()}
          showSuccess={false}
        />
      );
    }
    render(<OddTotalHarness />);
    await user.click(
      screen.getByRole("button", { name: "Split" }),
    );
    await user.click(
      screen.getByRole("button", { name: /split evenly/i }),
    );
    // 6.555 cannot be halved into two equal 3-decimal legs; the button must
    // still produce legs that sum exactly to the total (3.278 + 3.277).
    const cashInput = screen.getByLabelText(/cash amount/i) as HTMLInputElement;
    const cardInput = screen.getByLabelText(/card amount/i) as HTMLInputElement;
    expect(cashInput.value).toBe("3.278");
    expect(cardInput.value).toBe("3.277");
    expect(
      screen.getByRole("button", { name: /complete payment/i }),
    ).toHaveProperty("disabled", false);
  });

  it("keeps Complete disabled until split legs equal the total", async () => {
    const user = userEvent.setup();
    const onPaymentComplete = vi.fn();
    const setSelectedPaymentMethod = vi.fn();
    let split: { cashAmount: number; cardAmount: number } = {
      cashAmount: 0,
      cardAmount: 0,
    };
    const { rerender } = render(
      <CheckoutModal
        isOpen
        onOpenChange={vi.fn()}
        selectedPaymentMethod="split"
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        showOtherOptions={false}
        setShowOtherOptions={vi.fn()}
        isOnHoldMode={false}
        setIsOnHoldMode={vi.fn()}
        carPlateNumber=""
        setCarPlateNumber={vi.fn()}
        paymentRecipient={null}
        setPaymentRecipient={vi.fn()}
        total={6.5}
        cart={[]}
        cartContainsAnyBatteries={() => false}
        staffMembers={[]}
        onPaymentComplete={onPaymentComplete}
        showSuccess={false}
        splitCashAmount={split.cashAmount}
        splitCardAmount={split.cardAmount}
        setSplitCashAmount={(v: number) => {
          split = { ...split, cashAmount: v };
        }}
        setSplitCardAmount={(v: number) => {
          split = { ...split, cardAmount: v };
        }}
      />,
    );
    void rerender;
    void user;
    // Invalid split (0 + 0 != 6.500) → Complete must be disabled
    expect(
      screen.getByRole("button", { name: /complete payment/i }),
    ).toHaveProperty("disabled", true);
  });
});
