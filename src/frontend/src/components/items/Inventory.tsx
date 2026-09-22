/* Contains all items */

import ItemCard from "./ItemCard";
import type { Item, ItemStatus } from "../../lib/types";
import { Separator } from "../ui/separator";
import { ItemDetailDialog } from "./ItemDetailDialog";
import { useState } from "react";

const statusOrder: Record<ItemStatus, number> = {
  not_listed: 0,
  listed: 1,
  sold: 2,
};
const statusLabels: Record<ItemStatus, string> = {
  not_listed: "Not listed",
  listed: "Listed",
  sold: "Sold",
};
const statuses: ItemStatus[] = ["not_listed", "listed", "sold"];

export function Inventory({ items, onItemChanged }: { items: Item[]; onItemChanged: () => void }) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<ItemStatus[]>(statuses);
  const statusCounts = items.reduce<Record<ItemStatus, number>>((counts, item) => {
    counts[item.status] += 1;
    return counts;
  }, { not_listed: 0, listed: 0, sold: 0 });
  const selectedStatusSet = new Set(selectedStatuses);
  const visibleItems = items
    .filter((item) => selectedStatusSet.has(item.status))
    .sort((first, second) => statusOrder[first.status] - statusOrder[second.status]);

  function toggleStatus(status: ItemStatus) {
    setSelectedStatuses((current) => current.includes(status)
      ? current.filter((selectedStatus) => selectedStatus !== status)
      : [...current, status]);
  }

  return (
    <div className="flex flex-col items-center gap-3 justify-center w-full">

      {/* Header */}
      <div className="flex w-full items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Inventory</h1>
        <span className="text-sm text-muted-foreground">
          {visibleItems.length} {visibleItems.length === 1 ? "Item" : "Items"}
        </span>
      </div>

      <div className="grid w-full grid-cols-3 gap-2">
        {statuses.map((status) => {
          const isSelected = selectedStatusSet.has(status);
          return (
            <button
              key={status}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleStatus(status)}
              className={`flex min-h-20 flex-col justify-between rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 ${isSelected ? "border-primary bg-primary/10" : "border-border bg-muted/30 text-muted-foreground"}`}
            >
              <span className="text-xs font-medium uppercase tracking-wide">{statusLabels[status]}</span>
              <span className="text-2xl font-semibold tabular-nums">{statusCounts[status]}</span>
            </button>
          );
        })}
      </div>

      <Separator className="w-full" />

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visibleItems.map((item) => (
          <ItemCard key={item.id} item={item} onSelect={setSelectedItem} />
        ))}
      </div>
      <ItemDetailDialog key={selectedItem?.id ?? "empty"} item={selectedItem} open={selectedItem !== null} onOpenChange={(open) => { if (!open) setSelectedItem(null); }} onItemChanged={() => { setSelectedItem(null); onItemChanged(); }} />
    </div>
  )
}