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
  Pencil,
  Trash2,
  PlusIcon,
  Download,
  FileText,
  FileSpreadsheet,
  BadgeCheck,
} from "lucide-react";
import {  useQuery } from "@tanstack/react-query";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/DataTablePagination";
import { toast } from "react-toastify";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function JournalTable() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  // const [deleteModal, setDeleteModal] = useState({ show: false, id: null, voucherNo: "" });
  const [downloading, setDownloading] = useState(null);

  // const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["unpostedJournalVouchers"],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/gl-all-unposted`);
      return res.data;
    },
  });

  // const deleteMutation = useMutation({
  //   mutationFn: async (voucherId) => {
  //     const res = await axios.delete(`${BASE_URL}/api/gl-delete/${voucherId}`);
  //     return res.data;
  //   },
  //   onSuccess: (data) => {
  //     if (data.success === 1 || data.status === "success") {
  //       toast.success("Voucher deleted successfully!");
  //       queryClient.invalidateQueries(["unpostedJournalVouchers"]);
  //     } else {
  //       toast.error(data.message || "Delete failed!");
  //     }
  //     setDeleteModal({ show: false, id: null, voucherNo: "" });
  //   },
  //   onError: (error) => {
  //     toast.error("Error deleting voucher: " + error.message);
  //     setDeleteModal({ show: false, id: null, voucherNo: "" });
  //   },
  // });

  // const handleDeleteClick = (voucher) => {
  //   setDeleteModal({ show: true, id: voucher.ID, voucherNo: voucher.VOUCHERNO });
  // };

  // const confirmDelete = () => {
  //   if (deleteModal.id) deleteMutation.mutate(deleteModal.id);
  // };

  const sortedVouchers = useMemo(() => {
    const vouchers = Array.isArray(data?.data) ? data.data : [];
    return [...vouchers].sort((a, b) => Number(b.ID) - Number(a.ID));
  }, [data]);

  const handleDownload = async (voucher, type) => {
    const key = `${voucher.ID}-${type}`;
    setDownloading(key);

    try {
      const response = await fetch(
        `${BASE_URL}/api/journal/download/${voucher.ID}?type=${type}`
      );

      if (!response.ok) {
        let errMsg = `Server error ${response.status}`;
        try {
          const errBody = await response.json();
          errMsg = errBody.detail || errBody.message || errMsg;
        } catch { /* ignore */ }
        toast.error(`Download failed: ${errMsg}`);
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const ext = type === "pdf" ? "pdf" : "xlsx";

      anchor.href = objectUrl;
      anchor.download = `journal_voucher_${voucher.VOUCHERNO}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      toast.success(`${type.toUpperCase()} downloaded successfully!`);
    } catch (err) {
      console.error(`[handleDownload] journal ${type} error:`, err);
      toast.error(`Error downloading ${type.toUpperCase()}: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const columns = [
    {
      accessorKey: "VOUCHERNO",
      header: ({ column }) => (
        <Button variant="ghost" className="font-bold text-gray-800 text-sm font-sans" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Voucher No <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <div className="ml-3">{row.getValue("VOUCHERNO")}</div>,
    },
    {
      accessorKey: "TRANS_DATE",
      header: ({ column }) => (
        <Button variant="ghost" className="font-bold text-gray-800 text-sm font-sans" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Transaction Date <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <div className="ml-3">{row.getValue("TRANS_DATE")}</div>,
    },
    {
      accessorKey: "GL_ENTRY_DATE",
      header: ({ column }) => (
        <Button variant="ghost" className="font-bold text-gray-800 text-sm font-sans" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
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
        <Button variant="ghost" className="font-bold text-gray-800 text-sm font-sans" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Debit <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("DEBIT") || 0);
        const formatted = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
        return <div className="font-medium ml-3">{formatted}</div>;
      },
    },
    {
      accessorKey: "CREDIT",
      header: ({ column }) => (
        <Button variant="ghost" className="font-bold text-gray-800 text-sm font-sans" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Credit <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("CREDIT") || 0);
        const formatted = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
        return <div className="font-medium ml-3">{formatted}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <div className="text-center font-bold text-gray-800 text-sm font-sans">Actions</div>,
      cell: ({ row }) => {
        const voucher = row.original;
        const isApproved = voucher.POSTED === 1 || voucher.POSTED === "1";

        return (
          <div className="flex items-center justify-center gap-1">

            {/* Edit — disabled when approved */}
            {isApproved ? (
              <Button variant="ghost" size="icon" disabled className="opacity-30 cursor-not-allowed">
                <Pencil size={16} />
              </Button>
            ) : (
              <Link to={`/dashboard/journal-edit/${voucher.ID}`} title="Edit Voucher">
                <Button variant="ghost" size="icon">
                  <Pencil size={16} />
                </Button>
              </Link>
            )}

            {/* Download — always active */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-violet-700"
                  title="Download"
                  disabled={downloading?.startsWith(`${voucher.ID}-`)}
                >
                  <Download size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Download as
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  disabled={downloading === `${voucher.ID}-pdf`}
                  onClick={() => handleDownload(voucher, "pdf")}
                >
                  <FileText size={14} className="text-red-500" />
                  {downloading === `${voucher.ID}-pdf` ? "Generating…" : "PDF"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  disabled={downloading === `${voucher.ID}-excel`}
                  onClick={() => handleDownload(voucher, "excel")}
                >
                  <FileSpreadsheet size={14} className="text-green-600" />
                  {downloading === `${voucher.ID}-excel` ? "Generating…" : "Excel"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Approved badge OR Delete */}
            {isApproved ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-green-600 bg-green-100 border border-green-200 cursor-default">
                      <BadgeCheck size={16} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-green-700 text-white text-xs">
                    Approved
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                size="icon"
                onClick={() => console.log(voucher)}
                title="Delete Voucher"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: sortedVouchers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading vouchers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-red-600">Error loading vouchers.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6">
        <Card className="w-full shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-bold">Journal Vouchers</CardTitle>
          </CardHeader>

          <div className="bg-card rounded-md p-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Search vouchers..."
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
                          onCheckedChange={(value) => col.toggleVisibility(!!value)}
                        >
                          {col.id.replace(/_/g, " ")}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link to="/dashboard/journal-create">
                  <Button>
                    <PlusIcon size={16} className="mr-2" />
                    Add New Journal
                  </Button>
                </Link>
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
                          <p className="text-muted-foreground">No unposted vouchers found</p>
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

      {/* Delete Confirmation Modal */}
      {/* {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 md:w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete voucher{" "}
              <span className="font-semibold">{deleteModal.voucherNo}</span>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ show: false, id: null, voucherNo: "" })}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}