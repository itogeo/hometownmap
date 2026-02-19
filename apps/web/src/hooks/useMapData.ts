import { useState, useEffect, useCallback, useRef } from 'react'

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
  const [floodZoneData, setFloodZoneData] = useState<any>(null)
  const loadedLayersRef = useRef<Set<string>>(new Set())

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

  // Reset loaded layers cache when cityId changes
  useEffect(() => {
    loadedLayersRef.current = new Set()
    setLayerData({})
  }, [cityId])

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

  // Always load flood zone data for parcel overlap detection
  useEffect(() => {
    console.log('Loading flood zones for spatial lookup...')
    fetch(`/data/layers/${cityId}/fema_flood_zones.geojson`)
      .then(res => res.json())
      .then(data => {
        console.log('Flood zones loaded:', data.features?.length)
        setFloodZoneData(data)
      })
      .catch(err => console.error('Error loading flood zones:', err))
  }, [cityId])

  // Load other layer data (only load layers not already loaded)
  useEffect(() => {
    if (visibleLayers.length === 0) {
      console.log('No visible layers yet, skipping load')
      return
    }

    const loadLayers = async () => {
      // Skip layers that are already loaded or loaded separately
      const specialLayers = ['parcels', 'businesses', 'attractions']
      const layersToLoad = visibleLayers.filter(
        id => !specialLayers.includes(id) && !loadedLayersRef.current.has(id)
      )

      if (layersToLoad.length === 0) {
        console.log('All visible layers already loaded')
        return
      }

      console.log('Loading new layers:', layersToLoad)

      const newLayerData: { [key: string]: any } = {}

      for (const layerId of layersToLoad) {
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
            loadedLayersRef.current.add(layerId)
          } else {
            console.error(`Failed to load ${layerId}: ${response.status}`)
          }
        } catch (error) {
          console.error(`Failed to load layer ${layerId}:`, error)
        }
      }

      // Merge with existing layer data
      if (Object.keys(newLayerData).length > 0) {
        console.log('Merging', Object.keys(newLayerData).length, 'new layers')
        setLayerData(prev => ({ ...prev, ...newLayerData }))
      }
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

  // Find which flood zone(s) a point is in
  const findFloodZone = useCallback((lng: number, lat: number): { zone: string; subtype: string | null; isFloodway: boolean; isSFHA: boolean } | null => {
    if (!floodZoneData?.features) return null

    for (const feature of floodZoneData.features) {
      const geom = feature.geometry
      let isInside = false

      if (geom.type === 'Polygon') {
        isInside = pointInPolygon([lng, lat], geom.coordinates[0])
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) {
          if (pointInPolygon([lng, lat], poly[0])) {
            isInside = true
            break
          }
        }
      }

      if (isInside) {
        const props = feature.properties || {}
        const subtype = (props.ZONE_SUBTY || '').trim() || null
        return {
          zone: props.FLD_ZONE || 'Unknown',
          subtype,
          isFloodway: subtype === 'FLOODWAY',
          isSFHA: props.SFHA_TF === 'T',
        }
      }
    }
    return null
  }, [floodZoneData, pointInPolygon])

  return {
    layerData,
    parcelData,
    businessData,
    attractionsData,
    subdivisionData,
    findSubdivision,
    findFloodZone,
  }
}
