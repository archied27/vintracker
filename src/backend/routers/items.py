"""
Routes for all items endpoints
"""

from datetime import date
from pathlib import Path
from typing import Any, Literal
import sqlite3
import shutil
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, ConfigDict, Field

from db import PROJECT_ROOT, get_db

router = APIRouter(prefix="/api/items", tags=["items"])

Season = Literal["summer", "winter", "autumn", "spring"]


class ItemCreate(BaseModel):
    title: str = Field(min_length=1)
    photo_url: str | None = None
    category: str | None = None
    season: Season
    brand: str | None = None
    size: str | None = None
    source_platform: str | None = None
    buy_price: float = Field(ge=0)
    buy_date: date
    notes: str | None = None


class ItemUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1)
    photo_url: str | None = None
    category: str | None = None
    season: Season | None = None
    brand: str | None = None
    size: str | None = None
    source_platform: str | None = None
    buy_price: float | None = Field(default=None, ge=0)
    buy_date: date | None = None
    notes: str | None = None


class ItemListRequest(BaseModel):
    listing_price: float = Field(ge=0)
    listing_url: str | None = None
    listed_date: date | None = None


class ItemSellRequest(BaseModel):
    sale_price: float = Field(ge=0)
    sold_date: date | None = None


def serialize_item(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item.pop("fees", None)
    item.pop("shipping_cost", None)
    return item


def get_item_or_404(connection: sqlite3.Connection, item_id: int) -> sqlite3.Row:
    row = connection.execute(
        "SELECT * FROM items WHERE id = ?", (item_id,)
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return row


@router.get("/")
def get_items(connection: sqlite3.Connection = Depends(get_db)):
    rows = connection.execute("SELECT * FROM items ORDER BY id DESC").fetchall()
    items = [serialize_item(row) for row in rows]
    for item in items:
        item["price_history"] = [
            serialize_item(history)
            for history in connection.execute(
                "SELECT price, changed_at FROM price_history WHERE item_id = ? ORDER BY changed_at",
                (item["id"],),
            ).fetchall()
        ]
    return items


@router.get("/{item_id}")
def get_item(item_id: int, connection: sqlite3.Connection = Depends(get_db)):
    item = serialize_item(get_item_or_404(connection, item_id))
    item["price_history"] = []
    return item


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_item(
    request: Request,
    title: str = Form(...),
    category: str | None = Form(default=None),
    season: Season = Form(...),
    brand: str | None = Form(default=None),
    size: str | None = Form(default=None),
    source_platform: str | None = Form(default=None),
    buy_price: float = Form(...),
    buy_date: date = Form(...),
    notes: str | None = Form(default=None),
    photo: UploadFile | None = File(default=None),
    connection: sqlite3.Connection = Depends(get_db),
):
    photo_url = None
    if photo is not None and photo.filename:
        uploads_dir = PROJECT_ROOT / "data" / "uploads"
        uploads_dir.mkdir(parents=True, exist_ok=True)
        safe_name = f"{uuid.uuid4()}_{photo.filename.replace(' ', '_')}"
        destination = uploads_dir / safe_name
        try:
            with destination.open("wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
        finally:
            await photo.close()
        photo_url = f"{str(request.base_url).rstrip('/')}/uploads/{safe_name}"

    cursor = connection.execute(
        """
        INSERT INTO items (title, photo_url, category, season, brand, size,
                          source_platform, buy_price, buy_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            title,
            photo_url,
            category,
            season,
            brand,
            size,
            source_platform,
            buy_price,
            buy_date.isoformat(),
            notes,
        ),
    )
    connection.commit()
    return serialize_item(get_item_or_404(connection, cursor.lastrowid))


@router.patch("/{item_id}")
def update_item(
    item_id: int,
    item: ItemUpdate,
    connection: sqlite3.Connection = Depends(get_db),
):
    get_item_or_404(connection, item_id)
    updates = item.model_dump(exclude_unset=True)
    if not updates:
        return serialize_item(get_item_or_404(connection, item_id))
    if "buy_date" in updates and updates["buy_date"] is not None:
        updates["buy_date"] = updates["buy_date"].isoformat()

    columns = ", ".join(f"{field} = ?" for field in updates)
    connection.execute(
        f"UPDATE items SET {columns} WHERE id = ?",
        (*updates.values(), item_id),
    )
    connection.commit()
    return serialize_item(get_item_or_404(connection, item_id))


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, connection: sqlite3.Connection = Depends(get_db)):
    get_item_or_404(connection, item_id)
    connection.execute("DELETE FROM items WHERE id = ?", (item_id,))
    connection.commit()


@router.post("/{item_id}/list")
def mark_item_listed(
    item_id: int,
    request: ItemListRequest,
    connection: sqlite3.Connection = Depends(get_db),
):
    item = get_item_or_404(connection, item_id)
    if item["status"] == "sold":
        raise HTTPException(status_code=400, detail="A sold item cannot be listed")
    listed_date = request.listed_date or date.today()
    connection.execute(
        """
        UPDATE items
        SET status = 'listed', listing_price = ?, listing_url = ?, listed_date = ?
        WHERE id = ?
        """,
        (request.listing_price, request.listing_url, listed_date.isoformat(), item_id),
    )
    connection.execute(
        "INSERT INTO price_history (item_id, price, changed_at) VALUES (?, ?, datetime('now'))",
        (item_id, request.listing_price),
    )
    connection.commit()
    return serialize_item(get_item_or_404(connection, item_id))


@router.post("/{item_id}/sell")
def mark_item_sold(
    item_id: int,
    request: ItemSellRequest,
    connection: sqlite3.Connection = Depends(get_db),
):
    item = get_item_or_404(connection, item_id)
    if item["status"] == "sold":
        raise HTTPException(status_code=400, detail="Item is already sold")
    sold_date = request.sold_date or date.today()
    profit = request.sale_price - item["buy_price"]
    margin_pct = (profit / request.sale_price * 100) if request.sale_price else None
    roi_pct = (profit / item["buy_price"] * 100) if item["buy_price"] else None
    connection.execute(
        """
        UPDATE items
        SET status = 'sold', sale_price = ?, sold_date = ?, profit = ?,
            margin_pct = ?, roi_pct = ?
        WHERE id = ?
        """,
        (
            request.sale_price,
            sold_date.isoformat(),
            profit,
            margin_pct,
            roi_pct,
            item_id,
        ),
    )
    connection.commit()
    return serialize_item(get_item_or_404(connection, item_id))