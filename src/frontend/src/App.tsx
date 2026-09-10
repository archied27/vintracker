import { useEffect, useState } from "react";
import { Inventory } from "./components/items/Inventory";
import type { Item } from "./lib/types";

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    loadItems();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-3">
      {error ? <p className="text-destructive">{error}</p> : <Inventory items={items} />}
    </div>
  );
}

export default App;