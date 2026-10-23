import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const src = path.join(root, 'server');
const out = path.join(root, 'dist');

await mkdir(out, { recursive: true });

for (const item of ['index.js', 'admin', 'public']) {
  const s = path.join(src, item);
  if (existsSync(s)) {
    await cp(s, path.join(out, item), { recursive: true });
    console.log('build-server: copied ' + item);
  }
}

// ثبّت مكتبات السيرفر جوّا مجلد السيرفر ثم انسخها بجانب الكود المبني
try {
  execSync('npm install --prefix server --omit=dev --no-audit --no-fund', { stdio: 'inherit' });
  console.log('build-server: server deps installed');
} catch (e) {
  console.warn('build-server: server deps install failed -> ' + (e && e.message));
}

const srvNm = path.join(src, 'node_modules');
if (existsSync(srvNm)) {
  await cp(srvNm, path.join(out, 'node_modules'), { recursive: true, dereference: true });
  console.log('build-server: node_modules -> dist');
}

await cp(path.join(src, 'package.json'), path.join(out, 'package.json'));

if (!existsSync(path.join(out, 'index.js'))) {
  console.error('build-server: FAILED - dist/index.js missing');
  process.exit(1);
}
console.log('build-server: dist/ جاهز');
