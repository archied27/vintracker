"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, PlusSquareIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

const SOURCE_PLATFORMS = ["Vinted", "Charity Shop", "Carboot", "Depop", "Other"];

const todayISO = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  title: "",
  buyPrice: "",
  buyDate: todayISO(),
  season: "summer",
  sourcePlatform: "Vinted",
  brand: "",
  category: "",
  size: "",
  notes: "",
};

export function AddItemDialog({
  open,
  onOpenChange,
  onItemAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  function handleImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedImage(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const price = Number.parseFloat(form.buyPrice);
    if (!form.title.trim() || Number.isNaN(price)) {
      return;
    }

    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("category", form.category.trim() || "");
    payload.append("season", form.season);
    payload.append("brand", form.brand.trim() || "");
    payload.append("size", form.size.trim() || "");
    payload.append("source_platform", form.sourcePlatform);
    payload.append("buy_price", String(price));
    payload.append("buy_date", form.buyDate || todayISO());
    payload.append("notes", form.notes.trim() || "");

    if (selectedImage) {
      payload.append("photo", selectedImage);
    }

    try {
      const response = await fetch("/api/items/", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to add item.");
      }

      setForm(EMPTY);
      setSelectedImage(null);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
      onItemAdded?.();
    } catch (error) {
      console.error("Unable to add item", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-5">
          <DialogTitle>Add a new item</DialogTitle>
          <DialogDescription>
            Log what you just bought.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            <div className="grid grid-cols-1 gap-2">
              {selectedImage ? null : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-20 items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <ImagePlus className="size-4" aria-hidden />
                  Upload Image
                </button>
              )}

              {previewUrl ? (
                <div className="overflow-hidden rounded-lg border bg-muted/30">
                  <img src={previewUrl} alt="Selected item" className="h-40 w-full object-cover" />
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Item title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                placeholder="e.g. Hollister Shorts"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="buyPrice">Purchase price (£)</Label>
                <Input
                  id="buyPrice"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={form.buyPrice}
                  onChange={(event) => set("buyPrice", event.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buyDate">Purchase date</Label>
                <Input
                  id="buyDate"
                  type="date"
                  value={form.buyDate}
                  onChange={(event) => set("buyDate", event.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="season">Season</Label>
                <Select
                  value={form.season}
                  onValueChange={(value) => set("season", value)}
                >
                  <SelectTrigger id="season" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="autumn">Autumn</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={form.sourcePlatform}
                  onValueChange={(value) => set("sourcePlatform", value)}
                >
                  <SelectTrigger id="source" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {SOURCE_PLATFORMS.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={form.brand}
                onChange={(event) => set("brand", event.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(event) => set("category", event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={form.size}
                  onChange={(event) => set("size", event.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => set("notes", event.target.value)}
                placeholder="Condition, flaws, sourcing notes…"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="border-t p-5">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AddItem({ onItemAdded }: { onItemAdded?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <PlusSquareIcon className="size-4" />
        Add item
      </Button>
      <AddItemDialog open={open} onOpenChange={setOpen} onItemAdded={onItemAdded} />
    </>
  );
}