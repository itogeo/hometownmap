import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// Map layer IDs to their file names in the gallatin-county folder
const gallatinLayerMap: { [key: string]: string } = {
  'fema_flood': 'fema_flood_zones',
  'landslides': 'landslides',
  'wui': 'wildland_urban_interface',
  'conservation': 'conservation_easements',
  'soils': 'soils_nrcs',
  'groundwater_wells': 'groundwater_monitor_wells',
  'wastewater': 'wastewater_treatment_systems',
  'water_supply': 'water_supply_systems',
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { city, layer } = req.query

  if (!city || typeof city !== 'string' || !layer || typeof layer !== 'string') {
    return res.status(400).json({ error: 'City and layer parameters required' })
  }

  const baseDir = path.join(process.cwd(), '../../datasets/cities', city)

  // Paths to check in order of priority
  const pathsToTry = [
    // 1. Processed folder (city-specific data)
    path.join(baseDir, 'processed', `${layer}.geojson`),
    // 2. Gallatin county raw data (mapped name)
    gallatinLayerMap[layer]
      ? path.join(baseDir, 'raw/gallatin-county', `${gallatinLayerMap[layer]}.geojson`)
      : null,
    // 3. Gallatin county raw data (exact name)
    path.join(baseDir, 'raw/gallatin-county', `${layer}.geojson`),
  ].filter(Boolean) as string[]

  try {
    for (const dataPath of pathsToTry) {
      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf-8')
        return res.status(200).json(JSON.parse(data))
      }
    }

    console.log(`Layer not found: ${layer}. Tried:`, pathsToTry)
    return res.status(404).json({ error: 'Layer data not found' })
  } catch (error) {
    console.error('Failed to load layer data:', error)
    res.status(500).json({ error: 'Failed to load layer data' })
  }
}
