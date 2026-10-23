#!/usr/bin/env python3
"""Prepare the approved product/category snapshot and mirror only its images."""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import ipaddress
import json
from pathlib import Path
import socket
import time
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif", "image/svg+xml": ".svg"}
MAX_BYTES = 20 * 1024 * 1024


def mirror(url: str, target: Path):
    parsed = urlsplit(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password:
        return url, None, "invalid-url"
    try:
        addresses = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
        if any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
            return url, None, "non-public-host"
        key = hashlib.sha256(url.encode()).hexdigest()[:24]
        for attempt in range(3):
            try:
                req = Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "image/*"})
                with urlopen(req, timeout=35) as response:
                    kind = response.headers.get_content_type()
                    extension = IMAGE_TYPES.get(kind)
                    if not extension:
                        return url, None, "not-image"
                    data = response.read(MAX_BYTES + 1)
                if not data or len(data) > MAX_BYTES:
                    return url, None, "image-size-invalid"
                name = key + extension
                (target / name).write_bytes(data)
                return url, "/catalog/images/" + name, None
            except Exception:
                if attempt == 2:
                    return url, None, "download-failed"
                time.sleep(0.5 * (attempt + 1))
    except Exception:
        return url, None, "host-unavailable"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--project", type=Path, required=True)
    args = parser.parse_args()
    raw = json.loads(args.input.read_text())
    image_directory = args.project / "client/kdd-public/catalog/images"
    data_directory = args.project / "client/src/kdd/data"
    image_directory.mkdir(parents=True, exist_ok=True)
    data_directory.mkdir(parents=True, exist_ok=True)
    urls = sorted({row["image_url"] for group in ("products", "categories", "product_images") for row in raw[group] if row.get("image_url")})
    mirrored, failures = {}, []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(mirror, url, image_directory) for url in urls]
        for number, future in enumerate(as_completed(futures), start=1):
            original, local, error = future.result()
            if local:
                mirrored[original] = local
            else:
                failures.append({"imageId": hashlib.sha256(original.encode()).hexdigest()[:24], "reason": error})
            if number % 15 == 0 or number == len(urls):
                print(f"Catalog images: {number}/{len(urls)} processed, {len(mirrored)} saved", flush=True)

    nodes = {}
    for row in raw["categories"]:
        node = dict(row)
        node["sort_order"] = int(node.get("sort_order") or 0)
        node["children"] = []
        node["image_url"] = mirrored.get(node.get("image_url"))
        nodes[node["id"]] = node
    roots = []
    for node in nodes.values():
        parent = nodes.get(node.get("parent_id"))
        (parent["children"] if parent else roots).append(node)
    seen = set()
    def sort_tree(tree, ancestors=()):
        tree.sort(key=lambda node: (node["sort_order"], node["slug"]))
        for node in tree:
            if node["id"] in ancestors:
                raise RuntimeError("Category cycle")
            seen.add(node["id"])
            sort_tree(node["children"], ancestors + (node["id"],))
    sort_tree(roots)
    if len(seen) != len(nodes):
        raise RuntimeError("Unreachable category nodes")

    products = []
    for row in raw["products"]:
        item = dict(row)
        item["price"] = float(item["price"])
        item["old_price"] = float(item["old_price"]) if item.get("old_price") is not None else None
        item["image_url"] = mirrored.get(item["image_url"])
        category = nodes.get(item.get("category_id"))
        item["category"] = {key: category[key] for key in ("slug", "name_ar", "name_en")} if category else None
        products.append(item)
    gallery = []
    for row in raw["product_images"]:
        if local := mirrored.get(row.get("image_url")):
            gallery.append({**row, "image_url": local})
    (data_directory / "catalog.json").write_text(json.dumps({"products": products, "categories": roots}, ensure_ascii=False, indent=2) + "\n")
    (data_directory / "product-images.json").write_text(json.dumps(gallery, ensure_ascii=False, indent=2) + "\n")
    summary = {"exportedAt": raw["exportedAt"], "productCount": len(products), "categoryCount": len(nodes), "galleryRowCount": len(gallery), "uniqueImagesSaved": len(mirrored), "imageFailures": failures, "source": "Approved original public product catalog", "tablesRead": ["products", "categories", "product_images"]}
    (data_directory / "catalog-info.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    print(f"Snapshot ready: {len(products)} products, {len(nodes)} categories, {len(gallery)} gallery rows; image failures: {len(failures)}", flush=True)


if __name__ == "__main__":
    main()
