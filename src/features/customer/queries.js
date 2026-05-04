import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_API_BASE_URL;

// ── Query Keys ────────────────────────────────────────────────────────────────
export const customerKeys = {
  all:    ["customers"],
  lists:  () => [...customerKeys.all, "lists"],
  detail: (id) => [...customerKeys.all, "detail", id],
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
export const useCustomers = () =>
  useQuery({
    queryKey: customerKeys.lists(),
    queryFn:  () => fetchJSON(`${BASE}/api/customer`),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    throwOnError: false,
  });

export const useCustomerById = (customerId) =>
  useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn:  () => fetchJSON(`${BASE}/api/customer/${customerId}`),
    enabled:  !!customerId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetchJSON(`${BASE}/api/customer`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.lists() }),
    onError: (err) => console.error("Create customer failed:", err),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, data }) =>
      fetchJSON(`${BASE}/api/customer`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ CUSTOMER_ID: customerId, ...data }),
      }),
    onSuccess: (_, { customerId }) => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.detail(customerId) });
    },
    onError: (err) => console.error("Update customer failed:", err),
  });
};

export const useDeleteCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (customerId) =>
      fetchJSON(`${BASE}/api/customer`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ CUSTOMER_ID: customerId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.lists() }),
    onError: (err) => console.error("Delete customer failed:", err),
  });
};