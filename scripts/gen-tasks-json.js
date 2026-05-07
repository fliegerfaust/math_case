import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const tasksDir = path.join(__dirname, '..', 'public', 'tasks')
const jsonPath = path.join(tasksDir, 'tasks.json')

const RARITIES = ['common', 'rare', 'epic']

function randomRarity() {
  const weights = [60, 30, 10] // common 60%, rare 30%, epic 10%
  const roll = Math.random() * 100
  let acc = 0
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]
    if (roll < acc) return RARITIES[i]
  }
  return 'common'
}

async function main() {
  const pngFiles = fs
    .readdirSync(tasksDir)
    .filter(f => f.toLowerCase().endsWith('.png'))
    .sort()

  if (!pngFiles.length) {
    console.log('gen-tasks-json: no PNG files found, tasks.json unchanged')
    return
  }

  let existing = []
  try {
    existing = JSON.parse(await fsp.readFile(jsonPath, 'utf8'))
  } catch {
    // tasks.json missing or invalid — start fresh
  }

  const byImage = Object.fromEntries(existing.map(t => [t.image, t]))

  // Assign stable numeric IDs based on sorted order
  const tasks = pngFiles.map((filename, i) => {
    const image = `tasks/${filename}`
    const prev = byImage[image]
    return {
      id: i + 1,
      rarity: prev?.rarity ?? randomRarity(),
      image,
      message: prev?.message ?? '',
    }
  })

  await fsp.writeFile(jsonPath, JSON.stringify(tasks, null, 2) + '\n', 'utf8')

  const added   = tasks.filter(t => !byImage[t.image]).length
  const removed = existing.filter(t => !tasks.find(n => n.image === t.image)).length
  console.log(
    `gen-tasks-json: ${tasks.length} task(s) written` +
    (added   ? `, +${added} new`     : '') +
    (removed ? `, -${removed} removed` : '') +
    '.'
  )
}

main().catch(err => {
  console.error('gen-tasks-json failed:', err)
  process.exit(1)
})
