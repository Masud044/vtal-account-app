import { TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const fmt    = (v) => `৳${Number(v || 0).toLocaleString("en-IN")}`;
const fmtShort = (v) => {
  if (v >= 100000) return `৳${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `৳${(v / 1000).toFixed(0)}K`;
  return `৳${v}`;
};

const SALE_COLORS = ["#3B82F6","#10B981","#8B5CF6","#F97316","#EAB308","#06B6D4"];
const EXP_COLORS  = ["#EF4444","#F97316","#F59E0B","#EC4899","#8B5CF6","#6B7280","#14B8A6"];

export default function ReportBreakdown({ salesBreakdown = [], expenseBreakdown = [], summary }) {
  const totalSales = summary?.all?.total_sales  || 1;
  const totalExp   = summary?.all?.total_expense || 1;

  return (
    <div className="space-y-4">
      {/* ── Charts ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sales Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sales by product</CardTitle>
            <p className="text-xs text-muted-foreground">Account 4xx — credit side</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={salesBreakdown}
                    dataKey="total"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={82}
                    paddingAngle={2}
                  >
                    {salesBreakdown.map((_, i) => (
                      <Cell key={i} fill={SALE_COLORS[i % SALE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col gap-1.5 text-xs w-full">
                {salesBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ background: SALE_COLORS[i % SALE_COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                    <span className="font-medium ml-auto pl-2 tabular-nums">{fmt(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Horizontal Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expenses by category</CardTitle>
            <p className="text-xs text-muted-foreground">Account 5xx — debit side</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={expenseBreakdown}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={fmtShort}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={115}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {expenseBreakdown.map((_, i) => (
                    <Cell
                      key={i}
                      fill={EXP_COLORS[i % EXP_COLORS.length]}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Breakdown Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Sales breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {salesBreakdown.map((item, i) => {
              const pct = Math.min((item.total / totalSales) * 100, 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground truncate pr-2">{item.name}</span>
                    <span className="font-medium text-green-700 tabular-nums flex-shrink-0">
                      {fmt(item.total)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-green-50 dark:bg-green-950/40">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between text-sm font-semibold pt-2 border-t">
              <span>Total</span>
              <span className="text-green-700">{fmt(summary?.all?.total_sales)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4 text-red-600" />
              Expense breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenseBreakdown.map((item, i) => {
              const pct = Math.min((item.total / totalExp) * 100, 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground truncate pr-2">{item.name}</span>
                    <span className="font-medium text-red-700 tabular-nums flex-shrink-0">
                      {fmt(item.total)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-red-50 dark:bg-red-950/40">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between text-sm font-semibold pt-2 border-t">
              <span>Total</span>
              <span className="text-red-700">{fmt(summary?.all?.total_expense)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Final Summary Footer ─────────────────────────────────── */}
      <Card className="bg-muted/40 border-dashed">
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total sales</p>
              <p className="text-xl font-semibold text-blue-600 tabular-nums">
                {fmt(summary?.all?.total_sales)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total expenses</p>
              <p className="text-xl font-semibold text-red-600 tabular-nums">
                {fmt(summary?.all?.total_expense)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Net surplus</p>
              <p className={`text-xl font-semibold tabular-nums ${
                summary?.all?.net_surplus >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {fmt(summary?.all?.net_surplus)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Profit margin</p>
              <p className="text-xl font-semibold text-green-600">
                {summary?.all?.profit_margin_pct}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}