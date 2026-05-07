import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from 'webdav'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env from project root (simple parser, no extra deps)
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
}

const BASE_URL = process.env.YADISK_WEBDAV_URL || 'https://webdav.yandex.ru'
const TOKEN = process.env.YADISK_TOKEN
const REMOTE_DIR = process.env.YADISK_TASKS_DIR
const PUBLIC_URL = process.env.YADISK_PUBLIC_URL
const PUBLIC_PATH = process.env.YADISK_PUBLIC_PATH || '/'

const tasksDir = path.join(__dirname, '..', 'public', 'tasks')

function die(msg) {
  console.error(`yadisk-pull-tasks: ${msg}`)
  process.exit(1)
}

function isHttpUrl(v) {
  return typeof v === 'string' && /^https?:\/\//i.test(v)
}

function normalizeRemoteDir(p) {
  if (!p) return null
  if (!p.startsWith('/')) return `/${p}`
  return p
}

async function fileSizeOrNull(filePath) {
  try {
    const st = await fsp.stat(filePath)
    return st.isFile() ? st.size : null
  } catch {
    return null
  }
}

function parsePublicKeyFromUrl(url) {
  // Yandex Disk API expects the full public URL as public_key
  return String(url).split('?')[0].split('#')[0]
}

async function yadiskPublicList(publicKey, publicPath) {
  const u = new URL('https://cloud-api.yandex.net/v1/disk/public/resources')
  u.searchParams.set('public_key', publicKey)
  u.searchParams.set('path', publicPath)
  u.searchParams.set('limit', '9999')

  const res = await fetch(u, { method: 'GET' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`public list failed: ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`)
  }
  return res.json()
}

async function yadiskPublicGetDownloadUrl(publicKey, filePath) {
  const u = new URL('https://cloud-api.yandex.net/v1/disk/public/resources/download')
  u.searchParams.set('public_key', publicKey)
  u.searchParams.set('path', filePath)

  const res = await fetch(u, { method: 'GET' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`public download meta failed: ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`)
  }
  const data = await res.json()
  if (!data?.href) throw new Error('public download meta missing href')
  return data.href
}

async function downloadToFile(url, filePath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText}`)
  const ab = await res.arrayBuffer()
  await fsp.writeFile(filePath, Buffer.from(ab))
}

async function pullFromPublicLink() {
  if (!PUBLIC_URL) die('missing env YADISK_PUBLIC_URL (public share link)')
  if (!isHttpUrl(PUBLIC_URL)) die('YADISK_PUBLIC_URL must be a valid http(s) URL')

  const publicKey = parsePublicKeyFromUrl(PUBLIC_URL)
  if (!publicKey) die('failed to parse public key from YADISK_PUBLIC_URL (expected ...yandex.ru/d/<key>)')

  await fsp.mkdir(tasksDir, { recursive: true })

  let listing
  try {
    listing = await yadiskPublicList(publicKey, PUBLIC_PATH)
  } catch (err) {
    die(`failed to list public resource: ${err?.message || String(err)}`)
  }

  const items = listing?._embedded?.items
  if (!Array.isArray(items)) {
    die('public resource is not a directory (or missing _embedded.items)')
  }

  const pngs = items
    .filter(i => i?.type === 'file')
    .filter(i => typeof i?.name === 'string' && i.name.toLowerCase().endsWith('.png'))

  if (!pngs.length) {
    console.log(`yadisk-pull-tasks: no PNG files found in public resource path ${PUBLIC_PATH}`)
    return
  }

  console.log(`yadisk-pull-tasks: found ${pngs.length} PNG file(s) via public link`)

  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const item of pngs) {
    const localName = item.name
    const localPath = path.join(tasksDir, localName)
    const remoteSize = typeof item.size === 'number' ? item.size : null
    const localSize = await fileSizeOrNull(localPath)

    if (remoteSize != null && localSize === remoteSize) {
      console.log(`  skip  ${localName} (same size ${remoteSize}b)`)
      skipped++
      continue
    }

    try {
      const href = await yadiskPublicGetDownloadUrl(publicKey, item.path)
      await downloadToFile(href, localPath)
      console.log(`  pull  ${localName}${remoteSize != null ? ` (${remoteSize}b)` : ''}`)
      downloaded++
    } catch (err) {
      console.log(`  fail  ${localName}: ${err?.message || String(err)}`)
      failed++
    }
  }

  console.log(
    `yadisk-pull-tasks: done. pulled=${downloaded}, skipped=${skipped}, failed=${failed}`,
  )
  if (failed > 0) process.exit(1)
}

async function main() {
  if (PUBLIC_URL) {
    await pullFromPublicLink()
    return
  }

  if (!TOKEN) die('missing env YADISK_TOKEN')
  const remoteDir = normalizeRemoteDir(REMOTE_DIR)
  if (!remoteDir) die('missing env YADISK_TASKS_DIR (remote folder path on Yandex.Disk)')

  await fsp.mkdir(tasksDir, { recursive: true })

  const client = createClient(BASE_URL, { username: 'oauth', password: TOKEN })

  let entries
  try {
    entries = await client.getDirectoryContents(remoteDir, { details: true })
  } catch (err) {
    die(`failed to list remote dir "${remoteDir}": ${err?.message || String(err)}`)
  }

  const pngs = entries
    .filter(e => e.type === 'file')
    .filter(e => typeof e.basename === 'string' && e.basename.toLowerCase().endsWith('.png'))

  if (!pngs.length) {
    console.log(`yadisk-pull-tasks: no PNG files found in ${remoteDir}`)
    return
  }

  console.log(`yadisk-pull-tasks: found ${pngs.length} PNG file(s) in ${remoteDir}`)

  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const entry of pngs) {
    const remotePath = entry.filename
    const localName = entry.basename
    const localPath = path.join(tasksDir, localName)

    const remoteSize = typeof entry.size === 'number' ? entry.size : null
    const localSize = await fileSizeOrNull(localPath)

    if (remoteSize != null && localSize === remoteSize) {
      console.log(`  skip  ${localName} (same size ${remoteSize}b)`)
      skipped++
      continue
    }

    try {
      const buf = await client.getFileContents(remotePath, { format: 'buffer' })
      await fsp.writeFile(localPath, buf)
      console.log(`  pull  ${localName}${remoteSize != null ? ` (${remoteSize}b)` : ''}`)
      downloaded++
    } catch (err) {
      console.log(`  fail  ${localName}: ${err?.message || String(err)}`)
      failed++
    }
  }

  console.log(
    `yadisk-pull-tasks: done. pulled=${downloaded}, skipped=${skipped}, failed=${failed}`,
  )

  if (failed > 0) process.exit(1)
}

main().catch(err => {
  console.error('yadisk-pull-tasks failed:', err)
  process.exit(1)
})

