import React, { useEffect, useState } from "react";
import {
  BadgeCheckIcon,
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  SparklesIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuthV2 } from "@/features/authentication-v2/use-auth-v2";

export default function UserDropDown() {
  const { user, logout } = useAuthV2();
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_BASE_URL;

  const [avatarTs, setAvatarTs] = useState(() => Date.now());

  useEffect(() => {
    const handler = () => setAvatarTs(Date.now());
    window.addEventListener("avatar-updated", handler);
    return () => window.removeEventListener("avatar-updated", handler);
  }, []);

  const avatarSrc = user?.id
    ? `${BASE}/api/emp-images/person/${user.id}?t=${avatarTs}`
    : user?.avatar;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 rounded-lg cursor-pointer">
          <AvatarImage src={avatarSrc} alt={user.username} />
          <AvatarFallback className="rounded-lg">
            {user.username?.slice(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg z-200"
        sideOffset={4}
        align="end"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={avatarSrc} alt={user.username} />
              <AvatarFallback className="rounded-lg">
                {user.username?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.username}</span>
              <span className="text-muted-foreground truncate text-xs">
                Role: {user.roles} user
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <SparklesIcon />
            Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheckIcon />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCardIcon />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BellIcon />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 cursor-pointer focus:text-red-700"
        >
          <LogOutIcon className="text-red-600" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}