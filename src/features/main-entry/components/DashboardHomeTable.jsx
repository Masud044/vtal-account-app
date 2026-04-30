"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Pencil,
  Trash2,
  ArrowUpDown,
  ChevronDown,
  FileUser,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/DataTablePagination";
import axios from "axios";

const getVoucherTypeLabel = (type) => {
  switch (String(type)) {
    case "1":
      return "Receive";
    case "2":
      return "Payment";
    case "3":
      return "Journal";
    case "4":
      return "Bank Transfer";
    default:
      return "Unknown";
  }
};

const getEditRoute = (type, id) => {
  switch (String(type)) {
    case "1":
      return `/dashboard/receive-edit/${id}`;
    case "2":
      return `/dashboard/payment-voucher/${id}`;
    case "3":
      return `/dashboard/journal-voucher/${id}`;
    default:
      return `/dashboard/cash-voucher/${id}`;
  }
};

// ⭐ setConfirmId পাস করা হচ্ছে — direct approve না করে dialog খুলবে
const createColumns = (setConfirmId) => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "VOUCHER_TYPE",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Voucher Type <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const type = row.getValue("VOUCHER_TYPE");
      const colorMap = {
        1: "text-green-800 bg-green-100",
        2: "text-red-800 bg-red-100",
        3: "text-blue-800 bg-blue-100",
        4: "text-purple-800 bg-purple-100",
      };
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${colorMap[type] || "text-gray-800 bg-gray-100"}`}
        >
          {getVoucherTypeLabel(type)}
        </span>
      );
    },
  },
  {
    accessorKey: "VOUCHERNO",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Voucher No <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="ml-3">{row.getValue("VOUCHERNO")}</div>,
  },
  {
    accessorKey: "TRANS_DATE",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Transaction Date <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="ml-3">{row.getValue("TRANS_DATE")}</div>,
  },
  {
    accessorKey: "DESCRIPTION",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Description <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="ml-3">{row.getValue("DESCRIPTION")}</div>
    ),
  },
  {
    accessorKey: "ENTRY_BY",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Entry By <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="ml-3">{row.getValue("ENTRY_BY")}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const item = row.original;
      const editRoute = getEditRoute(item.VOUCHER_TYPE, item.ID);

      return (
        <div className="flex items-center justify-center gap-3">
          {/* Edit */}
          <Link to={editRoute}>
            <Button
               variant="ghost"
              size="icon"
              // className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <Pencil size={16} />
            </Button>
          </Link>

          {/* ✅ Approve — dialog খুলবে, direct post হবে না */}
          <Button
            variant="ghost"
            size="icon"
            className="text-green-600 hover:text-green-800 hover:bg-green-50"
            onClick={() => setConfirmId(item.ID)}
          >
            <FileUser size={16} />
          </Button>

          {/* Delete */}
          <Button
            // variant="ghost"
            size="icon"
            // className="text-red-600 hover:text-red-800 hover:bg-red-50"
            onClick={() => console.log("Delete ID:", item.ID)}
          >
            <Trash2 size={18} />
          </Button>
        </div>
      );
    },
  },
];

const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export function DashboardHomeTable() {
  const queryClient = useQueryClient();

  // ✅ Confirm Dialog এর জন্য — কোন ID approve হবে সেটা track করে
  const [confirmId, setConfirmId] = React.useState(null);
  // ✅ Loading state — approve button এ spinner দেখাবে
  const [isApproving, setIsApproving] = React.useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["unpostedVouchers"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/info-list`);
      return res.data;
    },
  });

  const apiData = Array.isArray(data?.vouchers) ? data.vouchers : [];

  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});

  // ✅ Approve Handler — backend এ posted=1 করবে
  const handleActivateVoucher = async () => {
    if (!confirmId) return;
    setIsApproving(true);
    try {
      const res = await axios.get(`${url}/api/active-voucher?id=${confirmId}`);
      if (res.data.success) {
        queryClient.invalidateQueries(["unpostedVouchers"]); // table refresh
      } else {
        alert(res.data.message || "Failed to approve voucher");
      }
    } catch (error) {
      alert("Something went wrong: " + error.message);
    } finally {
      setIsApproving(false);
      setConfirmId(null); // dialog বন্ধ করো
    }
  };

  const columns = React.useMemo(() => createColumns(setConfirmId), []);

  const table = useReactTable({
    data: apiData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  return (
    <div className="rounded-lg bg-white">
      {/* ✅ Approve Confirmation Dialog */}
      <AlertDialog
        open={!!confirmId}
        onOpenChange={() => !isApproving && setConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              Approve Voucher?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Voucher ID <strong>{confirmId}</strong> will be permanently
              approved.{" "}
              <span className="text-red-500 font-medium">
                This action cannot be undone.
              </span>{" "}
              Please confirm before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivateVoucher}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? "Approving..." : "Yes, Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search & Column Toggle */}
      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Filter descriptions..."
          value={table.getColumn("DESCRIPTION")?.getFilterValue() ?? ""}
          onChange={(e) =>
            table.getColumn("DESCRIPTION")?.setFilterValue(e.target.value)
          }
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
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center h-24"
                >
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center h-24 text-red-600"
                >
                  Error: {error.message}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              !error &&
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && !error && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center h-24"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
