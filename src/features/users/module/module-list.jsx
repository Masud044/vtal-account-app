import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Trash2, AlertCircle, RefreshCw, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

import { useModules, useDeleteModule } from "./queries";
import AddModuleDialog from "./add-module-dialog";
import UpdateModuleDialog from "./update-module-dialog";
import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";

export default function ModuleList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // const {
  //   data: modulesData = [],
  //   isLoading,
  //   isError,
  //   error,
  //   refetch,
  //   isFetching,
  // } = useModules();

  const {
  data: rawModules = [],
  isLoading,
  isError,
  error,
  refetch,
  isFetching,
} = useModules();

// শুধু এই 4টা module দেখাবে
const ALLOWED_MODULES = ["Dashboard", "Main Entry", "Main Report", "Inventory"];
const modulesData = rawModules.filter((m) => ALLOWED_MODULES.includes(m.MODULE_NAME));

  const deleteModuleMutation = useDeleteModule();

  const handleEdit = (module) => {
    setSelectedModule(module);
    setIsUpdateDialogOpen(true);
  };

  const handleDelete = async (module) => {
    const confirmed = await showConfirmation({
      title: "Delete module?",
      description: `Are you sure you want to delete "${module.MODULE_NAME}"? This will also affect all permissions under this module.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deleteModuleMutation.mutateAsync(module.ID);
        toast.success("Module deleted successfully!");
      } catch (error) {
        toast.error(error?.message || "Failed to delete module. Please try again.");
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
      accessorKey: "SEQUENCE_NO",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Seq." />
      ),
      cell: ({ row }) => (
        <div className="text-center text-muted-foreground w-10">
          {row.getValue("SEQUENCE_NO") ?? "—"}
        </div>
      ),
    },
    {
      accessorKey: "MODULE_NAME",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Module Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium ps-2">{row.getValue("MODULE_NAME")}</div>
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
    //     const module = row.original;

    //     return (
    //       <div className="flex items-center gap-1">
    //         <Button
    //           variant="ghost"
    //           size="icon"
    //           className="h-8 w-8"
    //           onClick={() => handleEdit(module)}
    //         >
    //           <IconEdit className="h-4 w-4" />
    //           <span className="sr-only">Edit</span>
    //         </Button>

    //         <Button
    //           variant="ghost"
    //           size="icon"
    //           className="h-8 w-8 text-destructive hover:text-destructive"
    //           onClick={() => handleDelete(module)}
    //           disabled={deleteModuleMutation.isPending}
    //         >
    //           {deleteModuleMutation.isPending ? (
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
    data: modulesData,
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
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Modules</h1>
            </div>
          
          </div>
        </div>
        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading modules...</p>
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
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Modules</h1>
            </div>
            {/* <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus />
              Add Module
            </Button> */}
          </div>
        </div>
        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Modules</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load modules. Please try again."}</p>
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
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Modules</h1>
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
                  <BreadcrumbPage>Modules</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* <div className="flex items-center gap-2"> */}
            {/* <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
               <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> 
              <span className="sr-only">Refresh data</span>
            </Button> */}

            {/* <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus />
              Add Module
            </Button> */}
          {/* </div> */}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar table={table} searchPlaceholder="Search modules..." />

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
                            <LayoutGrid />
                          </EmptyMedia>
                          <EmptyTitle>No Modules Found</EmptyTitle>
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
        <AddModuleDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          showConfirmation={showConfirmation}
        />
      )}

      {isUpdateDialogOpen && (
        <UpdateModuleDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          showConfirmation={showConfirmation}
          module={selectedModule}
        />
      )}

      <ConfirmationDialog />
    </div>
  );
}