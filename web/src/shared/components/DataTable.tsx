import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { LoadingState } from "@/shared/components/LoadingState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  pageSize?: number;
  emptyState?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  loadingLabel?: string;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search…",
  toolbar,
  pageSize = 10,
  emptyState,
  emptyTitle = "No results",
  emptyDescription = "Try changing the search or filters.",
  isLoading = false,
  isError = false,
  onRetry,
  loadingLabel = "Loading records…",
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {searchKey && (
          <Input
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
            className="h-9 w-full sm:max-w-xs"
          />
        )}
        {toolbar}
      </div>
      {isLoading ? (
        <LoadingState label={loadingLabel} rows={5} />
      ) : isError ? (
        <ErrorState message="The records could not be loaded." onRetry={onRetry} />
      ) : (
        <>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : h.column.getCanSort() ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                            onClick={() => h.column.toggleSorting(h.column.getIsSorted() === "asc")}
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        ) : (
                          flexRender(h.column.columnDef.header, h.getContext())
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      {emptyState ?? (
                        <EmptyState
                          title={emptyTitle}
                          description={emptyDescription}
                          className="border-0 bg-transparent p-4"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {Math.max(1, table.getPageCount())}
            </p>
            <div className="flex items-center gap-1">
              <Button
                aria-label="Previous page"
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                aria-label="Next page"
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
