// src\features\user-management\queries.js


import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { getToken } from "@/features/authentication-v2/queries";
const BASE = import.meta.env.VITE_API_BASE_URL;

const URLS = {
  users:       `${BASE}/api/users`,
  roles:       `${BASE}/api/users/roles`,
  permissions: `${BASE}/api/users/permissions`,
  modules:     `${BASE}/api/users/modules`,
};

const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
};

// ── Fetchers ──────────────────────────────────────────────────────────────────


const fetcher = async (url, options = {}) => {
  const token = getToken();
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};
// const fetcher = async (url, options = {}) => {
//   const res = await fetch(url, {
//     credentials: "include",
//     headers: { "Content-Type": "application/json" },
//     ...options,
//   });
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.error || err.message || `Request failed: ${res.status}`);
//   }
//   return res.json();
// };

/** Build query string — skips empty/null/undefined values */
const buildQS = (params) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") qs.set(k, String(v));
  });
  return qs.toString();
};

// ── Users ─────────────────────────────────────────────────────────────────────

/**
 * Server-side paginated, sorted, filtered user list.
 * Expects the backend to accept: page, limit, search, sortBy, sortOrder, roleId, moduleId
 * and return: { data: [], pagination: { total, totalPages } }
 */
export const useUsers = (params) =>
  useQuery({
    queryKey: ["users", "list", params],
    queryFn: async () => {
      const json = await fetcher(`${URLS.users}?${buildQS(params)}`);
      return json.data; // unwrap → { data: [], pagination: {} }
    },
    refetchOnMount: true,
    placeholderData: (prev) => prev,
    ...queryDefaults,
  });

export const useUserById = (id) =>
  useQuery({
    queryKey: ["users", "detail", id],
    queryFn: async () => {
      const json = await fetcher(`${URLS.users}/${id}`);
      return json.data;
    },
    enabled: !!id,
    ...queryDefaults,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetcher(URLS.users, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", "list"] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => fetcher(`${URLS.users}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["users", "list"] });
      qc.invalidateQueries({ queryKey: ["users", "detail", String(id)] });
    },
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: ({ id, newPassword }) =>
      fetcher(`${URLS.users}/${id}/change-password`, {
        method: "PATCH",
        body: JSON.stringify({ newPassword }),
      }),
  });

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => fetcher(`${URLS.users}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", "list"] }),
  });
};

export const useActivateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      fetcher(`${URLS.users}/${id}/activate`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", "list"] }),
  });
};

// ── Roles ─────────────────────────────────────────────────────────────────────

export const useRoles = () =>
  useQuery({
    queryKey: ["roles", "list"],
    queryFn: async () => {
      const json = await fetcher(`${URLS.users}/roles/all`);
      return json.data;
    },
    ...queryDefaults,
  });

export const useCreateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetcher(`${URLS.users}/roles`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles", "list"] }),
  });
};

export const useUpdateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => fetcher(`${URLS.users}/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles", "list"] }),
  });
};

export const useDeleteRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => fetcher(`${URLS.users}/roles/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles", "list"] }),
  });
};

// ── Permissions ───────────────────────────────────────────────────────────────

export const usePermissions = () =>
  useQuery({
    queryKey: ["permissions", "list"],
    queryFn: async () => {
      const json = await fetcher(`${URLS.users}/permissions/all`);
      return json.data;
    },
    ...queryDefaults,
  });

export const useCreatePermission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetcher(`${URLS.users}/permissions`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permissions", "list"] }),
  });
};

export const useDeletePermission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => fetcher(`${URLS.users}/permissions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permissions", "list"] }),
  });
};

// ── Modules ───────────────────────────────────────────────────────────────────

export const useModules = () =>
  useQuery({
    queryKey: ["modules", "list"],
    queryFn: async () => {
      const json = await fetcher(`${URLS.users}/modules/all`);
      return json.data;
    },
    ...queryDefaults,
  });

export const useCreateModule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetcher(`${URLS.users}/modules`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", "list"] }),
  });
};

export const useUpdateModule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => fetcher(`${URLS.users}/modules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", "list"] }),
  });
};

export const useDeleteModule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => fetcher(`${URLS.users}/modules/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", "list"] }),
  });
};

// ── Assign / Revoke ───────────────────────────────────────────────────────────

export const useAssignRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }) =>
      fetcher(`${URLS.users}/${userId}/roles`, { method: "POST", body: JSON.stringify({ roleId }) }),
    onSuccess: (_, { userId }) =>
      qc.invalidateQueries({ queryKey: ["users", "detail", String(userId)] }),
  });
};

export const useRevokeRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }) =>
      fetcher(`${URLS.users}/${userId}/roles/${roleId}`, { method: "DELETE" }),
    onSuccess: (_, { userId }) =>
      qc.invalidateQueries({ queryKey: ["users", "detail", String(userId)] }),
  });
};

export const useAssignPermission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, permissionId }) =>
      fetcher(`${URLS.users}/${userId}/permissions`, { method: "POST", body: JSON.stringify({ permissionId }) }),
    onSuccess: (_, { userId }) =>
      qc.invalidateQueries({ queryKey: ["users", "detail", String(userId)] }),
  });
};

export const useRevokePermission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, permissionId }) =>
      fetcher(`${URLS.users}/${userId}/permissions/${permissionId}`, { method: "DELETE" }),
    onSuccess: (_, { userId }) =>
      qc.invalidateQueries({ queryKey: ["users", "detail", String(userId)] }),
  });
};



// ── Role Permissions ──────────────────────────────────────────────────────────

export const useRolePermissions = (roleId) =>
  useQuery({
    queryKey: ["roles", "permissions", roleId],
    queryFn: async () => {
      const json = await fetcher(`${URLS.users}/roles/${roleId}/permissions`);
      return json.data;
    },
    enabled: !!roleId,
    ...queryDefaults,
  });

export const useAssignPermissionToRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionId }) =>
      fetcher(`${URLS.users}/roles/${roleId}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissionId }),
      }),
    onSuccess: (_, { roleId }) =>
      qc.invalidateQueries({ queryKey: ["roles", "permissions", roleId] }),
  });
};

export const useRevokePermissionFromRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionId }) =>
      fetcher(`${URLS.users}/roles/${roleId}/permissions/${permissionId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, { roleId }) =>
      qc.invalidateQueries({ queryKey: ["roles", "permissions", roleId] }),
  });
};



export const useRolePermissionsBatch = (roleIds = []) =>
  useQueries({
    queries: roleIds.map((roleId) => ({
      queryKey: ["roles", "permissions", String(roleId)],
      queryFn: async () => {
        const json = await fetcher(`${URLS.users}/roles/${roleId}/permissions`);
        return json.data;
      },
      enabled: !!roleId,
      ...queryDefaults,
    })),
  });