import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CANVAS_W = 600
const CANVAS_H = 300
const PADDING = 24
const INNER_W = CANVAS_W - PADDING * 2   // 552
const INNER_H = CANVAS_H - PADDING * 2   // 252
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

const tasksDir = path.join(__dirname, '..', 'public', 'tasks')

async function normalizeImage(filePath) {
  const meta = await sharp(filePath).metadata()

  // Skip if already exactly the target size (idempotent)
  if (meta.width === CANVAS_W && meta.height === CANVAS_H) {
    console.log(`  skip  ${path.basename(filePath)} (already ${CANVAS_W}×${CANVAS_H})`)
    return
  }

  // Step 1: scale to fit inside the inner area, preserving aspect ratio
  const resizedBuffer = await sharp(filePath)
    .resize(INNER_W, INNER_H, {
      fit: 'inside',
      withoutEnlargement: false,
      background: WHITE,
    })
    .flatten({ background: WHITE })
    .png()
    .toBuffer()

  // Step 2: composite centered on a white 600×300 canvas
  await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: WHITE,
    },
  })
    .composite([{ input: resizedBuffer, gravity: 'center' }])
    .flatten({ background: WHITE })
    .png()
    .toFile(filePath)

  console.log(`  norm  ${path.basename(filePath)}  (${meta.width}×${meta.height} → ${CANVAS_W}×${CANVAS_H})`)
}

async function main() {
  const files = fs
    .readdirSync(tasksDir)
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(tasksDir, f))

  if (!files.length) {
    console.log('normalize-tasks: no PNG files found in public/tasks/')
    return
  }

  console.log(`normalize-tasks: processing ${files.length} file(s)…`)
  await Promise.all(files.map(normalizeImage))
  console.log('normalize-tasks: done.')
}

main().catch(err => {
  console.error('normalize-tasks failed:', err)
  process.exit(1)
})
