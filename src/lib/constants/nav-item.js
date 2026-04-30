import {
  Home,
  FileText,
  Plus,
  Wrench,
  ClipboardList,
  Settings,
  User,
  LogOutIcon,
  Menu,
  X,
} from "lucide-react";




export const NAV_ITEMS = [
  {
    label: "Main Entry",
    links: [
    //    { to: "/dashboard/contraction-process", label: "Contraction Process", Icon: ClipboardList },
    //   { to: "/dashboard/timeline", label: "Dashboard Timeline", Icon: ClipboardList },
    //   { to: "/dashboard/shedule-header", label: "Schedule Header", Icon: ClipboardList },
    //   { to: "/dashboard/shedule-line", label: "Schedule Line", Icon: ClipboardList },
      { to: "/dashboard", label: "Home", Icon: Home },
      { to: "/dashboard/receive-voucher", label: "Receive Voucher", Icon: Home },
      { to: "/dashboard/payment-voucher", label: "Payment Voucher", Icon: FileText },
      { to: "/dashboard/journal-voucher", label: "Journal Voucher", Icon: Plus },
      { to: "/dashboard/cash-voucher", label: "Cash Transfer", Icon: Plus },
     
      { to: "/dashboard/chart-account", label: "Chart of Account", Icon: Wrench },
      { to: "/dashboard/all-chart", label: "All Chart of Account", Icon: ClipboardList },
    ],
  },

  {
    label: "Report",
    links: [
      { to: "/dashboard/daily-expense", label: "Daily Expense Report", Icon: ClipboardList },
     
      { to: "/dashboard/daily-income", label: "Daily Income Report", Icon: ClipboardList },
      { to: "/dashboard/ledger", label: "Ledger", Icon: FileText },
      { to: "/dashboard/cash-book", label: "Cash Book", Icon: FileText },
      { to: "/dashboard/chart-of-account", label: "Chart of Account", Icon: ClipboardList },
    ],
  },

  {
    label: "Inventory",
    links: [
      { to: "/dashboard/inventory", label: "Inventory", Icon: ClipboardList },
      { to: "/dashboard/dispatch", label: "Dispatch", Icon: FileText },
      { to: "/dashboard/item", label: "item", Icon: ClipboardList },
      { to: "/dashboard/item-stock", label: "item-stock", Icon: FileText },
     
     
    ],
  },

//   {
//     label: "Users",
//     links: [
//       { to: "/dashboard/user", label: "User", Icon: User },
//       // { to: "/dashboard/add-user", label: "Add User", Icon: User },
//       { to: "/dashboard/admin-user", label: "Admin User", Icon: User },
//     ],
//   },

//   {
//     label: "Settings",
//     links: [
//       // { to: "/dashboard/general-settings", label: "General Settings", Icon: Settings },
//       // { to: "/dashboard/account-settings", label: "Account Settings", Icon: Settings },
//       { to: "/dashboard/supplier-setting-voucher", label: "Supplier Setting", Icon: Plus },
//       { to: "/dashboard/customer-setting-voucher", label: "Customer Setting", Icon: Plus },
//       { to: "/dashboard/project-setting", label: "Project Setting", Icon: Plus },
//       { to: "/dashboard/contrator-setting", label: "Contractor Setting", Icon: Plus },
//     ],
//   },
];
