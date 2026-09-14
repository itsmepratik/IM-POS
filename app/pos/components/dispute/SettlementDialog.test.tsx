import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettlementDialog } from "./SettlementDialog";

vi.mock("@/lib/hooks/useStaffIDs", () => ({
  useStaffIDs: () => ({
    staffMembers: [
      { id: "0001", name: "Ahmed Al-Busaidi" },
      { id: "0010", name: "Adanan" },
      { id: "0020", name: "Forman" },
    ],
  }),
}));

vi.mock("@/lib/contexts/DataProvider", () => ({
  useBranch: () => ({ currentBranch: null, inventoryLocationId: "loc-1" }),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

/**
 * TDD — credit settlement must let the cashier choose how the credit is
 * settled: Cash, Card, or Mobile transfer (no hardcoded CASH).
 */
async function driveToConfirmStep() {
  const user = userEvent.setup();
  render(<SettlementDialog open onOpenChange={vi.fn()} />);

  await user.type(
    screen.getByPlaceholderText(/enter reference or bill number/i),
    "A011230926",
  );
  await user.click(screen.getByRole("button", { name: /continue/i }));

  await user.type(screen.getByPlaceholderText("ID"), "0001");
  await user.click(screen.getByRole("button", { name: /verify id/i }));

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: /confirm settlement/i }),
    ).toBeDefined();
  });
  return user;
}

describe("SettlementDialog - settlement payment options", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks for the reference first", () => {
    render(<SettlementDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText(/reference\/bill number/i)).toBeDefined();
  });

  it("shows cash, card, and mobile pay choices on the confirm step", async () => {
    await driveToConfirmStep();
    expect(
      screen.getByRole("radio", { name: /^cash$/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("radio", { name: /^card$/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("radio", { name: /mobile pay/i }),
    ).toBeDefined();
  });

  it("reveals the POS mobile recipients when Mobile Pay is selected", async () => {
    const user = await driveToConfirmStep();
    await user.click(screen.getByRole("radio", { name: /mobile pay/i }));
    expect(
      screen.getByRole("button", { name: "Foreman" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Forman" }),
    ).toBeDefined();
  });

  it("blocks mobile settlement until a recipient is picked", async () => {
    const user = await driveToConfirmStep();
    await user.click(screen.getByRole("radio", { name: /mobile pay/i }));
    await user.click(
      screen.getByRole("button", { name: /confirm settlement/i }),
    );
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("posts the mobile recipient account with a mobile settlement", async () => {
    const user = await driveToConfirmStep();
    await user.click(screen.getByRole("radio", { name: /mobile pay/i }));
    await user.click(screen.getByRole("button", { name: "Foreman" }));
    await user.click(
      screen.getByRole("button", { name: /confirm settlement/i }),
    );

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    const [, options] = vi.mocked(fetch).mock.calls[0] as [
      string,
      { body: string },
    ];
    const body = JSON.parse(options.body) as {
      paymentMethod: string;
      mobilePaymentAccount: string;
    };
    expect(body.paymentMethod).toBe("MOBILE");
    // Same value the POS checkout stores: the staff name behind the
    // "Foreman" display label.
    expect(body.mobilePaymentAccount).toBe("Adanan");
  });

  it("posts the selected settlement method instead of hardcoded CASH", async () => {
    const user = await driveToConfirmStep();
    await user.click(screen.getByRole("radio", { name: /card/i }));
    await user.click(
      screen.getByRole("button", { name: /confirm settlement/i }),
    );

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    const [, options] = vi.mocked(fetch).mock.calls[0] as [
      string,
      { body: string },
    ];
    const body = JSON.parse(options.body) as { paymentMethod: string };
    expect(body.paymentMethod).toBe("CARD");
  });

  it("defaults the settlement method to cash", async () => {
    const user = await driveToConfirmStep();
    await user.click(
      screen.getByRole("button", { name: /confirm settlement/i }),
    );

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    const [, options] = vi.mocked(fetch).mock.calls[0] as [
      string,
      { body: string },
    ];
    const body = JSON.parse(options.body) as { paymentMethod: string };
    expect(body.paymentMethod).toBe("CASH");
  });
});
