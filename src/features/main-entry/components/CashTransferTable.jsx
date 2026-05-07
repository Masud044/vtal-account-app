import { useState, useMemo } from "react";
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
  Download,
  FileText,
  FileSpreadsheet,
  PlusIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

import { DataTablePagination } from "@/components/DataTablePagination";
import { toast } from "react-toastify";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function CashTransferTable() {
  const [sorting, setSorting]               = useState([]);
  const [columnFilters, setColumnFilters]   = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter]     = useState("");
  const [downloading, setDownloading]       = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["unpostedCashTransfers"],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/cash-all-unposted`);
      return res.data;
    },
  });

  const sortedVouchers = useMemo(() => {
    const vouchers = data?.status === "success" ? data.data : [];
    return [...vouchers].sort((a, b) => Number(b.ID) - Number(a.ID));
  }, [data]);

  // ── Download handler ─────────────────────────────────────────────────────────
  const handleDownload = async (voucher, type) => {
    const key = `${voucher.ID}-${type}`;
    setDownloading(key);
    try {
      const response = await fetch(
        `${BASE_URL}/api/cash-transfer/download/${voucher.ID}?type=${type}`
      );
      if (!response.ok) {
        let errMsg = `Server error ${response.status}`;
        try { const b = await response.json(); errMsg = b.detail || b.message || errMsg; } catch { /* ignore */ }
        toast.error(`Download failed: ${errMsg}`);
        return;
      }
      const blob      = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor    = document.createElement("a");
      anchor.href     = objectUrl;
      anchor.download = `cash_transfer_${voucher.VOUCHERNO}.${type === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      toast.success(`${type.toUpperCase()} downloaded successfully!`);
    } catch (err) {
      toast.error(`Error downloading ${type.toUpperCase()}: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const columns = [
    {
      accessorKey: "VOUCHERNO",
      header: ({ column }) => (
        <Button variant="ghost" className="font-bold text-gray-800 text-sm font-sans"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Voucher No <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <div className="ml-3">{row.getValue("VOUCHERNO")}</div>,
    },
    {
      accessorKey: "TRANS_DATE",
      header: ({ column }) => (
        <Button variant="ghost" className="font-bold text-gray-800 text-sm font-sans"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Transaction Date <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <div className="ml-3">{row.getValue("TRANS_DATE")}</div>,
    },
    {
      accessorKey: "GL_ENTRY_DATE",
      header: ({ column }) => (
        <Button variant="ghost" className="font-bold text-gray-800 text-sm font-sans"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          GL Date <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <div className="ml-3">{row.getValue("GL_ENTRY_DATE")}</div>,
    },
    {
      accessorKey: "DESCRIPTION",
      header: () => (
        <div className="text-left font-bold text-gray-800 text-sm font-sans">Description</div>
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("DESCRIPTION")}>
          {row.getValue("DESCRIPTION")}
        </div>
      ),
    },
    {
      accessorKey: "DEBIT",
      header: ({ column }) => (
        <Button variant="ghost" className="font-bold text-gray-800 text-sm font-sans"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Debit <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const amount    = parseFloat(row.getValue("DEBIT") || 0);
        const formatted = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
        return <div className="font-medium ml-3">{formatted}</div>;
      },
    },
    {
      accessorKey: "CREDIT",
      header: ({ column }) => (
        <Button variant="ghost" className="font-bold text-gray-800 text-sm font-sans"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Credit <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const amount    = parseFloat(row.getValue("CREDIT") || 0);
        const formatted = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
        return <div className="font-medium ml-3">{formatted}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <div className="text-center font-bold text-gray-800 text-sm font-sans">Actions</div>,
      cell: ({ row }) => {
        const voucher = row.original;
        return (
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Download"
                  disabled={downloading?.startsWith(`${voucher.ID}-`)}
                >
                  <Download size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Download as</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2"
                  disabled={downloading === `${voucher.ID}-pdf`}
                  onClick={() => handleDownload(voucher, "pdf")}>
                  <FileText size={14} className="text-red-500" />
                  {downloading === `${voucher.ID}-pdf` ? "Generating…" : "PDF"}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2"
                  disabled={downloading === `${voucher.ID}-excel`}
                  onClick={() => handleDownload(voucher, "excel")}>
                  <FileSpreadsheet size={14} className="text-green-600" />
                  {downloading === `${voucher.ID}-excel` ? "Generating…" : "Excel"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: sortedVouchers, columns,
    onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility, onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-12">
      <p className="text-red-600">Error loading records.</p>
    </div>
  );

  return (
    <div className="mt-6">
      <Card className="w-full shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-bold">Cash Transfer</CardTitle>
        </CardHeader>

        <div className="bg-card rounded-md p-4">
          <div className="space-y-4">

            {/* Search + Columns + Add New */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search records..."
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
                      onCheckedChange={(value) => col.toggleVisibility(!!value)}
                    >
                      {col.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/dashboard/cash-transfer-create">
                <Button>
                  <PlusIcon size={16} className="mr-2" />
                  Add New Transfer
                </Button>
              </Link>
            </div>

            {/* Table */}
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
                      <TableRow key={row.id}>
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
                        <p className="text-muted-foreground">No cash transfer records found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <DataTablePagination table={table} />
          </div>
        </div>
      </Card>
    </div>
  );
}