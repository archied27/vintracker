/* A single item card */

import { Card } from "../ui/card";
import type { Item } from "../../lib/types";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
});

export default function ItemCard({ item, onSelect }: { item: Item; onSelect: (item: Item) => void }) {
    const displayedPrice = item.status === "sold"
        ? item.sale_price ?? item.buy_price
        : item.status === "listed"
            ? item.listing_price ?? item.buy_price
            : item.buy_price;
    const priceLabel = item.status === "sold"
        ? "Sold For"
        : item.status === "listed"
            ? "Listed For"
            : "Bought For";
    const statusLabel = item.status === "sold"
        ? "Sold"
        : item.status === "listed"
            ? "Listed"
            : "Not Listed";
    const statusClassName = item.status === "sold"
        ? "bg-emerald-500 text-white"
        : item.status === "listed"
            ? "bg-sky-500 text-white"
            : "bg-amber-400 text-amber-950";

  return (
    <Card role="button" tabIndex={0} onClick={() => onSelect(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(item); }} className="group cursor-pointer gap-0 overflow-hidden p-0 transition-colors hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none">
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-muted">
            {item.photo_url ? (
                <img
                    src={item.photo_url}
                    alt={item.title}
                    sizes="(max-width: 768px) 50vw, 240px"
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                />
            ) : null}
            <span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${statusClassName}`}>
                {statusLabel}
            </span>
        </div>

        {/* Info Section */}
        <div className="flex flex-col gap-2 p-3">
            <div className="min-w-0">
                <h3 className="truncate text-sm font-medium">{item.title}</h3>
                <p className="truncate text-xs text-muted-foreground">
                    {[item.brand, item.size].filter(Boolean).join(", ") || item.category || ""}
                </p>
            </div>

            <div className="flex items-center justify-between gap-5">
                <div>
                    <div>
                        <div className="text-[11px] text-muted-foreground">
                            {priceLabel}
                        </div>
                        <div className="text-sm font-semibold tabular-nums">
                            {currencyFormatter.format(displayedPrice)}
                        </div>
                    </div>
                </div>

                {item.status !== "not_listed" ? (
                    <div className="text-[11px] text-muted-foreground">
                        Bought For {currencyFormatter.format(item.buy_price)}
                    </div>
                ) : null}
            </div>
        </div>
    </Card>
  );
}