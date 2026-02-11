import React, { useEffect, useRef, useState, useCallback } from 'react'
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl'
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl'
import { CityConfig, MapMode, Feature } from '@/types'

interface MapViewProps {
  cityConfig: CityConfig
  currentMode: MapMode
  visibleLayers: string[]
  layerOrder?: string[]
  mapStyleOverride?: 'satellite' | 'streets'
  selectedLocation?: {
    longitude: number
    latitude: number
    zoom?: number
  } | null
  onBusinessSelect?: (business: any) => void
  onAttractionSelect?: (attraction: any) => void
}

export default function MapView({
  cityConfig,
  currentMode,
  visibleLayers,
  layerOrder = [],
  mapStyleOverride,
  selectedLocation,
  onBusinessSelect,
  onAttractionSelect,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [layerData, setLayerData] = useState<{ [key: string]: any }>({})
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number
    latitude: number
    features: Array<{ layerId: string; layerName: string; properties: any }>
    screenY: number // To determine anchor position
  } | null>(null)

  // Direct parcel data loading (like SimpleMap) for reliability
  const [parcelData, setParcelData] = useState<any>(null)
  // Direct business data loading for reliability
  const [businessData, setBusinessData] = useState<any>(null)
  // Direct attractions data loading for tourism mode
  const [attractionsData, setAttractionsData] = useState<any>(null)
  // Subdivision data for spatial lookups
  const [subdivisionData, setSubdivisionData] = useState<any>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-red-600">
          Error: Mapbox token not configured. Please add
          NEXT_PUBLIC_MAPBOX_TOKEN to your .env file.
        </div>
      </div>
    )
  }

  // Load parcels directly (like SimpleMap for reliability)
  useEffect(() => {
    if (visibleLayers.includes('parcels')) {
      console.log('🏠 Loading parcels directly...')
      fetch(`/data/layers/${cityConfig.id}/parcels.geojson`)
        .then(res => res.json())
        .then(data => {
          console.log('✅ Parcels loaded directly:', data.features?.length)
          setParcelData(data)
        })
        .catch(err => console.error('❌ Error loading parcels:', err))
    } else {
      setParcelData(null)
    }
  }, [visibleLayers, cityConfig.id])

  // Load businesses directly for reliability
  useEffect(() => {
    if (visibleLayers.includes('businesses')) {
      console.log('🏢 Loading businesses directly...')
      fetch(`/data/layers/${cityConfig.id}/businesses.geojson`)
        .then(res => res.json())
        .then(data => {
          console.log('✅ Businesses loaded directly:', data.features?.length)
          setBusinessData(data)
        })
        .catch(err => console.error('❌ Error loading businesses:', err))
    } else {
      setBusinessData(null)
    }
  }, [visibleLayers, cityConfig.id])

  // Load attractions directly for tourism mode
  useEffect(() => {
    if (visibleLayers.includes('attractions')) {
      console.log('🗺️ Loading attractions directly...')
      fetch(`/data/layers/${cityConfig.id}/attractions.geojson`)
        .then(res => res.json())
        .then(data => {
          console.log('✅ Attractions loaded directly:', data.features?.length)
          setAttractionsData(data)
        })
        .catch(err => console.error('❌ Error loading attractions:', err))
    } else {
      setAttractionsData(null)
    }
  }, [visibleLayers, cityConfig.id])

  // Load subdivision data for spatial lookups (always load for popup enrichment)
  useEffect(() => {
    console.log('📍 Loading subdivisions for spatial lookup...')
    fetch(`/data/layers/${cityConfig.id}/subdivisions.geojson`)
      .then(res => res.json())
      .then(data => {
        console.log('✅ Subdivisions loaded:', data.features?.length)
        setSubdivisionData(data)
      })
      .catch(err => console.error('❌ Error loading subdivisions:', err))
  }, [cityConfig.id])

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

  // Load layer data
  useEffect(() => {
    if (visibleLayers.length === 0) {
      console.log('⏳ No visible layers yet, skipping load')
      return
    }

    const loadLayers = async () => {
      const newLayerData: { [key: string]: any } = {}

      console.log('🗺️ Loading layers:', visibleLayers)

      for (const layerId of visibleLayers) {
        // Skip parcels, businesses, attractions - loaded separately for reliability
        if (layerId === 'parcels' || layerId === 'businesses' || layerId === 'attractions') continue

        try {
          const response = await fetch(
            `/data/layers/${cityConfig.id}/${layerId}.geojson`
          )
          if (response.ok) {
            const data = await response.json()
            console.log(`✅ Loaded ${layerId}:`, {
              features: data.features?.length || 0,
              type: data.type,
              firstGeomType: data.features?.[0]?.geometry?.type
            })
            newLayerData[layerId] = data
          } else {
            console.error(`❌ Failed to load ${layerId}: ${response.status}`)
          }
        } catch (error) {
          console.error(`Failed to load layer ${layerId}:`, error)
        }
      }

      console.log('📊 Total layers loaded:', Object.keys(newLayerData).length)
      setLayerData(newLayerData)
    }

    loadLayers()
  }, [visibleLayers, cityConfig.id])

  // Fly to selected location
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedLocation.longitude, selectedLocation.latitude],
        zoom: selectedLocation.zoom || 17,
        duration: 2000,
      })
    }
  }, [selectedLocation])

  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const allFeatures = event.features || []
      if (allFeatures.length === 0) return

      // Check if any feature is an attraction - handle separately
      const attractionFeature = allFeatures.find(f => {
        const sourceId = f.source as string
        return sourceId?.replace('-source', '') === 'attractions'
      })

      if (attractionFeature && onAttractionSelect) {
        const coordinates = (attractionFeature.geometry as GeoJSON.Point).coordinates
        onAttractionSelect({
          name: attractionFeature.properties?.name,
          category: attractionFeature.properties?.category,
          description: attractionFeature.properties?.description,
          highlights: attractionFeature.properties?.highlights,
          hours: attractionFeature.properties?.hours,
          fee: attractionFeature.properties?.fee,
          website: attractionFeature.properties?.website,
          story: attractionFeature.properties?.story,
          coordinates: [coordinates[0], coordinates[1]] as [number, number],
        })
        return // Don't show popup for attractions
      }

      // Gather info from all clicked features
      const featureInfos: Array<{ layerId: string; layerName: string; properties: any }> = []
      const seenLayers = new Set<string>()

      for (const feature of allFeatures) {
        const sourceId = feature.source as string
        const layerId = sourceId?.replace('-source', '')

        // Skip duplicates and attractions
        if (!layerId || seenLayers.has(layerId) || layerId === 'attractions') continue
        seenLayers.add(layerId)

        let enrichedProperties = { ...feature.properties }

        // Enrich with subdivision info for parcels
        if (layerId === 'parcels') {
          const subdivision = findSubdivision(event.lngLat.lng, event.lngLat.lat)
          if (subdivision) {
            enrichedProperties._subdivision = subdivision
          }
        }

        const layerConfig = cityConfig.layers[layerId]
        featureInfos.push({
          layerId,
          layerName: layerConfig?.display_name || layerId,
          properties: enrichedProperties,
        })
      }

      if (featureInfos.length === 0) return

      setPopupInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        features: featureInfos,
        screenY: event.point.y, // Track screen position for smart anchoring
      })
    },
    [onAttractionSelect, findSubdivision, cityConfig.layers]
  )

  const getLayerStyle = (layerId: string) => {
    const config = cityConfig.layers[layerId]
    if (!config) return null

    const style = config.style || {}

    // Map our style config to Mapbox layer paint properties
    // Reduce opacity for more transparency (multiply by 0.6)
    const baseOpacity = style['fill-opacity'] || 0.2
    return {
      'fill-color': style.fill || '#3388ff',
      'fill-opacity': Math.min(baseOpacity * 0.6, 0.3),
    }
  }

  const getLayerLineStyle = (layerId: string) => {
    const config = cityConfig.layers[layerId]
    if (!config) return null

    const style = config.style || {}

    const lineStyle: any = {
      'line-color': style.stroke || '#3388ff',
      'line-width': style['stroke-width'] || 2,
      'line-opacity': (style['stroke-opacity'] || 1) * 0.7,
    }

    // Dashed line for city boundaries
    if (layerId === 'cities') {
      lineStyle['line-dasharray'] = [4, 3]
    }

    return lineStyle
  }

  // Get map style - use override if provided, otherwise use mode config
  const getMapStyle = () => {
    const styleMap: { [key: string]: string } = {
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
      streets: 'mapbox://styles/mapbox/streets-v12',
      light: 'mapbox://styles/mapbox/light-v11',
      dark: 'mapbox://styles/mapbox/dark-v11',
      outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    }

    // Use override if provided
    if (mapStyleOverride) {
      return styleMap[mapStyleOverride] || styleMap.streets
    }

    // Otherwise use mode config
    const modeConfig = cityConfig.modes[currentMode]
    const stylePreference = modeConfig?.mapStyle || 'streets'
    return styleMap[stylePreference] || styleMap.streets
  }

  return (
    <div className="h-full w-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude: cityConfig.map.center[0],
          latitude: cityConfig.map.center[1],
          zoom: cityConfig.map.zoom,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={getMapStyle()}
        onClick={handleClick}
        interactiveLayerIds={[
          // Direct parcel layers
          'parcels-fill',
          'parcels-outline',
          // Business markers (all clickable)
          'businesses-point',
          'businesses-shadow',
          'businesses-inner',
          'businesses-label',
          // Attraction markers (all clickable)
          'attractions-point',
          'attractions-glow',
          'attractions-icon',
          // Config-driven layers
          ...visibleLayers.filter(id => id !== 'parcels' && id !== 'businesses' && id !== 'attractions').flatMap((id) => [
            `${id}-fill`,
            `${id}-line`,
            `${id}-outline`,
            `${id}-point`,
          ])
        ]}
      >
        <NavigationControl position="bottom-right" />

        {/* DIRECT PARCEL RENDERING */}
        {parcelData && visibleLayers.includes('parcels') && (
          <Source id="parcels-source" type="geojson" data={parcelData}>
            {/* Fill layer - more transparent */}
            <Layer
              id="parcels-fill"
              type="fill"
              filter={['any',
                ['==', ['geometry-type'], 'Polygon'],
                ['==', ['geometry-type'], 'MultiPolygon']
              ]}
              minzoom={13}
              paint={{
                'fill-color': '#FBBF24',
                'fill-opacity': 0.08
              }}
            />
            {/* Outline layer - subtle borders */}
            <Layer
              id="parcels-outline"
              type="line"
              filter={['any',
                ['==', ['geometry-type'], 'Polygon'],
                ['==', ['geometry-type'], 'MultiPolygon']
              ]}
              minzoom={13}
              paint={{
                'line-color': '#B45309',
                'line-width': 1,
                'line-opacity': 0.5
              }}
            />
          </Source>
        )}

        {/* 500-YEAR FLOODPLAIN (Zone X) - Very light blue, render underneath */}
        {layerData['floodplain_500yr'] && visibleLayers.includes('floodplain_500yr') && (
          <Source id="floodplain_500yr-source" type="geojson" data={layerData['floodplain_500yr']}>
            <Layer
              id="floodplain_500yr-fill"
              type="fill"
              filter={['all',
                ['any',
                  ['==', ['geometry-type'], 'Polygon'],
                  ['==', ['geometry-type'], 'MultiPolygon']
                ],
                ['==', ['get', 'FLD_ZONE'], 'X']
              ]}
              paint={{
                'fill-color': '#E0F2FE',  // Very light blue (sky-100)
                'fill-opacity': 0.3
              }}
            />
            <Layer
              id="floodplain_500yr-outline"
              type="line"
              filter={['all',
                ['any',
                  ['==', ['geometry-type'], 'Polygon'],
                  ['==', ['geometry-type'], 'MultiPolygon']
                ],
                ['==', ['get', 'FLD_ZONE'], 'X']
              ]}
              paint={{
                'line-color': '#7DD3FC',  // Light blue (sky-300)
                'line-width': 0.75,
                'line-opacity': 0.5
              }}
            />
          </Source>
        )}

        {/* 100-YEAR FLOODPLAIN (Zones A, AE, AH, AO) - Blue, render on top */}
        {layerData['floodplain_100yr'] && visibleLayers.includes('floodplain_100yr') && (
          <Source id="floodplain_100yr-source" type="geojson" data={layerData['floodplain_100yr']}>
            <Layer
              id="floodplain_100yr-fill"
              type="fill"
              filter={['all',
                ['any',
                  ['==', ['geometry-type'], 'Polygon'],
                  ['==', ['geometry-type'], 'MultiPolygon']
                ],
                ['any',
                  ['==', ['get', 'FLD_ZONE'], 'A'],
                  ['==', ['get', 'FLD_ZONE'], 'AE'],
                  ['==', ['get', 'FLD_ZONE'], 'AH'],
                  ['==', ['get', 'FLD_ZONE'], 'AO']
                ]
              ]}
              paint={{
                'fill-color': [
                  'match',
                  ['get', 'FLD_ZONE'],
                  'A', '#1D4ED8',      // Dark blue - highest risk (no elevation data)
                  'AE', '#3B82F6',     // Medium blue - high risk with BFE
                  'AH', '#60A5FA',     // Light blue - shallow flooding
                  'AO', '#93C5FD',     // Lighter blue - sheet flow
                  '#3B82F6'            // Default blue
                ],
                'fill-opacity': 0.35
              }}
            />
            <Layer
              id="floodplain_100yr-outline"
              type="line"
              filter={['all',
                ['any',
                  ['==', ['geometry-type'], 'Polygon'],
                  ['==', ['geometry-type'], 'MultiPolygon']
                ],
                ['any',
                  ['==', ['get', 'FLD_ZONE'], 'A'],
                  ['==', ['get', 'FLD_ZONE'], 'AE'],
                  ['==', ['get', 'FLD_ZONE'], 'AH'],
                  ['==', ['get', 'FLD_ZONE'], 'AO']
                ]
              ]}
              paint={{
                'line-color': [
                  'match',
                  ['get', 'FLD_ZONE'],
                  'A', '#1E3A8A',      // Darkest blue
                  'AE', '#1D4ED8',     // Dark blue
                  'AH', '#2563EB',     // Medium blue
                  'AO', '#3B82F6',     // Blue
                  '#1D4ED8'            // Default
                ],
                'line-width': 1.5,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Legacy FLOOD ZONES layer - in case old config is used */}
        {layerData['flood_zones'] && visibleLayers.includes('flood_zones') && (
          <Source id="flood_zones-source" type="geojson" data={layerData['flood_zones']}>
            <Layer
              id="flood_zones-fill"
              type="fill"
              filter={['all',
                ['any',
                  ['==', ['geometry-type'], 'Polygon'],
                  ['==', ['geometry-type'], 'MultiPolygon']
                ],
                ['any',
                  ['==', ['get', 'FLD_ZONE'], 'A'],
                  ['==', ['get', 'FLD_ZONE'], 'AE'],
                  ['==', ['get', 'FLD_ZONE'], 'AH'],
                  ['==', ['get', 'FLD_ZONE'], 'AO']
                ]
              ]}
              paint={{
                'fill-color': '#3B82F6',
                'fill-opacity': 0.35
              }}
            />
            <Layer
              id="flood_zones-outline"
              type="line"
              filter={['all',
                ['any',
                  ['==', ['geometry-type'], 'Polygon'],
                  ['==', ['geometry-type'], 'MultiPolygon']
                ],
                ['any',
                  ['==', ['get', 'FLD_ZONE'], 'A'],
                  ['==', ['get', 'FLD_ZONE'], 'AE'],
                  ['==', ['get', 'FLD_ZONE'], 'AH'],
                  ['==', ['get', 'FLD_ZONE'], 'AO']
                ]
              ]}
              paint={{
                'line-color': '#1D4ED8',
                'line-width': 1.5,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Render other visible layers (excluding specially-rendered layers) */}
        {/* Using layerOrder for render order - items later in array render on top */}
        {/* Layers at the START of layerOrder render FIRST (bottom), layers at END render LAST (top) */}
        {[...layerOrder].reverse()
          .filter(id => visibleLayers.includes(id) &&
            !['parcels', 'businesses', 'attractions', 'flood_zones', 'floodplain_100yr', 'floodplain_500yr'].includes(id))
          .map((layerId) => {
          const data = layerData[layerId]
          if (!data || !data.features || data.features.length === 0) {
            console.log(`⚠️ Skipping ${layerId}: no data or features`)
            return null
          }

          const layerConfig = cityConfig.layers[layerId]
          if (!layerConfig) {
            console.log(`⚠️ Skipping ${layerId}: no layer config`)
            return null
          }

          console.log(`🎨 Rendering ${layerId}: ${data.features.length} features`)

          return (
            <Source
              key={layerId}
              id={`${layerId}-source`}
              type="geojson"
              data={data}
            >
              {/* Fill layer for Polygons/MultiPolygons - uses geometry-type filter */}
              <Layer
                id={`${layerId}-fill`}
                type="fill"
                filter={['any',
                  ['==', ['geometry-type'], 'Polygon'],
                  ['==', ['geometry-type'], 'MultiPolygon']
                ]}
                minzoom={layerConfig.minzoom || 0}
                paint={getLayerStyle(layerId) as any}
              />

              {/* Outline for polygons */}
              <Layer
                id={`${layerId}-outline`}
                type="line"
                filter={['any',
                  ['==', ['geometry-type'], 'Polygon'],
                  ['==', ['geometry-type'], 'MultiPolygon']
                ]}
                minzoom={layerConfig.minzoom || 0}
                paint={getLayerLineStyle(layerId) as any}
                layout={layerId === 'cities' ? { 'line-cap': 'round', 'line-join': 'round' } : undefined}
              />

              {/* Line layer for LineStrings/MultiLineStrings - uses geometry-type filter */}
              <Layer
                id={`${layerId}-line`}
                type="line"
                filter={['any',
                  ['==', ['geometry-type'], 'LineString'],
                  ['==', ['geometry-type'], 'MultiLineString']
                ]}
                paint={getLayerLineStyle(layerId) as any}
              />

              {/* Point layer for Points/MultiPoints - uses geometry-type filter */}
              <Layer
                id={`${layerId}-point`}
                type="circle"
                filter={['any',
                  ['==', ['geometry-type'], 'Point'],
                  ['==', ['geometry-type'], 'MultiPoint']
                ]}
                paint={{
                  'circle-radius': 6,
                  'circle-color': layerConfig.style?.fill || '#3388ff',
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff',
                  'circle-opacity': 1,
                }}
              />

              {/* Add text labels for subdivisions */}
              {layerId === 'subdivisions' && (
                <Layer
                  id={`${layerId}-label`}
                  type="symbol"
                  filter={['any',
                    ['==', ['geometry-type'], 'Polygon'],
                    ['==', ['geometry-type'], 'MultiPolygon']
                  ]}
                  minzoom={layerConfig.minzoom || 0}
                  layout={{
                    'text-field': ['coalesce', ['get', 'SUB_NAME'], ['get', 'sub_name']],
                    'text-size': 12,
                    'text-anchor': 'center',
                    'text-justify': 'center',
                    'text-max-width': 8,
                    'text-allow-overlap': false,
                  }}
                  paint={{
                    'text-color': '#047857',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 1.5,
                    'text-opacity': 0.9,
                  }}
                />
              )}
            </Source>
          )
        })}

        {/* BUSINESS MARKERS - Rendered after other layers */}
        {businessData && visibleLayers.includes('businesses') && (
          <Source id="businesses-source" type="geojson" data={businessData}>
            {/* Shadow/glow effect */}
            <Layer
              id="businesses-shadow"
              type="circle"
              paint={{
                'circle-radius': 14,
                'circle-color': '#1E40AF',
                'circle-opacity': 0.4,
                'circle-blur': 0.4,
              }}
            />
            {/* Main blue marker */}
            <Layer
              id="businesses-point"
              type="circle"
              paint={{
                'circle-radius': 10,
                'circle-color': '#3B82F6',
                'circle-stroke-width': 2.5,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 1,
              }}
            />
            {/* Inner white dot */}
            <Layer
              id="businesses-inner"
              type="circle"
              paint={{
                'circle-radius': 3,
                'circle-color': '#ffffff',
                'circle-opacity': 1,
              }}
            />
            {/* Business name labels */}
            <Layer
              id="businesses-label"
              type="symbol"
              layout={{
                'text-field': ['get', 'name'],
                'text-size': 10,
                'text-anchor': 'top',
                'text-offset': [0, 1],
                'text-max-width': 8,
                'text-allow-overlap': false,
              }}
              paint={{
                'text-color': '#1E40AF',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1.5,
              }}
            />
          </Source>
        )}

        {/* ATTRACTION MARKERS - Tourism mode, beautiful category-colored markers */}
        {attractionsData && visibleLayers.includes('attractions') && (
          <Source id="attractions-source" type="geojson" data={attractionsData}>
            {/* Outer glow based on category */}
            <Layer
              id="attractions-glow"
              type="circle"
              paint={{
                'circle-radius': 18,
                'circle-color': [
                  'match',
                  ['get', 'category'],
                  'State Park', '#059669',
                  'Historic Site', '#7C3AED',
                  'Trail', '#0891B2',
                  'Historic Landmark', '#B45309',
                  'Museum', '#6366F1',
                  'Recreation', '#0D9488',
                  'City Park', '#16A34A',
                  'Events', '#DC2626',
                  'Lodging', '#EA580C',
                  '#F59E0B'
                ],
                'circle-opacity': 0.35,
                'circle-blur': 0.5,
              }}
            />
            {/* Main marker with category color */}
            <Layer
              id="attractions-point"
              type="circle"
              paint={{
                'circle-radius': 12,
                'circle-color': [
                  'match',
                  ['get', 'category'],
                  'State Park', '#059669',
                  'Historic Site', '#7C3AED',
                  'Trail', '#0891B2',
                  'Historic Landmark', '#B45309',
                  'Museum', '#6366F1',
                  'Recreation', '#0D9488',
                  'City Park', '#16A34A',
                  'Events', '#DC2626',
                  'Lodging', '#EA580C',
                  '#F59E0B'
                ],
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 1,
              }}
            />
            {/* Icon layer using category emoji */}
            <Layer
              id="attractions-icon"
              type="symbol"
              layout={{
                'text-field': [
                  'match',
                  ['get', 'category'],
                  'State Park', '🏞️',
                  'Historic Site', '🏛️',
                  'Trail', '🥾',
                  'Historic Landmark', '🏨',
                  'Museum', '🖼️',
                  'Recreation', '🎯',
                  'City Park', '🌳',
                  'Events', '🎪',
                  'Lodging', '🏕️',
                  '📍'
                ],
                'text-size': 14,
                'text-anchor': 'center',
                'text-allow-overlap': true,
              }}
              paint={{
                'text-opacity': 1,
              }}
            />
            {/* Attraction name labels */}
            <Layer
              id="attractions-label"
              type="symbol"
              layout={{
                'text-field': ['get', 'name'],
                'text-size': 11,
                'text-anchor': 'top',
                'text-offset': [0, 1.8],
                'text-max-width': 10,
                'text-allow-overlap': false,
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
              }}
              paint={{
                'text-color': '#1F2937',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2,
              }}
            />
          </Source>
        )}

        {/* Popup */}
        {popupInfo && popupInfo.features.length > 0 && (() => {
          // Filter out city and buildings from popup, get parcel and subdivision info
          const validFeatures = popupInfo.features.filter(f => f.layerId !== 'cities' && f.layerId !== 'buildings')
          if (validFeatures.length === 0) return null

          const parcel = validFeatures.find(f => f.layerId === 'parcels')
          const subdivision = validFeatures.find(f => f.layerId === 'subdivisions' || f.layerId === 'minor_subdivisions')
          const otherFeatures = validFeatures.filter(f => f.layerId !== 'parcels' && f.layerId !== 'subdivisions' && f.layerId !== 'minor_subdivisions')

          // Get subdivision name
          const subdivName = parcel?.properties._subdivision ||
                            subdivision?.properties.SUB_NAME ||
                            subdivision?.properties.sub_name

          return (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              anchor={popupInfo.screenY < 300 ? 'top' : 'bottom'}
              onClose={() => setPopupInfo(null)}
              closeButton={true}
              closeOnClick={false}
              maxWidth="200px"
            >
              <div className="text-[11px]">
                {/* Subdivision header */}
                {subdivName && (
                  <div className="bg-amber-100 text-amber-800 px-2 py-1 -mx-2.5 -mt-1 mb-1.5 text-[10px] font-medium">
                    {subdivName}
                  </div>
                )}

                {/* Parcel info */}
                {parcel && (
                  <div>
                    <div className="font-semibold text-gray-900">{parcel.properties.ownername || 'Unknown Owner'}</div>
                    <div className="text-gray-600 mt-0.5">
                      {parcel.properties.totalvalue && <span>Tax Assessed: ${(Number(parcel.properties.totalvalue) / 1000).toFixed(0)}K</span>}
                      {parcel.properties.totalvalue && parcel.properties.gisacres && <span className="mx-1">·</span>}
                      {parcel.properties.gisacres && <span>{Number(parcel.properties.gisacres).toFixed(2)} ac</span>}
                    </div>
                    {parcel.properties.addresslin && (
                      <div className="text-gray-500 text-[10px] mt-1">{parcel.properties.addresslin}</div>
                    )}
                  </div>
                )}

                {/* Other layers */}
                {otherFeatures.map((feature, index) => {
                  const p = feature.properties

                  // Special rendering for FEMA flood determination points
                  if (feature.layerId === 'fema_flood') {
                    const outcome = p.OUTCOME || 'Unknown'
                    const isRemoved = outcome.toLowerCase().includes('removed')
                    const isDenied = outcome.toLowerCase().includes('denied')
                    const dateEnded = p.DATEENDED ? new Date(p.DATEENDED).toLocaleDateString() : null

                    return (
                      <div key={feature.layerId} className={`${parcel || index > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}`}>
                        <div className="text-[9px] text-gray-400 uppercase mb-1">FEMA Flood Determination</div>

                        {/* Outcome badge */}
                        <div className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mb-1 ${
                          isRemoved ? 'bg-green-100 text-green-800' :
                          isDenied ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {outcome}
                        </div>

                        {/* Property name */}
                        {p.PROJECTNAME && (
                          <div className="text-gray-900 text-[10px] mt-1 leading-tight">{p.PROJECTNAME}</div>
                        )}

                        {/* Details grid */}
                        <div className="mt-1.5 space-y-0.5 text-[9px]">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Type:</span>
                            <span className="text-gray-700 font-medium">{p.PROJECTCATEGORY || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Lot Type:</span>
                            <span className="text-gray-700">{p.LOTTYPE || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <span className="text-gray-700">{p.STATUS || 'N/A'}</span>
                          </div>
                          {dateEnded && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Date:</span>
                              <span className="text-gray-700">{dateEnded}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Case #:</span>
                            <span className="text-gray-700 font-mono">{p.CASENUMBER || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Link to FEMA */}
                        {p.PDFHYPERLINKID && (
                          <a
                            href={`https://msc.fema.gov/portal/advanceSearch#${p.PDFHYPERLINKID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-blue-600 hover:underline mt-1.5 inline-block"
                          >
                            View FEMA Letter →
                          </a>
                        )}
                      </div>
                    )
                  }

                  // Special rendering for FEMA flood zone polygons (all floodplain layers)
                  if (feature.layerId === 'flood_zones' || feature.layerId === 'floodplain_100yr' || feature.layerId === 'floodplain_500yr') {
                    const zone = p.FLD_ZONE || 'Unknown'
                    const subtype = p.ZONE_SUBTY
                    const isSFHA = p.SFHA_TF === 'T'
                    const bfe = p.STATIC_BFE && p.STATIC_BFE !== -9999 ? p.STATIC_BFE : null

                    // Zone descriptions
                    const zoneDescriptions: { [key: string]: string } = {
                      'A': '100-year flood zone (1% annual chance, no base elevation)',
                      'AE': '100-year flood zone (1% annual chance, with base elevation)',
                      'AH': 'Shallow flooding 1-3 ft (1% annual chance)',
                      'AO': 'Sheet flow flooding 1-3 ft (1% annual chance)',
                      'V': 'Coastal high hazard zone',
                      'VE': 'Coastal zone with base elevation',
                      'X': 'Minimal flood hazard (outside 100-year floodplain, may be in 500-year zone)',
                      'D': 'Undetermined flood hazard',
                    }

                    // Zone colors for badge - blue theme
                    const zoneColors: { [key: string]: string } = {
                      'A': 'bg-blue-700 text-white',
                      'AE': 'bg-blue-500 text-white',
                      'AH': 'bg-blue-400 text-white',
                      'AO': 'bg-blue-300 text-blue-900',
                      'V': 'bg-purple-100 text-purple-800',
                      'VE': 'bg-purple-100 text-purple-800',
                      'X': 'bg-sky-100 text-sky-700',
                      'D': 'bg-gray-100 text-gray-800',
                    }

                    // Get the appropriate header based on layer
                    const layerHeader = feature.layerId === 'floodplain_100yr' ? '100-Year Floodplain' :
                                       feature.layerId === 'floodplain_500yr' ? '500-Year Floodplain' :
                                       'FEMA Flood Zone'

                    return (
                      <div key={feature.layerId} className={`${parcel || index > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}`}>
                        <div className="text-[9px] text-gray-400 uppercase mb-1">{layerHeader}</div>

                        {/* Zone badge */}
                        <div className="flex items-center gap-2">
                          <div className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${zoneColors[zone] || 'bg-blue-100 text-blue-800'}`}>
                            Zone {zone}
                          </div>
                          {isSFHA && (
                            <div className="text-[9px] text-red-600 font-medium">⚠️ Special Flood Hazard Area</div>
                          )}
                        </div>

                        {/* Description */}
                        <div className="text-gray-700 text-[10px] mt-1">
                          {zoneDescriptions[zone] || 'Flood hazard zone'}
                        </div>

                        {/* Details */}
                        <div className="mt-1.5 space-y-0.5 text-[9px]">
                          {subtype && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Subtype:</span>
                              <span className="text-gray-700">{subtype}</span>
                            </div>
                          )}
                          {bfe && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Base Flood Elevation:</span>
                              <span className="text-gray-700 font-medium">{bfe} ft</span>
                            </div>
                          )}
                          {p.FLD_AR_ID && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Area ID:</span>
                              <span className="text-gray-700 font-mono">{p.FLD_AR_ID}</span>
                            </div>
                          )}
                          {p.SOURCE_CIT && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">FIRM Panel:</span>
                              <span className="text-gray-700 font-mono">{p.SOURCE_CIT}</span>
                            </div>
                          )}
                        </div>

                        {/* Insurance note for high-risk zones */}
                        {isSFHA && (
                          <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-800">
                            Flood insurance may be required for federally-backed mortgages in this zone.
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Special rendering for Capital Projects
                  if (feature.layerId === 'projects' && p.id) {
                    const isFloodProject = p.category === 'Flood Control'
                    const statusColors: { [key: string]: string } = {
                      'In Progress': 'bg-blue-100 text-blue-800',
                      'Planning': 'bg-amber-100 text-amber-800',
                      'Planned': 'bg-amber-100 text-amber-800',
                      'Completed': 'bg-green-100 text-green-800',
                      'Design Phase - 75% Complete': 'bg-blue-100 text-blue-800',
                    }

                    return (
                      <div key={feature.layerId} className={`${parcel || index > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}`}>
                        <div className="text-[9px] text-gray-400 uppercase mb-1">
                          {isFloodProject ? 'Flood Mitigation Project' : 'Capital Project'}
                        </div>

                        {/* Project name */}
                        <div className="font-semibold text-gray-900 text-[11px]">{p.name}</div>

                        {/* Status badge */}
                        <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium mt-1 ${statusColors[p.status] || 'bg-gray-100 text-gray-800'}`}>
                          {p.status}
                        </div>

                        {/* Description */}
                        <div className="text-gray-600 text-[10px] mt-1.5 leading-tight">
                          {p.description?.substring(0, 150)}{p.description?.length > 150 ? '...' : ''}
                        </div>

                        {/* Budget for flood projects */}
                        {isFloodProject && p.budget > 0 && (
                          <div className="mt-1.5 text-[9px]">
                            <span className="text-gray-500">Budget:</span>
                            <span className="text-gray-700 font-medium ml-1">${(p.budget / 1000000).toFixed(1)}M</span>
                          </div>
                        )}

                        {/* Key benefits for flood projects */}
                        {isFloodProject && p.benefits && p.benefits.length > 0 && (
                          <div className="mt-1.5 p-1.5 bg-blue-50 border border-blue-200 rounded text-[9px] text-blue-800">
                            <div className="font-medium mb-0.5">Key Benefits:</div>
                            <ul className="list-disc list-inside space-y-0.5">
                              {p.benefits.slice(0, 3).map((b: string, i: number) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Link to source */}
                        {p.source && (
                          <a
                            href={p.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-blue-600 hover:underline mt-1.5 inline-block"
                          >
                            Learn More →
                          </a>
                        )}
                      </div>
                    )
                  }

                  // Special rendering for Building Permits
                  if (feature.layerId === 'building_permits' && p.permit_number) {
                    const statusColors: { [key: string]: string } = {
                      'Active': 'bg-green-100 text-green-800',
                      'Closed - Completed': 'bg-blue-100 text-blue-800',
                      'Closed': 'bg-gray-100 text-gray-800',
                      'Closed - Approved': 'bg-blue-100 text-blue-800',
                      'Closed - Withdrawn': 'bg-red-100 text-red-800',
                    }

                    const isActive = p.status === 'Active'
                    const formattedDate = p.issued_date ? new Date(p.issued_date).toLocaleDateString() : null

                    return (
                      <div key={feature.layerId} className={`${parcel || index > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}`}>
                        <div className="text-[9px] text-gray-400 uppercase mb-1">Building Permit</div>

                        {/* Permit number */}
                        <div className="font-semibold text-gray-900 text-[11px] font-mono">{p.permit_number}</div>

                        {/* Status badge */}
                        <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium mt-1 ${statusColors[p.status] || 'bg-gray-100 text-gray-800'}`}>
                          {isActive ? '🔨 ' : ''}{p.status}
                        </div>

                        {/* Owner/Project */}
                        {(p.owner_name || p.project_name) && (
                          <div className="text-gray-700 text-[10px] mt-1.5">
                            {p.owner_name || p.project_name}
                          </div>
                        )}

                        {/* Details */}
                        <div className="mt-1.5 space-y-0.5 text-[9px]">
                          {formattedDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Issued:</span>
                              <span className="text-gray-700">{formattedDate}</span>
                            </div>
                          )}
                          {p.address && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Location:</span>
                              <span className="text-gray-700 text-right max-w-[150px] truncate">{p.address.replace(/THREE FORKS.*$/i, 'TF')}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Type:</span>
                            <span className="text-gray-700">{p.permit_type}</span>
                          </div>
                        </div>

                        {/* Note about data currency */}
                        <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded text-[8px] text-amber-700">
                          Data from Montana EBIZ portal. May not include recent permits.
                        </div>
                      </div>
                    )
                  }

                  const title = p.name || p.district_n || p.fld_zone || p.zone_subty || feature.layerName
                  return (
                    <div key={feature.layerId} className={`${parcel || index > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}`}>
                      <div className="text-[9px] text-gray-400 uppercase">{feature.layerName}</div>
                      <div className="text-gray-900">{title}</div>
                    </div>
                  )
                })}
              </div>
            </Popup>
          )
        })()}
      </Map>
    </div>
  )
}
