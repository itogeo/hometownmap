import { useEffect, useState, useCallback, useRef } from 'react'
import Map, { Source, Layer, NavigationControl, Popup } from 'react-map-gl'
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl'
import Head from 'next/head'
import SearchBar from './SearchBar'
import { getCitySlug, getCityLayerPath } from '@/lib/cityConfig'

interface PopupInfo {
  longitude: number
  latitude: number
  properties: any
}

export default function SimpleMap() {
  const mapRef = useRef<MapRef>(null)
  const [parcelData, setParcelData] = useState<any>(null)
  const [zoningData, setZoningData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  // Handle search result selection
  const handleSearchResult = useCallback((result: any) => {
    if (result.center && mapRef.current) {
      mapRef.current.flyTo({
        center: result.center,
        zoom: 17,
        duration: 2000
      })
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    // Load parcels
    fetch(getCityLayerPath('parcels.geojson'))
      .then(res => res.json())
      .then(data => {
        console.log('✅ Loaded parcels:', data.features?.length)
        setParcelData(data)
      })
      .catch(err => {
        console.error('❌ Error loading parcels:', err)
        setError(err.message)
      })

    // Load zoning districts
    fetch(getCityLayerPath('zoningdistricts.geojson'))
      .then(res => res.json())
      .then(data => {
        console.log('✅ Loaded zoning:', data.features?.length)
        setZoningData(data)
      })
      .catch(err => console.log('Zoning not available'))
  }, [])

  // Handle map clicks
  const handleClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0]
    if (feature) {
      setPopupInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        properties: feature.properties
      })
    }
  }, [])

  if (!mapboxToken) {
    return <div style={{padding: 20, color: 'red'}}>Missing MAPBOX_TOKEN</div>
  }

  if (error) {
    return <div style={{padding: 20, color: 'red'}}>Error: {error}</div>
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  // Format acreage
  const formatAcreage = (value: number) => {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} acres`
  }

  return (
    <>
      <Head>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </Head>
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: -111.5514,
            latitude: 45.8925,
            zoom: 13
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          onClick={handleClick}
          interactiveLayerIds={['parcels-fill', 'parcels-outline', 'zoning-fill']}
        >
          <NavigationControl position="top-right" />

          {/* Zoning Districts - shows at all zoom levels */}
          {zoningData && zoningData.features?.length > 0 && (
            <Source id="zoning" type="geojson" data={zoningData}>
              <Layer
                id="zoning-fill"
                type="fill"
                paint={{
                  'fill-color': [
                    'match',
                    ['get', 'zone_type'],
                    'residential', '#22c55e',
                    'commercial', '#3b82f6',
                    'industrial', '#f59e0b',
                    'agricultural', '#84cc16',
                    '#9333ea' // default purple
                  ],
                  'fill-opacity': 0.25
                }}
              />
              <Layer
                id="zoning-outline"
                type="line"
                paint={{
                  'line-color': '#000000',
                  'line-width': 1,
                  'line-opacity': 0.5
                }}
              />
            </Source>
          )}

          {/* Parcels - only visible when zoomed in (zoom >= 14) */}
          {parcelData && (
            <Source id="parcels" type="geojson" data={parcelData}>
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

          {/* Popup for clicked features */}
          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
              closeButton={true}
              closeOnClick={false}
              maxWidth="350px"
            >
              <div style={{ padding: '12px', maxWidth: '320px' }}>
                {/* Owner Name - Title */}
                <h3 style={{
                  fontWeight: 'bold',
                  fontSize: '16px',
                  marginBottom: '12px',
                  borderBottom: '2px solid #3b82f6',
                  paddingBottom: '8px',
                  color: '#1f2937'
                }}>
                  {popupInfo.properties.ownername || 'Unknown Owner'}
                </h3>

                {/* Key Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Acreage */}
                  {popupInfo.properties.gisacres && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                        Acreage
                      </div>
                      <div style={{ fontSize: '14px', color: '#111827' }}>
                        {formatAcreage(popupInfo.properties.gisacres)}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {popupInfo.properties.addresslin && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                        Address
                      </div>
                      <div style={{ fontSize: '14px', color: '#111827' }}>
                        {popupInfo.properties.addresslin}
                      </div>
                    </div>
                  )}

                  {/* Property Type */}
                  {popupInfo.properties.proptype && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                        Property Type
                      </div>
                      <div style={{ fontSize: '14px', color: '#111827' }}>
                        {popupInfo.properties.proptype}
                      </div>
                    </div>
                  )}

                  {/* Tax Assessed Value */}
                  {popupInfo.properties.totalvalue && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                        Tax Assessed Value
                      </div>
                      <div style={{ fontSize: '14px', color: '#111827' }}>
                        {formatCurrency(popupInfo.properties.totalvalue)}
                      </div>
                    </div>
                  )}

                  {/* Tax Year */}
                  {popupInfo.properties.taxyear && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                        Tax Year
                      </div>
                      <div style={{ fontSize: '14px', color: '#111827' }}>
                        {popupInfo.properties.taxyear}
                      </div>
                    </div>
                  )}

                  {/* Property ID */}
                  {popupInfo.properties.propertyid && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                        Property ID
                      </div>
                      <div style={{ fontSize: '14px', color: '#111827' }}>
                        {popupInfo.properties.propertyid}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {/* Search bar */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000
        }}>
          <SearchBar cityId={getCitySlug()} onResultSelect={handleSearchResult} />
        </div>

        {/* Status overlay */}
        <div style={{
          position: 'absolute',
          top: 60,
          left: 10,
          background: 'rgba(255,255,255,0.9)',
          padding: 10,
          borderRadius: 5,
          zIndex: 999,
          fontSize: '12px'
        }}>
          <strong>Three Forks Map</strong><br/>
          Parcels: {parcelData ? parcelData.features?.length : 'Loading...'}<br/>
          Zoning: {zoningData ? zoningData.features?.length : 'N/A'}<br/>
          <em style={{color: '#666'}}>Zoom in to see parcels</em>
        </div>
      </div>
    </>
  )
}
