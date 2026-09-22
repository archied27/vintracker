export type ItemStatus = "not_listed" | "listed" | "sold";
export type ItemSeason = "summer" | "winter" | "autumn" | "spring";

export interface Item {
	id: number;
	title: string;
	photo_url: string | null;
	category: string | null;
	season: ItemSeason;
	brand: string | null;
	size: string | null;
	source_platform: string | null;
	buy_price: number;
	buy_date: string;
	status: ItemStatus;
	listing_price: number | null;
	listing_url: string | null;
	listed_date: string | null;
	sale_price: number | null;
	sold_date: string | null;
	profit: number | null;
	margin_pct: number | null;
	roi_pct: number | null;
	notes: string | null;
	price_history?: PriceHistoryEntry[];
}

export interface PriceHistoryEntry {
	price: number;
	changed_at: string;
}
