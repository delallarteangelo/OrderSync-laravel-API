import type { ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DataTable } from "@/shared/components/DataTable";

type Row = { name: string };
const columns: ColumnDef<Row>[] = [{ accessorKey: "name", header: "Name" }];

describe("DataTable states", () => {
  it("exposes an accessible loading state", () => {
    render(<DataTable columns={columns} data={[]} isLoading loadingLabel="Loading people…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading people…");
  });

  it("exposes an accessible error state", () => {
    render(<DataTable columns={columns} data={[]} isError />);
    expect(screen.getByRole("alert")).toHaveTextContent("could not be loaded");
  });

  it("uses the shared empty state", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No people"
        emptyDescription="Invite someone to begin."
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("No people");
  });

  it("sorts columns and paginates larger result sets", async () => {
    const user = userEvent.setup();
    const rows = Array.from({ length: 12 }, (_, index) => ({
      name: `Person ${String(index + 1).padStart(2, "0")}`,
    }));

    render(<DataTable columns={columns} data={rows} pageSize={10} />);

    expect(screen.getByText("Showing 1–10 of 12 records")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /name/i }));
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Person 01");

    await user.click(screen.getByRole("button", { name: /next page/i }));
    expect(screen.getByText("Showing 11–12 of 12 records")).toBeInTheDocument();
    expect(screen.getByText("Person 11")).toBeInTheDocument();
  });
});
