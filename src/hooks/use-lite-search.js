// src/hooks/use-lite-search.js

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const EMP_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-employee-lite`;
const SUP_URL = `${import.meta.env.VITE_API_BASE_URL}/api/supervisor-lite`;

// ── Fetchers ──────────────────────────────────────────────────────────────────

const searchEmployeesLite = async (searchTerm) => {
  const res = await fetch(`${EMP_URL}?q=${encodeURIComponent(searchTerm)}`);
  if (!res.ok) throw new Error(`Failed to search employees: ${res.status}`);
  const json = await res.json();
  return json.data || json;
};

const searchSupervisorsLite = async (searchTerm) => {
  const res = await fetch(`${SUP_URL}?q=${encodeURIComponent(searchTerm)}`);
  if (!res.ok) throw new Error(`Failed to search supervisors: ${res.status}`);
  const json = await res.json();
  return json.data || json;
};

// ── Debounce hook ─────────────────────────────────────────────────────────────

export const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

// ── Employee lite search hook ─────────────────────────────────────────────────

export const useEmployeeLiteSearch = (searchTerm) => {
  const debouncedTerm = useDebounce(searchTerm, 300);

  return useQuery({
    queryKey: ["employee-lite", debouncedTerm],
    queryFn:  () => searchEmployeesLite(debouncedTerm),
    enabled:  debouncedTerm.trim().length >= 2,
    staleTime: 30 * 1000,
    gcTime:    2 * 60 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
    placeholderData: [],
  });
};

// ── Supervisor lite search hook ───────────────────────────────────────────────
// Returns: { id, userId, name, empNo, role }
// role is one of: 'Supervisor' | 'Team Lead' | 'Manager'

export const useSupervisorLiteSearch = (searchTerm) => {
  const debouncedTerm = useDebounce(searchTerm, 300);

  return useQuery({
    queryKey: ["supervisor-lite", debouncedTerm],
    queryFn:  () => searchSupervisorsLite(debouncedTerm),
    enabled:  debouncedTerm.trim().length >= 2,
    staleTime: 30 * 1000,
    gcTime:    2 * 60 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
    placeholderData: [],
  });
};