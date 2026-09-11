import type { ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
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
});
