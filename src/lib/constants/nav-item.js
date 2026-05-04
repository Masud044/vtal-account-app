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




// export const NAV_ITEMS = [
//   {
//     label: "Main Entry",
//     links: [
    
//       { to: "/dashboard", label: "Home", Icon: Home },
//       { to: "/dashboard/receive-voucher", label: "Receive Voucher", Icon: Home },
//       { to: "/dashboard/payment-voucher", label: "Payment Voucher", Icon: FileText },
//       { to: "/dashboard/journal-voucher", label: "Journal Voucher", Icon: Plus },
//       { to: "/dashboard/cash-voucher", label: "Cash Transfer", Icon: Plus },
     
//       { to: "/dashboard/chart-account", label: "Chart of Account", Icon: Wrench },
//       { to: "/dashboard/all-chart", label: "All Chart of Account", Icon: ClipboardList },
//     ],
//   },

//   {
//     label: "Report",
//     links: [
//       { to: "/dashboard/daily-expense", label: "Daily Expense Report", Icon: ClipboardList },
     
//       { to: "/dashboard/daily-income", label: "Daily Income Report", Icon: ClipboardList },
//       { to: "/dashboard/ledger", label: "Ledger", Icon: FileText },
//       { to: "/dashboard/cash-book", label: "Cash Book", Icon: FileText },
//       { to: "/dashboard/chart-of-account", label: "Chart of Account", Icon: ClipboardList },
//     ],
//   },

//   {
//     label: "Inventory",
//     links: [
//       { to: "/dashboard/inventory", label: "Inventory", Icon: ClipboardList },
//       { to: "/dashboard/dispatch", label: "Dispatch", Icon: FileText },
//       { to: "/dashboard/item", label: "item", Icon: ClipboardList },
//       { to: "/dashboard/item-stock", label: "item-stock", Icon: FileText },
     
     
//     ],
//   },


// ];




export const NAV_ITEMS = [
  {
    label: "Main Entry",
    roles: ["Admin"],                  // শুধু Admin
    links: [
      { to: "/dashboard", label: "Home", Icon: Home },
      { to: "/dashboard/receive-voucher", label: "Receive Voucher", Icon: Home },
      { to: "/dashboard/payment-voucher", label: "Payment Voucher", Icon: FileText },
      { to: "/dashboard/journal-voucher", label: "Journal Voucher", Icon: Plus },
      { to: "/dashboard/cash-voucher", label: "Cash Transfer", Icon: Plus },
      { to: "/dashboard/chart-account", label: "Chart of Account", Icon: Wrench },
      { to: "/dashboard/customer", label: "Customer Info", Icon: Wrench },
      { to: "/dashboard/supplier", label: "Supplier Info", Icon: Wrench },
    ],
  },
  {
    label: "Main Report",
    roles: ["Admin"],                  // শুধু Admin
    links: [
      { to: "/dashboard/daily-expense", label: "Daily Expense Report", Icon: ClipboardList },
      { to: "/dashboard/daily-income", label: "Daily Income Report", Icon: ClipboardList },
      { to: "/dashboard/ledger", label: "Ledger", Icon: FileText },
      { to: "/dashboard/cash-book", label: "Cash Book", Icon: FileText },
      { to: "/dashboard/cash-book", label: "Cash Book", Icon: FileText },
      
    ],
  },

  {
    label: "User Management",
    roles: ["Admin"],                  // শুধু Admin
    links: [
      { to: "/dashboard/user-management", label: "User Management", Icon: ClipboardList },
      { to: "/dashboard/module", label: "Module", Icon: ClipboardList },
      { to: "/dashboard/role", label: "Role", Icon: FileText },
      { to: "/dashboard/permission", label: "Permission", Icon: FileText },
    ],
  },
  {
    label: "Inventory",
    roles: ["Admin", "Inventory"],     // Admin + Inventory উভয়ই
    links: [
      { to: "/dashboard/inventory", label: "Inventory", Icon: ClipboardList },
      { to: "/dashboard/dispatch", label: "Dispatch", Icon: FileText },
      { to: "/dashboard/item", label: "Item", Icon: ClipboardList },
      { to: "/dashboard/item-stock", label: "Item Stock", Icon: FileText },
    ],
  },
  {
    label: "Inventory Report",
   roles: ["Admin", "Inventory"],             // Admin + Inventory উভয়ই
    links: [
      { to: "/dashboard/daily-expense", label: "Daily Expense Report", Icon: ClipboardList },
      { to: "/dashboard/daily-income", label: "Daily Income Report", Icon: ClipboardList },
      { to: "/dashboard/ledger", label: "Ledger", Icon: FileText },
      { to: "/dashboard/cash-book", label: "Cash Book", Icon: FileText },
    ],
  },
];