import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import ModeSelector from '@/components/ModeSelector'
import LayerControl from '@/components/LayerControl'
import SearchBar from '@/components/SearchBar'
import WelcomeModal from '@/components/WelcomeModal'
import BusinessListPanel from '@/components/BusinessListPanel'
import TourismPanel from '@/components/TourismPanel'
import MobileMenu from '@/components/MobileMenu'
import BottomSheet from '@/components/BottomSheet'
import MeasurementTools, { MeasurementMode, Point } from '@/components/MeasurementTools'
import { useIsMobile } from '@/hooks/useIsMobile'
import { MapMode } from '@/types'

// Parse URL state
function parseUrlState(query: { [key: string]: string | string[] | undefined }) {
  return {
    mode: (query.mode as MapMode) || null,
    lat: query.lat ? parseFloat(query.lat as string) : null,
    lng: query.lng ? parseFloat(query.lng as string) : null,
    zoom: query.z ? parseFloat(query.z as string) : null,
    layers: query.layers ? (query.layers as string).split(',') : null,
  }
}

interface Business {
  name: string
  category: string
  address: string
  phone?: string
  website?: string
  coordinates: [number, number]
}

interface Attraction {
  name: string
  category: string
  description: string
  highlights?: string[]
  hours?: string
  fee?: string
  website?: string
  story?: string
  coordinates: [number, number]
}

// Dynamic import to avoid SSR issues with mapbox-gl
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-xl text-gray-600">Loading map...</div>
    </div>
  ),
})

