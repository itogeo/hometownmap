import React, { useEffect, useRef, useState, useCallback } from 'react'
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl'
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl'
import { CityConfig, MapMode, Feature } from '@/types'

interface MapViewProps {
  cityConfig: CityConfig
  currentMode: MapMode
  visibleLayers: string[]
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
    properties: any
    layerId?: string
  } | null>(null)

  // Direct parcel data loading (like SimpleMap) for reliability
  const [parcelData, setParcelData] = useState<any>(null)
  // Direct business data loading for reliability
  const [businessData, setBusinessData] = useState<any>(null)
  // Direct attractions data loading for tourism mode
  const [attractionsData, setAttractionsData] = useState<any>(null)

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
      const feature = event.features?.[0]
      if (!feature) return

      // Get layer ID from the feature's source
      const sourceId = feature.source as string
      const layerId = sourceId?.replace('-source', '')

      // Handle attraction clicks - open side panel instead of popup
      if (layerId === 'attractions' && onAttractionSelect) {
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates
        onAttractionSelect({
          name: feature.properties?.name,
          category: feature.properties?.category,
          description: feature.properties?.description,
          highlights: feature.properties?.highlights,
          hours: feature.properties?.hours,
          fee: feature.properties?.fee,
          website: feature.properties?.website,
          story: feature.properties?.story,
          coordinates: [coordinates[0], coordinates[1]] as [number, number],
        })
        return // Don't show popup for attractions
      }

      if (feature.geometry.type === 'Point') {
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates

        setPopupInfo({
          longitude: coordinates[0],
          latitude: coordinates[1],
          properties: feature.properties,
          layerId: layerId || undefined,
        })
      } else if (feature) {
        // For polygon/line features, use click location
        setPopupInfo({
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
          properties: feature.properties,
          layerId: layerId || undefined,
        })
      }
    },
    [onAttractionSelect]
  )

  const getLayerStyle = (layerId: string) => {
    const config = cityConfig.layers[layerId]
    if (!config) return null

    const style = config.style || {}

    // Map our style config to Mapbox layer paint properties
    return {
      'fill-color': style.fill || '#3388ff',
      'fill-opacity': style['fill-opacity'] || 0.2,
    }
  }

  const getLayerLineStyle = (layerId: string) => {
    const config = cityConfig.layers[layerId]
    if (!config) return null

    const style = config.style || {}

    return {
      'line-color': style.stroke || '#3388ff',
      'line-width': style['stroke-width'] || 2,
      'line-opacity': style['stroke-opacity'] || 1,
    }
  }

  // Get map style based on current mode
  const getMapStyle = () => {
    const modeConfig = cityConfig.modes[currentMode]
    const stylePreference = modeConfig?.mapStyle || 'satellite'

    const styleMap: { [key: string]: string } = {
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
      streets: 'mapbox://styles/mapbox/streets-v12',
      light: 'mapbox://styles/mapbox/light-v11',
      dark: 'mapbox://styles/mapbox/dark-v11',
      outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    }

    return styleMap[stylePreference] || styleMap.satellite
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

        {/* DIRECT PARCEL RENDERING - Like SimpleMap for reliability */}
        {parcelData && visibleLayers.includes('parcels') && (
          <Source id="parcels-source" type="geojson" data={parcelData}>
            {/* Invisible fill for click detection */}
            <Layer
              id="parcels-fill"
              type="fill"
              minzoom={14}
              paint={{
                'fill-color': '#FF0000',
                'fill-opacity': 0
              }}
            />
            {/* Red outline - more visible */}
            <Layer
              id="parcels-outline"
              type="line"
              minzoom={14}
              paint={{
                'line-color': '#FF0000',
                'line-width': 2.5,
                'line-opacity': 0.7
              }}
            />
          </Source>
        )}

        {/* Render other visible layers (excluding parcels, businesses, attractions which are rendered separately) */}
        {visibleLayers
          .filter(id => id !== 'parcels' && id !== 'businesses' && id !== 'attractions')
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

          // Check all geometry types in the layer
          const geometryTypes = new Set(
            data.features.map((f: any) => f.geometry?.type).filter(Boolean)
          )

          const hasPolygons = Array.from(geometryTypes).some((t) =>
            ['Polygon', 'MultiPolygon'].includes(t as string)
          )
          const hasLines = Array.from(geometryTypes).some((t) =>
            ['LineString', 'MultiLineString'].includes(t as string)
          )
          const hasPoints = Array.from(geometryTypes).some((t) =>
            ['Point', 'MultiPoint'].includes(t as string)
          )

          console.log(`🎨 Rendering ${layerId}:`, {
            features: data.features.length,
            hasPolygons,
            hasLines,
            hasPoints,
            geometryTypes: Array.from(geometryTypes)
          })

          return (
            <Source
              key={layerId}
              id={`${layerId}-source`}
              type="geojson"
              data={data}
            >
              {/* Render polygons */}
              {hasPolygons && (
                <>
                  {/* Fill layer - use explicit style for subdivisions */}
                  <Layer
                    id={`${layerId}-fill`}
                    type="fill"
                    minzoom={layerConfig.minzoom || 0}
                    paint={layerId === 'majorsubdivisions' ? {
                      'fill-color': '#10B981',
                      'fill-opacity': 0.4,
                    } : getLayerStyle(layerId) as any}
                  />
                  {/* Outline layer */}
                  <Layer
                    id={`${layerId}-outline`}
                    type="line"
                    minzoom={layerConfig.minzoom || 0}
                    paint={getLayerLineStyle(layerId) as any}
                  />
                  {/* Add text labels for subdivisions */}
                  {layerId === 'majorsubdivisions' && (
                    <Layer
                      id={`${layerId}-label`}
                      type="symbol"
                      minzoom={layerConfig.minzoom || 0}
                      layout={{
                        'text-field': ['get', 'sub_name'],
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
                </>
              )}

              {/* Render lines */}
              {hasLines && (
                <Layer
                  id={`${layerId}-line`}
                  type="line"
                  paint={getLayerLineStyle(layerId) as any}
                />
              )}

              {/* Render points (non-business) */}
              {hasPoints && (
                <Layer
                  id={`${layerId}-point`}
                  type="circle"
                  paint={{
                    'circle-radius': 6,
                    'circle-color': layerConfig.style?.fill || '#3388ff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 1,
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

        {/* Popup - Compact design */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="260px"
          >
            <div className="p-2">
              {/* Popup Title - Compact */}
              <h3 className="font-semibold text-sm text-gray-900 mb-1.5 border-b border-blue-400 pb-1 leading-tight">
                {popupInfo.properties.ownername ||
                 popupInfo.properties.name ||
                 popupInfo.properties.roadname ||
                 popupInfo.properties.city ||
                 popupInfo.properties.record ||
                 'Details'}
              </h3>

              {/* Popup Content - Compact grid layout */}
              <div className="text-xs space-y-1">
              {(() => {
                const layerConfig = popupInfo.layerId ? cityConfig.layers[popupInfo.layerId] : null
                const popupFields = layerConfig?.popup_fields || []

                // Short label map for compact display
                const labelMap: { [key: string]: string } = {
                  'ownername': 'Owner',
                  'addresslin': 'Address',
                  'address': 'Address',
                  'citystatez': 'City/State',
                  'gisacres': 'Acres',
                  'totalvalue': 'Value',
                  'totalbuild': 'Bldg Value',
                  'totallandv': 'Land Value',
                  'propertyid': 'Parcel #',
                  'proptype': 'Type',
                  'sub_name': 'Subdivision',
                  'record': 'Plat',
                  'area_acres': 'Acres',
                  'name': 'Name',
                  'category': 'Type',
                  'phone': 'Phone',
                  'website': 'Website',
                  'district_n': 'District',
                  'landuse': 'Use',
                  'zoned': 'Zone',
                }

                // If popup_fields are defined, use only those fields
                if (popupFields.length > 0) {
                  return popupFields
                    .filter((fieldKey) => {
                      const value = popupInfo.properties[fieldKey]
                      // Skip title field (already shown) and empty values
                      if (fieldKey === 'ownername' || fieldKey === 'name') return false
                      return value !== null && value !== undefined && value !== ''
                    })
                    .slice(0, 6) // Limit to 6 fields max for compact display
                    .map((fieldKey) => {
                    const value = popupInfo.properties[fieldKey]
                    const label = labelMap[fieldKey] || fieldKey.replace(/_/g, ' ')

                    // Format the value
                    let formattedValue: React.ReactNode = String(value)

                    // Format website as link
                    if (fieldKey === 'website' && value) {
                      formattedValue = (
                        <a href={value.startsWith('http') ? value : `https://${value}`}
                           target="_blank" rel="noopener noreferrer"
                           className="text-blue-600 hover:underline">
                          Link
                        </a>
                      )
                    }
                    // Format phone as clickable link
                    else if (fieldKey === 'phone' && value) {
                      formattedValue = (
                        <a href={`tel:${value.replace(/\D/g, '')}`}
                           className="text-blue-600 hover:underline">
                          {value}
                        </a>
                      )
                    }
                    // Format acreage
                    else if (fieldKey === 'gisacres' || fieldKey === 'area_acres') {
                      formattedValue = `${Number(value).toFixed(2)} ac`
                    }
                    // Format currency values
                    else if (fieldKey.includes('value') || fieldKey === 'totalbuild' || fieldKey === 'totallandv') {
                      const numValue = Number(value)
                      if (!isNaN(numValue)) {
                        formattedValue = `$${(numValue / 1000).toFixed(0)}K`
                      }
                    }

                    return (
                      <div key={fieldKey} className="flex justify-between gap-2">
                        <span className="text-gray-500 shrink-0">{label}:</span>
                        <span className="text-gray-900 text-right truncate">{formattedValue}</span>
                      </div>
                    )
                  })
                } else {
                  // Fallback: show limited properties
                  return Object.entries(popupInfo.properties)
                    .filter(([key, value]) => {
                      return !key.startsWith('_') &&
                             key !== 'dataset' && key !== 'source' && key !== 'globalid' &&
                             key !== 'ownername' && key !== 'name' &&
                             value !== null && value !== ''
                    })
                    .slice(0, 5)
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-2">
                        <span className="text-gray-500 shrink-0">{labelMap[key] || key}:</span>
                        <span className="text-gray-900 text-right truncate">{String(value)}</span>
                      </div>
                    ))
                }
              })()}
              </div>

              {/* Compact action buttons */}
              <div className="mt-2 pt-1.5 border-t border-gray-200 flex gap-1.5 text-xs">
                {/* Directions link */}
                {(popupInfo.properties.addresslin || popupInfo.properties.address) && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      popupInfo.properties.address || popupInfo.properties.addresslin
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Directions
                  </a>
                )}

                {/* County Records link - for parcels */}
                {popupInfo.layerId === 'parcels' && popupInfo.properties.propertyid && (
                  <a
                    href={`https://svc.mt.gov/msl/cadastral/?searchTerm=${encodeURIComponent(popupInfo.properties.propertyid)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Records
                  </a>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
