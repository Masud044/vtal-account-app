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
  AlertCircle,
  RefreshCw,
  ClipboardList,
} from "lucide-react";
import { IconEdit, IconPlus } from "@tabler/icons-react";
// import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";
import { useRequisitions } from "./queries";
import AddRequisitionSheet from "./add-requisition-sheet";
import UpdateRequisitionSheet from "./update-requisition-sheet";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const formatDate = (v) => {
  if (!v) return "—";
  try { return format(new Date(v), "dd MMM yyyy"); }
  catch { return "—"; }
};

/**
 * Shows total items with pending/approved counts inline.
 * e.g.  "3 items • 2 pending"   or   "2 items • all approved"
 */
function ItemsSummary({ pending, approved, total }) {
  if (total === 0) return <span className="text-muted-foreground text-sm">—</span>;

  const allApproved = pending === 0 && approved === total;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium">
        {total} {total === 1 ? "item" : "items"}
      </span>
      {allApproved ? (
        <span className="text-xs text-green-600 dark:text-green-400"> All Approved</span>
      ) : (
        <span className="text-xs text-yellow-600 dark:text-yellow-400">
          {pending} Pending
        </span>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function RequisitionList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const [selectedTid, setSelectedTid] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: requisitions = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useRequisitions();

  const handleEdit = (tid) => {
    setSelectedTid(tid);
    setIsUpdateSheetOpen(true);
  };

  const columns = [
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
    {
      accessorKey: "TID",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="TID" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">#{row.getValue("TID")}</span>
      ),
    },
    {
      accessorKey: "TDATE",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-light">{formatDate(row.getValue("TDATE"))}</span>
      ),
    },
    {
      accessorKey: "STORE_ID",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="From store" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.FROM_STORE_NAME || row.getValue("STORE_ID")}</span>
      ),
    },
    {
      accessorKey: "STORE_ID_TO",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="To store" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.TO_STORE_NAME || row.getValue("STORE_ID_TO")}</span>
      ),
    },
    {
      accessorKey: "CHALLAN_NO",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Challan" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-light">{row.getValue("CHALLAN_NO") || "—"}</span>
      ),
    },
    {
      // Items column — shows total with pending/approved breakdown (no separate status column)
      id: "items",
      header: "Items",
      cell: ({ row }) => (
        <ItemsSummary
          pending={row.original.PENDING_COUNT ?? 0}
          approved={row.original.APPROVED_COUNT ?? 0}
          total={row.original.TOTAL_ITEMS ?? 0}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(req.TID)}
                  >
                    <IconEdit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit requisition</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: requisitions,
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  /* ─── Loading ────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Dispatch</h1>
            <Button disabled>
              <IconPlus />
              Add Dispatch
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading requisitions...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error ──────────────────────────────────────────────────────────── */
  if (isError) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Dispatch</h1>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconPlus />
              Add Dispatch
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Dispatch</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load. Please try again."}</p>
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

  /* ─── Main ───────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Dispatch</h1>
            {/* <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>Inventory</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dispatch</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconPlus />
              Add Dispatch
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar
            table={table}
            searchPlaceholder="Search by TID, challan, store..."
          />

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
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
                          {flexRender(cell.column.columnDef.def, cell.getContext()) ??
                            flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                          <EmptyMedia variant="icon">
                            <ClipboardList />
                          </EmptyMedia>
                          <EmptyTitle>No Dispatch Found</EmptyTitle>
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
        <AddRequisitionSheet
          open={isAddSheetOpen}
          onOpenChange={setIsAddSheetOpen}
          showConfirmation={showConfirmation}
        />
      )}

      {isUpdateSheetOpen && selectedTid && (
        <UpdateRequisitionSheet
          open={isUpdateSheetOpen}
          onOpenChange={setIsUpdateSheetOpen}
          showConfirmation={showConfirmation}
          requisitionTid={selectedTid}
        />
      )}

      <ConfirmationDialog />
    </div>
  );
}