// src\features\users\permission\permission-list.jsx
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Trash2, AlertCircle, RefreshCw, KeyRound } from "lucide-react";
import { toast } from "sonner";

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
import { IconEdit, IconPlus } from "@tabler/icons-react";
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
import { Link } from "react-router";

import { usePermissions, useDeletePermission } from "./queries";
import AddPermissionDialog from "./add-permission-dialog";
import UpdatePermissionDialog from "./update-permission-dialog";
import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";

export default function PermissionList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: permissionsData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePermissions();

  const deletePermissionMutation = useDeletePermission();

  const handleEdit = (permission) => {
    setSelectedPermission(permission);
    setIsUpdateDialogOpen(true);
  };

  const handleDelete = async (permission) => {
    const confirmed = await showConfirmation({
      title: "Delete permission?",
      description: `Are you sure you want to delete "${permission.PERMISSION_NAME}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deletePermissionMutation.mutateAsync(permission.ID);
        toast.success("Permission deleted successfully!");
      } catch (error) {
        toast.error(error?.message || "Failed to delete permission. Please try again.");
      }
    }
  };

  const columns = [
    // {
    //   id: "select",
    //   header: ({ table }) => (
    //     <Checkbox
    //       checked={
    //         table.getIsAllPageRowsSelected() ||
    //         (table.getIsSomePageRowsSelected() && "indeterminate")
    //       }
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => row.toggleSelected(!!value)}
    //       aria-label="Select row"
    //     />
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
      accessorKey: "MODULE_NAME",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Module" />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="ps-2">
          {row.getValue("MODULE_NAME") || "—"}
        </Badge>
      ),
    },
    {
      accessorKey: "PERMISSION_CODE",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Permission Code" />
      ),
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
          {row.getValue("PERMISSION_CODE")}
        </code>
      ),
    },
    {
      accessorKey: "PERMISSION_NAME",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Permission Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium ps-2">{row.getValue("PERMISSION_NAME")}</div>
      ),
    },
    {
      accessorKey: "DESCRIPTION",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue("DESCRIPTION") || "—"}</div>
      ),
    },
    // {
    //   id: "actions",
    //   header: "Actions",
    //   enableHiding: false,
    //   cell: ({ row }) => {
    //     const permission = row.original;

    //     return (
    //       <div className="flex items-center gap-1">
    //         <Button
    //           variant="ghost"
    //           size="icon"
    //           className="h-8 w-8"
    //           onClick={() => handleEdit(permission)}
    //         >
    //           <IconEdit className="h-4 w-4" />
    //           <span className="sr-only">Edit</span>
    //         </Button>

    //         <Button
    //           variant="ghost"
    //           size="icon"
    //           className="h-8 w-8 text-destructive hover:text-destructive"
    //           onClick={() => handleDelete(permission)}
    //           disabled={deletePermissionMutation.isPending}
    //         >
    //           {deletePermissionMutation.isPending ? (
    //             <Spinner data-icon="inline-start" />
    //           ) : (
    //             <Trash2 className="h-4 w-4" />
    //           )}
    //           <span className="sr-only">Delete</span>
    //         </Button>
    //       </div>
    //     );
    //   },
    // },
  ];

  const table = useReactTable({
    data: permissionsData,
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

  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Permissions</h1>
            </div>
            <Button disabled>
              <IconPlus />
              Add Permission
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Permissions</h1>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus />
              Add Permission
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Permissions</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load permissions. Please try again."}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="w-fit"
              >
                {isFetching ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </>
                )}
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
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Permissions</h1>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>User Management</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Permissions</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            {/* <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh data</span>
            </Button> */}

            {/* <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus />
              Add Permission
            </Button> */}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar
            table={table}
            searchPlaceholder="Search permissions..."
          />

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
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
                          <EmptyMedia variant="icon">
                            <KeyRound />
                          </EmptyMedia>
                          <EmptyTitle>No Permissions Found</EmptyTitle>
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

      {isAddDialogOpen && (
        <AddPermissionDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          showConfirmation={showConfirmation}
        />
      )}

      {isUpdateDialogOpen && (
        <UpdatePermissionDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          showConfirmation={showConfirmation}
          permission={selectedPermission}
        />
      )}

      <ConfirmationDialog />
    </div>
  );
}