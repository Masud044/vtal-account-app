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
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";

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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useItemStocks, useDeleteItemStock } from "./queries";
import AddItemStockSheet from "./add-item-stock-sheet";
import UpdateItemStockSheet from "./update-item-stock-sheet";
import {  useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useUpdateItemStock } from "./queries"; // already আছে কিনা দেখো

function MinLevelCell({ stock, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(stock.MINIMUM_LEVEL ?? 0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const stockQty = stock.STOCK_QTY ?? 0;
  const minLevel = stock.MINIMUM_LEVEL ?? 0;
  const isLow = Number(stockQty) <= Number(minLevel);

  useEffect(() => {
    if (open) {
      setValue(stock.MINIMUM_LEVEL ?? 0);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open, stock.MINIMUM_LEVEL]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(stock, Number(value));
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0  bg-background/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`
              relative  px-2 py-0.5 rounded-md text-sm font-medium transition-colors cursor-pointer
              border border-transparent hover:border-border
              ${isLow
                ? "text-destructive bg-destructive/10 hover:bg-destructive/20"
                : "text-foreground bg-muted hover:bg-muted/80"
              }
            `}
            title="Click to edit minimum level"
          >
            {minLevel}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 p-3 z-[9999]"
          side="top"
          align="center"
          onInteractOutside={(e) => e.preventDefault()} // backdrop দিয়ে close হবে
        >
          <div className="space-y-3">
            {/* <div>
              <p className="text-sm font-medium">Edit Minimum Level</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stock.ITEM_NAME || `Item #${stock.ITEM_ID}`}
              </p>
            </div> */}
            <div className="space-y-1.5">
              <Label htmlFor="min-level-input" className="text-xs">Min Level</Label>
              <Input
                id="min-level-input"
                ref={inputRef}
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setOpen(false);
                }}
                className="h-8 text-sm"
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <Spinner className="h-3 w-3" /> : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

export default function ItemStockList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const updateMutation = useUpdateItemStock(); // queries থেকে import করো

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const {
    data: stocks = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useItemStocks();
  const deleteMutation = useDeleteItemStock();

  const handleEdit = (stock) => {
    setSelectedStock(stock);
    setIsUpdateSheetOpen(true);
  };

  const handleMinLevelUpdate = async (stock, newMinLevel) => {
  try {
    await deleteMutation.mutateAsync; // এটা না, updateMutation লাগবে
    // তোমার update mutation call:
    await updateMutation.mutateAsync({  
      storeId: stock.STORE_ID,
      itemId: stock.ITEM_ID,
      data: {
        stockQty:     stock.STOCK_QTY     ?? 0,
        minimumLevel: newMinLevel,
        status:       stock.STOCK_STATUS  ?? 1,
        price:        stock.STOCK_PRICE   || null,
        lastPrice:    stock.LAST_PRICE    || null,
        unitId:       stock.STOCK_UNIT_ID || null,
        uom:          stock.UOM           || null,
        booked:       stock.BOOKED        ?? 0,
      },
    });
    toast.success("Minimum level updated!");
  } catch (err) {
    toast.error(err?.message || "Failed to update minimum level.");
    throw err; // popover-এ loading reset করার জন্য
  }
};

  const handleDelete = async (stock) => {
    const confirmed = await showConfirmation({
      title: "Delete stock record?",
      description: `Delete stock for "${stock.ITEM_NAME || `Item #${stock.ITEM_ID}`}" in Store ${stock.STORE_ID}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (confirmed) {
      try {
        await deleteMutation.mutateAsync({ storeId: stock.STORE_ID, itemId: stock.ITEM_ID });
        toast.success("Stock record deleted successfully!");
      } catch (err) {
        toast.error(err?.message || "Failed to delete stock record. Please try again.");
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

    // Store ID
    {
      accessorKey: "STORE_NAME",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Store Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-muted-foreground">{row.getValue("STORE_NAME"   )}</div>
      ),
    },

    // Item ID
   
    // Item Name + Model (from ITEM join)
    {
      accessorKey: "ITEM_NAME",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Item Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("ITEM_NAME") || "—"}</div>
          
        </div>
      ),
    },

    // Stock Qty (with Low badge)
    {
      accessorKey: "STOCK_QTY",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Stock Qty <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const qty = row.getValue("STOCK_QTY");
        const min = row.original.MINIMUM_LEVEL;
        const isLow = qty != null && min != null && Number(qty) <= Number(min);
        return (
          <div className="flex items-center gap-1">
            <span className={`font-medium ${isLow ? "text-destructive" : ""}`}>
              {qty ?? "—"}
            </span>
            {isLow && <Badge variant="destructive" className="text-xs">Low</Badge>}
          </div>
        );
      },
    },

    // Min Level
    // {
    //   accessorKey: "MINIMUM_LEVEL",
    //   header: "Min Level",
    //   cell: ({ row }) => <div>{row.getValue("MINIMUM_LEVEL") ?? "—"}</div>,
    // },
    {
  accessorKey: "MINIMUM_LEVEL",
  header: "Min Level",
  cell: ({ row }) => (
    <MinLevelCell
      stock={row.original}
      onUpdate={handleMinLevelUpdate}
    />
  ),
},

    // Stock Price
    {
      accessorKey: "STOCK_PRICE",
      header: "Price",
      cell: ({ row }) => {
        const p = row.getValue("STOCK_PRICE");
        return <div>{p != null ? Number(p).toFixed(2) : "—"}</div>;
      },
    },

    // Last Price
    // {
    //   accessorKey: "LAST_PRICE",
    //   header: "Last Price",
    //   cell: ({ row }) => {
    //     const p = row.getValue("LAST_PRICE");
    //     return <div className="text-muted-foreground">{p != null ? Number(p).toFixed(2) : "—"}</div>;
    //   },
    // },

    // UOM
    {
      accessorKey: "UOM",
      header: "UOM",
      cell: ({ row }) => <div>{row.getValue("UOM") || "—"}</div>,
    },

    // Booked
    // {
    //   accessorKey: "BOOKED",
    //   header: "Booked",
    //   cell: ({ row }) => <div>{row.getValue("BOOKED") ?? 0}</div>,
    // },

    // Status
    {
      accessorKey: "STOCK_STATUS",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("STOCK_STATUS") === 1 ? "success" : "secondary"}>
          {row.getValue("STOCK_STATUS") === 1 ? "Active" : "Inactive"}
        </Badge>
      ),
    },

    // Actions
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const stock = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(stock)}>
              <IconEdit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(stock)}
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
    data: stocks,
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
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Item Stock</h1>
            <Button disabled><IconCircleDashedPlus className="mr-1" />Add Stock</Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading stock records...</p>
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
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Item Stock</h1>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconCircleDashedPlus className="mr-1" />Add Stock
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Stock Records</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load stock records."}</p>
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
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Item Stock</h1>
            {/* <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>Inventory</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-muted-foreground/80">Item Stock</BreadcrumbPage>
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
              <IconCircleDashedPlus className="mr-1" />Add Stock
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by item name, store, UOM..."
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
                          <EmptyMedia variant="icon"><Layers /></EmptyMedia>
                          <EmptyTitle>No Stock Records Found</EmptyTitle>
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
        <AddItemStockSheet
          open={isAddSheetOpen}
          onOpenChange={setIsAddSheetOpen}
          showConfirmation={showConfirmation}
        />
      )}
      {isUpdateSheetOpen && (
        <UpdateItemStockSheet
          open={isUpdateSheetOpen}
          onOpenChange={setIsUpdateSheetOpen}
          showConfirmation={showConfirmation}
          stock={selectedStock}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}