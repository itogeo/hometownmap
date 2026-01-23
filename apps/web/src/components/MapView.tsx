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
}

export default function MapView({
  cityConfig,
  currentMode,
  visibleLayers,
  selectedLocation,
  onBusinessSelect,
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
        // Skip parcels - loaded separately for reliability
        if (layerId === 'parcels') continue

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

      if (feature && feature.geometry.type === 'Point') {
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates

        // Get layer ID from the feature's source layer
        const layerId = event.features?.[0]?.source?.replace('-source', '')

        setPopupInfo({
          longitude: coordinates[0],
          latitude: coordinates[1],
          properties: feature.properties,
          layerId: layerId || undefined,
        })
      } else if (feature) {
        // For polygon/line features, use click location
        // Get layer ID from the feature's source layer
        const layerId = event.features?.[0]?.source?.replace('-source', '')

        setPopupInfo({
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
          properties: feature.properties,
          layerId: layerId || undefined,
        })
      }
    },
    []
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
          // Config-driven layers
          ...visibleLayers.filter(id => id !== 'parcels').flatMap((id) => [
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
            {/* Red outline - 50% opacity */}
            <Layer
              id="parcels-outline"
              type="line"
              minzoom={14}
              paint={{
                'line-color': '#FF0000',
                'line-width': 2,
                'line-opacity': 0.5
              }}
            />
          </Source>
        )}

        {/* Render other visible layers */}
        {visibleLayers.filter(id => id !== 'parcels').map((layerId) => {
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
              {/* Render polygons - NO FILTER, just render directly */}
              {hasPolygons && (
                <>
                  <Layer
                    id={`${layerId}-fill`}
                    type="fill"
                    minzoom={layerConfig.minzoom || 0}
                    paint={getLayerStyle(layerId) as any}
                  />
                  <Layer
                    id={`${layerId}-outline`}
                    type="line"
                    minzoom={layerConfig.minzoom || 0}
                    paint={getLayerLineStyle(layerId) as any}
                  />
                  {/* Add text labels for subdivisions */}
                  {(layerId === 'majorsubdivisions' || layerId === 'minorsubdivisions') && (
                    <Layer
                      id={`${layerId}-label`}
                      type="symbol"
                      minzoom={layerConfig.minzoom || 0}
                      layout={{
                        'text-field': layerId === 'majorsubdivisions'
                          ? ['get', 'sub_name']
                          : ['get', 'record'],
                        'text-size': layerId === 'majorsubdivisions' ? 14 : 11,
                        'text-anchor': 'center',
                        'text-justify': 'center',
                        'text-max-width': 8,
                        'text-allow-overlap': false,
                        'text-ignore-placement': false,
                      }}
                      paint={{
                        'text-color': layerId === 'majorsubdivisions' ? '#B45309' : '#A16207',
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 2,
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

              {/* Render points - with larger, more visible markers */}
              {hasPoints && (
                <>
                  <Layer
                    id={`${layerId}-point`}
                    type="circle"
                    paint={{
                      'circle-radius': layerId === 'businesses' ? 10 : 6,
                      'circle-color': layerId === 'businesses' ? '#3B82F6' : (layerConfig.style?.fill || '#3388ff'),
                      'circle-stroke-width': layerId === 'businesses' ? 3 : 2,
                      'circle-stroke-color': '#ffffff',
                      'circle-opacity': 1,
                    }}
                  />
                  {/* Add labels for businesses */}
                  {layerId === 'businesses' && (
                    <Layer
                      id={`${layerId}-label`}
                      type="symbol"
                      layout={{
                        'text-field': ['get', 'name'],
                        'text-size': 12,
                        'text-anchor': 'top',
                        'text-offset': [0, 1],
                        'text-max-width': 10,
                        'text-allow-overlap': false,
                      }}
                      paint={{
                        'text-color': '#1E40AF',
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 2,
                      }}
                    />
                  )}
                </>
              )}
            </Source>
          )
        })}

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="400px"
          >
            <div className="p-4">
              {/* Popup Title */}
              <h3 className="font-bold text-lg text-gray-900 mb-3 border-b-2 border-blue-500 pb-2">
                {popupInfo.properties.ownername ||
                 popupInfo.properties.name ||
                 popupInfo.properties.roadname ||
                 popupInfo.properties.city ||
                 popupInfo.properties.record ||
                 'Property Details'}
              </h3>

              {/* Popup Content - Use popup_fields from config if available */}
              {(() => {
                const layerConfig = popupInfo.layerId ? cityConfig.layers[popupInfo.layerId] : null
                const popupFields = layerConfig?.popup_fields || []

                // If popup_fields are defined, use only those fields
                if (popupFields.length > 0) {
                  return popupFields.map((fieldKey) => {
                    const value = popupInfo.properties[fieldKey]

                    // Skip null, undefined, or empty values
                    if (value === null || value === undefined || value === '') return null

                    // Format the label
                    const labelMap: { [key: string]: string } = {
                      'ownername': 'Owner',
                      'addresslin': 'Address',
                      'address': 'Address',
                      'gisacres': 'Acreage',
                      'totalvalue': 'Tax Assessed Value',
                      'legaldescr': 'Legal Description',
                      'propertyid': 'Property ID',
                      'taxyear': 'Tax Year',
                      'proptype': 'Property Type',
                      'totalbuild': 'Building Value',
                      'totallandv': 'Land Value',
                      'citystatez': 'City/State/ZIP',
                      'ownercity': 'Owner City',
                      'ownerstate': 'Owner State',
                      'area_sqm': 'Area',
                      'area_acres': 'Area',
                      'sub_name': 'Subdivision Name',
                      'record': 'Record',
                      'name': 'Name',
                      'category': 'Category',
                      'phone': 'Phone',
                      'website': 'Website',
                    }

                    const label = labelMap[fieldKey] || fieldKey
                      .replace(/_/g, ' ')
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')

                    // Format the value
                    let formattedValue: React.ReactNode = String(value)

                    // Format website as link
                    if (fieldKey === 'website' && value) {
                      formattedValue = (
                        <a
                          href={value.startsWith('http') ? value : `https://${value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {value.replace(/^https?:\/\//, '')}
                        </a>
                      )
                    }
                    // Format acreage
                    else if (fieldKey === 'gisacres' || fieldKey === 'area_acres' || fieldKey.includes('acres')) {
                      formattedValue = `${Number(value).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2
                      })} acres`
                    }
                    // Format currency values
                    else if (fieldKey.includes('value') || fieldKey.includes('build') || fieldKey.includes('landv')) {
                      const numValue = Number(value)
                      if (!isNaN(numValue)) {
                        formattedValue = `$${numValue.toLocaleString(undefined, {
                          maximumFractionDigits: 0
                        })}`
                      }
                    }
                    // Format area in square meters
                    else if (fieldKey === 'area_sqm') {
                      formattedValue = `${Number(value).toLocaleString(undefined, {
                        maximumFractionDigits: 0
                      })} sq m`
                    }
                    // Format lengths
                    else if (fieldKey.includes('length_')) {
                      formattedValue = `${Number(value).toLocaleString(undefined, {
                        maximumFractionDigits: 1
                      })} ${fieldKey.includes('_m') ? 'm' : 'ft'}`
                    }
                    // Format dates (YYYYMMDD)
                    else if ((fieldKey === 'updated' || fieldKey.includes('date')) && value.toString().length === 8) {
                      const str = value.toString()
                      formattedValue = `${str.slice(4,6)}/${str.slice(6,8)}/${str.slice(0,4)}`
                    }

                    return (
                      <div key={fieldKey} className="mb-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {label}
                        </div>
                        <div className="text-sm text-gray-900 mt-0.5">
                          {formattedValue}
                        </div>
                      </div>
                    )
                  })
                } else {
                  // Fallback: show all properties if no popup_fields defined
                  return Object.entries(popupInfo.properties).map(([key, value]) => {
                    if (
                      key.startsWith('_') ||
                      key === 'dataset' ||
                      key === 'source' ||
                      key === 'globalid' ||
                      key === 'ownername' || // Skip since it's in title
                      value === null ||
                      value === ''
                    ) return null

                    const label = key
                      .replace(/_/g, ' ')
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')

                    return (
                      <div key={key} className="mb-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase">
                          {label}
                        </div>
                        <div className="text-sm text-gray-900">
                          {String(value)}
                        </div>
                      </div>
                    )
                  })
                }
              })()}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
