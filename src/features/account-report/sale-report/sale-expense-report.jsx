import { useState } from "react";
import {
  TrendingUp, ShoppingCart, Coins,
  Receipt, RefreshCw, AlertCircle, FileBarChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Spinner }   from "@/components/ui/spinner";
import { useSaleExpenseReport } from "./queries";
import ReportBreakdown from "./report-breakdown";
import ReportTables    from "./report-table";

const fmt = (v) => `৳${Number(v || 0).toLocaleString("en-IN")}`;

function KpiCard({ label, value, sub, icon: Icon, colorClass }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </p>
        <p className={`text-2xl font-semibold tabular-nums ${colorClass}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function SaleExpenseReport() {
  const today          = new Date().toISOString().split("T")[0];
  const firstOfMonth   = `${today.slice(0, 8)}01`;

  const [fromDate, setFromDate]       = useState(firstOfMonth);
  const [toDate, setToDate]           = useState(today);
  const [queryParams, setQueryParams] = useState(null);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useSaleExpenseReport({
      from_date: queryParams?.from_date,
      to_date:   queryParams?.to_date,
      enabled:   !!queryParams,
    });

  const summary = data?.summary;

  return (
    <div className="space-y-5">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-muted-foreground" />
              Sales &amp; Expense Report
            </h1>
            {summary && (
              <p className="text-xs text-muted-foreground mt-1">
                {summary.from_date} → {summary.to_date}
                &nbsp;·&nbsp;{summary.total_gl_lines} GL lines
                &nbsp;·&nbsp;{summary.total_vouchers} vouchers
              </p>
            )}
          </div>
          {queryParams && (
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* ── Date Filter ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Date range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="from_date" className="text-xs">From</Label>
              <Input
                id="from_date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to_date" className="text-xs">To</Label>
              <Input
                id="to_date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-44"
              />
            </div>
            <Button
              onClick={() => setQueryParams({ from_date: fromDate, to_date: toDate })}
              disabled={isLoading}
            >
              {isLoading
                ? <><Spinner className="mr-2 h-4 w-4" />Generating...</>
                : "Generate Report"
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── States ───────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner className="h-10 w-10 mb-3" />
          <p className="text-sm text-muted-foreground">Loading report…</p>
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load report</AlertTitle>
          <AlertDescription>{error?.message || "Something went wrong."}</AlertDescription>
        </Alert>
      )}

      {!queryParams && !isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <FileBarChart className="h-14 w-14 mb-3 opacity-20" />
          <p className="text-sm">
            Select a date range and click <strong>Generate Report</strong>
          </p>
        </div>
      )}

      {/* ── Report ───────────────────────────────────────────────── */}
      {data && !isLoading && (
        <>
          {/* Journal KPIs */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Journal entries — voucher type 3
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Total Sales"    value={fmt(summary.journal.total_sales)}   sub="Credit · account 4xx" icon={TrendingUp}  colorClass="text-blue-600" />
              <KpiCard label="Total Expenses" value={fmt(summary.journal.total_expense)} sub="Debit · account 5xx"  icon={ShoppingCart} colorClass="text-red-600" />
              <KpiCard
                label="Net Surplus"
                value={fmt(summary.journal.net_surplus)}
                sub="Sales − expenses"
                icon={Coins}
                colorClass={summary.journal.net_surplus >= 0 ? "text-green-600" : "text-red-600"}
              />
              <KpiCard
                label="Vouchers"
                value={summary.total_vouchers}
                sub={`Income: ${summary.income_vouchers} · Expense: ${summary.expense_vouchers}`}
                icon={Receipt}
                colorClass="text-foreground"
              />
            </div>
          </div>

          <Separator />

          {/* All-voucher KPIs */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              All vouchers — overall
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Total Sales"    value={fmt(summary.all.total_sales)}   sub="All income entries"  icon={TrendingUp}  colorClass="text-blue-600" />
              <KpiCard label="Total Expenses" value={fmt(summary.all.total_expense)} sub="All expense entries" icon={ShoppingCart} colorClass="text-red-600" />
              <KpiCard
                label="Net Surplus"
                value={fmt(summary.all.net_surplus)}
                sub="Sales − expenses"
                icon={Coins}
                colorClass={summary.all.net_surplus >= 0 ? "text-green-600" : "text-red-600"}
              />
              <KpiCard
                label="Profit Margin"
                value={`${summary.all.profit_margin_pct}%`}
                sub="Net / total sales"
                icon={Receipt}
                colorClass={Number(summary.all.profit_margin_pct) >= 0 ? "text-green-600" : "text-red-600"}
              />
            </div>
          </div>

          {/* Charts + Breakdown */}
          <ReportBreakdown
            salesBreakdown={data.sales_breakdown}
            expenseBreakdown={data.expense_breakdown}
            summary={summary}
          />

          {/* Tables */}
          <ReportTables sales={data.sales} expenses={data.expenses} />
        </>
      )}
    </div>
  );
}