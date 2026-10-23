#!/usr/bin/env python3
"""Read-only export of the explicitly approved public product catalog.

Never reads customer, order, payment, visitor, user, or authentication tables.
Connection values are taken from the approved historic catalog client, not logged.
"""
from __future__ import annotations
import argparse
import json
import os
import re
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

TABLES = {
    "products": "id,name_ar,name_en,description_ar,description_en,price,old_price,image_url,category_id,weight,origin,in_stock,featured",
    "categories": "id,slug,name_ar,name_en,parent_id,sort_order,image_url,icon",
    "product_images": "id,product_id,image_url,sort_order",
}


def connection(config: Path):
    source = config.read_text()
    url = re.search(r'const\s+DEFAULT_SUPABASE_URL\s*=\s*[\"\']([^\"\']+)', source)
    key = re.search(r'const\s+DEFAULT_SUPABASE_PUBLISHABLE_KEY\s*=\s*[\"\']([^\"\']+)', source)
    if not url or not key:
        raise RuntimeError("Approved catalog connection was not found")
    return url.group(1).rstrip("/"), key.group(1)


def read_table(base: str, key: str, table: str):
    if table not in TABLES:
        raise ValueError("Table not allowed")
    result = []
    page_size = 500
    offset = 0
    while True:
        params = {"select": TABLES[table], "order": "id.asc", "limit": page_size, "offset": offset}
        request = Request(base + "/rest/v1/" + table + "?" + urlencode(params), headers={
            "apikey": key, "Authorization": "Bearer " + key,
            "Accept": "application/json", "Prefer": "count=exact",
        })
        try:
            with urlopen(request, timeout=40) as response:
                rows = json.load(response)
        except HTTPError as error:
            # Do not log key, URL parameters, or response bodies.
            raise RuntimeError(f"Catalog table {table}: HTTP {error.code}") from None
        if not isinstance(rows, list):
            raise RuntimeError("Invalid catalog response")
        result.extend(rows)
        print(f"{table}: {len(result)} rows", flush=True)
        if len(rows) < page_size:
            return result
        offset += page_size
        if offset > 100000:
            raise RuntimeError("Catalog safety limit exceeded")
        time.sleep(0.1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    base, key = connection(args.config)
    raw = {table: read_table(base, key, table) for table in TABLES}
    raw["exportedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(raw, ensure_ascii=False, indent=2) + "\n")
    os.chmod(args.output, 0o600)
    print("Approved catalog export saved. No customer or order data was queried.", flush=True)


if __name__ == "__main__":
    main()
