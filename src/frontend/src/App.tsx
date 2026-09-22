import { useEffect, useState } from "react";
import { Inventory } from "./components/items/Inventory";
import { Dashboard } from "./components/dashboard/Dashboard";
import type { Item } from "./lib/types";
import Hero from "./components/Hero";

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadItems() {
    try {
      const response = await fetch("/api/items/");
      if (!response.ok) {
        throw new Error(`Unable to load items (${response.status})`);
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("The items response was not a list");
      }

      setItems(data as Item[]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load items",
      );
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-3">
      <Hero onItemAdded={loadItems} />

      {error ? <p className="text-destructive">{error}</p> : <>
        <Dashboard items={items} />
        <Inventory items={items} onItemChanged={loadItems} />
      </>}
    </div>
  );
}

export default App;