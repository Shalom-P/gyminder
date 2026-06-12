import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url))

// Every raster export is flattened to full-bleed ink: the SVG's rounded
// corners are transparent, and iOS/Android mask icons themselves — baked
// transparent corners would render as black on a home screen. The iOS App
// Store icon additionally forbids an alpha channel entirely.
const INK = '#0b0b0c'

const targets = [
  ['../public/pwa-192.png', 192],
  ['../public/pwa-512.png', 512],
  ['../public/pwa-512-maskable.png', 512],
  ['../public/apple-touch-icon.png', 180],
  // native iOS app icon (asset catalog, referenced by Contents.json)
  ['../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024]
]

for (const [rel, size] of targets) {
  const out = fileURLToPath(new URL(rel, import.meta.url))
  // density scales the SVG rasterisation so sizes above the 512px viewBox
  // (the 1024 iOS icon) render from vectors instead of upscaling pixels.
  await sharp(svg, { density: (72 * size) / 512 })
    .resize(size, size)
    .flatten({ background: INK })
    .removeAlpha()
    .png()
    .toFile(out)
  console.log('wrote', rel, `${size}x${size}`)
}
