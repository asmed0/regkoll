import { promises as fs } from 'fs'
import path from 'path'

let plates = null

async function loadPlates() {
  if (plates) return plates
  const filePath = path.join(process.cwd(), 'data', 'police-plates.txt')
  const data = await fs.readFile(filePath, 'utf8')
  plates = new Set(
    data
      .split(/\r?\n/)
      .map((line) => line.trim().toUpperCase())
      .filter(Boolean)
  )
  return plates
}

export default async function handler(req, res) {
  const set = await loadPlates()
  const plate = String(req.query.plate || '').toUpperCase()
  res.status(200).json({ owned: set.has(plate) })
}

