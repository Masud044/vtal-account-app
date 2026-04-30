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
  Trash2,
  AlertCircle,
  RefreshCw,
  ArchiveIcon,
} from "lucide-react";
import { toast } from "sonner";

import { format } from "date-fns";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useInventories, useDeleteInventory } from "./queries";
import AddInventorySheet from "./add-inventory-sheet";
import UpdateInventorySheet from "./update-inventory-sheet";

export default function InventoryList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const {
    data: inventories = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useInventories();
  const deleteMutation = useDeleteInventory();

  const handleEdit = (inv) => {
    setSelectedInv(inv);
    setIsUpdateSheetOpen(true);
  };

  const handleDelete = async (inv) => {
    const confirmed = await showConfirmation({
      title: "Delete inventory record?",
      description: `Are you sure you want to delete TID #${inv.TID}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(inv.TID);
        toast.success("Inventory deleted successfully!");
      } catch (err) {
        toast.error(err?.message || "Failed to delete inventory. Please try again.");
      }
    }
  };

  const columns = [
    // Select
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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

    // TID
    // {
    //   accessorKey: "TID",
    //   header: ({ column }) => (
    //     <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
    //       TID <ArrowUpDown className="ml-2 h-4 w-4" />
    //     </Button>
    //   ),
    //   cell: ({ row }) => (
    //     <div className="font-medium text-muted-foreground">{row.getValue("TID")}</div>
    //   ),
    // },

    // Item
    {
      accessorKey: "ITEM_NAME",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Item <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("ITEM_NAME") || "—"}</div>
          <div className="text-xs text-muted-foreground">
            {/* ID: {row.original.INV_ITEM_ID}
            {row.original.MODEL ? ` · ${row.original.MODEL}` : ""} */}
          </div>
        </div>
      ),
    },
    
    //  {
    //   accessorKey: "ITEM_DESCRIPTION",
    //   header: "description",
    //   cell: ({ row }) => <div>{row.getValue("ITEM_DESCRIPTION") ?? "—"}</div>,
    // },
     {
      accessorKey: "ITEM_DESCRIPTION",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-muted-foreground text-sm">
          {row.getValue("ITEM_DESCRIPTION") || "—"}
        </div>
      ),
    },

    {
      accessorKey: "INVTDATE",
      header: "Invt Date",
      cell: ({ row }) => {
        const val = row.getValue("INVTDATE");
        return <div>{val ? format(new Date(val), "dd MMM yyyy") : "—"}</div>;
      },
    },


    // GRN No
    {
      accessorKey: "GRNNO",
      header: "GRN No",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.getValue("GRNNO") || "—"}
        </Badge>
      ),
    },

    // PO No
    // {
    //   accessorKey: "PONO",
    //   header: "PO No",
    //   cell: ({ row }) => <div>{row.getValue("PONO") ?? "—"}</div>,
    // },

    // Store ID
   // ✅ Fix
{
  accessorKey: "STORE_NAME",      // ← STORE_NAME করুন
  header: "Store Name",
  cell: ({ row }) => <div>{row.getValue("STORE_NAME") ?? "—"}</div>,
},
    // Inv Qty
    {
      accessorKey: "INVQTY",
      header: "Inv Qty",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("INVQTY") ?? "—"}</div>
      ),
    },

    // Stock Qty (from ITEM_STOCK join)
    // {
    //   accessorKey: "STOCK_QTY",
    //   header: "Stock Qty",
    //   cell: ({ row }) => {
    //     const qty = row.getValue("STOCK_QTY");
    //     const min = row.original.MINIMUM_LEVEL;
    //     const isLow = qty != null && min != null && Number(qty) <= Number(min);
    //     return (
    //       <div className="flex items-center gap-1">
    //         <span className={`font-medium ${isLow ? "text-destructive" : ""}`}>
    //           {qty ?? "—"}
    //         </span>
    //         {isLow && <Badge variant="destructive" className="text-xs">Low</Badge>}
    //       </div>
    //     );
    //   },
    // },

    // Price
    {
      accessorKey: "INV_PRICE",
      header: "Price",
      cell: ({ row }) => {
        const p = row.getValue("INV_PRICE");
        return <div>{p != null ? Number(p).toFixed(2) : "—"}</div>;
      },
    },

     {
      accessorKey: "UNIT_PRICE",
      header: "Unit Price",
      cell: ({ row }) => {
        const p = row.getValue("UNIT_PRICE");
        return <div>{p != null ? Number(p).toFixed(2) : "—"}</div>;
      },
    },

    // Selling Price
    // {
    //   accessorKey: "SELLING_UNIT_PRICE",
    //   header: "Selling Price",
    //   cell: ({ row }) => {
    //     const p = row.getValue("SELLING_UNIT_PRICE");
    //     return <div>{p != null ? Number(p).toFixed(2) : "—"}</div>;
    //   },
    // },

    // Unit
    {
      accessorKey: "INV_UNIT",
      header: "Unit",
      cell: ({ row }) => <div>{row.getValue("INV_UNIT") || "—"}</div>,
    },

    // Inv Date
    
    // Inv Status
//    {
//   accessorKey: "INVSTATUS",
//   header: "Inv Status",
//   cell: ({ row }) => {
//     const status = row.getValue("INVSTATUS");
//     return (
//       <Badge variant={status === 2 ? "success" : "warning"}>
//         {status === 2 ? "Transferred" : "Pending"}
//       </Badge>
//     );
//   },
// },

{
  accessorKey: "INVSTATUS",
  header: "Inv Status",
  cell: ({ row }) => {
    const inv = row.original;
    const status = row.getValue("INVSTATUS");

    // ✅ Already transferred — শুধু text দেখাবে
    if (status === 2) {
      return (
        <span className="text-xs font-medium text-green-600 dark:text-green-400">
          ✓ Transferred
        </span>
      );
    }

    // ✅ Pending — দুটো icon button দেখাবে
    return (
      <div className="flex items-center gap-1">
        {/* Pending badge */}
        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">
          Pending
        </Badge>

        {/* Transfer button */}
      


<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
        onClick={async () => {
          const confirmed = await showConfirmation({
            title: "Transfer to Stock?",
            description: `TID #${inv.TID} — Are you sure you want to transfer this inventory to stock?`,
            confirmText: "Transfer",
            cancelText: "Cancel",
            variant: "default",
          });
          if (!confirmed) return;

          try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/${inv.TID}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                item:          inv.INV_ITEM_ID,
                storeId:       inv.STOREID,
                invQty:        inv.INVQTY,
                grnNo:         inv.GRNNO          || null,
                poNo:          inv.PONO            || null,
                price:         inv.INV_PRICE       || null,
                unit:          inv.INV_UNIT        || null,
                unitPrice:     inv.UNIT_PRICE      ? String(inv.UNIT_PRICE) : null,
                unitId:        inv.INV_UNIT_ID     || null,
                inventoryType: inv.INVENTORY_TYPE  || null,
                itemType:      inv.ITEMTYPE        || null,
                accounted:     inv.ACCOUNTED       || null,
                invtDate:      inv.INVTDATE        || null,
                invStatus:     2,
                invoiceStatus: inv.INVOICE_STATUS  ?? 0,
              }),
            }).then(res => {
              if (!res.ok) throw new Error("Failed");
            });

            toast.success(`TID #${inv.TID} transferred to stock!`);
            refetch();
          } catch {
            toast.error("Transfer failed. Please try again.");
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p>Transfer to stock</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
      </div>
    );
  },
},

    // Invoice Status
    // {
    //   accessorKey: "INVOICE_STATUS",
    //   header: "Invoice",
    //   cell: ({ row }) => (
    //     <Badge variant={row.getValue("INVOICE_STATUS") === 1 ? "success" : "outline"}>
    //       {row.getValue("INVOICE_STATUS") === 1 ? "Invoiced" : "Pending"}
    //     </Badge>
    //   ),
    // },

    // Actions
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const inv = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(inv)}>
              <IconEdit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(inv)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? <Spinner data-icon="inline-start" />
                : <Trash2 className="h-4 w-4" />}
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: inventories,
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
  });

  // Loading
  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Inventories</h1>
            <Button disabled><IconCircleDashedPlus className="mr-1" />Add Inventory</Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading inventories...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Inventories</h1>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconCircleDashedPlus className="mr-1" />Add Inventory
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Inventories</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load inventories."}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="w-fit">
                {isFetching
                  ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</>
                  : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Inventory</h1>
            {/* <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>Inventory</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-muted-foreground/80">Inventories</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconCircleDashedPlus className="mr-1" />Add Inventory
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by item name, GRN, store..."
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
                {table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
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

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
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
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><ArchiveIcon /></EmptyMedia>
                          <EmptyTitle>No Inventory Records Found</EmptyTitle>
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
        <AddInventorySheet
          open={isAddSheetOpen}
          onOpenChange={setIsAddSheetOpen}
          showConfirmation={showConfirmation}
        />
      )}
      {isUpdateSheetOpen && (
        <UpdateInventorySheet
          open={isUpdateSheetOpen}
          onOpenChange={setIsUpdateSheetOpen}
          showConfirmation={showConfirmation}
          inventory={selectedInv}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}