import { useEffect, useRef, useState, useCallback } from 'react'
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
}

export default function MapView({
  cityConfig,
  currentMode,
  visibleLayers,
  selectedLocation,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [layerData, setLayerData] = useState<{ [key: string]: any }>({})
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number
    latitude: number
    properties: any
  } | null>(null)

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

  // Load layer data
  useEffect(() => {
    const loadLayers = async () => {
      const newLayerData: { [key: string]: any } = {}

      for (const layerId of visibleLayers) {
        try {
          const response = await fetch(
            `/api/layers/${cityConfig.id}/${layerId}`
          )
          if (response.ok) {
            const data = await response.json()
            newLayerData[layerId] = data
          }
        } catch (error) {
          console.error(`Failed to load layer ${layerId}:`, error)
        }
      }

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
        setPopupInfo({
          longitude: coordinates[0],
          latitude: coordinates[1],
          properties: feature.properties,
        })
      } else if (feature) {
        // For polygon/line features, use click location
        setPopupInfo({
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
          properties: feature.properties,
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
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        onClick={handleClick}
        interactiveLayerIds={visibleLayers.map((id) => `${id}-layer`)}
      >
        <NavigationControl position="bottom-right" />

        {/* Render visible layers */}
        {visibleLayers.map((layerId) => {
          const data = layerData[layerId]
          if (!data) return null

          const layerConfig = cityConfig.layers[layerId]
          if (!layerConfig) return null

          return (
            <Source
              key={layerId}
              id={`${layerId}-source`}
              type="geojson"
              data={data}
            >
              {/* Render appropriate layer type based on geometry */}
              {data.features?.[0]?.geometry?.type === 'Polygon' ||
              data.features?.[0]?.geometry?.type === 'MultiPolygon' ? (
                <>
                  <Layer
                    id={`${layerId}-layer`}
                    type="fill"
                    paint={getLayerStyle(layerId) as any}
                  />
                  <Layer
                    id={`${layerId}-outline`}
                    type="line"
                    paint={getLayerLineStyle(layerId) as any}
                  />
                </>
              ) : data.features?.[0]?.geometry?.type === 'LineString' ||
                data.features?.[0]?.geometry?.type === 'MultiLineString' ? (
                <Layer
                  id={`${layerId}-layer`}
                  type="line"
                  paint={getLayerLineStyle(layerId) as any}
                />
              ) : (
                <Layer
                  id={`${layerId}-layer`}
                  type="circle"
                  paint={{
                    'circle-radius': 6,
                    'circle-color': layerConfig.style?.fill || '#3388ff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                  }}
                />
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
          >
            <div className="p-2 min-w-[200px]">
              {Object.entries(popupInfo.properties).map(([key, value]) => {
                // Skip internal properties
                if (key.startsWith('_') || key === 'dataset' || key === 'source')
                  return null

                return (
                  <div key={key} className="mb-1">
                    <span className="font-semibold text-gray-700">
                      {key.replace(/_/g, ' ').toUpperCase()}:
                    </span>{' '}
                    <span className="text-gray-600">{String(value)}</span>
                  </div>
                )
              })}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
