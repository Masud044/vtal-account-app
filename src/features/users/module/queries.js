import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const moduleQueryKeys = {
  all: ["modules"],
  lists: () => [...moduleQueryKeys.all, "lists"],
  detail: (id) => [...moduleQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/users/modules`;

/**
 * =========================
 * GET ALL
 * =========================
 */
const getModules = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/all`, {
  // credentials: "include",
});;

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
const createModule = async (data) => {
  try {
    const res = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      //  credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create module: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error creating module:", error);
    throw error;
  }
};

/**
 * =========================
 * UPDATE
 * =========================
 */
const updateModule = async ({ id, data }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      //  credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update module: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error updating module:", error);
    throw error;
  }
};

/**
 * =========================
 * DELETE
 * =========================
 */
const deleteModule = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      //  credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete module: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
};

/**
 * =========================
 * HOOKS
 * =========================
 */

export const useModules = () =>
  useQuery({
    queryKey: moduleQueryKeys.lists(),
    queryFn: getModules,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    throwOnError: false,
  });

export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Create module failed:", error);
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Update module failed:", error);
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Delete module failed:", error);
    },
  });
};