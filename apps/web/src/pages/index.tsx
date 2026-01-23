import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import ModeSelector from '@/components/ModeSelector'
import LayerControl from '@/components/LayerControl'
import SearchBar from '@/components/SearchBar'
import WelcomeModal from '@/components/WelcomeModal'
import BusinessListPanel from '@/components/BusinessListPanel'
import { MapMode } from '@/types'

interface Business {
  name: string
  category: string
  address: string
  phone?: string
  website?: string
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
  const [cityConfig, setCityConfig] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    longitude: number
    latitude: number
    zoom?: number
  } | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)

  // Load city configuration
  useEffect(() => {
    fetch('/api/config/three-forks')
      .then((res) => res.json())
      .then((config) => {
        setCityConfig(config)
        // Set initial layers based on mode - load ALL layers from config
        const modeLayers = config.modes[currentMode]?.layers || []
        setVisibleLayers(modeLayers)
      })
      .catch((err) => console.error('Failed to load city config:', err))
  }, [currentMode])

  // Load businesses data
  useEffect(() => {
    fetch('/api/layers/three-forks/businesses')
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

  const handleModeChange = (mode: MapMode) => {
    setCurrentMode(mode)
    if (cityConfig) {
      const modeLayers = cityConfig.modes[mode]?.layers || []
      setVisibleLayers(modeLayers)
    }
  }

  const toggleLayer = (layerId: string) => {
    setVisibleLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((id) => id !== layerId)
        : [...prev, layerId]
    )
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

      <div className="relative h-screen w-screen overflow-hidden">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 bg-white shadow-md">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {cityConfig.branding.logo && (
                <img
                  src={cityConfig.branding.logo}
                  alt={`${cityConfig.name} logo`}
                  className="h-10 w-10"
                />
              )}
              <h1 className="text-xl font-bold text-gray-800">
                {cityConfig.branding.title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <SearchBar
                cityId={cityConfig.id}
                onResultSelect={handleSearchSelect}
              />
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
        <div className="absolute inset-0 pt-32">
          <MapView
            cityConfig={cityConfig}
            currentMode={currentMode}
            visibleLayers={visibleLayers}
            selectedLocation={selectedLocation}
          />
        </div>

        {/* Business List Panel (Business Mode) */}
        {currentMode === 'business' && businesses.length > 0 && (
          <aside className="absolute left-4 top-36 z-10 w-80 bg-white rounded-lg shadow-lg max-h-[calc(100vh-180px)] overflow-hidden flex flex-col">
            <BusinessListPanel
              businesses={businesses}
              onBusinessSelect={handleBusinessSelect}
              selectedBusiness={selectedBusiness}
            />

            {/* Demographics at bottom of panel */}
            {cityConfig.demographics && (
              <div className="border-t p-3 bg-gray-50">
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  {cityConfig.name} at a Glance
                </div>
                <div className="flex gap-3 text-xs text-gray-600">
                  {cityConfig.demographics.population && (
                    <div>
                      Pop: <span className="font-semibold">{cityConfig.demographics.population.toLocaleString()}</span>
                    </div>
                  )}
                  {cityConfig.demographics.median_income && (
                    <div>
                      Income: <span className="font-semibold">${(cityConfig.demographics.median_income / 1000).toFixed(0)}K</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Layer Control */}
        <aside className="absolute right-4 top-36 z-10 w-64 bg-white rounded-lg shadow-lg p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
          <LayerControl
            layers={cityConfig.modes[currentMode]?.layers || []}
            visibleLayers={visibleLayers}
            onToggleLayer={toggleLayer}
            layerConfig={cityConfig.layers}
            allLayers={Object.keys(cityConfig.layers)}
          />
        </aside>
      </div>
    </>
  )
}
