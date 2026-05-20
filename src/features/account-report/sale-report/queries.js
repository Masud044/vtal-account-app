import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_API_BASE_URL;

export const reportKeys = {
  all:    ["sale-expense-report"],
  report: (from, to) => [...reportKeys.all, from, to],
};

const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.data ?? json;
};

export const useSaleExpenseReport = ({ from_date, to_date, enabled = true }) =>
  useQuery({
    queryKey: reportKeys.report(from_date, to_date),
    queryFn:  () =>
      fetchJSON(
        `${BASE}/api/report/sale-expense?from_date=${from_date}&to_date=${to_date}`
      ),
    enabled:  enabled && !!from_date && !!to_date,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });