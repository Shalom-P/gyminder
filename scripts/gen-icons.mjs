import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url))

const targets = [
  ['../public/pwa-192.png', 192],
  ['../public/pwa-512.png', 512],
  ['../public/pwa-512-maskable.png', 512],
  ['../public/apple-touch-icon.png', 180]
]

for (const [rel, size] of targets) {
  const out = fileURLToPath(new URL(rel, import.meta.url))
  await sharp(svg).resize(size, size).png().toFile(out)
  console.log('wrote', rel, `${size}x${size}`)
}
