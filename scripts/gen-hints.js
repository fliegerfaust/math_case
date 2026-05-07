/**
 * gen-hints.js
 *
 * Generates motivational hints for tasks that have an empty `message` field.
 * Uses the Cursor AI API (available in Cursor IDE) or falls back to OpenAI if
 * OPENAI_API_KEY is set. If neither is available, skips generation and reminds
 * the user to fill hints manually or run `pnpm run tasks:gen-hints` inside Cursor.
 */

import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

// Load .env
const envPath = path.join(projectRoot, '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
}

const tasksDir  = path.join(projectRoot, 'public', 'tasks')
const jsonPath  = path.join(tasksDir, 'tasks.json')
const OPENAI_KEY = process.env.OPENAI_API_KEY

const SYSTEM_PROMPT = `Ты — помощник преподавателя математики ЕГЭ.
Твоя задача — написать короткую (2-3 предложения) мотивирующую подсказку для ученика к задаче на изображении.

СТРОГИЕ ПРАВИЛА:
- НЕ решай задачу и не показывай шаги решения
- НЕ называй конкретные формулы с подставленными числами
- НЕ говори, что именно нужно сделать по шагам
- Только намекни, какую ИДЕЮ или ПОНЯТИЕ стоит вспомнить
- Тон: поддерживающий, дружелюбный, уверенный
- Язык: русский
- Длина: строго 2-3 предложения
- Никаких вступлений вроде "Конечно!" или "Вот подсказка:"
Верни только текст подсказки, без кавычек.`

async function generateHintOpenAI(imagePath) {
  const imageData = await fsp.readFile(imagePath)
  const base64    = imageData.toString('base64')
  const ext       = path.extname(imagePath).slice(1).toLowerCase()
  const mimeType  = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`

  const body = {
    model: 'gpt-4o',
    max_tokens: 200,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: 'text', text: 'Напиши подсказку к этому заданию.' },
        ],
      },
    ],
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

async function main() {
  let tasks
  try {
    tasks = JSON.parse(await fsp.readFile(jsonPath, 'utf8'))
  } catch {
    console.log('gen-hints: tasks.json not found, skipping')
    return
  }

  const needHints = tasks.filter(t => !t.message)
  if (!needHints.length) {
    console.log('gen-hints: all tasks already have hints, nothing to do')
    return
  }

  if (!OPENAI_KEY) {
    console.log(`gen-hints: ${needHints.length} task(s) need hints but OPENAI_API_KEY is not set.`)
    console.log('gen-hints: set OPENAI_API_KEY in .env and re-run `pnpm run tasks:sync` to auto-generate hints.')
    console.log('gen-hints: tasks without hints:')
    for (const t of needHints) console.log(`  - ${t.image}`)
    return
  }

  console.log(`gen-hints: generating hints for ${needHints.length} task(s) via OpenAI…`)

  let ok = 0
  let fail = 0

  for (const task of needHints) {
    const imagePath = path.join(projectRoot, 'public', task.image)
    if (!fs.existsSync(imagePath)) {
      console.log(`  skip  ${task.image} (file not found)`)
      continue
    }

    try {
      const hint = await generateHintOpenAI(imagePath)
      task.message = hint
      console.log(`  done  ${task.image}`)
      console.log(`        "${hint}"`)
      ok++
    } catch (err) {
      console.log(`  fail  ${task.image}: ${err?.message || String(err)}`)
      fail++
    }
  }

  await fsp.writeFile(jsonPath, JSON.stringify(tasks, null, 2) + '\n', 'utf8')
  console.log(`gen-hints: done. generated=${ok}, failed=${fail}.`)
}

main().catch(err => {
  console.error('gen-hints failed:', err)
  process.exit(1)
})
