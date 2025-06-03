import express from 'express'
import fs from 'fs'
import path from 'path'

const app = express()
const plates = new Set()

const filePath = path.join(process.cwd(), 'data', 'police-plates.txt')

try {
  const file = fs.readFileSync(filePath, 'utf8')
  file.split(/\r?\n/).forEach((line) => {
    const plate = line.trim().toUpperCase()
    if (plate) plates.add(plate)
  })
} catch (err) {
  console.error('Failed to load plate file', err)
}

app.get('/api/check', (req, res) => {
  const plate = String(req.query.plate || '').toUpperCase()
  res.json({ owned: plates.has(plate) })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
