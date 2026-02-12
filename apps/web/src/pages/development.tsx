import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Link from 'next/link'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-gray-600">Loading map...</div>
    </div>
  ),
})

interface ZoneInfo {
  code: string
  name: string
  description: string
  uses: string[]
  color: string
}

const ZONING_INFO: ZoneInfo[] = [
  {
    code: 'R-1',
    name: 'Residential - Low Density',
    description: 'Single-family residential, large lots',
    uses: ['Single-family homes', 'Home occupations', 'Accessory buildings'],
    color: '#4682B4',
  },
  {
    code: 'R-2',
    name: 'Residential - Medium Density',
    description: 'Single and two-family residential',
    uses: ['Single-family homes', 'Duplexes', 'Home occupations', 'Parks'],
    color: '#87CEEB',
  },
  {
    code: 'R-3',
    name: 'Residential - High Density',
    description: 'Multi-family residential',
    uses: ['Apartments', 'Townhouses', 'Condos', 'Assisted living'],
    color: '#6495ED',
  },
  {
    code: 'CBD',
    name: 'Central Business District',
    description: 'Downtown commercial core',
    uses: ['Retail', 'Restaurants', 'Offices', 'Mixed-use', 'Entertainment'],
    color: '#E31C3D',
  },
  {
    code: 'C-1',
    name: 'Commercial - General',
    description: 'General commercial uses',
    uses: ['Retail stores', 'Service businesses', 'Restaurants', 'Gas stations'],
    color: '#FFD700',
  },
  {
    code: 'I-1',
    name: 'Industrial - Light',
    description: 'Light industrial and manufacturing',
    uses: ['Warehouses', 'Light manufacturing', 'Contractors', 'Storage'],
    color: '#FF8C00',
  },
  {
    code: 'A/R',
    name: 'Agricultural/Residential',
    description: 'Rural residential with agricultural uses',
    uses: ['Farming', 'Ranching', 'Single-family homes', 'Barns', 'Stables'],
    color: '#9ACD32',
  },
]

const PERMIT_STEPS = [
  {
    step: 1,
    title: 'Pre-Application Meeting',
    description: 'Schedule a meeting with City staff to discuss your project',
    details: 'Free consultation to understand requirements before you apply',
  },
  {
    step: 2,
    title: 'Submit Application',
    description: 'Complete application forms with required documents',
    details: 'Site plan, building plans, and application fee required',
  },
  {
    step: 3,
    title: 'Plan Review',
    description: 'City reviews plans for code compliance',
    details: 'Typically 2-4 weeks for residential, longer for commercial',
  },
  {
    step: 4,
    title: 'Permit Issued',
    description: 'Receive your building permit',
    details: 'Post permit on job site before starting work',
  },
  {
    step: 5,
    title: 'Inspections',
    description: 'Schedule inspections during construction',
    details: 'Foundation, framing, electrical, plumbing, final',
  },
  {
    step: 6,
    title: 'Certificate of Occupancy',
    description: 'Final approval to use the building',
    details: 'Required before moving in or opening for business',
  },
]

