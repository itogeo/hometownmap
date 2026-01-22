import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import ModeSelector from '@/components/ModeSelector'
import LayerControl from '@/components/LayerControl'
import SearchBar from '@/components/SearchBar'
import WelcomeModal from '@/components/WelcomeModal'
import { MapMode } from '@/types'

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
  const [visibleLayers, setVisibleLayers] = useState<string[]>([
    'parcels',
    'city_boundary',
  ])
  const [cityConfig, setCityConfig] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    longitude: number
    latitude: number
    zoom?: number
  } | null>(null)

  // Load city configuration
  useEffect(() => {
    fetch('/api/config/three-forks')
      .then((res) => res.json())
      .then((config) => {
        setCityConfig(config)
        // Set initial layers based on mode
        const modeLayers = config.modes[currentMode]?.layers || []
        setVisibleLayers(modeLayers.slice(0, 2)) // Start with first 2 layers
      })
      .catch((err) => console.error('Failed to load city config:', err))
  }, [currentMode])

  const handleModeChange = (mode: MapMode) => {
    setCurrentMode(mode)
    if (cityConfig) {
      const modeLayers = cityConfig.modes[mode]?.layers || []
      setVisibleLayers(modeLayers.slice(0, 2))
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

        {/* Layer Control */}
        <aside className="absolute right-4 top-36 z-10 w-64 bg-white rounded-lg shadow-lg p-4">
          <LayerControl
            layers={cityConfig.modes[currentMode]?.layers || []}
            visibleLayers={visibleLayers}
            onToggleLayer={toggleLayer}
            layerConfig={cityConfig.layers}
          />
        </aside>

        {/* Demographics Card (Business Mode) */}
        {currentMode === 'business' && cityConfig.demographics && (
          <aside className="absolute left-4 bottom-4 z-10 w-64 bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-bold text-gray-800 mb-2">
              {cityConfig.name} at a Glance
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              {cityConfig.demographics.population && (
                <div>
                  Population:{' '}
                  <span className="font-semibold">
                    {cityConfig.demographics.population.toLocaleString()}
                  </span>
                </div>
              )}
              {cityConfig.demographics.median_income && (
                <div>
                  Median Income:{' '}
                  <span className="font-semibold">
                    ${cityConfig.demographics.median_income.toLocaleString()}
                  </span>
                </div>
              )}
              {cityConfig.demographics.growth_rate && (
                <div>
                  Growth Rate:{' '}
                  <span className="font-semibold">
                    {cityConfig.demographics.growth_rate}
                  </span>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </>
  )
}
