import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { city } = req.query

  if (!city || typeof city !== 'string') {
    return res.status(400).json({ error: 'City parameter required' })
  }

  try {
    // Load city configuration
    const configPath = path.join(
      process.cwd(),
      '../../config/cities',
      `${city}.json`
    )

    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: 'City configuration not found' })
    }

    const configData = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configData)

    res.status(200).json(config)
  } catch (error) {
    console.error('Failed to load city config:', error)
    res.status(500).json({ error: 'Failed to load configuration' })
  }
}
