from collections.abc import Generator
from pathlib import Path
import sqlite3


DATABASE_PATH = Path(__file__).resolve().parents[2] / "data" / "vintracker.db"


def get_connection() -> sqlite3.Connection:
	DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

	connection = sqlite3.connect(DATABASE_PATH)
	connection.row_factory = sqlite3.Row
	connection.execute("PRAGMA foreign_keys = ON")
	return connection


def init_db() -> None:
	with get_connection() as connection:
		connection.executescript(
			"""
			CREATE TABLE IF NOT EXISTS items (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				title TEXT NOT NULL,
				photo_url TEXT,
				category TEXT,
				brand TEXT,
				size TEXT,
				source_platform TEXT,
				buy_price REAL NOT NULL CHECK (buy_price >= 0),
				buy_date TEXT NOT NULL,
				status TEXT NOT NULL DEFAULT 'not_listed'
					CHECK (status IN ('not_listed', 'listed', 'sold')),
				listing_price REAL CHECK (listing_price >= 0),
				listed_date TEXT,
				sale_price REAL CHECK (sale_price >= 0),
				sold_date TEXT,
				profit REAL,
				margin_pct REAL,
				roi_pct REAL,
				notes TEXT
			);

			CREATE TABLE IF NOT EXISTS price_history (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				item_id INTEGER NOT NULL,
				price REAL NOT NULL CHECK (price >= 0),
				changed_at TEXT NOT NULL,
				FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
			);
			"""
		)


def get_db() -> Generator[sqlite3.Connection, None, None]:
	connection = get_connection()
	try:
		yield connection
	finally:
		connection.close()
