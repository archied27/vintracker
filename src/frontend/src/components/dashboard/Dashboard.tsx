import { Package, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { Item } from "../../lib/types";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "2-digit",
});

function formatCurrency(value: number | string) {
  return currencyFormatter.format(Number(value));
}

function getProfit(item: Item) {
  return item.profit ?? ((item.sale_price ?? 0) - item.buy_price);
}

function ProfitChart({ items }: { items: Item[] }) {
  const soldItems = items
    .filter((item) => item.status === "sold" && item.sold_date)
    .sort((first, second) => first.sold_date!.localeCompare(second.sold_date!));
  let runningProfit = 0;
  const points = soldItems.map((item) => {
    runningProfit += getProfit(item);
    return {
      date: item.sold_date!,
      value: runningProfit,
    };
  });

  if (!points.length) {
    return (
      <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
        Profit will appear here when an item is sold.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.12} strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(value) => dateFormatter.format(new Date(`${value}T00:00:00`))} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrency} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            labelFormatter={(value) => dateFormatter.format(new Date(`${value}T00:00:00`))}
            formatter={(value) => [formatCurrency(Number(value)), "Profit"]}
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)" }}
          />
          <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} fill="url(#profitFill)" dot={{ fill: "var(--background)", stroke: "var(--primary)", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, accentClassName }: { icon: React.ReactNode; label: string; value: string; detail?: string; accentClassName: string }) {
  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        <span className={`rounded-md p-2 ${accentClassName}`}>{icon}</span>
      </CardContent>
    </Card>
  );
}

export function Dashboard({ items }: { items: Item[] }) {
  const totalInvested = items.reduce((total, item) => total + item.buy_price, 0);
  const soldItems = items.filter((item) => item.status === "sold");
  const totalRevenue = soldItems.reduce((total, item) => total + (item.sale_price ?? 0), 0);
  const netProfit = soldItems.reduce((total, item) => total + getProfit(item), 0);
  const netProfitRoi = totalInvested ? (netProfit / totalInvested) * 100 : 0;

  return (
    <section className="w-full space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={<Wallet className="size-4" />} label="Total invested" value={formatCurrency(totalInvested)} detail="Across all items" accentClassName="text-sky-300" />
        <MetricCard icon={<TrendingUp className="size-4" />} label="Total revenue" value={formatCurrency(totalRevenue)} detail={`${soldItems.length} sold ${soldItems.length === 1 ? "item" : "items"}`} accentClassName="text-teal-300" />
        <MetricCard icon={<PiggyBank className="size-4" />} label="Net profit" value={formatCurrency(netProfit)} detail={`${netProfitRoi.toFixed(1)}% ROI`} accentClassName="text-emerald-300" />
        <MetricCard icon={<Package className="size-4" />} label="Inventory" value={String(items.length)} detail={`${items.length === 1 ? "Item" : "Items"} tracked`} accentClassName="text-amber-300" />
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Profit over time</CardTitle>
          <p className="text-sm text-muted-foreground">Cumulative profit from sold items</p>
        </CardHeader>
        <CardContent>
          <ProfitChart items={items} />
        </CardContent>
      </Card>
    </section>
  );
}
