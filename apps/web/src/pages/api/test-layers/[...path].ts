import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { path: pathParts } = req.query
  const filePath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts

  // Base datasets directory (relative to apps/web)
  const baseDir = path.join(process.cwd(), '../../datasets/cities/three-forks')

  // Map the request path to actual file locations
  let fullPath: string

  if (filePath?.startsWith('gallatin/')) {
    // New Gallatin County data
    const fileName = filePath.replace('gallatin/', '')
    fullPath = path.join(baseDir, 'raw/gallatin-county', `${fileName}.geojson`)
  } else if (filePath?.startsWith('processed/')) {
    // Processed data
    const fileName = filePath.replace('processed/', '')
    fullPath = path.join(baseDir, 'processed', `${fileName}.geojson`)
  } else if (filePath?.startsWith('boundaries/')) {
    // Boundary data
    const fileName = filePath.replace('boundaries/', '')
    fullPath = path.join(baseDir, 'boundaries', `${fileName}.geojson`)
  } else {
    // Default to processed folder
    fullPath = path.join(baseDir, 'processed', `${filePath}.geojson`)
  }

  try {
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: `File not found: ${filePath}` })
    }

    const data = fs.readFileSync(fullPath, 'utf-8')
    const geojson = JSON.parse(data)

    res.setHeader('Content-Type', 'application/json')
    res.status(200).json(geojson)
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error)
    res.status(500).json({ error: `Failed to load ${filePath}` })
  }
}
