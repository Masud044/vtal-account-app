import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE      = `${import.meta.env.VITE_API_BASE_URL}/api/grn`;
const STORE_API     = `${import.meta.env.VITE_API_BASE_URL}/api/stores`;
const ITEM_STOCK_API= `${import.meta.env.VITE_API_BASE_URL}/api/item-stock`;
const ITEMS_API     = `${import.meta.env.VITE_API_BASE_URL}/api/item`;
const UOM_API       = `${import.meta.env.VITE_API_BASE_URL}/api/inv-uom`;

const grnQueryKeys = {
  all:          ["grn"],
  lists:        () => [...grnQueryKeys.all, "list"],
  detail:       (id) => [...grnQueryKeys.all, "detail", id],
  stores:       ["stores"],
  itemsByStore: (storeId) => ["item-stock", "by-store", storeId],
  items:        ["items"],
};

const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 0,
  gcTime: 0,
  refetchOnWindowFocus: false,
  throwOnError: false,
};

/* ─── API Functions ──────────────────────────────────────────────────────── */

const getGRNList = async () => {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const getGRNById = async (tid) => {
  const res = await fetch(`${API_BASE}/${tid}`);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const createGRN = async (data) => {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create: ${res.status}`);
  }
  return res.json();
};

const updateGRN = async ({ tid, data }) => {
  const res = await fetch(`${API_BASE}/${tid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update: ${res.status}`);
  }
  return res.json();
};

const deleteGRN = async (tid) => {
  const res = await fetch(`${API_BASE}/${tid}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete: ${res.status}`);
  }
  return res.json();
};

// ── Approve one detail row ───────────────────────────────────────────────────
// STATUS 1 (Pending) → 2 (Approved)
// DB trigger INV_UPDATE_STAT fires automatically → updates ITEM_STOCK
const approveDetailGRN = async ({ masterTid, detailTid }) => {
  const res = await fetch(`${API_BASE}/${masterTid}/details/${detailTid}/approve`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to approve: ${res.status}`);
  }
  return res.json();
};

// ── Approve all pending detail rows ─────────────────────────────────────────
const approveAllGRN = async (masterTid) => {
  const res = await fetch(`${API_BASE}/${masterTid}/approve-all`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to approve all: ${res.status}`);
  }
  return res.json();
};

const getStores = async () => {
  const res = await fetch(STORE_API);
  if (!res.ok) throw new Error(`Failed to fetch stores: ${res.status}`);
  const json = await res.json();
  return json.data || json;
};

const getItemsByStore = async (storeId) => {
  const res = await fetch(`${ITEM_STOCK_API}?storeId=${storeId}`);
  if (!res.ok) throw new Error(`Failed to fetch items: ${res.status}`);
  const json = await res.json();
  return json.data || json;
};

const getAllItems = async () => {
  const res = await fetch(ITEMS_API);
  if (!res.ok) throw new Error(`Failed to fetch items: ${res.status}`);
  const json = await res.json();
  return json.data || json;
};

const getAllUOMs = async () => {
  const res = await fetch(UOM_API);
  if (!res.ok) throw new Error(`Failed to fetch UOMs: ${res.status}`);
  const json = await res.json();
  return json.data || json;
};

/* ─── Hooks ──────────────────────────────────────────────────────────────── */

export const useGRNList = () =>
  useQuery({
    queryKey: grnQueryKeys.lists(),
    queryFn: getGRNList,
    refetchOnMount: true,
    ...queryDefaults,
  });

export const useGRNById = (tid) =>
  useQuery({
    queryKey: grnQueryKeys.detail(tid),
    queryFn: () => getGRNById(tid),
    enabled: !!tid,
    ...queryDefaults,
  });

export const useStores = () =>
  useQuery({
    queryKey: grnQueryKeys.stores,
    queryFn: getStores,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useItemsByStore = (storeId) =>
  useQuery({
    queryKey: grnQueryKeys.itemsByStore(storeId),
    queryFn: () => getItemsByStore(storeId),
    enabled: !!storeId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

export const useAllItems = () =>
  useQuery({
    queryKey: grnQueryKeys.items,
    queryFn: getAllItems,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useUOMList = () =>
  useQuery({
    queryKey: ["uom"],
    queryFn: getAllUOMs,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useCreateGRN = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGRN,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: grnQueryKeys.lists() }),
    onError: (err) => console.error("Create GRN failed:", err),
  });
};

export const useUpdateGRN = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateGRN,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: grnQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: grnQueryKeys.detail(vars.tid) });
    },
    onError: (err) => console.error("Update GRN failed:", err),
  });
};

export const useDeleteGRN = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGRN,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: grnQueryKeys.lists() }),
    onError: (err) => console.error("Delete GRN failed:", err),
  });
};

// STATUS 1 → 2 per row; trigger updates ITEM_STOCK automatically
export const useApproveDetailGRN = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveDetailGRN,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: grnQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: grnQueryKeys.detail(vars.masterTid) });
    },
  });
};

// Approve all pending rows under a GRN
export const useApproveAllGRN = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveAllGRN,
    onSuccess: (_, masterTid) => {
      queryClient.invalidateQueries({ queryKey: grnQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: grnQueryKeys.detail(masterTid) });
    },
  });
};