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
      fetch(`/api/layers/${cityConfig.id}/parcels`)
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
      fetch(`/api/layers/${cityConfig.id}/businesses`)
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
      fetch(`/api/layers/${cityConfig.id}/attractions`)
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
    fetch(`/api/layers/${cityConfig.id}/subdivisions`)
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
            `/api/layers/${cityConfig.id}/${layerId}`
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

        {/* Render other visible layers (excluding parcels, businesses, attractions which are rendered separately) */}
        {/* Using layerOrder for render order - items later in array render on top */}
        {/* Layers at the START of layerOrder render FIRST (bottom), layers at END render LAST (top) */}
        {[...layerOrder].reverse()
          .filter(id => visibleLayers.includes(id) && id !== 'parcels' && id !== 'businesses' && id !== 'attractions')
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
