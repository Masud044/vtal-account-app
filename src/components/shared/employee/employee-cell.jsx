// src\components\shared\employee\employee-cell.jsx

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";

export function EmployeeCell({
  id,
  firstName,
  lastName,
  title,
  empNo,
}) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  const avatarColor = getAvatarColor(fullName);

  const avatarUrl = `${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${id}`;

  return (
    <div className="flex items-center gap-3 py-1">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback
          className={cn("text-xs font-semibold text-white", avatarColor)}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col">
        <span className="font-medium leading-tight">
          {title && (
            <span className="text-muted-foreground mr-1">{title}</span>
          )}
          {fullName || "N/A"}
        </span>

        <span className="text-xs text-muted-foreground">
          ID : {empNo ?? "N/A"}
        </span>
      </div>
    </div>
  );
}

