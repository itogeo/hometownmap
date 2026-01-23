import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// Fuzzy string matching function
function fuzzyMatch(value: any, pattern: string): number {
  // Convert to string and handle null/undefined
  if (value === null || value === undefined) return 0
  const str = String(value)
  if (!str) return 0

  const strLower = str.toLowerCase()
  const patternLower = pattern.toLowerCase()

  // Exact match
  if (strLower === patternLower) return 100

  // Starts with
  if (strLower.startsWith(patternLower)) return 90

  // Contains
  if (strLower.includes(patternLower)) return 80

  // Levenshtein-like simple scoring
  let score = 0
  let patternIdx = 0
  for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
    if (strLower[i] === patternLower[patternIdx]) {
      score += 1
      patternIdx++
    }
  }

  if (patternIdx === patternLower.length) {
    return (score / patternLower.length) * 70
  }

  return 0
}

// Calculate centroid for polygon
function getCentroid(geometry: any): [number, number] {
  if (geometry.type === 'Point') {
    return geometry.coordinates as [number, number]
  }

  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates[0]
    const sum = coords.reduce(
      (acc: [number, number], coord: [number, number]) => [
        acc[0] + coord[0],
        acc[1] + coord[1],
      ],
      [0, 0]
    )
    return [sum[0] / coords.length, sum[1] / coords.length]
  }

  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates[0][0]
    const sum = coords.reduce(
      (acc: [number, number], coord: [number, number]) => [
        acc[0] + coord[0],
        acc[1] + coord[1],
      ],
      [0, 0]
    )
    return [sum[0] / coords.length, sum[1] / coords.length]
  }

  return [0, 0]
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { city, q } = req.query

  if (!city || typeof city !== 'string' || !q || typeof q !== 'string') {
    return res.status(400).json({ error: 'City and query parameters required' })
  }

  try {
    const basePath = path.join(
      process.cwd(),
      '../../datasets/cities',
      city,
      'processed'
    )

    const searchResults: any[] = []

    // Search parcels
    const parcelsPath = path.join(basePath, 'parcels.geojson')
    console.log('Search API - Looking for parcels at:', parcelsPath)
    console.log('Search API - File exists:', fs.existsSync(parcelsPath))

    if (fs.existsSync(parcelsPath)) {
      const parcelsData = JSON.parse(fs.readFileSync(parcelsPath, 'utf-8'))

      parcelsData.features.forEach((feature: any) => {
        const props = feature.properties
        const scores: number[] = []

        // Search multiple fields - Montana Cadastral field names
        // Owner name fields
        if (props.ownername) scores.push(fuzzyMatch(props.ownername, q))
        if (props.owner_name) scores.push(fuzzyMatch(props.owner_name, q))

        // Address fields
        if (props.addresslin) scores.push(fuzzyMatch(props.addresslin, q))
        if (props.address) scores.push(fuzzyMatch(props.address, q))
        if (props.citystatez) scores.push(fuzzyMatch(props.citystatez, q))

        // Property ID fields
        if (props.propertyid) scores.push(fuzzyMatch(props.propertyid, q))
        if (props.parcel_id) scores.push(fuzzyMatch(props.parcel_id, q))
        if (props.geocode) scores.push(fuzzyMatch(props.geocode, q))

        // Legal description
        if (props.legaldescr) scores.push(fuzzyMatch(props.legaldescr, q))

        const maxScore = Math.max(...scores, 0)

        if (maxScore > 50) {
          searchResults.push({
            type: 'parcel',
            score: maxScore,
            parcel_id: props.propertyid || props.parcel_id,
            address: props.addresslin || props.address || 'No address',
            owner_name: props.ownername || props.owner_name,
            acreage: props.gisacres || props.acreage,
            zoning: props.proptype || props.zoning,
            total_value: props.totalvalue,
            center: getCentroid(feature.geometry),
          })
        }
      })
    }

    // Search businesses (if exists)
    const businessPath = path.join(basePath, 'businesses.geojson')
    if (fs.existsSync(businessPath)) {
      const businessData = JSON.parse(fs.readFileSync(businessPath, 'utf-8'))

      businessData.features.forEach((feature: any) => {
        const props = feature.properties
        const scores: number[] = []

        if (props.name) scores.push(fuzzyMatch(props.name, q))
        if (props.category) scores.push(fuzzyMatch(props.category, q))
        if (props.address) scores.push(fuzzyMatch(props.address, q))

        const maxScore = Math.max(...scores, 0)

        if (maxScore > 50) {
          searchResults.push({
            type: 'business',
            score: maxScore,
            name: props.name,
            category: props.category,
            address: props.address,
            phone: props.phone,
            center: getCentroid(feature.geometry),
          })
        }
      })
    }

    // Sort by score descending
    searchResults.sort((a, b) => b.score - a.score)

    // Limit results
    const results = searchResults.slice(0, 15)

    res.status(200).json({ results, count: results.length })
  } catch (error: any) {
    console.error('Search failed:', error?.message || error)
    res.status(500).json({ error: 'Search failed', details: error?.message })
  }
}
