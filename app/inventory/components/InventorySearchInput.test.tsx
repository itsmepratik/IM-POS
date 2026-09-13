import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InventorySearchInput } from "./InventorySearchInput";

/**
 * Regression suite: the search magnifier is a real button and clicking it
 * commits the search — the same path as pressing Enter.
 */
describe("InventorySearchInput search button", () => {
  it("renders the search icon as a clickable button", () => {
    render(
      <InventorySearchInput searchQuery="" onSearchQueryChange={() => {}} />,
    );

    const button = screen.getByRole("button", { name: "Search" });
    expect(button).not.toBeNull();
    expect(button.getAttribute("type")).toBe("button");
  });

  it("clicking the search icon commits the typed query", async () => {
    const user = userEvent.setup();
    const onSearchQueryChange = vi.fn();
    render(
      <InventorySearchInput
        searchQuery=""
        onSearchQueryChange={onSearchQueryChange}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Search..."),
      "brake pads",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onSearchQueryChange).toHaveBeenCalledWith("brake pads");
  });

  it("clicking the search icon trims the query, like Enter does", async () => {
    const user = userEvent.setup();
    const onSearchQueryChange = vi.fn();
    render(
      <InventorySearchInput
        searchQuery=""
        onSearchQueryChange={onSearchQueryChange}
      />,
    );

    await user.type(screen.getByPlaceholderText("Search..."), "  oil  ");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onSearchQueryChange).toHaveBeenCalledWith("oil");
  });

  it("Enter still commits the search", async () => {
    const user = userEvent.setup();
    const onSearchQueryChange = vi.fn();
    render(
      <InventorySearchInput
        searchQuery=""
        onSearchQueryChange={onSearchQueryChange}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Search..."),
      "filter{Enter}",
    );

    expect(onSearchQueryChange).toHaveBeenCalledWith("filter");
  });

  it("clear button still resets the search", async () => {
    const user = userEvent.setup();
    const onSearchQueryChange = vi.fn();
    render(
      <InventorySearchInput
        searchQuery="oil"
        onSearchQueryChange={onSearchQueryChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(onSearchQueryChange).toHaveBeenCalledWith("");
  });
});
