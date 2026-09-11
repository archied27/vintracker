/* Contains all items */

import ItemCard from "./ItemCard";
import type { Item } from "../../lib/types";
import { Separator } from "../ui/separator";


export function Inventory({ items }: { items: Item[] }) {
  return (
    <div className="flex flex-col items-center gap-3 justify-center w-full">

      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <h1 className="text-xl font-bold">Inventory</h1>
      </div>

      <Separator className="w-full" />

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}