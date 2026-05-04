// src\hooks\use-permission.js
import { useAuthV2 as useAuth } from "@/features/authentication-v2/use-auth-v2";

// Can user do this one thing?
// Usage: const canRunPayroll = useCan("PAY_PROCESS");
export const useHasPermission = (permissionCode) => {
  const { user } = useAuth();
  return user?.permissions?.includes(permissionCode) ?? false;
};

// Can user do ALL of these?
// Usage: const canManagePayroll = useCanAll(["PAY_PROCESS", "PAY_CONFIG"]);
export const useHasAllPermissions = (permissionCodes = []) => {
  const { user } = useAuth();
  const perms = user?.permissions ?? [];
  return permissionCodes.every((code) => perms.includes(code));
};

// Can user do ANY of these?
// Usage: const canSeeApprovals = useCanAny(["ATT_LEAVE_APPROVE", "MSS_APPROVE_TEAM"]);
export const useHasAnyPermissions = (permissionCodes = []) => {
  const { user } = useAuth();
  const perms = user?.permissions ?? [];
  return permissionCodes.some((code) => perms.includes(code));
};