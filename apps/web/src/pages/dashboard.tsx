import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getCityConfigPath, getCityLayerPath } from '@/lib/cityConfig'

interface CityConfig {
  name: string
  demographics: {
    population: number
    median_income: number
    median_age: number
    growth_rate: string
  }
  contact: {
    phone: string
    email: string
    website: string
  }
}

interface DashboardStats {
  totalParcels: number
  totalAssessedValue: number
  publicLandAcres: number
  activePermits: number
  recentPermits: number
  permitsByType: { [key: string]: number }
}

export default function Dashboard() {
  const [cityConfig, setCityConfig] = useState<CityConfig | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalParcels: 0,
    totalAssessedValue: 0,
    publicLandAcres: 0,
    activePermits: 0,
    recentPermits: 0,
    permitsByType: {},
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load city config
    fetch(getCityConfigPath())
      .then(res => res.json())
      .then(config => setCityConfig(config))
      .catch(err => console.error('Failed to load config:', err))

    // Load parcel data for stats
    Promise.all([
      fetch(getCityLayerPath('parcels.geojson')).then(r => r.json()).catch(() => ({ features: [] })),
      fetch(getCityLayerPath('building_permits.geojson')).then(r => r.json()).catch(() => ({ features: [] })),
      fetch(getCityLayerPath('public_lands.geojson')).then(r => r.json()).catch(() => ({ features: [] })),
    ]).then(([parcels, permits, publicLands]) => {
      const parcelFeatures = parcels.features || []
      const permitFeatures = permits.features || []
      const publicLandFeatures = publicLands.features || []

      // Calculate stats
      let totalValue = 0
      parcelFeatures.forEach((f: any) => {
        const val = f.properties?.totalvalue || f.properties?.TOTALVALUE || 0
        totalValue += Number(val)
      })

      let publicAcres = 0
      publicLandFeatures.forEach((f: any) => {
        const acres = f.properties?.gisacres || f.properties?.GISACRES || 0
        publicAcres += Number(acres)
      })

      const activePermits = permitFeatures.filter((f: any) => f.properties?.status === 'Active').length
      const recentPermits = permitFeatures.filter((f: any) => {
        const date = f.properties?.issued_date
        if (!date) return false
        const issued = new Date(date)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        return issued > sixMonthsAgo
      }).length

      // Count by type
      const byType: { [key: string]: number } = {}
      permitFeatures.forEach((f: any) => {
        const type = f.properties?.permit_type || 'Other'
        byType[type] = (byType[type] || 0) + 1
      })

      setStats({
        totalParcels: parcelFeatures.length,
        totalAssessedValue: totalValue,
        publicLandAcres: publicAcres,
        activePermits,
        recentPermits,
        permitsByType: byType,
      })
      setLoading(false)
    })
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  return (
    <>
      <Head>
        <title>City Dashboard | {cityConfig?.name || 'CityView'}</title>
        <meta name="description" content={`${cityConfig?.name || 'City'} statistics and development dashboard`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="h-1 bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600" />
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <span className="font-bold text-gray-900">{cityConfig?.name || 'CityView'}</span>
                </Link>
                <span className="text-gray-300">/</span>
                <h1 className="text-gray-600 font-medium">City Dashboard</h1>
              </div>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/" className="text-blue-600 hover:text-blue-700">
                  Back to Map
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Demographics row */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="text-3xl font-bold text-blue-600">
                      {cityConfig?.demographics?.population?.toLocaleString() || '2,143'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Population</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="text-3xl font-bold text-emerald-600">
                      {cityConfig?.demographics?.growth_rate || '+8%'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Growth (2010-2020)</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="text-3xl font-bold text-purple-600">
                      ${cityConfig?.demographics?.median_income?.toLocaleString() || '54,000'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Median Income</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="text-3xl font-bold text-amber-600">
                      {cityConfig?.demographics?.median_age || 42}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Median Age</div>
                  </div>
                </div>
              </div>

              {/* Property stats row */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Data</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.totalParcels.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Total Parcels</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(stats.totalAssessedValue)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Total Assessed Value</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="text-3xl font-bold text-green-600">
                      {stats.publicLandAcres.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Public Land Acres</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.activePermits}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Active Permits</div>
                  </div>
                </div>
              </div>

              {/* Development activity */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Development Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Permits (Last 6 Months)</span>
                      <span className="font-semibold text-gray-900">{stats.recentPermits}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Projects</span>
                      <span className="font-semibold text-gray-900">{stats.activePermits}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500 mb-2">Permits by Type</div>
                      {Object.entries(stats.permitsByType)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-600">{type}</span>
                            <span className="text-sm font-medium text-gray-900">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                  <div className="space-y-3">
                    <Link
                      href="/?mode=planning"
                      className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-blue-900">Planning Map</div>
                        <div className="text-sm text-blue-600">Zoning and future land use</div>
                      </div>
                    </Link>

                    <Link
                      href="/?mode=development"
                      className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-purple-900">Development Map</div>
                        <div className="text-sm text-purple-600">Permits and projects</div>
                      </div>
                    </Link>

                    <Link
                      href="/?mode=hazards"
                      className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-amber-900">Hazard Map</div>
                        <div className="text-sm text-amber-600">Flood zones and fire risk</div>
                      </div>
                    </Link>

                    <Link
                      href="/projects"
                      className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-emerald-900">Capital Projects</div>
                        <div className="text-sm text-emerald-600">City infrastructure projects</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Data sources footer */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Data Sources</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-500">
                  <div>
                    <div className="font-medium text-gray-700">Property Data</div>
                    <div>Montana Cadastral Database</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Permits</div>
                    <div>Montana EBIZ Portal (2016-2023)</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Flood Data</div>
                    <div>FEMA National Flood Hazard Layer</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <div>
                {cityConfig?.contact && (
                  <span>
                    City Hall: <a href={`tel:${cityConfig.contact.phone}`} className="text-blue-600 hover:underline">{cityConfig.contact.phone}</a>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Link href="/resources" className="hover:text-gray-700">Resources</Link>
                <Link href="/visit" className="hover:text-gray-700">Visit</Link>
                {cityConfig?.contact?.website && (
                  <a href={cityConfig.contact.website} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">
                    City Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
