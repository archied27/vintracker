import { useState, type ReactNode } from "react";
import {
  CalendarClock,
  CircleDollarSign,
  ExternalLink,
  History,
  Tag,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import type { Item, ItemStatus } from "../../lib/types";

const todayISO = () => new Date().toISOString().slice(0, 10);
const formatGBP = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value ?? 0);
const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`)) : "-";

function statusLabel(status: ItemStatus) {
  return status === "not_listed" ? "Not listed" : status === "listed" ? "Listed" : "Sold";
}

async function requestItem(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error((await response.text()) || "Unable to update item");
  }
  return response.status === 204 ? null : response.json();
}

export function ItemDetailDialog({
  item,
  open,
  onOpenChange,
  onItemChanged,
}: {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemChanged: () => void;
}) {
  const [listPrice, setListPrice] = useState(item?.listing_price == null ? "" : String(item.listing_price));
  const [listUrl, setListUrl] = useState(item?.listing_url ?? "");
  const [salePrice, setSalePrice] = useState(item?.listing_price == null ? "" : String(item.listing_price));
  const [saleDate, setSaleDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!item) return null;

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onItemChanged();
      onOpenChange(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update item");
    } finally {
      setBusy(false);
    }
  }

  const handleList = () => {
    const price = Number.parseFloat(listPrice);
    if (Number.isNaN(price)) return;
    return runAction(async () => {
      await requestItem(`/api/items/${item.id}/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_price: price, listing_url: listUrl.trim() || null }),
      });
    });
  };

  const handleSold = () => {
    const price = Number.parseFloat(salePrice);
    if (Number.isNaN(price)) return;
    return runAction(async () => {
      await requestItem(`/api/items/${item.id}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_price: price,
          sold_date: saleDate || todayISO(),
        }),
      });
    });
  };

  const handleDelete = () => runAction(async () => {
    await requestItem(`/api/items/${item.id}`, { method: "DELETE" });
  });

  const profit = item.sale_price == null ? null : item.sale_price - item.buy_price;
  const margin = item.sale_price ? (profit! / item.sale_price) * 100 : null;
  const roi = item.buy_price ? (profit! / item.buy_price) * 100 : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader className="sr-only"><DialogTitle>{item.title}</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-[220px_1fr]">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {item.photo_url ? <img src={item.photo_url} alt={item.title} className="h-full w-full object-cover object-center" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No photo</div>}
          </div>
          <div className="min-w-0 p-5">
            <span className="inline-flex rounded-full border px-2 py-1 text-xs font-medium">{statusLabel(item.status)}</span>
            <h2 className="mt-2 text-lg font-semibold leading-tight">{item.title}</h2>
            <p className="text-sm text-muted-foreground">{[item.brand, item.size, item.category].filter(Boolean).join(" · ") || "No details"}</p>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Field label="Bought for" value={formatGBP(item.buy_price)} />
              <Field label="Source" value={item.source_platform ?? "-"} />
              <Field label="Purchase date" value={formatDate(item.buy_date)} />
              {item.listed_date && <Field label="Listed" value={formatDate(item.listed_date)} />}
              {item.status === "sold" && <>
                <Field label="Sale price" value={formatGBP(item.sale_price)} />
                <Field label="Sold date" value={formatDate(item.sold_date)} />
              </>}
            </dl>

            {item.status === "sold" && profit !== null && <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border bg-muted/40 p-3 text-center">
              <Metric label="Profit" value={`${profit >= 0 ? "+" : ""}${formatGBP(profit)}`} />
              <Metric label="Margin" value={margin === null ? "-" : `${margin.toFixed(0)}%`} />
              <Metric label="ROI" value={roi === null ? "-" : `${roi.toFixed(0)}%`} />
            </div>}
            {item.notes && <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{item.notes}</p>}
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            <Separator className="my-5" />

            {item.status === "not_listed" && <ActionBlock icon={<Tag className="size-4" />} title="List this item">
              <div className="grid grid-cols-2 gap-3">
                <MoneyField id="listPrice" label="Listing price (£)" value={listPrice} onChange={setListPrice} />
                <div className="space-y-1.5"><Label htmlFor="listUrl">Listing URL</Label><Input id="listUrl" value={listUrl} onChange={(event) => setListUrl(event.target.value)} placeholder="Optional" /></div>
              </div>
              <Button className="mt-3 w-full" onClick={handleList} disabled={!listPrice || busy}>Mark as listed</Button>
            </ActionBlock>}

            {item.status === "listed" && <div className="space-y-5">
              <ActionBlock icon={<Tag className="size-4" />} title="Adjust listing price">
                <div className="flex items-end gap-2">
                  <div className="flex-1"><MoneyField id="editPrice" label="Listing price (£)" value={listPrice} onChange={setListPrice} /></div>
                  <Button variant="secondary" onClick={handleList} disabled={!listPrice || busy || Number.parseFloat(listPrice) === item.listing_price}>Update</Button>
                </div>
                {item.listing_url && <a href={item.listing_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"><ExternalLink className="size-3" />View live listing</a>}
              </ActionBlock>
              <ActionBlock icon={<CircleDollarSign className="size-4" />} title="Mark as sold">
              <div className="grid grid-cols-2 gap-3">
                <MoneyField id="salePrice" label="Sale price (£)" value={salePrice} onChange={setSalePrice} />
                <div className="space-y-1.5"><Label htmlFor="saleDate">Sale date</Label><Input id="saleDate" type="date" className="appearance-none" value={saleDate} onChange={(event) => setSaleDate(event.target.value)} /></div>
              </div>
              <Button className="mt-3 w-full" onClick={handleSold} disabled={!salePrice || busy}>Confirm sale</Button>
              </ActionBlock>
            </div>}

            {item.price_history && item.price_history.length > 1 && <div className="mt-5"><div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><History className="size-3.5" />Price history</div><div className="flex flex-wrap gap-1.5">{item.price_history.map((entry) => <span key={`${entry.changed_at}-${entry.price}`} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs tabular-nums"><CalendarClock className="size-3" />{formatDate(entry.changed_at)}: {formatGBP(entry.price)}</span>)}</div></div>}
            <Separator className="my-5" />
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={busy} className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" />Delete item</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{value}</dd></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><div className="text-base font-semibold tabular-nums">{value}</div><div className="text-[11px] text-muted-foreground">{label}</div></div>;
}

function ActionBlock({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <div className="rounded-xl border p-4"><div className="mb-3 flex items-center gap-2 text-sm font-medium"><span className="text-primary">{icon}</span>{title}</div>{children}</div>;
}

function MoneyField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" inputMode="decimal" step="0.01" min="0" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0.00" /></div>;
}