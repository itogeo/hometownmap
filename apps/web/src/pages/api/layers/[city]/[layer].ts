import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { city, layer } = req.query

  if (!city || typeof city !== 'string' || !layer || typeof layer !== 'string') {
    return res.status(400).json({ error: 'City and layer parameters required' })
  }

  try {
    // Try to load processed layer data
    const dataPath = path.join(
      process.cwd(),
      '../../datasets/cities',
      city,
      'processed',
      `${layer}.geojson`
    )

    if (!fs.existsSync(dataPath)) {
      // If city-specific doesn't exist, try county-level
      const countyDataPath = path.join(
        process.cwd(),
        '../../datasets/gallatin/processed',
        `${layer}.geojson`
      )

      if (!fs.existsSync(countyDataPath)) {
        return res.status(404).json({ error: 'Layer data not found' })
      }

      const data = fs.readFileSync(countyDataPath, 'utf-8')
      return res.status(200).json(JSON.parse(data))
    }

    const data = fs.readFileSync(dataPath, 'utf-8')
    res.status(200).json(JSON.parse(data))
  } catch (error) {
    console.error('Failed to load layer data:', error)
    res.status(500).json({ error: 'Failed to load layer data' })
  }
}
