import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const roleQueryKeys = {
  all: ["roles"],
  lists: () => [...roleQueryKeys.all, "lists"],
  detail: (id) => [...roleQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/users/roles`;

/**
 * =========================
 * GET ALL
 * =========================
 */
const getRoles = async () => {
  try {
   const res = await fetch(`${API_BASE_URL}/all`, {
  // credentials: "include",
});
   

    if (!res.ok) {
      throw new Error(`Failed to fetch roles: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

/**
 * =========================
 * CREATE
 * =========================
 */
const createRole = async (data) => {
  try {
    const res = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      //  credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create role: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

/**
 * =========================
 * UPDATE
 * =========================
 */
const updateRole = async ({ id, data }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      //  credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update role: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
};

/**
 * =========================
 * DELETE
 * =========================
 */
const deleteRole = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      //  credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete role: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
};

/**
 * =========================
 * HOOKS
 * =========================
 */

export const useRoles = () =>
  useQuery({
    queryKey: roleQueryKeys.lists(),
    queryFn: getRoles,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    throwOnError: false,
  });

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Create role failed:", error);
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Update role failed:", error);
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Delete role failed:", error);
    },
  });
};