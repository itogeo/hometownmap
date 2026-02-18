import React, { useEffect, useRef, useState, useCallback } from 'react'
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl'
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl'
import { CityConfig, MapMode, Feature } from '@/types'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useMapData } from '@/hooks/useMapData'
import PopupContent from '@/components/map/PopupContent'

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
  const isMobile = useIsMobile()
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number
    latitude: number
    features: Array<{ layerId: string; layerName: string; properties: any }>
    screenY: number
  } | null>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  // Use extracted data loading hook
  const {
    layerData,
    parcelData,
    businessData,
    attractionsData,
    findSubdivision,
  } = useMapData({ cityId: cityConfig.id, visibleLayers })

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

      // If no features clicked, close the popup
      if (allFeatures.length === 0) {
        setPopupInfo(null)
        return
      }

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
        return
      }

      // Gather info from all clicked features
      const featureInfos: Array<{ layerId: string; layerName: string; properties: any }> = []
      const seenLayers = new Set<string>()

      for (const feature of allFeatures) {
        const sourceId = feature.source as string
        const layerId = sourceId?.replace('-source', '')

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
        screenY: event.point.y,
      })
    },
    [onAttractionSelect, findSubdivision, cityConfig.layers]
  )

  const getLayerStyle = (layerId: string) => {
    const config = cityConfig.layers[layerId]
    if (!config) return null

    const style = config.style || {}
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

    if (layerId === 'cities') {
      lineStyle['line-dasharray'] = [4, 3]
    }

    return lineStyle
  }

  const getMapStyle = () => {
    const styleMap: { [key: string]: string } = {
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
      streets: 'mapbox://styles/mapbox/streets-v12',
      light: 'mapbox://styles/mapbox/light-v11',
      dark: 'mapbox://styles/mapbox/dark-v11',
      outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    }

    if (mapStyleOverride) {
      return styleMap[mapStyleOverride] || styleMap.streets
    }

    const modeConfig = cityConfig.modes[currentMode]
    const stylePreference = modeConfig?.mapStyle || 'streets'
    return styleMap[stylePreference] || styleMap.streets
  }

  // Get interactive layer IDs
  const interactiveLayerIds = [
    'parcels-fill', 'parcels-outline',
    'businesses-point', 'businesses-shadow', 'businesses-inner', 'businesses-label',
    'attractions-point', 'attractions-glow', 'attractions-icon',
    'emergency_services-point', 'emergency_services-glow', 'emergency_services-icon',
    'parks_recreation-point', 'parks_recreation-glow', 'parks_recreation-icon',
    ...visibleLayers.filter(id => !['parcels', 'businesses', 'attractions', 'emergency_services', 'parks_recreation'].includes(id))
      .flatMap((id) => [`${id}-fill`, `${id}-line`, `${id}-outline`, `${id}-point`])
  ]

  // Filter layers for rendering (excluding special layers)
  const renderableLayers = [...layerOrder].reverse()
    .filter(id => visibleLayers.includes(id) &&
      !['parcels', 'businesses', 'attractions', 'flood_zones', 'floodplain_100yr', 'floodplain_500yr'].includes(id))

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
        style={{ width: '100%', height: '100%', cursor: 'pointer' }}
        mapStyle={getMapStyle()}
        onClick={handleClick}
        interactiveLayerIds={interactiveLayerIds}
        cursor="pointer"
      >
        <NavigationControl position="bottom-right" />

        {/* PARCEL RENDERING */}
        {parcelData && visibleLayers.includes('parcels') && (
          <Source id="parcels-source" type="geojson" data={parcelData}>
            <Layer
              id="parcels-fill"
              type="fill"
              filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
              minzoom={13}
              paint={{
                'fill-color': '#FEF3C7',
                'fill-opacity': 0.4
              }}
            />
            <Layer
              id="parcels-outline"
              type="line"
              filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
              minzoom={13}
              paint={{
                'line-color': '#D97706',
                'line-width': 1.5,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* 500-YEAR FLOODPLAIN */}
        {layerData['floodplain_500yr'] && visibleLayers.includes('floodplain_500yr') && (
          <Source id="floodplain_500yr-source" type="geojson" data={layerData['floodplain_500yr']}>
            <Layer
              id="floodplain_500yr-fill"
              type="fill"
              filter={['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']], ['==', ['get', 'FLD_ZONE'], 'X']]}
              paint={{ 'fill-color': '#E0F2FE', 'fill-opacity': 0.3 }}
            />
            <Layer
              id="floodplain_500yr-outline"
              type="line"
              filter={['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']], ['==', ['get', 'FLD_ZONE'], 'X']]}
              paint={{ 'line-color': '#7DD3FC', 'line-width': 0.75, 'line-opacity': 0.5 }}
            />
          </Source>
        )}

        {/* 100-YEAR FLOODPLAIN */}
        {layerData['floodplain_100yr'] && visibleLayers.includes('floodplain_100yr') && (
          <Source id="floodplain_100yr-source" type="geojson" data={layerData['floodplain_100yr']}>
            <Layer
              id="floodplain_100yr-fill"
              type="fill"
              filter={['all',
                ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
                ['any', ['==', ['get', 'FLD_ZONE'], 'A'], ['==', ['get', 'FLD_ZONE'], 'AE'], ['==', ['get', 'FLD_ZONE'], 'AH'], ['==', ['get', 'FLD_ZONE'], 'AO']]
              ]}
              paint={{
                'fill-color': ['match', ['get', 'FLD_ZONE'], 'A', '#1D4ED8', 'AE', '#3B82F6', 'AH', '#60A5FA', 'AO', '#93C5FD', '#3B82F6'],
                'fill-opacity': 0.35
              }}
            />
            <Layer
              id="floodplain_100yr-outline"
              type="line"
              filter={['all',
                ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
                ['any', ['==', ['get', 'FLD_ZONE'], 'A'], ['==', ['get', 'FLD_ZONE'], 'AE'], ['==', ['get', 'FLD_ZONE'], 'AH'], ['==', ['get', 'FLD_ZONE'], 'AO']]
              ]}
              paint={{
                'line-color': ['match', ['get', 'FLD_ZONE'], 'A', '#1E3A8A', 'AE', '#1D4ED8', 'AH', '#2563EB', 'AO', '#3B82F6', '#1D4ED8'],
                'line-width': 1.5, 'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Legacy flood zones */}
        {layerData['flood_zones'] && visibleLayers.includes('flood_zones') && (
          <Source id="flood_zones-source" type="geojson" data={layerData['flood_zones']}>
            <Layer
              id="flood_zones-fill"
              type="fill"
              filter={['all',
                ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
                ['any', ['==', ['get', 'FLD_ZONE'], 'A'], ['==', ['get', 'FLD_ZONE'], 'AE'], ['==', ['get', 'FLD_ZONE'], 'AH'], ['==', ['get', 'FLD_ZONE'], 'AO']]
              ]}
              paint={{ 'fill-color': '#3B82F6', 'fill-opacity': 0.35 }}
            />
            <Layer
              id="flood_zones-outline"
              type="line"
              filter={['all',
                ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
                ['any', ['==', ['get', 'FLD_ZONE'], 'A'], ['==', ['get', 'FLD_ZONE'], 'AE'], ['==', ['get', 'FLD_ZONE'], 'AH'], ['==', ['get', 'FLD_ZONE'], 'AO']]
              ]}
              paint={{ 'line-color': '#1D4ED8', 'line-width': 1.5, 'line-opacity': 0.8 }}
            />
          </Source>
        )}

        {/* Render other visible layers */}
        {renderableLayers.map((layerId) => {
          const data = layerData[layerId]
          if (!data || !data.features || data.features.length === 0) return null

          const layerConfig = cityConfig.layers[layerId]
          if (!layerConfig) return null

          return (
            <Source key={layerId} id={`${layerId}-source`} type="geojson" data={data}>
              <Layer
                id={`${layerId}-fill`}
                type="fill"
                filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
                minzoom={layerConfig.minzoom || 0}
                paint={getLayerStyle(layerId) as any}
              />
              <Layer
                id={`${layerId}-outline`}
                type="line"
                filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
                minzoom={layerConfig.minzoom || 0}
                paint={getLayerLineStyle(layerId) as any}
                layout={layerId === 'cities' ? { 'line-cap': 'round', 'line-join': 'round' } : undefined}
              />
              <Layer
                id={`${layerId}-line`}
                type="line"
                filter={['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']]}
                paint={getLayerLineStyle(layerId) as any}
              />
              <Layer
                id={`${layerId}-point`}
                type="circle"
                filter={['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]}
                paint={{
                  'circle-radius': 8,
                  'circle-color': layerConfig.style?.fill || '#3388ff',
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff',
                  'circle-opacity': 1,
                }}
              />
              <Layer
                id={`${layerId}-point-label`}
                type="symbol"
                filter={['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]}
                layout={{
                  'text-field': ['coalesce', ['get', 'name'], ['get', 'NAME'], ''],
                  'text-size': 10,
                  'text-anchor': 'top',
                  'text-offset': [0, 1],
                  'text-max-width': 8,
                  'text-allow-overlap': false,
                }}
                paint={{
                  'text-color': layerConfig.style?.stroke || '#1F2937',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 1.5,
                }}
              />
              {layerId === 'subdivisions' && (
                <Layer
                  id={`${layerId}-label`}
                  type="symbol"
                  filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
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
                    'text-color': '#6D28D9',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 1.5,
                    'text-opacity': 0.9,
                  }}
                />
              )}
            </Source>
          )
        })}

        {/* EMERGENCY SERVICES MARKERS */}
        {layerData['emergency_services'] && visibleLayers.includes('emergency_services') && (
          <Source id="emergency_services-source" type="geojson" data={layerData['emergency_services']}>
            <Layer
              id="emergency_services-glow"
              type="circle"
              paint={{
                'circle-radius': 16,
                'circle-color': ['match', ['get', 'type'],
                  'Fire Station', '#DC2626', 'Law Enforcement', '#1D4ED8', 'Medical', '#059669',
                  'School', '#7C3AED', 'Government', '#0891B2', 'Library', '#D97706',
                  'Post Office', '#6366F1', '#6B7280'],
                'circle-opacity': 0.35, 'circle-blur': 0.5,
              }}
            />
            <Layer
              id="emergency_services-point"
              type="circle"
              paint={{
                'circle-radius': 12,
                'circle-color': ['match', ['get', 'type'],
                  'Fire Station', '#DC2626', 'Law Enforcement', '#1D4ED8', 'Medical', '#059669',
                  'School', '#7C3AED', 'Government', '#0891B2', 'Library', '#D97706',
                  'Post Office', '#6366F1', '#6B7280'],
                'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff', 'circle-opacity': 1,
              }}
            />
            <Layer
              id="emergency_services-icon"
              type="symbol"
              layout={{
                'text-field': ['match', ['get', 'type'],
                  'Fire Station', 'F', 'Law Enforcement', 'P', 'Medical', 'M',
                  'School', 'S', 'Government', 'G', 'Library', 'L',
                  'Post Office', 'PO', '?'],
                'text-size': 11, 'text-anchor': 'center', 'text-allow-overlap': true,
                'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              }}
              paint={{ 'text-color': '#ffffff', 'text-opacity': 1 }}
            />
            <Layer
              id="emergency_services-label"
              type="symbol"
              layout={{
                'text-field': ['get', 'name'], 'text-size': 11, 'text-anchor': 'top', 'text-offset': [0, 1.5],
                'text-max-width': 10, 'text-allow-overlap': false,
              }}
              paint={{ 'text-color': '#1F2937', 'text-halo-color': '#ffffff', 'text-halo-width': 2 }}
            />
          </Source>
        )}

        {/* PARKS & RECREATION MARKERS */}
        {layerData['parks_recreation'] && visibleLayers.includes('parks_recreation') && (
          <Source id="parks_recreation-source" type="geojson" data={layerData['parks_recreation']}>
            <Layer
              id="parks_recreation-glow"
              type="circle"
              paint={{
                'circle-radius': 16,
                'circle-color': ['match', ['get', 'type'],
                  'City Park', '#16A34A', 'State Park', '#059669', 'Recreation', '#0891B2',
                  'Fishing Access', '#0284C7', 'Attraction', '#D97706', '#16A34A'],
                'circle-opacity': 0.35, 'circle-blur': 0.5,
              }}
            />
            <Layer
              id="parks_recreation-point"
              type="circle"
              paint={{
                'circle-radius': 12,
                'circle-color': ['match', ['get', 'type'],
                  'City Park', '#16A34A', 'State Park', '#059669', 'Recreation', '#0891B2',
                  'Fishing Access', '#0284C7', 'Attraction', '#D97706', '#16A34A'],
                'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff', 'circle-opacity': 1,
              }}
            />
            <Layer
              id="parks_recreation-icon"
              type="symbol"
              layout={{
                'text-field': ['match', ['get', 'type'],
                  'City Park', 'P', 'State Park', 'SP', 'Recreation', 'R',
                  'Fishing Access', 'FA', 'Attraction', 'A', 'P'],
                'text-size': 11, 'text-anchor': 'center', 'text-allow-overlap': true,
                'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              }}
              paint={{ 'text-color': '#ffffff', 'text-opacity': 1 }}
            />
            <Layer
              id="parks_recreation-label"
              type="symbol"
              layout={{
                'text-field': ['get', 'name'], 'text-size': 11, 'text-anchor': 'top', 'text-offset': [0, 1.5],
                'text-max-width': 10, 'text-allow-overlap': false,
              }}
              paint={{ 'text-color': '#15803D', 'text-halo-color': '#ffffff', 'text-halo-width': 2 }}
            />
          </Source>
        )}

        {/* BUSINESS MARKERS */}
        {businessData && visibleLayers.includes('businesses') && (
          <Source id="businesses-source" type="geojson" data={businessData}>
            <Layer id="businesses-shadow" type="circle" paint={{ 'circle-radius': 14, 'circle-color': '#1E40AF', 'circle-opacity': 0.4, 'circle-blur': 0.4 }} />
            <Layer id="businesses-point" type="circle" paint={{ 'circle-radius': 10, 'circle-color': '#3B82F6', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#ffffff', 'circle-opacity': 1 }} />
            <Layer id="businesses-inner" type="circle" paint={{ 'circle-radius': 3, 'circle-color': '#ffffff', 'circle-opacity': 1 }} />
            <Layer
              id="businesses-label"
              type="symbol"
              layout={{ 'text-field': ['get', 'name'], 'text-size': 10, 'text-anchor': 'top', 'text-offset': [0, 1], 'text-max-width': 8, 'text-allow-overlap': false }}
              paint={{ 'text-color': '#1E40AF', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 }}
            />
          </Source>
        )}

        {/* ATTRACTION MARKERS */}
        {attractionsData && visibleLayers.includes('attractions') && (
          <Source id="attractions-source" type="geojson" data={attractionsData}>
            <Layer
              id="attractions-glow"
              type="circle"
              paint={{
                'circle-radius': 18,
                'circle-color': ['match', ['get', 'category'],
                  'State Park', '#059669', 'Historic Site', '#7C3AED', 'Trail', '#0891B2',
                  'Historic Landmark', '#B45309', 'Museum', '#6366F1', 'Recreation', '#0D9488',
                  'City Park', '#16A34A', 'Events', '#DC2626', 'Lodging', '#EA580C', '#F59E0B'],
                'circle-opacity': 0.35, 'circle-blur': 0.5,
              }}
            />
            <Layer
              id="attractions-point"
              type="circle"
              paint={{
                'circle-radius': 12,
                'circle-color': ['match', ['get', 'category'],
                  'State Park', '#059669', 'Historic Site', '#7C3AED', 'Trail', '#0891B2',
                  'Historic Landmark', '#B45309', 'Museum', '#6366F1', 'Recreation', '#0D9488',
                  'City Park', '#16A34A', 'Events', '#DC2626', 'Lodging', '#EA580C', '#F59E0B'],
                'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff', 'circle-opacity': 1,
              }}
            />
            <Layer
              id="attractions-icon"
              type="symbol"
              layout={{
                'text-field': ['match', ['get', 'category'],
                  'State Park', 'SP', 'Historic Site', 'H', 'Trail', 'T', 'Historic Landmark', 'HL',
                  'Museum', 'M', 'Recreation', 'R', 'City Park', 'P', 'Events', 'E', 'Lodging', 'L', '?'],
                'text-size': 11, 'text-anchor': 'center', 'text-allow-overlap': true,
                'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              }}
              paint={{ 'text-color': '#ffffff', 'text-opacity': 1 }}
            />
            <Layer
              id="attractions-label"
              type="symbol"
              layout={{
                'text-field': ['get', 'name'], 'text-size': 11, 'text-anchor': 'top', 'text-offset': [0, 1.8],
                'text-max-width': 10, 'text-allow-overlap': false, 'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
              }}
              paint={{ 'text-color': '#1F2937', 'text-halo-color': '#ffffff', 'text-halo-width': 2 }}
            />
          </Source>
        )}

        {/* Popup */}
        {popupInfo && popupInfo.features.length > 0 && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor={popupInfo.screenY < 300 ? 'top' : 'bottom'}
            offset={popupInfo.screenY < 300 ? [0, 15] : [0, -15]}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            closeOnClick={true}
            maxWidth={isMobile ? "calc(100vw - 32px)" : "320px"}
            className="mobile-popup"
          >
            <PopupContent
              features={popupInfo.features}
              onClose={() => setPopupInfo(null)}
            />
          </Popup>
        )}
      </Map>
    </div>
  )
}