export default function DevelopmentPage() {
  const [cityConfig, setCityConfig] = useState<any>(null)
  const [selectedZone, setSelectedZone] = useState<ZoneInfo | null>(null)

  useEffect(() => {
    fetch('/data/config/three-forks.json')
      .then((res) => res.json())
      .then(setCityConfig)
      .catch((err) => console.error('Failed to load config:', err))
  }, [])

  if (!cityConfig) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Override config for development view
  const devConfig = {
    ...cityConfig,
    modes: {
      development: {
        ...cityConfig.modes.development,
        layers: ['zoningdistricts', 'parcels', 'subdivisions', 'cities'],
      }
    }
  }

  return (
    <>
      <Head>
        <title>Development Guide | Three Forks, MT</title>
        <meta
          name="description"
          content="Guide to building and development in Three Forks, Montana. Zoning information, permit process, and contact information."
        />
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
              ← Back to Map
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Development Guide
            </h1>
            <p className="text-gray-600">Building and zoning information for Three Forks</p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6">
          {/* Quick Contact */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-blue-900">Questions about your project?</h2>
                <p className="text-sm text-blue-700">Contact City Hall for a free pre-application consultation</p>
              </div>
              <div className="flex gap-3">
                <a
                  href="tel:4062853431"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  (406) 285-3431
                </a>
                <a
                  href="mailto:cityclerk@threeforksmontana.us"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg border border-blue-300 hover:bg-blue-50"
                >
                  Email
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Info */}
            <div className="space-y-6">
              {/* Permit Process */}
              <section className="bg-white rounded-lg p-5 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Building Permit Process
                </h2>
                <div className="space-y-4">
                  {PERMIT_STEPS.map((step) => (
                    <div key={step.step} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{step.title}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{step.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Zoning Districts */}
              <section className="bg-white rounded-lg p-5 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Zoning Districts
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Click on a zone to see permitted uses. Use the map to find your property's zone.
                </p>
                <div className="grid gap-2">
                  {ZONING_INFO.map((zone) => (
                    <button
                      key={zone.code}
                      onClick={() => setSelectedZone(selectedZone?.code === zone.code ? null : zone)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        selectedZone?.code === zone.code
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: zone.color }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{zone.code}</span>
                            <span className="text-sm text-gray-600">{zone.name}</span>
                          </div>
                          <p className="text-xs text-gray-500">{zone.description}</p>
                        </div>
                        <span className="text-gray-400">
                          {selectedZone?.code === zone.code ? '▼' : '▶'}
                        </span>
                      </div>
                      {selectedZone?.code === zone.code && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">Permitted Uses:</p>
                          <div className="flex flex-wrap gap-1">
                            {zone.uses.map((use) => (
                              <span
                                key={use}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                              >
                                {use}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* Common Requirements */}
              <section className="bg-white rounded-lg p-5 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Common Requirements
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Front Setback</span>
                    <span className="font-medium">25 ft (typical)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Side Setback</span>
                    <span className="font-medium">10-15 ft</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Rear Setback</span>
                    <span className="font-medium">20 ft</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Max Building Height</span>
                    <span className="font-medium">35 ft (residential)</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Lot Coverage</span>
                    <span className="font-medium">40-60% (varies by zone)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  * Requirements vary by zone. Contact City Hall for specific requirements for your property.
                </p>
              </section>
            </div>

            {/* Right Column - Map */}
            <div className="lg:sticky lg:top-4 space-y-4">
              <div className="h-[400px] lg:h-[600px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
                <MapView
                  cityConfig={devConfig}
                  currentMode="development"
                  visibleLayers={['zoningdistricts', 'parcels', 'cities']}
                  layerOrder={['cities', 'zoningdistricts', 'parcels']}
                  mapStyleOverride="streets"
                />
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">How to use the map:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Click on any parcel to see property details</li>
                  <li>Colored areas show zoning districts</li>
                  <li>Use the search bar on the main map for address lookup</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Resources */}
          <section className="mt-8 bg-white rounded-lg p-5 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Resources
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <a
                href="https://threeforksmontana.us"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <h3 className="font-medium text-gray-900">City Ordinances</h3>
                <p className="text-sm text-gray-600">Full zoning code and regulations</p>
              </a>
              <a
                href="https://gallatincomt.virtualtownhall.net/gis"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <h3 className="font-medium text-gray-900">County GIS</h3>
                <p className="text-sm text-gray-600">Property records and surveys</p>
              </a>
              <Link
                href="/resources"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <h3 className="font-medium text-gray-900">City Contacts</h3>
                <p className="text-sm text-gray-600">Who to call for help</p>
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
            <p>City of Three Forks | 206 Main Street | Three Forks, MT 59752</p>
            <p className="mt-1">(406) 285-3431 | Mon-Fri 8:00 AM - 5:00 PM</p>
          </div>
        </footer>
      </div>
    </>
  )
}