export default function Home() {
  const router = useRouter()
  const [currentMode, setCurrentMode] = useState<MapMode>('property')
  const [userLocation, setUserLocation] = useState<{ longitude: number; latitude: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState<string[]>([])
  const [layerOrder, setLayerOrder] = useState<string[]>([])
  const [layerOpacity, setLayerOpacity] = useState<{ [key: string]: number }>({})
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('streets')
  const [cityConfig, setCityConfig] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    longitude: number
    latitude: number
    zoom?: number
  } | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lng: number; lat: number; zoom: number } | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [selectedAttraction, setSelectedAttraction] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLayerSheetOpen, setIsLayerSheetOpen] = useState(false)
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('none')
  const [measurementPoints, setMeasurementPoints] = useState<Point[]>([])
  const [showMeasureTools, setShowMeasureTools] = useState(false)
  const [urlStateLoaded, setUrlStateLoaded] = useState(false)
  const isMobile = useIsMobile()

  // Read URL state on initial load
  useEffect(() => {
    if (!router.isReady || urlStateLoaded) return

    const urlState = parseUrlState(router.query)

    // Apply mode from URL
    if (urlState.mode && ['property', 'planning', 'hazards', 'explore', 'business'].includes(urlState.mode)) {
      setCurrentMode(urlState.mode)
    }

    // Apply location from URL
    if (urlState.lat && urlState.lng) {
      setSelectedLocation({
        latitude: urlState.lat,
        longitude: urlState.lng,
        zoom: urlState.zoom || 16,
      })
    }

    setUrlStateLoaded(true)
  }, [router.isReady, router.query, urlStateLoaded])

  // Update URL when state changes (debounced)
  const updateUrl = useCallback((params: { mode?: string; lat?: number; lng?: number; zoom?: number }) => {
    if (!router.isReady) return

    const query: { [key: string]: string } = {}

    if (params.mode && params.mode !== 'property') {
      query.mode = params.mode
    }

    if (params.lat && params.lng) {
      query.lat = params.lat.toFixed(5)
      query.lng = params.lng.toFixed(5)
    }

    if (params.zoom && params.zoom !== 14) {
      query.z = params.zoom.toFixed(1)
    }

    // Only update if query changed
    const currentQuery = router.query
    const hasChanged = Object.keys(query).some(k => query[k] !== currentQuery[k]) ||
                       Object.keys(currentQuery).some(k => !['mode', 'lat', 'lng', 'z'].includes(k) || query[k] !== currentQuery[k])

    if (hasChanged) {
      router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
    }
  }, [router])

  // Handle map move to update URL
  const handleMapMove = useCallback((center: { lng: number; lat: number }, zoom: number) => {
    setMapCenter({ lng: center.lng, lat: center.lat, zoom })
    // Debounce URL updates
    const timeout = setTimeout(() => {
      updateUrl({ mode: currentMode, lat: center.lat, lng: center.lng, zoom })
    }, 500)
    return () => clearTimeout(timeout)
  }, [currentMode, updateUrl])

  // Load city configuration
  useEffect(() => {
    fetch('/data/config/three-forks.json')
      .then((res) => res.json())
      .then((config) => {
        setCityConfig(config)
        // Set initial layers based on mode - load ALL layers from config
        const modeLayers = config.modes[currentMode]?.layers || []
        setVisibleLayers(modeLayers)
        // Initialize layer order (reversed so first = rendered on top)
        setLayerOrder([...modeLayers].reverse())
        // Set map style from mode config
        const modeStyle = config.modes[currentMode]?.mapStyle
        if (modeStyle === 'satellite' || modeStyle === 'streets') {
          setMapStyle(modeStyle)
        }
      })
      .catch((err) => console.error('Failed to load city config:', err))
  }, [currentMode])

  // Load businesses data
  useEffect(() => {
    fetch('/data/layers/three-forks/businesses.geojson')
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          const bizList: Business[] = data.features.map((f: any) => ({
            name: f.properties.name,
            category: f.properties.category,
            address: f.properties.address,
            phone: f.properties.phone,
            website: f.properties.website,
            coordinates: f.geometry.coordinates as [number, number],
          }))
          setBusinesses(bizList)
          console.log(`✅ Loaded ${bizList.length} businesses`)
        }
      })
      .catch((err) => console.error('Failed to load businesses:', err))
  }, [])

  // Load attractions data
  useEffect(() => {
    fetch('/data/layers/three-forks/attractions.geojson')
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          const attractionList: Attraction[] = data.features.map((f: any) => ({
            name: f.properties.name,
            category: f.properties.category,
            description: f.properties.description,
            highlights: f.properties.highlights,
            hours: f.properties.hours,
            fee: f.properties.fee,
            website: f.properties.website,
            story: f.properties.story,
            coordinates: f.geometry.coordinates as [number, number],
          }))
          setAttractions(attractionList)
          console.log(`✅ Loaded ${attractionList.length} attractions`)
        }
      })
      .catch((err) => console.error('Failed to load attractions:', err))
  }, [])

  const handleModeChange = (mode: MapMode) => {
    setCurrentMode(mode)
    if (cityConfig) {
      const modeLayers = cityConfig.modes[mode]?.layers || []
      setVisibleLayers(modeLayers)
      setLayerOrder([...modeLayers].reverse())
      // Update map style from mode config
      const modeStyle = cityConfig.modes[mode]?.mapStyle
      if (modeStyle === 'satellite' || modeStyle === 'streets') {
        setMapStyle(modeStyle)
      }
    }
    // Update URL with new mode
    if (mapCenter) {
      updateUrl({ mode, lat: mapCenter.lat, lng: mapCenter.lng, zoom: mapCenter.zoom })
    } else {
      updateUrl({ mode })
    }
  }

  const toggleLayer = (layerId: string) => {
    setVisibleLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((id) => id !== layerId)
        : [...prev, layerId]
    )
  }

  const handleReorderLayer = (layerId: string, direction: 'up' | 'down') => {
    setLayerOrder((prev) => {
      const index = prev.indexOf(layerId)
      if (index === -1) return prev
      const newOrder = [...prev]
      if (direction === 'up' && index > 0) {
        // Swap with previous (move up = render on top)
        ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
      } else if (direction === 'down' && index < prev.length - 1) {
        // Swap with next (move down = render below)
        ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
      }
      return newOrder
    })
  }

  const toggleMapStyle = () => {
    setMapStyle((prev) => (prev === 'satellite' ? 'streets' : 'satellite'))
  }

  const handleOpacityChange = (layerId: string, opacity: number) => {
    setLayerOpacity(prev => ({ ...prev, [layerId]: opacity }))
  }

  const handleSearchSelect = (result: any) => {
    if (result.center) {
      setSelectedLocation({
        longitude: result.center[0],
        latitude: result.center[1],
        zoom: 17,
      })
    }
  }

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business.name)
    setSelectedLocation({
      longitude: business.coordinates[0],
      latitude: business.coordinates[1],
      zoom: 17,
    })
  }

  const handleAttractionSelect = (attraction: Attraction) => {
    setSelectedAttraction(attraction.name)
    setSelectedLocation({
      longitude: attraction.coordinates[0],
      latitude: attraction.coordinates[1],
      zoom: 15,
    })
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords
        setUserLocation({ longitude, latitude })
        setSelectedLocation({
          longitude,
          latitude,
          zoom: 16,
        })
        setIsLocating(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to get your location. Please check your browser permissions.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  if (!cityConfig) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Loading configuration...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{cityConfig.branding.title || 'HometownMap'}</title>
        <meta
          name="description"
          content={`Interactive mapping portal for ${cityConfig.name}`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </Head>

      <WelcomeModal cityName={cityConfig.name} />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        cityName={cityConfig.name}
      />

      <div className="relative h-screen w-screen overflow-hidden">
        {/* Accent bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 z-20" />

        {/* Header */}
        <header className="absolute top-1 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-tf-stone-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              {/* Logo/Brand mark */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  {cityConfig.branding?.title || 'CityView'}
                </h1>
                {cityConfig.branding?.subtitle && (
                  <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">
                    {cityConfig.branding.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <SearchBar
                cityId={cityConfig.id}
                onResultSelect={handleSearchSelect}
                className="w-full sm:w-64"
              />
              <nav className="hidden lg:flex items-center gap-1 text-xs">
                <Link
                  href="/dashboard"
                  className="px-2.5 py-1.5 text-blue-700 font-medium hover:bg-blue-50 rounded transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/visit"
                  className="px-2.5 py-1.5 text-tf-stone-500 hover:text-tf-river-700 hover:bg-tf-stone-100 rounded transition-colors"
                >
                  Visit
                </Link>
                <Link
                  href="/resources"
                  className="px-2.5 py-1.5 text-tf-stone-500 hover:text-tf-river-700 hover:bg-tf-stone-100 rounded transition-colors"
                >
                  Resources
                </Link>
              </nav>

              {/* Mobile menu button */}
              <button
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg
                           bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          <ModeSelector
            currentMode={currentMode}
            onModeChange={handleModeChange}
            availableModes={Object.keys(cityConfig.modes).filter(
              (mode) => cityConfig.modes[mode].enabled
            )}
          />
        </header>

        {/* Map */}
        <div className="absolute inset-0 pt-20">
          <MapView
            cityConfig={cityConfig}
            currentMode={currentMode}
            visibleLayers={visibleLayers}
            layerOrder={layerOrder}
            mapStyleOverride={mapStyle}
            selectedLocation={selectedLocation}
            onAttractionSelect={handleAttractionSelect}
          />
        </div>

        {/* Business List Panel - Desktop */}
        {currentMode === 'business' && businesses.length > 0 && !isMobile && (
          <aside className="absolute left-3 top-24 z-10 w-56 bg-white rounded shadow-lg" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="p-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-700">{businesses.length} Businesses</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <BusinessListPanel
                businesses={businesses}
                onBusinessSelect={handleBusinessSelect}
                selectedBusiness={selectedBusiness}
              />
            </div>
          </aside>
        )}

        {/* Business List Panel - Mobile Bottom Sheet */}
        {currentMode === 'business' && businesses.length > 0 && isMobile && (
          <BottomSheet
            isOpen={true}
            onClose={() => {}}
            title={`${businesses.length} Businesses`}
            defaultHeight={40}
            minHeight={15}
          >
            <BusinessListPanel
              businesses={businesses}
              onBusinessSelect={handleBusinessSelect}
              selectedBusiness={selectedBusiness}
            />
          </BottomSheet>
        )}

        {/* Tourism Panel - Desktop */}
        {currentMode === 'explore' && attractions.length > 0 && !isMobile && (
          <aside className="absolute left-3 top-24 z-10 w-64 bg-white rounded shadow-lg" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="p-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-700">{attractions.length} Places</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <TourismPanel
                attractions={attractions}
                onAttractionSelect={handleAttractionSelect}
                selectedAttraction={selectedAttraction}
              />
            </div>
          </aside>
        )}

        {/* Tourism Panel - Mobile Bottom Sheet */}
        {currentMode === 'explore' && attractions.length > 0 && isMobile && (
          <BottomSheet
            isOpen={true}
            onClose={() => {}}
            title={`${attractions.length} Places`}
            defaultHeight={40}
            minHeight={15}
          >
            <TourismPanel
              attractions={attractions}
              onAttractionSelect={handleAttractionSelect}
              selectedAttraction={selectedAttraction}
            />
          </BottomSheet>
        )}

        {/* Measurement Tools & Locate Me - Desktop */}
        {!isMobile && (
          <div className="absolute left-3 top-24 z-10 flex flex-col gap-2">
            {/* Locate Me button */}
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className={`w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center transition-colors ${
                isLocating ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="What's happening near me?"
            >
              {isLocating ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>

            {/* Measurement Toggle button */}
            <button
              onClick={() => setShowMeasureTools(!showMeasureTools)}
              className={`w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center transition-colors ${
                showMeasureTools ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Measurement tools"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </button>

            {/* Tools panel */}
            {showMeasureTools && (
              <div className="w-36">
                <MeasurementTools
                  currentMode={measurementMode}
                  points={measurementPoints}
                  onModeChange={setMeasurementMode}
                  onPointsChange={setMeasurementPoints}
                />
              </div>
            )}
          </div>
        )}

        {/* Locate Me - Mobile */}
        {isMobile && (
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className={`absolute left-3 top-24 z-10 w-10 h-10 bg-white rounded-lg shadow-lg
                       flex items-center justify-center touch-manipulation transition-colors ${
                         isLocating ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                       }`}
            aria-label="What's happening near me?"
          >
            {isLocating ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}

        {/* Layer Control - Desktop */}
        {!isMobile && (
          <aside className="absolute right-3 top-24 z-10 w-48 bg-white rounded shadow-lg">
            <div className="p-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Layers</span>
              <button
                onClick={toggleMapStyle}
                className="text-[10px] text-gray-500 hover:text-gray-700"
              >
                {mapStyle === 'satellite' ? 'Satellite' : 'Streets'}
              </button>
            </div>
            <div className="p-1.5 max-h-[calc(100vh-180px)] overflow-y-auto">
              <LayerControl
                layers={cityConfig.modes[currentMode]?.layers || []}
                visibleLayers={visibleLayers}
                onToggleLayer={toggleLayer}
                layerConfig={cityConfig.layers}
                layerOrder={layerOrder}
                onReorderLayer={handleReorderLayer}
                layerGroups={cityConfig.modes[currentMode]?.layerGroups}
                layerOpacity={layerOpacity}
                onOpacityChange={handleOpacityChange}
              />
            </div>
          </aside>
        )}

        {/* Layer Control - Mobile Button */}
        {isMobile && (
          <button
            onClick={() => setIsLayerSheetOpen(true)}
            className="absolute right-3 top-24 z-10 w-10 h-10 bg-white rounded-lg shadow-lg
                       flex items-center justify-center touch-manipulation"
            aria-label="Open layers"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
        )}

        {/* Layer Control - Mobile Bottom Sheet */}
        {isMobile && (
          <BottomSheet
            isOpen={isLayerSheetOpen}
            onClose={() => setIsLayerSheetOpen(false)}
            title="Layers"
            defaultHeight={50}
            minHeight={20}
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Map Style</span>
                <button
                  onClick={toggleMapStyle}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  {mapStyle === 'satellite' ? 'Satellite' : 'Streets'}
                </button>
              </div>
              <LayerControl
                layers={cityConfig.modes[currentMode]?.layers || []}
                visibleLayers={visibleLayers}
                onToggleLayer={toggleLayer}
                layerConfig={cityConfig.layers}
                layerOrder={layerOrder}
                onReorderLayer={handleReorderLayer}
                layerGroups={cityConfig.modes[currentMode]?.layerGroups}
                layerOpacity={layerOpacity}
                onOpacityChange={handleOpacityChange}
              />
            </div>
          </BottomSheet>
        )}

        {/* Footer - Contact and Quick Links */}
        {!isMobile && (
          <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-between items-end pointer-events-none">
            {/* Left: Contact info */}
            <div className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg shadow-sm px-3 py-2 text-[11px]">
              <div className="font-medium text-tf-river-700">City Hall</div>
              <div className="flex items-center gap-2 text-tf-stone-600">
                <a href="tel:4062853431" className="text-tf-forest-600 hover:text-tf-forest-700 hover:underline">
                  (406) 285-3431
                </a>
                <span className="text-tf-stone-300">•</span>
                <span>206 Main St</span>
              </div>
            </div>

            {/* Right: Quick links */}
            <div className="pointer-events-auto flex gap-2 text-[11px]">
              <Link
                href="/resources"
                className="px-2.5 py-1.5 bg-white/95 backdrop-blur-sm text-tf-river-600
                           hover:text-tf-river-800 hover:bg-white rounded-lg shadow-sm transition-colors"
              >
                Who Do I Call?
              </Link>
              <Link
                href="/projects"
                className="px-2.5 py-1.5 bg-white/95 backdrop-blur-sm text-tf-river-600
                           hover:text-tf-river-800 hover:bg-white rounded-lg shadow-sm transition-colors"
              >
                City Projects
              </Link>
              {cityConfig.contact?.website && (
                <a
                  href={cityConfig.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-white/95 backdrop-blur-sm text-tf-river-600
                             hover:text-tf-river-800 hover:bg-white rounded-lg shadow-sm transition-colors"
                >
                  City Website
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
