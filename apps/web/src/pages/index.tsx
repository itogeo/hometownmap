import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Link from 'next/link'
import ModeSelector from '@/components/ModeSelector'
import LayerControl from '@/components/LayerControl'
import SearchBar from '@/components/SearchBar'
import WelcomeModal from '@/components/WelcomeModal'
import BusinessListPanel from '@/components/BusinessListPanel'
import TourismPanel from '@/components/TourismPanel'
import MobileMenu from '@/components/MobileMenu'
import BottomSheet from '@/components/BottomSheet'
import { useIsMobile } from '@/hooks/useIsMobile'
import { MapMode } from '@/types'

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
  const [currentMode, setCurrentMode] = useState<MapMode>('resident')
  const [visibleLayers, setVisibleLayers] = useState<string[]>([])
  const [layerOrder, setLayerOrder] = useState<string[]>([])
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('streets')
  const [cityConfig, setCityConfig] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    longitude: number
    latitude: number
    zoom?: number
  } | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [selectedAttraction, setSelectedAttraction] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLayerSheetOpen, setIsLayerSheetOpen] = useState(false)
  const isMobile = useIsMobile()

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
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-2">
            <h1 className="text-lg font-semibold text-gray-900">
              {cityConfig.name}
            </h1>

            <div className="flex items-center gap-2">
              <SearchBar
                cityId={cityConfig.id}
                onResultSelect={handleSearchSelect}
                className="w-full sm:w-80"
              />
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/visit"
                  className="px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                >
                  Visit
                </Link>
                <Link
                  href="/development"
                  className="px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                >
                  Development
                </Link>
                <Link
                  href="/resources"
                  className="px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                >
                  Resources
                </Link>
              </nav>

              {/* Mobile menu button */}
              <button
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg
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
        {currentMode === 'tourism' && attractions.length > 0 && !isMobile && (
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
        {currentMode === 'tourism' && attractions.length > 0 && isMobile && (
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
              />
            </div>
          </BottomSheet>
        )}

        {/* Footer links - hidden on mobile when panels are open, responsive layout */}
        {!isMobile && (
          <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-between items-end">
            {/* Left: Contact info */}
            <div className="bg-white/95 rounded-lg shadow-sm px-3 py-2 text-[11px]">
              <div className="font-medium text-gray-700">Three Forks City Hall</div>
              <a href="tel:4062853431" className="text-blue-600 hover:text-blue-800">
                (406) 285-3431
              </a>
              <span className="text-gray-400 mx-1">|</span>
              <span className="text-gray-500">206 Main St</span>
            </div>

            {/* Right: Quick links */}
            <div className="flex gap-2 text-[11px]">
              <Link
                href="/resources"
                className="px-2 py-1 bg-white/95 text-gray-600 hover:text-gray-900 rounded shadow-sm"
              >
                Who Do I Call?
              </Link>
              <Link
                href="/test-map"
                className="px-2 py-1 bg-white/95 text-gray-600 hover:text-gray-900 rounded shadow-sm"
              >
                All Data
              </Link>
              {cityConfig.contact?.website && (
                <a
                  href={cityConfig.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-white/95 text-gray-600 hover:text-gray-900 rounded shadow-sm"
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
