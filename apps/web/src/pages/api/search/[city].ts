import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { city, q } = req.query

  if (!city || typeof city !== 'string' || !q || typeof q !== 'string') {
    return res.status(400).json({ error: 'City and query parameters required' })
  }

  try {
    // Load parcels data for searching
    const parcelsPath = path.join(
      process.cwd(),
      `../../../Datasets/hometownmap/cities/${city}/processed`,
      'parcels.geojson'
    )

    if (!fs.existsSync(parcelsPath)) {
      return res.status(404).json({ error: 'Parcels data not found' })
    }

    const parcelsData = JSON.parse(fs.readFileSync(parcelsPath, 'utf-8'))

    // Simple search through features
    const query = q.toLowerCase()
    const results = parcelsData.features
      .filter((feature: any) => {
        const address = feature.properties.address?.toLowerCase() || ''
        const owner = feature.properties.owner_name?.toLowerCase() || ''
        return address.includes(query) || owner.includes(query)
      })
      .slice(0, 10) // Limit to 10 results
      .map((feature: any) => ({
        parcel_id: feature.properties.parcel_id,
        address: feature.properties.address,
        owner_name: feature.properties.owner_name,
        center: feature.geometry.coordinates[0], // Simplified - would need proper centroid calculation
      }))

    res.status(200).json({ results })
  } catch (error) {
    console.error('Search failed:', error)
    res.status(500).json({ error: 'Search failed' })
  }
}
