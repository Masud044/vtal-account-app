import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_API_BASE_URL;

// ── Query Keys ────────────────────────────────────────────────────────────────
export const chartKeys = {
  all:    ["chart-account"],
  lists:  () => [...chartKeys.all, "lists"],
  detail: (id) => [...chartKeys.all, "detail", id],
};

// ── Shared fetcher ────────────────────────────────────────────────────────────
const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  // Backend returns { success, data } for GET, { success, message } for POST/PUT
  return json.data ?? json;
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** GET /api/chart-account — all accounts */
export const useChartOfAccounts = () =>
  useQuery({
    queryKey: chartKeys.lists(),
    queryFn:  () => fetchJSON(`${BASE}/api/chart-account`),
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30_000),
    throwOnError: false,
  });

/** GET /api/chart-account/:id — single account */
export const useChartOfAccountById = (id) =>
  useQuery({
    queryKey: chartKeys.detail(id),
    queryFn:  () => fetchJSON(`${BASE}/api/chart-account/${id}`),
    enabled:  !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

/**
 * POST /api/chart-account/add — create new account
 *
 * Payload: { account_id, account_name, account_type, is_parent,
 *            parent_account_id, lebel, lastlevel, enabled }
 */
export const useCreateChartOfAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetchJSON(`${BASE}/api/chart-account/add`, {   // ← /add
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: chartKeys.lists() }),
    onError: (err) => console.error("Create chart of account failed:", err),
  });
};

/**
 * PUT /api/chart-account/:id — partial update
 *
 * Payload: { id, data: { account_name, account_type, ... } }
 */
export const useUpdateChartOfAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      fetchJSON(`${BASE}/api/chart-account/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: chartKeys.lists() });
      qc.invalidateQueries({ queryKey: chartKeys.detail(id) });
    },
    onError: (err) => console.error("Update chart of account failed:", err),
  });
};

// export const useDeleteChartOfAccount = () => {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (id) =>
//       fetchJSON(`${BASE}/api/chart-account/${id}`, { method: "DELETE" }),
//     onSuccess: () => qc.invalidateQueries({ queryKey: chartKeys.lists() }),
//     onError: (err) => console.error("Delete chart of account failed:", err),
//   });
// };