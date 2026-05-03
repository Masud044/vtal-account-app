import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";

// import api from "@/api/Ap";
import { SectionContainer } from "@/components/SectionContainer";
import { DashboardHomeTable } from "../components/DashboardHomeTable";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import axios from "axios";

const url  = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DashboardHome = () => {
  // Fetch Expenses
  const { data: expenses = {} } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      // const res = await api.get("/dash_board_expense.php");
      const res = await axios.get(`${url}/api/dashboard-expense`);
      return res.data.success ? res.data : {};
    },
  });

  // Fetch Income
  const { data: income = {} } = useQuery({
    queryKey: ["income"],
    queryFn: async () => {
      // const res = await api.get("/dash_board_income.php");
      const res = await axios.get(`${url}/api/dashboard-income`);
      return res.data.success ? res.data : {};
    },
  });

  // Fetch Bank Balance
  const { data: cash = {} } = useQuery({
    queryKey: ["cash"],
    queryFn: async () => {
      // const res = await api.get("/dash_board_cash.php");
      const res = await axios.get(`${url}/api/dashboard-cash`);
      return res.data.success ? res.data : {};
    },
  });

  // Helper function for Theme Styles
  const getTheme = (type) => {
    switch (type) {
      case "income":
        return {
          cardBg: "bg-[#F0FDF4] border-emerald-100/50", // Emerald 50
          iconBg: "bg-emerald-100 text-emerald-600",
          badgeBg: "bg-emerald-100/50 text-emerald-700",
          trendIcon: TrendingUp,
        };
      case "expense":
        return {
          cardBg: "bg-[#FFF1F2] border-rose-100/50", // Rose 50
          iconBg: "bg-rose-100 text-rose-600",
          badgeBg: "bg-rose-100/50 text-rose-700",
          trendIcon: TrendingDown,
        };
      case "balance":
        return {
          cardBg: "bg-[#F5F3FF] border-violet-100/50", // Violet 50
          iconBg: "bg-violet-100 text-violet-600",
          badgeBg: "bg-violet-100/50 text-violet-700",
          trendIcon: Activity,
        };
      default:
        return {};
    }
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, trend, type }) => {
    const theme = getTheme(type);
    const TrendIcon = theme.trendIcon;

    return (
      <Card className={cn(
        "border shadow-sm transition-all duration-300 hover:shadow-md",
        theme.cardBg
      )}>
        <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-600">
            {title}
          </CardTitle>
          <div className={cn("p-2 rounded-full transition-transform hover:scale-110", theme.iconBg)}>
            <Icon size={18} strokeWidth={2.5} />
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {Number(value || 0).toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-slate-500">Taka</span>
          </div>

          <div className="mt-5">
            <div className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ring-black/5",
              theme.badgeBg
            )}>
              <TrendIcon size={12} className="mr-1.5" strokeWidth={3} />
              {trend}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <SectionContainer>
      <div className="py-5 space-y-6 bg-slate-50/30 min-h-screen">
        
        {/* Stats Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 ">
          <StatCard
            title="Money Income"
            value={income.total_income}
            icon={ArrowUpRight}
            trend="+12%"
            type="income"
          />

          <StatCard
            title="Money Expenses"
            value={expenses.total_expense}
            icon={ArrowDownRight}
            trend="-5%"
            type="expense"
          />

          <StatCard
            title="Banking Balance"
            value={cash.bankBalance}
            icon={Landmark}
            trend="Stable"
            type="balance"
          />
        </div>

        {/* Table Section */}
        <Card className="border-none  overflow-hidden">
           <div className="p-1">
             <DashboardHomeTable />
           </div>
        </Card>

      </div>
    </SectionContainer>
  );
};

export default DashboardHome;