#!/usr/bin/env python3
"""Match approved product data to the public reference store DOM.

Reads only catalog cards, category links, and home product-section ordering.
Never reads customer/order/payment records or credentials.
"""
from __future__ import annotations
import argparse
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urlparse
from bs4 import BeautifulSoup


def read_cards(soup):
    output = []
    for card in soup.select('div.group.relative.bg-card'):
        link = card.find('a', href=re.compile(r'^/product/'))
        heading = card.find('h3')
        price = card.select_one('span.font-extrabold.text-primary.text-base.tabular-nums')
        previous = card.select_one('span.line-through')
        badge = next((span for span in card.select('span.tabular-nums') if '%' in span.get_text()), None)
        if not link or not heading or not price or not previous:
            raise RuntimeError('Reference product card is incomplete')
        image = link.find('img')
        output.append({
            'id': link['href'].split('/')[-1],
            'name_ar': heading.get_text(' ', strip=True),
            'priceText': price.get_text(strip=True),
            'oldPriceText': previous.get_text(strip=True),
            'discountText': badge.get_text(strip=True) if badge else '',
            'image_url': image.get('src') if image else None,
        })
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--products-html', type=Path, required=True)
    parser.add_argument('--home-html', type=Path, required=True)
    parser.add_argument('--project', type=Path, required=True)
    parser.add_argument('--approved-export', type=Path, required=True)
    args = parser.parse_args()
    products_doc = BeautifulSoup(args.products_html.read_text(), 'html.parser')
    home_doc = BeautifulSoup(args.home_html.read_text(), 'html.parser')
    reference_products = read_cards(products_doc)
    if len(reference_products) != 159 or len({row['id'] for row in reference_products}) != 159:
        raise RuntimeError('Expected all 159 unique reference products')
    data = args.project / 'client/src/kdd/data'
    catalog = json.loads((data / 'catalog.json').read_text())
    catalog_by_id = {row['id']: row for row in catalog['products']}
    original = json.loads(args.approved_export.read_text())
    original_by_id = {row['id']: row for row in original['products']}
    if set(catalog_by_id) != {row['id'] for row in reference_products}:
        raise RuntimeError('Catalog product identity mismatch')
    values = []
    for row in reference_products:
        source = original_by_id[row['id']]
        if float(row['oldPriceText']) != float(source['price']):
            raise RuntimeError('Reference previous price differs from approved source')
        if row['discountText'] != '-50%':
            raise RuntimeError('Reference discount is not uniformly 50 percent')
        values.append(float((Decimal(row['oldPriceText']) * Decimal('0.5')).quantize(Decimal('0.001'), rounding=ROUND_HALF_UP)))
    # Match the actual reference's three-decimal per-product discounted price.
    expected = json.loads(subprocess.check_output(['node', '-e',
        'const fs=require("fs");const x=JSON.parse(fs.readFileSync(0,"utf8"));console.log(JSON.stringify(x.map(v=>v.toFixed(3))));'],
        input=json.dumps(values), text=True))
    mismatches = [(row['id'], row['priceText'], text) for row,text in zip(reference_products,expected) if row['priceText'] != text]
    if mismatches:
        raise RuntimeError(f'Reference price rounding mismatch: {mismatches[:3]}')
    products = []
    for row,price in zip(reference_products,values):
        product = dict(catalog_by_id[row['id']])
        product['price'] = price
        product['old_price'] = float(original_by_id[row['id']]['price'])
        product['name_ar'] = row['name_ar']
        original_image = original_by_id[row['id']]['image_url']
        if row['image_url'] != original_image:
            raise RuntimeError('Reference product image changed; mirror before publishing')
        products.append(product)
    catalog['products'] = products

    home_sections = {}
    for card in home_doc.select('div.group.relative.bg-card'):
        link = card.find('a', href=re.compile(r'^/product/'))
        heading = card.find_previous('h2')
        if link and heading:
            home_sections.setdefault(heading.get_text(' ',strip=True),[]).append(link['href'].split('/')[-1])
    if len(home_sections) != 6 or any(len(ids) != 12 for ids in home_sections.values()):
        raise RuntimeError('Reference home sections are incomplete')
    family_order = ['kdd-dairy','kdd-juices','kdd-icecream','kdd-cooking']
    category_links = []
    seen = set()
    for link in home_doc.select('header nav a'):
        href = link.get('href','')
        if href.startswith('/category/') and href not in seen:
            seen.add(href)
            category_links.append({'slug':href.split('/')[-1], 'name_ar':link.get_text(' ',strip=True)})
    category_rank = {row['slug']: index for index,row in enumerate(category_links)}
    def reorder(nodes):
        nodes.sort(key=lambda node: category_rank.get(node['slug'],10000))
        for index,node in enumerate(nodes):
            node['sort_order']=index
            reorder(node['children'])
    reorder(catalog['categories'])
    previews = {}
    for link in home_doc.select('a[href^="/category/"]'):
        image = link.find('img')
        if not image or not image.get('src', '').startswith('https://eshop.kddc.com/'):
            continue
        url = image['src']
        name = hashlib.sha256(url.encode()).hexdigest()[:24] + Path(urlparse(url).path).suffix
        if not (args.project / 'client/kdd-public/catalog/images' / name).exists():
            raise RuntimeError('Reference category thumbnail must be mirrored first')
        previews[link['href'].rsplit('/', 1)[-1]] = '/catalog/images/' + name
    layout = {
        'referenceUrl':'https://kddproducts.lovable.app/',
        'discountPercent':50,
        'headerTabs':[{'label':'الرئيسية','href':'/'},{'label':'منتجات كي دي دي','href':'/category/section-kdd'},{'label':'كل المنتجات','href':'/products'}],
        'familyOrder':family_order,
        'categoryLinks':category_links,
        'homeProductSections':home_sections,
        'allProductOrder':[row['id'] for row in reference_products],
        'categoryPreviewImages':previews,
    }
    (data / 'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
    (data / 'reference-layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n')
    (data / 'reference-prices.json').write_text(json.dumps(reference_products,ensure_ascii=False,indent=2)+'\n')
    info = json.loads((data / 'catalog-info.json').read_text())
    info.update({'referenceUrl':layout['referenceUrl'],'discountPercent':50,'priceMatchCount':len(products),'homeSectionCount':len(home_sections)})
    (data / 'catalog-info.json').write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n')
    print(f'Matched {len(products)} products, original images, all current/previous prices and 50% discounts.')
    print(f'Matched {len(category_links)} category links and {len(home_sections)} home product sections.')


if __name__ == '__main__':
    main()
