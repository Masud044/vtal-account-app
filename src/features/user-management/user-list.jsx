import { useState, useMemo, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import {
  UserX,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Users,
  KeyRound,
  Eye,
  ArrowUp,
  ArrowDown,
  UsersIcon,
} from "lucide-react";
import {
  IconColumns3Filled,
  IconEdit,
  IconPlus,
  IconSelector,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

import {
  useUsers,
  useDeleteUser,
  useActivateUser,
  useRoles,
} from "./queries";
import AddUserDialog from "./add-user-dialog";
import UpdateUserDialog from "./update-user-dialog";
import ChangePasswordDialog from "./change-password-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable, TableLoadingOverlay } from "@/components/shared/data-table";
import { EmployeeCell } from "@/components/shared/employee/employee-cell";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SORT_COLUMN_MAP = {
  user: "USERNAME",
  CREATED_AT: "CREATED_AT",
};

const REVERSE_SORT_MAP = {
  USERNAME: "user",
  CREATED_AT: "CREATED_AT",
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "MMM dd, yyyy");
  } catch {
    return "—";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  SORT HEADER
// ─────────────────────────────────────────────────────────────────────────────

function SortHeader({ column, children, className }) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{children}</div>;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          className,
        )}
      >
        {children}
        {column.getIsSorted() === "desc" ? (
          <ArrowDown />
        ) : column.getIsSorted() === "asc" ? (
          <ArrowUp />
        ) : (
          <IconSelector />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-28">
        <DropdownMenuCheckboxItem
          className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
          checked={column.getIsSorted() === "asc"}
          onClick={() => column.toggleSorting(false)}
        >
          <ArrowUp /> Asc
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
          checked={column.getIsSorted() === "desc"}
          onClick={() => column.toggleSorting(true)}
        >
          <ArrowDown /> Desc
        </DropdownMenuCheckboxItem>
        {column.getIsSorted() && (
          <DropdownMenuItem
            className="pl-2 [&_svg]:text-muted-foreground"
            onClick={() => column.clearSorting()}
          >
            <IconX /> Reset
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FILTER COMBOBOX
// ─────────────────────────────────────────────────────────────────────────────

function FilterCombobox({ placeholder, options, value, onValueChange }) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const hasValue = !!value;

  return (
    <Combobox
      items={options.map((o) => o.label)}
      value={selectedLabel}
      onValueChange={(label) => {
        if (!label) {
          onValueChange("");
          return;
        }
        const opt = options.find((o) => o.label === label);
        onValueChange(opt?.value ?? "");
      }}
    >
      <ComboboxInput
        placeholder={placeholder}
        showTrigger={!hasValue}
        showClear={hasValue}
      />
      <ComboboxContent>
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {(label) => (
            <ComboboxItem key={label} value={label}>
              {label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// ── Small avatar for the list (h-8 w-8) ──────────────────────────────────────
function UserListAvatar({ user }) {
  const BASE = import.meta.env.VITE_API_BASE_URL;

  const urlsToTry = [
    `${BASE}/api/emp-images/person/${user.ID}`,
    user.EMPLOYEE_ID
      ? `${BASE}/api/emp-images/person/${user.EMPLOYEE_ID}`
      : null,
  ].filter(Boolean);

  const [srcIndex, setSrcIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const initials =
    [user.FIRST_NAME?.[0], user.LAST_NAME?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || user.USERNAME?.[0]?.toUpperCase();

  const handleError = () => {
    const next = srcIndex + 1;
    if (next < urlsToTry.length) {
      setSrcIndex(next);
    } else {
      setFailed(true);
    }
  };

  return (
    <div
      className={cn(
        "h-8 w-8 shrink-0 rounded-full overflow-hidden flex items-center justify-center",
        getAvatarColor(user.USERNAME),
      )}
    >
      {!failed ? (
        <img
          key={urlsToTry[srcIndex]}
          src={urlsToTry[srcIndex]}
          onError={handleError}
          alt={user.USERNAME}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xs font-semibold text-white">{initials}</span>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function UserList() {
  const navigate = useNavigate();

  // ── URL state via nuqs ──────────────────────────────────────────────────────
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit, setLimit] = useQueryState(
    "limit",
    parseAsInteger.withDefault(20),
  );
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [roleId, setRoleId] = useQueryState(
    "roleId",
    parseAsString.withDefault(""),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsString.withDefault("CREATED_AT"),
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "sortOrder",
    parseAsString.withDefault("DESC"),
  );

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [columnVisibility, setColumnVisibility] = useState({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Local search input — debounced before hitting the URL/backend
  const [searchInput, setSearchInput] = useState(search);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // ── Filter data ─────────────────────────────────────────────────────────────
  const { data: roles = [] } = useRoles();

  // ── Combobox options ────────────────────────────────────────────────────────
  const roleOptions = roles.map((r) => ({
    label: r.ROLE_NAME,
    value: String(r.ID),
  }));

  // ── Backend params ──────────────────────────────────────────────────────────
  const backendParams = useMemo(
    () => ({
      page,
      limit,
      search,
      roleId,
      sortBy,
      sortOrder,
    }),
    [page, limit, search, roleId, sortBy, sortOrder],
  );

  // ── Queries ─────────────────────────────────────────────────────────────────
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useUsers(backendParams);

  const deleteMutation = useDeleteUser();
  const activateMutation = useActivateUser();

  // ── Derived ─────────────────────────────────────────────────────────────────
  const rows = response?.data ?? [];
  const total = response?.pagination?.total ?? 0;
  const pageCount = response?.pagination?.totalPages ?? 1;

  // ── Debounced search ────────────────────────────────────────────────────────
  const debouncedSearch = useDebouncedCallback((val) => {
    setSearch(val || null);
    setPage(1);
  }, 300);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  // ── Sorting bridge ──────────────────────────────────────────────────────────
  const sorting = useMemo(() => {
    if (!sortBy) return [];
    const columnId = REVERSE_SORT_MAP[sortBy] ?? sortBy;
    return [{ id: columnId, desc: sortOrder === "DESC" }];
  }, [sortBy, sortOrder]);

  const onSortingChange = useCallback(
    (updaterOrValue) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;
      if (next.length === 0) {
        setSortBy("CREATED_AT");
        setSortOrder("DESC");
      } else {
        const col = SORT_COLUMN_MAP[next[0].id] ?? "CREATED_AT";
        setSortBy(col);
        setSortOrder(next[0].desc ? "DESC" : "ASC");
        setPage(1);
      }
    },
    [sorting, setSortBy, setSortOrder, setPage],
  );

  // ── Pagination bridge ───────────────────────────────────────────────────────
  const pagination = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize: limit,
    }),
    [page, limit],
  );

  const onPaginationChange = useCallback(
    (updaterOrValue) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue;
      setPage(next.pageIndex + 1);
      setLimit(next.pageSize);
    },
    [pagination, setPage, setLimit],
  );

  // ── Filter helpers ──────────────────────────────────────────────────────────
  const hasActiveFilters = search || roleId;

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch(null);
    setRoleId(null);
    setPage(1);
  };

  // ── Dialog helpers ──────────────────────────────────────────────────────────
  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsUpdateOpen(true);
  };
  const handlePassword = (user) => {
    setSelectedUser(user);
    setIsPasswordOpen(true);
  };

  const handleDelete = async (user) => {
    const confirmed = await showConfirmation({
      title: "Deactivate user?",
      description: `Are you sure you want to deactivate "${user.USERNAME}"?`,
      confirmText: "Deactivate",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(user.ID);
      toast.success("User deactivated successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to deactivate user.");
    }
  };

  const handleActivate = async (user) => {
    const confirmed = await showConfirmation({
      title: "Activate user?",
      description: `Are you sure you want to activate "${user.USERNAME}"?`,
      confirmText: "Activate",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      await activateMutation.mutateAsync(user.ID);
      toast.success("User activated successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to activate user.");
    }
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        id: "user",
        accessorFn: (row) => row.USERNAME,
        header: ({ column }) => <SortHeader column={column}>User</SortHeader>,
        cell: ({ row }) => {
          const u = row.original;
          const fullName = [u.FIRST_NAME, u.LAST_NAME].filter(Boolean).join(" ");

          return (
            <div className="flex items-center gap-3 py-1">
              <UserListAvatar user={u} />
              <div className="flex flex-col min-w-0">
                <span className="font-medium leading-tight">{u.USERNAME}</span>
                {fullName && (
                  <span className="text-xs text-muted-foreground truncate">
                    {fullName}
                    {u.EMP_NO && (
                      <span className="ml-1 font-mono opacity-70">{u.EMP_NO}</span>
                    )}
                  </span>
                )}
                {u.LOCATION_NAME && (
                  <span className="text-xs text-muted-foreground/60 truncate">
                    {u.LOCATION_NAME}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "STATUS",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const status = row.getValue("STATUS");
          return (
            <Badge
              variant="outline"
              className={cn(
                status === "ACTIVE"
                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                  : "bg-muted text-muted-foreground border-border",
              )}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "CREATED_AT",
        header: ({ column }) => (
          <SortHeader column={column}>Created</SortHeader>
        ),
        cell: ({ row }) => (
          <div className="text-sm font-light">
            {formatDate(row.getValue("CREATED_AT"))}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const user = row.original;
          const isActive = user.STATUS === "ACTIVE";
          const isBusy = deleteMutation.isPending || activateMutation.isPending;

          return (
            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        navigate(`/dashboard/user-management/users/${user.ID}`)
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Details</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(user)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit User</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                      onClick={() => handlePassword(user)}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Change Password</TooltipContent>
                </Tooltip>

                {isActive ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(user)}
                        disabled={isBusy}
                      >
                        {deleteMutation.isPending ? (
                          <Spinner data-icon="inline-start" />
                        ) : (
                          <UserX className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Deactivate</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                        onClick={() => handleActivate(user)}
                        disabled={isBusy}
                      >
                        {activateMutation.isPending ? (
                          <Spinner data-icon="inline-start" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Activate</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          );
        },
      },
    ],
    [deleteMutation.isPending],
  );

  // ── TanStack table ──────────────────────────────────────────────────────────
  const table = useReactTable({
    data: rows,
    columns,
    pageCount,
    state: { pagination, columnVisibility, sorting },
    onPaginationChange,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading)
    return (
      <div>
        <PageHeader disabled />
        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    );

  // ── Error state ─────────────────────────────────────────────────────────────
  if (isError)
    return (
      <div>
        <PageHeader
          onRefetch={refetch}
          isFetching={isFetching}
          onAdd={() => setIsAddOpen(true)}
        />
        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Users</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load users."}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
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

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        onRefetch={refetch}
        isFetching={isFetching}
        onAdd={() => setIsAddOpen(true)}
      />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          {/* ── Filter Bar ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search — debounced 300ms */}
            <SearchInput
              placeholder="Search username..."
              value={searchInput}
              onChange={handleSearchChange}
              onClear={() => {
                setSearchInput("");
                debouncedSearch("");
              }}
            />

            {/* Role — Combobox */}
            <FilterCombobox
              placeholder="Role"
              options={roleOptions}
              value={roleId}
              onValueChange={(v) => {
                setRoleId(v || null);
                setPage(1);
              }}
            />

            {/* Reset all */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 border border-dashed text-muted-foreground hover:text-foreground"
                onClick={clearAllFilters}
              >
                Reset <IconX className="ml-2 h-4 w-4" />
              </Button>
            )}

            {/* Columns — pushed right */}
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 font-medium shadow-sm"
                  >
                    <IconColumns3Filled className="size-3.5" /> Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
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
                        {col.id.replace(/_/g, " ")}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Record count */}
          <p className="text-sm font-medium text-muted-foreground">
            {isFetching
              ? "Loading records..."
              : `${total.toLocaleString()} user${total !== 1 ? "s" : ""} found`}
          </p>

          {/* ── Table ──────────────────────────────────────────────────── */}
          <DataTable
            table={table}
            isFetching={isFetching}
            loadingLabel="Loading users..."
            empty={{
              colSpan: columns.length,
              icon: UsersIcon,
              title: "No Users Found",
            }}
          />

          <DataTablePagination table={table} />
        </div>
      </div>

      {isAddOpen && (
        <AddUserDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          showConfirmation={showConfirmation}
        />
      )}
      {isUpdateOpen && (
        <UpdateUserDialog
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          showConfirmation={showConfirmation}
          user={selectedUser}
        />
      )}
      {isPasswordOpen && (
        <ChangePasswordDialog
          open={isPasswordOpen}
          onOpenChange={setIsPasswordOpen}
          user={selectedUser}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE HEADER
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader({ isFetching, onRefetch, onAdd, disabled }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
            Users
          </h1>
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
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          {onRefetch && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefetch}
              disabled={isFetching || disabled}
            >
              <RefreshCw
                className={cn("h-4 w-4", isFetching && "animate-spin")}
              />
            </Button>
          )}
          <Button onClick={onAdd} disabled={disabled}>
            <IconPlus size={18} className="mr-1" /> Add User
          </Button>
        </div>
      </div>
    </div>
  );
}