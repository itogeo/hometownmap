import React, { useEffect, useRef, useState, useCallback } from 'react'
import Map, { Source, Layer, Popup } from 'react-map-gl'
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
  selectedParcelId?: string | null
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
  selectedParcelId: externalSelectedParcelId,
  onBusinessSelect,
  onAttractionSelect,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const isMobile = useIsMobile()
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number
    latitude: number
    features: Array<{ layerId: string; layerName: string; properties: any }>
    screenX: number
    screenY: number
  } | null>(null)
  const [internalSelectedParcelId, setInternalSelectedParcelId] = useState<string | null>(null)

  // Use external selection if provided, otherwise use internal
  const selectedParcelId = externalSelectedParcelId || internalSelectedParcelId

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  // Use extracted data loading hook
  const {
    layerData,
    parcelData,
    businessData,
    attractionsData,
    findSubdivision,
    findFloodZone,
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

      // If no features clicked, close the popup and clear selection
      if (allFeatures.length === 0) {
        setPopupInfo(null)
        setInternalSelectedParcelId(null)
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

        // Enrich with subdivision and flood zone info for parcels and track selection
        if (layerId === 'parcels') {
          const subdivision = findSubdivision(event.lngLat.lng, event.lngLat.lat)
          if (subdivision) {
            enrichedProperties._subdivision = subdivision
          }
          // Check flood zone overlap
          const floodZone = findFloodZone(event.lngLat.lng, event.lngLat.lat)
          if (floodZone) {
            enrichedProperties._floodZone = floodZone.zone
            enrichedProperties._floodSubtype = floodZone.subtype
            enrichedProperties._isFloodway = floodZone.isFloodway
            enrichedProperties._isSFHA = floodZone.isSFHA
          }
          // Track selected parcel for highlighting
          const parcelId = feature.properties?.parcelid || feature.properties?.PARCELID
          if (parcelId) {
            setInternalSelectedParcelId(parcelId)
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
        screenX: event.point.x,
        screenY: event.point.y,
      })
    },
    [onAttractionSelect, findSubdivision, findFloodZone, cityConfig.layers]
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
    'hydrants-point', 'hydrants-glow', 'hydrants-inner',
    'groundwater_wells-point', 'groundwater_wells-glow', 'groundwater_wells-inner',
    // FEMA flood zone layers (combined + separate)
    'fema_flood_zones-floodplain-fill', 'fema_flood_zones-floodplain-outline',
    'fema_flood_zones-floodway-fill', 'fema_flood_zones-floodway-outline', 'fema_flood_zones-floodway-hatch',
    // Separate flood layers
    'floodplain_100yr-fill', 'floodplain_100yr-outline',
    'floodway-fill', 'floodway-outline', 'floodway-hatch',
    ...visibleLayers.filter(id => !['parcels', 'businesses', 'attractions', 'emergency_services', 'parks_recreation', 'fema_flood_zones'].includes(id))
      .flatMap((id) => [`${id}-fill`, `${id}-line`, `${id}-outline`, `${id}-point`])
  ]

  // Filter layers for rendering (excluding layers with special rendering)
  const specialLayers = ['parcels', 'businesses', 'attractions', 'emergency_services', 'parks_recreation', 'flood_zones', 'floodplain_100yr', 'floodplain_500yr', 'fema_flood_zones', 'floodway', 'hydrants', 'groundwater_wells']
  const renderableLayers = visibleLayers.filter(id => !specialLayers.includes(id))

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
                'fill-opacity': 0.15
              }}
            />
            <Layer
              id="parcels-outline"
              type="line"
              filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
              minzoom={13}
              paint={{
                'line-color': '#D97706',
                'line-width': 1,
                'line-opacity': 0.6
              }}
            />
            {/* Selected parcel highlight */}
            <Layer
              id="parcels-selected"
              type="line"
              filter={selectedParcelId
                ? ['all',
                    ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
                    ['any',
                      ['==', ['get', 'parcelid'], selectedParcelId],
                      ['==', ['get', 'PARCELID'], selectedParcelId]
                    ]
                  ]
                : ['==', 'parcelid', '__none__']
              }
              minzoom={13}
              paint={{
                'line-color': '#ffffff',
                'line-width': 4,
                'line-opacity': 1
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

        {/* FEMA FLOOD ZONES - Two distinct layers: 100-Year Floodplain + Floodway */}
        {layerData['fema_flood_zones'] && visibleLayers.includes('fema_flood_zones') && (
          <Source id="fema_flood_zones-source" type="geojson" data={layerData['fema_flood_zones']}>
            {/* 100-YEAR FLOODPLAIN (light blue) - All A/AE zones that are NOT floodway */}
            <Layer
              id="fema_flood_zones-floodplain-fill"
              type="fill"
              minzoom={10}
              filter={['all',
                ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
                ['any', ['==', ['get', 'FLD_ZONE'], 'A'], ['==', ['get', 'FLD_ZONE'], 'AE'], ['==', ['get', 'FLD_ZONE'], 'AH'], ['==', ['get', 'FLD_ZONE'], 'AO']],
                ['!=', ['get', 'ZONE_SUBTY'], 'FLOODWAY']
              ]}
              paint={{
                'fill-color': '#60A5FA',
                'fill-opacity': 0.3
              }}
            />
            <Layer
              id="fema_flood_zones-floodplain-outline"
              type="line"
              minzoom={10}
              filter={['all',
                ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
                ['any', ['==', ['get', 'FLD_ZONE'], 'A'], ['==', ['get', 'FLD_ZONE'], 'AE'], ['==', ['get', 'FLD_ZONE'], 'AH'], ['==', ['get', 'FLD_ZONE'], 'AO']],
                ['!=', ['get', 'ZONE_SUBTY'], 'FLOODWAY']
              ]}
              paint={{
                'line-color': '#2563EB',
                'line-width': 1.5,
                'line-opacity': 0.7
              }}
            />

            {/* FLOODWAY (red) - A/AE zones with ZONE_SUBTY = FLOODWAY */}
            <Layer
              id="fema_flood_zones-floodway-fill"
              type="fill"
              minzoom={10}
              filter={['all',
                ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
                ['==', ['get', 'ZONE_SUBTY'], 'FLOODWAY']
              ]}
              paint={{
                'fill-color': '#DC2626',
                'fill-opacity': 0.35
              }}
            />
            {/* Floodway hatching effect - diagonal lines */}
            <Layer
              id="fema_flood_zones-floodway-hatch"
              type="line"
              minzoom={10}
              filter={['all',
                ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
                ['==', ['get', 'ZONE_SUBTY'], 'FLOODWAY']
              ]}
              paint={{
                'line-color': '#991B1B',
                'line-width': 2.5,
                'line-opacity': 0.9,
                'line-dasharray': [2, 3]
              }}
            />
            <Layer
              id="fema_flood_zones-floodway-outline"
              type="line"
              minzoom={10}
              filter={['all',
                ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
                ['==', ['get', 'ZONE_SUBTY'], 'FLOODWAY']
              ]}
              paint={{
                'line-color': '#7F1D1D',
                'line-width': 2,
                'line-opacity': 0.9
              }}
            />
          </Source>
        )}

        {/* SEPARATE FLOODPLAIN 100-YEAR LAYER (light blue) */}
        {layerData['floodplain_100yr'] && visibleLayers.includes('floodplain_100yr') && (
          <Source id="floodplain_100yr-source" type="geojson" data={layerData['floodplain_100yr']}>
            <Layer
              id="floodplain_100yr-fill"
              type="fill"
              minzoom={10}
              filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
              paint={{
                'fill-color': '#60A5FA',
                'fill-opacity': 0.3
              }}
            />
            <Layer
              id="floodplain_100yr-outline"
              type="line"
              minzoom={10}
              filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
              paint={{
                'line-color': '#2563EB',
                'line-width': 1.5,
                'line-opacity': 0.7
              }}
            />
          </Source>
        )}

        {/* SEPARATE FLOODWAY LAYER (red with dashed border) */}
        {layerData['floodway'] && visibleLayers.includes('floodway') && (
          <Source id="floodway-source" type="geojson" data={layerData['floodway']}>
            <Layer
              id="floodway-fill"
              type="fill"
              minzoom={10}
              filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
              paint={{
                'fill-color': '#DC2626',
                'fill-opacity': 0.35
              }}
            />
            <Layer
              id="floodway-hatch"
              type="line"
              minzoom={10}
              filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
              paint={{
                'line-color': '#991B1B',
                'line-width': 2.5,
                'line-opacity': 0.9,
                'line-dasharray': [2, 3]
              }}
            />
            <Layer
              id="floodway-outline"
              type="line"
              minzoom={10}
              filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
              paint={{
                'line-color': '#7F1D1D',
                'line-width': 2,
                'line-opacity': 0.9
              }}
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
                  'circle-radius': layerId === 'building_permits' ? 4 : 8,
                  'circle-color': layerConfig.style?.fill || '#3388ff',
                  'circle-stroke-width': layerId === 'building_permits' ? 1 : 2,
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

        {/* HYDRANT MARKERS */}
        {layerData['hydrants'] && visibleLayers.includes('hydrants') && (
          <Source id="hydrants-source" type="geojson" data={layerData['hydrants']}>
            <Layer
              id="hydrants-glow"
              type="circle"
              filter={['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]}
              paint={{
                'circle-radius': 8,
                'circle-color': '#EF4444',
                'circle-opacity': 0.25,
                'circle-blur': 0.4,
              }}
            />
            <Layer
              id="hydrants-point"
              type="circle"
              filter={['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]}
              paint={{
                'circle-radius': 5,
                'circle-color': '#EF4444',
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 1,
              }}
            />
            <Layer
              id="hydrants-inner"
              type="circle"
              filter={['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]}
              paint={{
                'circle-radius': 1.5,
                'circle-color': '#ffffff',
                'circle-opacity': 1,
              }}
            />
          </Source>
        )}

        {/* GROUNDWATER WELL MARKERS */}
        {layerData['groundwater_wells'] && visibleLayers.includes('groundwater_wells') && (
          <Source id="groundwater_wells-source" type="geojson" data={layerData['groundwater_wells']}>
            <Layer
              id="groundwater_wells-glow"
              type="circle"
              filter={['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]}
              paint={{
                'circle-radius': 8,
                'circle-color': '#0EA5E9',
                'circle-opacity': 0.25,
                'circle-blur': 0.4,
              }}
            />
            <Layer
              id="groundwater_wells-point"
              type="circle"
              filter={['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]}
              paint={{
                'circle-radius': 5,
                'circle-color': '#0EA5E9',
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 1,
              }}
            />
            <Layer
              id="groundwater_wells-inner"
              type="circle"
              filter={['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]}
              paint={{
                'circle-radius': 1.5,
                'circle-color': '#ffffff',
                'circle-opacity': 1,
              }}
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
        {popupInfo && popupInfo.features.length > 0 && (() => {
          // Smart anchor: pick the best side based on click position relative to viewport
          const mapEl = mapRef.current?.getMap()?.getContainer()
          const vw = mapEl?.clientWidth || window.innerWidth
          const vh = mapEl?.clientHeight || window.innerHeight
          const nearTop = popupInfo.screenY < vh * 0.35
          const nearBottom = popupInfo.screenY > vh * 0.65
          const nearLeft = popupInfo.screenX < vw * 0.25
          const nearRight = popupInfo.screenX > vw * 0.75
          let anchor: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom'
          if (nearTop && nearLeft) anchor = 'top-left'
          else if (nearTop && nearRight) anchor = 'top-right'
          else if (nearBottom && nearLeft) anchor = 'bottom-left'
          else if (nearBottom && nearRight) anchor = 'bottom-right'
          else if (nearTop) anchor = 'top'
          else if (nearLeft) anchor = 'left'
          else if (nearRight) anchor = 'right'
          else anchor = 'bottom'
          return (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor={anchor}
            offset={15}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            closeOnClick={false}
            maxWidth={isMobile ? "calc(100vw - 32px)" : "280px"}
            className="mobile-popup"
          >
            <PopupContent
              features={popupInfo.features}
              onClose={() => setPopupInfo(null)}
              contact={cityConfig.contact}
            />
          </Popup>
          )
        })()}
      </Map>
    </div>
  )
}
