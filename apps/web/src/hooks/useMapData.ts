import { useState, useEffect, useCallback } from 'react'

interface UseMapDataOptions {
  cityId: string
  visibleLayers: string[]
}

export function useMapData({ cityId, visibleLayers }: UseMapDataOptions) {
  const [layerData, setLayerData] = useState<{ [key: string]: any }>({})
  const [parcelData, setParcelData] = useState<any>(null)
  const [businessData, setBusinessData] = useState<any>(null)
  const [attractionsData, setAttractionsData] = useState<any>(null)
  const [subdivisionData, setSubdivisionData] = useState<any>(null)

  // Load parcels directly
  useEffect(() => {
    if (visibleLayers.includes('parcels')) {
      console.log('Loading parcels directly...')
      fetch(`/data/layers/${cityId}/parcels.geojson`)
        .then(res => res.json())
        .then(data => {
          console.log('Parcels loaded directly:', data.features?.length)
          setParcelData(data)
        })
        .catch(err => console.error('Error loading parcels:', err))
    } else {
      setParcelData(null)
    }
  }, [visibleLayers, cityId])

  // Load businesses directly
  useEffect(() => {
    if (visibleLayers.includes('businesses')) {
      console.log('Loading businesses directly...')
      fetch(`/data/layers/${cityId}/businesses.geojson`)
        .then(res => res.json())
        .then(data => {
          console.log('Businesses loaded directly:', data.features?.length)
          setBusinessData(data)
        })
        .catch(err => console.error('Error loading businesses:', err))
    } else {
      setBusinessData(null)
    }
  }, [visibleLayers, cityId])

  // Load attractions directly
  useEffect(() => {
    if (visibleLayers.includes('attractions')) {
      console.log('Loading attractions directly...')
      fetch(`/data/layers/${cityId}/attractions.geojson`)
        .then(res => res.json())
        .then(data => {
          console.log('Attractions loaded directly:', data.features?.length)
          setAttractionsData(data)
        })
        .catch(err => console.error('Error loading attractions:', err))
    } else {
      setAttractionsData(null)
    }
  }, [visibleLayers, cityId])

  // Load subdivision data for spatial lookups
  useEffect(() => {
    console.log('Loading subdivisions for spatial lookup...')
    fetch(`/data/layers/${cityId}/subdivisions.geojson`)
      .then(res => res.json())
      .then(data => {
        console.log('Subdivisions loaded:', data.features?.length)
        setSubdivisionData(data)
      })
      .catch(err => console.error('Error loading subdivisions:', err))
  }, [cityId])

  // Load other layer data
  useEffect(() => {
    if (visibleLayers.length === 0) {
      console.log('No visible layers yet, skipping load')
      return
    }

    const loadLayers = async () => {
      const newLayerData: { [key: string]: any } = {}

      console.log('Loading layers:', visibleLayers)

      for (const layerId of visibleLayers) {
        // Skip layers loaded separately
        if (layerId === 'parcels' || layerId === 'businesses' || layerId === 'attractions') continue

        try {
          const response = await fetch(`/data/layers/${cityId}/${layerId}.geojson`)
          if (response.ok) {
            const data = await response.json()
            console.log(`Loaded ${layerId}:`, {
              features: data.features?.length || 0,
              type: data.type,
              firstGeomType: data.features?.[0]?.geometry?.type
            })
            newLayerData[layerId] = data
          } else {
            console.error(`Failed to load ${layerId}: ${response.status}`)
          }
        } catch (error) {
          console.error(`Failed to load layer ${layerId}:`, error)
        }
      }

      console.log('Total layers loaded:', Object.keys(newLayerData).length)
      setLayerData(newLayerData)
    }

    loadLayers()
  }, [visibleLayers, cityId])

  // Helper: Check if a point is inside a polygon (ray casting algorithm)
  const pointInPolygon = useCallback((point: [number, number], polygon: number[][]) => {
    const [x, y] = point
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1]
      const xj = polygon[j][0], yj = polygon[j][1]
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
    }
    return inside
  }, [])

  // Find which subdivision a point is in
  const findSubdivision = useCallback((lng: number, lat: number): string | null => {
    if (!subdivisionData?.features) return null

    for (const feature of subdivisionData.features) {
      const geom = feature.geometry
      if (geom.type === 'Polygon') {
        if (pointInPolygon([lng, lat], geom.coordinates[0])) {
          return feature.properties?.SUB_NAME || feature.properties?.sub_name || null
        }
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) {
          if (pointInPolygon([lng, lat], poly[0])) {
            return feature.properties?.SUB_NAME || feature.properties?.sub_name || null
          }
        }
      }
    }
    return null
  }, [subdivisionData, pointInPolygon])

  return {
    layerData,
    parcelData,
    businessData,
    attractionsData,
    subdivisionData,
    findSubdivision,
  }
}
