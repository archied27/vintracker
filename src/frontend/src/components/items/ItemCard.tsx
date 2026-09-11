/* A single item card */

import { Card } from "../ui/card";
import type { Item } from "../../lib/types";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
});

export default function ItemCard({ item }: { item: Item }) {
    const displayedPrice = item.sale_price ?? item.listing_price ?? item.buy_price;
    const priceLabel = item.sale_price !== null
        ? "Sold For"
        : item.listing_price !== null
            ? "Listed For"
            : "Bought For";

  return (
    <Card className="group cursor-pointer gap-0 overflow-hidden p-0 transition-colors hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none">
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-muted">
            {item.photo_url ? (
                <img
                    src={item.photo_url}
                    alt={item.title}
                    sizes="(max-width: 768px) 50vw, 240px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
            ) : null}
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
                    <div className="text-[11px] text-muted-foreground">
                        {priceLabel}
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                        {currencyFormatter.format(displayedPrice)}
                    </div>
                </div>

                <div className="text-[11px] text-muted-foreground">
                    Bought For {currencyFormatter.format(item.buy_price)}
                </div>
            </div>
        </div>
    </Card>
  );
}