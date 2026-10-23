from pathlib import Path
from PIL import Image, ImageOps
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'optimized'
OUT.mkdir(parents=True, exist_ok=True)
inputs = list((ROOT / 'public' / 'catalog' / 'images').glob('*'))
inputs += list((ROOT / 'public' / 'media').glob('*'))
inputs += [ROOT / 'src' / 'assets' / name for name in [
    'hero-milk.jpg', 'hero-icecream2.jpg', 'hero-juice2.jpg', 'farm.jpg',
    'kdd-hero-dairy.jpg',
]]
manifest = {}
original_total = 0
card_total = 0
for index, source in enumerate(inputs):
    if not source.is_file():
        continue
    relative = source.relative_to(ROOT).as_posix()
    public_url = '/' + relative.removeprefix('public/')
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image = image.convert('RGBA' if image.mode in ('RGBA', 'LA') else 'RGB')
        original_width, original_height = image.size
        name = hashlib.sha256(source.read_bytes()).hexdigest()[:16]
        variants = []
        widths = sorted({min(width, original_width) for width in [320, 640, 1280, 1600]})
        for width in widths:
            height = max(1, round(original_height * width / original_width))
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            output = OUT / f'{name}-{width}.webp'
            resized.save(output, 'WEBP', quality=90, method=5)
            variants.append({'src': '/optimized/' + output.name, 'width': width, 'height': height, 'bytes': output.stat().st_size})
        manifest[public_url] = {'width': original_width, 'height': original_height, 'variants': variants}
        original_total += source.stat().st_size
        card_total += min(variants, key=lambda item: abs(item['width'] - 640))['bytes']
    if (index + 1) % 25 == 0:
        print(f'Optimized {index + 1}/{len(inputs)} images', flush=True)
(ROOT / 'src' / 'data' / 'image-variants.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + '\n')
print(json.dumps({'images': len(manifest), 'original_bytes': original_total, '640px_bytes': card_total, 'reduction_percent': round((1 - card_total / original_total) * 100, 1)}, ensure_ascii=False), flush=True)
