import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="120" r="220" fill="#ffffff" fill-opacity="0.06"/>
  <circle cx="180" cy="540" r="280" fill="#ffffff" fill-opacity="0.05"/>
  <text x="600" y="240" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="40" font-weight="600" fill="#bfdbfe" letter-spacing="6">MEU IP</text>
  <text x="600" y="340" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="80" font-weight="800" fill="#ffffff">Descubra seu IP</text>
  <text x="600" y="410" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="30" font-weight="500" fill="#dbeafe">IPv4 e IPv6 em tempo real</text>
  <rect x="320" y="475" width="560" height="62" rx="31" fill="#ffffff"/>
  <text x="600" y="516" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="26" font-weight="600" fill="#1d4ed8">meuip.adryanfreitas.dev</text>
  <text x="600" y="585" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="500" fill="#dbeafe" fill-opacity="0.85">Gratuito · Sem login · Sem rastreamento</text>
</svg>`;

const iconSvg = (
  size,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <text x="32" y="42" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="800" fill="#ffffff">IP</text>
</svg>`;

const maskableIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <circle cx="380" cy="80" r="140" fill="#ffffff" fill-opacity="0.05"/>
  <circle cx="100" cy="420" r="180" fill="#ffffff" fill-opacity="0.04"/>
  <text x="256" y="280" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="180" font-weight="800" fill="#ffffff">IP</text>
  <text x="256" y="360" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="44" font-weight="600" fill="#bfdbfe" letter-spacing="4">MEU IP</text>
</svg>`;

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="6" fill="url(#bg)"/>
  <text x="16" y="22" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="800" fill="#ffffff">IP</text>
</svg>`;

const pngTasks = [
  { out: 'public/og-default.png', svg: ogSvg, w: 1200, h: 630 },
  { out: 'public/favicon-192.png', svg: iconSvg(192), w: 192, h: 192 },
  { out: 'public/favicon-512.png', svg: iconSvg(512), w: 512, h: 512 },
  { out: 'public/maskable-icon-512.png', svg: maskableIconSvg, w: 512, h: 512 },
  { out: 'public/apple-touch-icon.png', svg: iconSvg(180), w: 180, h: 180 },
];

for (const t of pngTasks) {
  const buf = await sharp(Buffer.from(t.svg))
    .resize(t.w, t.h)
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(t.out, buf);
  console.log('wrote', t.out, buf.length, 'bytes');
}

writeFileSync('public/favicon.svg', faviconSvg);
console.log('wrote public/favicon.svg', faviconSvg.length, 'bytes');

const icoSizes = [16, 32, 48];
const icoBuffers = await Promise.all(
  icoSizes.map((size) =>
    sharp(Buffer.from(iconSvg(size)))
      .resize(size, size)
      .png()
      .toBuffer(),
  ),
);

const headerSize = 6 + 16 * icoSizes.length;
let offset = headerSize;
const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
icoSizes.forEach((size, i) => {
  const entryOffset = 6 + i * 16;
  header.writeUInt8(size === 256 ? 0 : size, entryOffset);
  header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
  header.writeUInt8(0, entryOffset + 2);
  header.writeUInt8(0, entryOffset + 3);
  header.writeUInt16LE(1, entryOffset + 4);
  header.writeUInt16LE(32, entryOffset + 6);
  header.writeUInt32LE(icoBuffers[i].length, entryOffset + 8);
  header.writeUInt32LE(offset, entryOffset + 12);
  offset += icoBuffers[i].length;
});

const ico = Buffer.concat([header, ...icoBuffers]);
writeFileSync('public/favicon.ico', ico);
console.log('wrote public/favicon.ico', ico.length, 'bytes');
