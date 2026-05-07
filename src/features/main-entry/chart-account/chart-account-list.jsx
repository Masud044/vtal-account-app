import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  BookOpen,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { Spinner } from "@/components/ui/spinner";
import { IconCircleDashedPlus, IconEdit } from "@tabler/icons-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

import { useChartOfAccounts } from "./queries";
import AddChartSheet from "./add-chart-account-sheet";
import UpdateChartSheet from "./update-chart-account-sheet";

// Level badge colors
const LEVEL_COLORS = {
  1: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  2: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300",
  3: "bg-teal-100   text-teal-800   dark:bg-teal-900/30   dark:text-teal-300",
  4: "bg-amber-100  text-amber-800  dark:bg-amber-900/30  dark:text-amber-300",
};

export default function ChartList() {
  const [sorting, setSorting]                   = useState([]);
  const [columnFilters, setColumnFilters]       = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection]         = useState({});
  const [globalFilter, setGlobalFilter]         = useState("");
  const [isAddSheetOpen, setIsAddSheetOpen]         = useState(false);
  const [isUpdateSheetOpen, setIsUpdateSheetOpen]   = useState(false);
  const [selectedAccount, setSelectedAccount]       = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: accounts = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useChartOfAccounts();

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setIsUpdateSheetOpen(true);
  };

  const columns = [
    // ── Select ──────────────────────────────────────────────────────────────
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // ── Account ID ───────────────────────────────────────────────────────────
    {
      accessorKey: "ACCOUNT_ID",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Account ID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.getValue("ACCOUNT_ID")}
        </span>
      ),
    },

    // ── Account Name (trim spaces, show indent via padding) ──────────────────
    {
      accessorKey: "ACCOUNT_NAME",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Account Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const level  = row.getValue("LEBEL") ?? 1;
        const name   = String(row.getValue("ACCOUNT_NAME") ?? "").trim();
        const indent = (level - 1) * 16; // 16px per level
        return (
          <span
            className="font-medium block"
            style={{ paddingLeft: `${indent}px` }}
          >
            {name || "—"}
          </span>
        );
      },
      // globalFilter এ trimmed name দিয়ে match হবে
      filterFn: (row, _, filterValue) =>
        String(row.getValue("ACCOUNT_NAME"))
          .trim()
          .toLowerCase()
          .includes(filterValue.toLowerCase()),
    },

    // ── Root Account ─────────────────────────────────────────────────────────
    {
      accessorKey: "ROOT_ACCOUNT",
      header: "Root",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs  font-normal">
          {row.getValue("ROOT_ACCOUNT") || "—"}
        </Badge>
      ),
    },

    // ── Level ────────────────────────────────────────────────────────────────
    {
      accessorKey: "LEBEL",
      header: "Level",
      cell: ({ row }) => {
        const lvl = row.getValue("LEBEL");
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              LEVEL_COLORS[lvl] ?? "bg-gray-100 text-gray-800"
            }`}
          >
            L{lvl}
          </span>
        );
      },
    },

    // ── Is Leaf ──────────────────────────────────────────────────────────────
    {
      accessorKey: "IS_LEAF",
      header: "Type",
      cell: ({ row }) => {
        const isLeaf = row.getValue("IS_LEAF") === 1;
        return (
          <Badge variant={isLeaf ? "success" : "secondary"}>
            {isLeaf ? "Leaf" : "Parent"}
          </Badge>
        );
      },
    },

    // ── Full Path ────────────────────────────────────────────────────────────
    {
      accessorKey: "FULL_PATH",
      header: "Full Path",
      cell: ({ row }) => {
        // strip leading " > " produced by SYS_CONNECT_BY_PATH
        const path = String(row.getValue("FULL_PATH") ?? "").replace(/^\s*>\s*/, "");
        return (
          <span
            className="text-xs text-muted-foreground max-w-[260px] block truncate"
            title={path}
          >
            {path || "—"}
          </span>
        );
      },
    },

    // ── Actions ──────────────────────────────────────────────────────────────
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const account = row.original;
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEdit(account)}
          >
            <IconEdit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: accounts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    autoResetPageIndex: false,
    enableMultiSort: false,
  });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
              Chart of Account
            </h1>
            <Button disabled>
              <IconCircleDashedPlus className="mr-1" />Add Account
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
              Chart of Account
            </h1>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconCircleDashedPlus className="mr-1" />Add Account
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Accounts</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load accounts."}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="w-fit"
              >
                {isFetching ? (
                  <><Spinner className="mr-2 h-4 w-4" />Retrying...</>
                ) : (
                  <><RefreshCw className="mr-2 h-4 w-4" />Retry</>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
            Chart of Account
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconCircleDashedPlus className="mr-1" />Add Account
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by name or account ID..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize"
                      checked={col.getIsVisible()}
                      onCheckedChange={(v) => col.toggleVisibility(!!v)}
                    >
                      {col.id.replace(/_/g, " ").toLowerCase()}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder
                          ? null
                          : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
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
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><BookOpen /></EmptyMedia>
                          <EmptyTitle>No Accounts Found</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </div>

      {/* Sheets */}
      {isAddSheetOpen && (
        <AddChartSheet
          open={isAddSheetOpen}
          onOpenChange={setIsAddSheetOpen}
          showConfirmation={showConfirmation}
        />
      )}
      {isUpdateSheetOpen && (
        <UpdateChartSheet
          open={isUpdateSheetOpen}
          onOpenChange={setIsUpdateSheetOpen}
          showConfirmation={showConfirmation}
          account={selectedAccount}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}