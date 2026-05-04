// src\components\shared\data-table.jsx

import { flexRender } from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";




import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { TableEmptyState } from "./empty-state";


export function DataTable({ table, isFetching, loadingLabel, empty }) {
  return (
    <div className="relative overflow-hidden rounded-md border">
      <TableLoadingOverlay
        show={isFetching}
        label={loadingLabel}
      />

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableEmptyState {...empty} />
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function TableLoadingOverlay({
  show,
  label = "Loading...",
  className,
}) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center bg-background/40 rounded-md",
        className
      )}
    >
      <div className="flex items-center gap-2.5 rounded-lg bg-background/90 px-4 py-2.5 shadow-md border text-sm font-medium">
        <Spinner className="h-4 w-4" />
        {label}
      </div>
    </div>
  );
}