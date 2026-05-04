// src/features/users/role/role-permission-matrix.jsx
import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import { useQueries } from "@tanstack/react-query";
import {
  Layers,
  Info,
  RefreshCw,
  Check,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import PageContainer from "@/components/page-container";

import { useRoles, usePermissions } from "../../user-management/queries";

const BASE = import.meta.env.VITE_API_BASE_URL;

// ── Static Cell ─────────────────────────────────────────
function MatrixCell({ granted }) {
  return (
    <td className="px-2 py-3 text-center border-b border-border/30">
      {granted ? (
        <Check className="h-4 w-4 text-emerald-600 mx-auto" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground mx-auto" />
      )}
    </td>
  );
}

// ── Main ────────────────────────────────────────────────
export default function RolePermissionMatrix() {
  const [search, setSearch] = useState("");

  const {
    data: roles = [],
    isLoading: rolesLoading,
    isError: rolesError,
    refetch: refetchRoles,
  } = useRoles();

  const {
    data: allPermissions = [],
    isLoading: permsLoading,
    isError: permsError,
    refetch: refetchPerms,
  } = usePermissions();

  const rolePermissionQueries = useQueries({
    queries: roles.map((role) => ({
      queryKey: ["roles", "permissions", String(role.ID)],
      queryFn: async () => {
        const res = await fetch(
          `${BASE}/api/users/roles/${role.ID}/permissions`
        );
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        return json.data ?? [];
      },
      enabled: roles.length > 0,
    })),
  });

  const isLoading =
    rolesLoading ||
    permsLoading ||
    rolePermissionQueries.some((q) => q.isLoading);

  const isError =
    rolesError ||
    permsError ||
    rolePermissionQueries.some((q) => q.isError);

  // ── Build lookup ──
  const rolePermMap = useMemo(() => {
    const map = {};
    roles.forEach((role, i) => {
      const perms = rolePermissionQueries[i]?.data ?? [];
      map[role.ID] = new Set(perms.map((p) => p.ID));
    });
    return map;
  }, [roles, rolePermissionQueries]);

  // ── Search + group ──
  const grouped = useMemo(() => {
    const filtered = allPermissions.filter((p) => {
      const q = search.toLowerCase();
      return (
        p.PERMISSION_NAME.toLowerCase().includes(q) ||
        p.PERMISSION_CODE.toLowerCase().includes(q) ||
        (p.MODULE_NAME || "").toLowerCase().includes(q)
      );
    });

    return filtered.reduce((acc, p) => {
      const mod = p.MODULE_NAME || "Other";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    }, {});
  }, [allPermissions, search]);

  const refetchAll = () => {
    refetchRoles();
    refetchPerms();
    rolePermissionQueries.forEach((q) => q.refetch());
  };

  // ── Loading ──
  if (isLoading)
    return (
      <PageContainer>
        <Skeleton className="h-[80vh] w-full rounded-xl" />
      </PageContainer>
    );

  // ── Error ──
  if (isError)
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load roles or permissions.
          </AlertDescription>
        </Alert>
      </PageContainer>
    );

  return (
    <PageContainer>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-3 border-b pb-3">
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
                <BreadcrumbPage>Permission Matrix</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

         
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <Input
            placeholder="Search permission, code, module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Table */}
        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[75vh]">
              <table className="w-full text-sm">
                
                {/* Header */}
                <thead className="sticky top-0 bg-background z-20">
                  <tr>
                    <th className="sticky left-0 bg-background px-4 py-3 text-left border-r min-w-[260px]">
                      Permission
                    </th>
                    {roles.map((role) => (
                      <th key={role.ID} className="px-4 py-3 text-center">
                        {role.ROLE_NAME}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(grouped).map(([module, perms]) => (
                    <React.Fragment key={module}>
                      
                      {/* Module header */}
                      <tr>
                        <td
                          colSpan={roles.length + 1}
                          className="bg-muted px-4 py-2 font-semibold"
                        >
                          <Layers className="inline h-4 w-4 mr-2" />
                          {module}
                        </td>
                      </tr>

                      {/* Permissions */}
                      {perms.map((perm) => (
                        <tr key={perm.ID} className="hover:bg-muted/30 transition">
                          
                          {/* Left sticky */}
                          <td className="sticky left-0 bg-background px-4 py-2 border-r">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {perm.PERMISSION_NAME}
                              </span>

                              {perm.DESCRIPTION && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                      {perm.DESCRIPTION}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground font-mono">
                              {perm.PERMISSION_CODE}
                            </div>
                          </td>

                          {/* Cells */}
                          {roles.map((role) => (
                            <MatrixCell
                              key={role.ID}
                              granted={rolePermMap[role.ID]?.has(perm.ID)}
                            />
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>

              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}