import AddItem from "./items/AddItem";

export default function Hero({ onItemAdded }: { onItemAdded?: () => void }) {
  return (
    <section className="flex w-full items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">VinTracker</h1>
      </div>

      <div className="">
        <AddItem onItemAdded={onItemAdded} />
      </div>
    </section>
  );
}