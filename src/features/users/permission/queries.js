import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const permissionQueryKeys = {
  all: ["permissions"],
  lists: () => [...permissionQueryKeys.all, "lists"],
  detail: (id) => [...permissionQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/users/permissions`;
const MODULES_API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/users/modules`;

/**
 * =========================
 * GET ALL PERMISSIONS
 * =========================
 */
const getPermissions = async () => {
  try {
   const res = await fetch(`${API_BASE_URL}/all`, {
  // credentials: "include",
});

    if (!res.ok) {
      throw new Error(`Failed to fetch permissions: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching permissions:", error);
    throw error;
  }
};

/**
 * =========================
 * GET ALL MODULES (for dropdown)
 * =========================
 */
const getModulesForSelect = async () => {
  try {
    const res = await fetch(`${MODULES_API_URL}/all`, {
  // credentials: "include",
});


    if (!res.ok) {
      throw new Error(`Failed to fetch modules: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching modules:", error);
    throw error;
  }
};

/**
 * =========================
 * CREATE
 * =========================
 */
const createPermission = async (data) => {
  try {
    const res = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create permission: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error creating permission:", error);
    throw error;
  }
};

/**
 * =========================
 * DELETE
 * =========================
 */
const deletePermission = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      // credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete permission: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting permission:", error);
    throw error;
  }
};

/**
 * =========================
 * HOOKS
 * =========================
 */

export const usePermissions = () =>
  useQuery({
    queryKey: permissionQueryKeys.lists(),
    queryFn: getPermissions,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    throwOnError: false,
  });

export const useModulesForSelect = () =>
  useQuery({
    queryKey: ["modules", "lists"],
    queryFn: getModulesForSelect,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Create permission failed:", error);
    },
  });
};

export const useDeletePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Delete permission failed:", error);
    },
  });
};