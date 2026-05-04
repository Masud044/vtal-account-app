import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_API_BASE_URL;

// ── Query Keys ────────────────────────────────────────────────────────────────
export const supplierKeys = {
  all:    ["suppliers"],
  lists:  () => [...supplierKeys.all, "lists"],
  detail: (id) => [...supplierKeys.all, "detail", id],
};

// ── Fetcher ───────────────────────────────────────────────────────────────────
const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.data ?? json;
};

// ── Hooks ─────────────────────────────────────────────────────────────────────
export const useSuppliers = () =>
  useQuery({
    queryKey: supplierKeys.lists(),
    queryFn:  () => fetchJSON(`${BASE}/api/supplier`),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    throwOnError: false,
  });

export const useSupplierById = (supplierId) =>
  useQuery({
    queryKey: supplierKeys.detail(supplierId),
    queryFn:  () => fetchJSON(`${BASE}/api/supplier/${supplierId}`),
    enabled:  !!supplierId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

export const useCreateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetchJSON(`${BASE}/api/supplier`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.lists() }),
    onError: (err) => console.error("Create supplier failed:", err),
  });
};

export const useUpdateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, data }) =>
      fetchJSON(`${BASE}/api/supplier`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ SUPPLIER_ID: supplierId, ...data }),
      }),
    onSuccess: (_, { supplierId }) => {
      qc.invalidateQueries({ queryKey: supplierKeys.lists() });
      qc.invalidateQueries({ queryKey: supplierKeys.detail(supplierId) });
    },
    onError: (err) => console.error("Update supplier failed:", err),
  });
};

export const useDeleteSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (supplierId) =>
      fetchJSON(`${BASE}/api/supplier`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ SUPPLIER_ID: supplierId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.lists() }),
    onError: (err) => console.error("Delete supplier failed:", err),
  });
};