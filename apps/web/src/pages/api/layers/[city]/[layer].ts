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

// Map layer IDs to their file names in the processed folder
// Both floodplain layers use the same source data (filtered server-side for performance)
const processedLayerMap: { [key: string]: string } = {
  'floodplain_100yr': 'flood_zones',
  'floodplain_500yr': 'flood_zones',
}

// Server-side filters for floodplain layers (much faster than client-side filtering)
const floodplainFilters: { [key: string]: string[] } = {
  'floodplain_100yr': ['A', 'AE', 'AH', 'AO'],  // 100-year flood zones
  'floodplain_500yr': ['X'],                     // 500-year flood zones (minimal risk)
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { city, layer } = req.query

  if (!city || typeof city !== 'string' || !layer || typeof layer !== 'string') {
    return res.status(400).json({ error: 'City and layer parameters required' })
  }

  const baseDir = path.join(process.cwd(), '../../datasets/cities', city)

  // Paths to check in order of priority
  const pathsToTry = [
    // 1. Processed folder (mapped name - for layers like floodplain_100yr -> flood_zones)
    processedLayerMap[layer]
      ? path.join(baseDir, 'processed', `${processedLayerMap[layer]}.geojson`)
      : null,
    // 2. Processed folder (exact name)
    path.join(baseDir, 'processed', `${layer}.geojson`),
    // 3. Gallatin county raw data (mapped name)
    gallatinLayerMap[layer]
      ? path.join(baseDir, 'raw/gallatin-county', `${gallatinLayerMap[layer]}.geojson`)
      : null,
    // 4. Gallatin county raw data (exact name)
    path.join(baseDir, 'raw/gallatin-county', `${layer}.geojson`),
  ].filter(Boolean) as string[]

  try {
    for (const dataPath of pathsToTry) {
      if (fs.existsSync(dataPath)) {
        const rawData = fs.readFileSync(dataPath, 'utf-8')
        let geojson = JSON.parse(rawData)

        // Apply server-side filtering for floodplain layers
        // This dramatically reduces data sent to client (from 6700+ to ~1200 or ~5500 features)
        if (floodplainFilters[layer] && geojson.features) {
          const allowedZones = floodplainFilters[layer]
          geojson = {
            ...geojson,
            features: geojson.features.filter((f: any) =>
              allowedZones.includes(f.properties?.FLD_ZONE)
            )
          }
        }

        // Set cache headers for better performance
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
        return res.status(200).json(geojson)
      }
    }

    console.log(`Layer not found: ${layer}. Tried:`, pathsToTry)
    return res.status(404).json({ error: 'Layer data not found' })
  } catch (error) {
    console.error('Failed to load layer data:', error)
    res.status(500).json({ error: 'Failed to load layer data' })
  }
}
