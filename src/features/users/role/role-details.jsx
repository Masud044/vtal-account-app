// src/features/users/role/role-details.jsx
import { useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import {
  ShieldCheck,
  Puzzle,
  Filter,
  Plus,
  Trash2,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import PageContainer from "@/components/page-container";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";

import {
  useRoles,
  usePermissions,
  useRolePermissions,
  useAssignPermissionToRole,
  useRevokePermissionFromRole,
} from "../../user-management/queries";

export default function RoleDetailsPage() {
  const { id } = useParams();

  const [activeModule, setActiveModule] = useState("All");
  const [selectedPermissionId, setSelectedPermissionId] = useState("");
  const [open, setOpen] = useState(false);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const role = roles.find((r) => String(r.ID) === String(id));

  const { data: rolePermissions = [], isLoading: permsLoading } =
    useRolePermissions(id);

  const { data: allPermissions = [] } = usePermissions();

  const assignMutation = useAssignPermissionToRole();
  const revokeMutation = useRevokePermissionFromRole();

  const isLoading = rolesLoading || permsLoading;

  const assignedIds = new Set(rolePermissions.map((p) => p.ID));
  const availablePermissions = allPermissions.filter(
    (p) => !assignedIds.has(p.ID),
  );

  const selectedPermission = availablePermissions.find(
    (p) => String(p.ID) === selectedPermissionId,
  );

  const grouped = useMemo(() => {
    return rolePermissions.reduce((acc, p) => {
      const mod = p.MODULE_NAME || "Other";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    }, {});
  }, [rolePermissions]);

  const moduleNames = Object.keys(grouped);

  const filtered = useMemo(() => {
    if (activeModule === "All") return grouped;
    return { [activeModule]: grouped[activeModule] || [] };
  }, [grouped, activeModule]);

  const handleAssign = async () => {
    if (!selectedPermissionId) return toast.error("Select a permission");

    try {
      await assignMutation.mutateAsync({
        roleId: parseInt(id),
        permissionId: parseInt(selectedPermissionId),
      });

      toast.success("Permission assigned");
      setSelectedPermissionId("");
    } catch {
      toast.error("Failed to assign");
    }
  };

  const handleRevoke = async (perm) => {
    const confirmed = await showConfirmation({
      title: "Remove permission?",
      description: `Remove "${perm.PERMISSION_NAME}" from this role?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (!confirmed) return;

    try {
      await revokeMutation.mutateAsync({
        roleId: parseInt(id),
        permissionId: perm.ID,
      });

      toast.success("Permission removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-[80vh] w-full rounded-xl" />
      </PageContainer>
    );
  }

  const allAssigned = availablePermissions.length === 0;

  return (
    <PageContainer>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h1 className="text-xl font-semibold">{role?.ROLE_NAME}</h1>

              <Breadcrumb>
                <BreadcrumbList className="text-xs text-muted-foreground">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/">Admin</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Role Details</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <Badge variant="secondary">
            {rolePermissions.length} permissions
          </Badge>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Assign */}
          <div>
            {allAssigned ? (
              <div className="text-sm text-muted-foreground bg-muted/40 px-3 py-2 rounded-md border">
                All permissions are already assigned to this role
              </div>
            ) : (
              <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-[420px] justify-between h-9"
                    >
                      {selectedPermission
                        ? selectedPermission.PERMISSION_NAME
                        : "Assign permission"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[420px] p-0">
                    <Command>
                      <CommandInput placeholder="Search permission..." />
                      <CommandEmpty>No permission found.</CommandEmpty>

                      <div className="max-h-[320px] overflow-y-auto">
                        {Object.entries(
                          availablePermissions.reduce((acc, p) => {
                            const mod = p.MODULE_NAME || "Other";
                            if (!acc[mod]) acc[mod] = [];
                            acc[mod].push(p);
                            return acc;
                          }, {}),
                        ).map(([module, perms]) => (
                          <CommandGroup key={module} heading={module}>
                            {perms.map((p) => (
                              <CommandItem
                                key={p.ID}
                                value={`${p.PERMISSION_NAME} ${p.PERMISSION_CODE} ${module}`}
                                onSelect={() => {
                                  setSelectedPermissionId(String(p.ID));
                                  setOpen(false);
                                }}
                                className="flex items-center gap-2"
                              >
                                <span className="font-mono text-xs text-muted-foreground">
                                  {p.PERMISSION_CODE}
                                </span>

                                <span className="truncate flex-1">
                                  {p.PERMISSION_NAME}
                                </span>

                                <Check
                                  className={`h-4 w-4 ${
                                    selectedPermissionId === String(p.ID)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))}
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button
                  size="sm"
                  onClick={handleAssign}
                  disabled={!selectedPermissionId}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Assign
                </Button>
              </div>
            )}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={activeModule} onValueChange={setActiveModule}>
              <SelectTrigger className="w-52 h-9">
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Modules</SelectItem>
                {moduleNames.map((mod) => (
                  <SelectItem key={mod} value={mod}>
                    {mod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List */}
        <Card className="border rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y">
              {Object.entries(filtered).map(([module, perms]) => (
                <div key={module}>
                  <div className="bg-muted/60 px-5 py-3 flex justify-between">
                    <span className="font-semibold">{module}</span>
                    <span className="text-xs text-muted-foreground">
                      {perms.length}
                    </span>
                  </div>

                  {perms.map((perm) => (
                    <div
                      key={perm.ID}
                      className="flex justify-between items-center px-5 py-3 hover:bg-muted/40"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {perm.PERMISSION_NAME}
                          </span>
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] px-2 py-0.5"
                          >
                            {perm.PERMISSION_CODE}
                          </Badge>
                        </div>
                        {perm.DESCRIPTION && (
                          <div className="text-xs text-muted-foreground">
                            {perm.DESCRIPTION}
                          </div>
                        )}
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRevoke(perm)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog />
    </PageContainer>
  );
}
