import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface CityConfig {
  name: string
  branding: {
    title: string
    primary_color: string
  }
  contact: {
    phone: string
    email: string
    website: string
  }
}

const LOCKED_LAYERS = [
  {
    name: 'Snow Plow Routes',
    description: 'Priority snow removal routes digitized from city maintenance maps',
    icon: '❄️',
    source: 'City PDF Maps',
  },
  {
    name: 'Sewer Main Lines',
    description: 'Complete sewer infrastructure with pipe sizes and materials',
    icon: '🔧',
    source: 'City Engineering',
  },
  {
    name: 'Water Main Lines',
    description: 'Water distribution system with pressure zones and pipe details',
    icon: '💧',
    source: 'City Engineering',
  },
  {
    name: 'Street Lighting',
    description: 'Street light locations with pole types and wattage',
    icon: '💡',
    source: 'City Public Works',
  },
  {
    name: 'Stormwater Infrastructure',
    description: 'Drainage systems, culverts, and retention areas',
    icon: '🌧️',
    source: 'City Engineering',
  },
  {
    name: 'City-Owned Properties',
    description: 'Detailed inventory of municipal assets and facilities',
    icon: '🏛️',
    source: 'City Administration',
  },
]

const BENEFITS = [
  {
    title: 'Reduce Staff Time',
    description: 'Citizens find answers themselves instead of calling City Hall',
    stat: '40%',
    statLabel: 'fewer phone inquiries',
  },
  {
    title: 'Modern Citizen Portal',
    description: 'Professional, mobile-friendly access to city information',
    stat: '24/7',
    statLabel: 'self-service access',
  },
  {
    title: 'Better Planning Decisions',
    description: 'Interactive maps for council presentations and public meetings',
    stat: '10x',
    statLabel: 'faster visual analysis',
  },
  {
    title: 'Economic Development',
    description: 'Showcase your city to developers and businesses',
    stat: '100%',
    statLabel: 'professional presentation',
  },
]

const INCLUDED_FEATURES = [
  'Interactive zoning map with parcel lookup',
  'Flood zone and hazard visualization',
  'Building permit history search',
  'Custom data layer digitization',
  'Mobile-optimized interface',
  'Address and owner name search',
  'Embeddable widgets for city website',
  'Annual data updates included',
  'Dedicated support contact',
  'Staff training session',
]

export default function PartnershipPage() {
  const [cityConfig, setCityConfig] = useState<CityConfig | null>(null)

  useEffect(() => {
    fetch('/data/config/three-forks.json')
      .then((res) => res.json())
      .then((config) => setCityConfig(config))
      .catch((err) => console.error('Failed to load city config:', err))
  }, [])

  return (
    <>
      <Head>
        <title>City Partnership - {cityConfig?.branding?.title || 'CityView'}</title>
        <meta
          name="description"
          content="Partner with CityView to provide your citizens with professional interactive mapping services"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">{cityConfig?.branding?.title || 'CityView'}</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Map
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-16 px-4 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-3 py-1 bg-blue-600 rounded-full text-sm mb-4">
              For City Administrators
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Bring Your City's Data to Life
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              CityView transforms your existing PDFs, maps, and spreadsheets into an interactive
              public portal—reducing staff workload while improving citizen service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`mailto:partnerships@itogeo.com?subject=CityView Partnership Inquiry - ${cityConfig?.name || 'My City'}`}
                className="px-8 py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Schedule a Demo
              </a>
              <a
                href="#pricing"
                className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                View Pricing
              </a>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Your Data is Already There—It's Just Locked in PDFs
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Static PDFs</h3>
                <p className="text-gray-600 text-sm">
                  Zoning maps, snow routes, and infrastructure diagrams exist as PDFs nobody can search.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Phone Calls</h3>
                <p className="text-gray-600 text-sm">
                  Staff spend hours answering "What's my zoning?" and "Is this in the floodplain?"
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Confusion</h3>
                <p className="text-gray-600 text-sm">
                  Citizens struggle to find information, leading to frustration and missed opportunities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
              Results Cities Are Seeing
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {BENEFITS.map((benefit, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{benefit.stat}</div>
                  <div className="text-sm text-gray-500 mb-3">{benefit.statLabel}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Locked Layers Preview */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Data Layers Available with Partnership
            </h2>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
              We'll digitize your existing PDFs and maps into interactive, searchable layers—at no extra digitization cost.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {LOCKED_LAYERS.map((layer, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{layer.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{layer.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{layer.description}</p>
                      <div className="mt-2 text-xs text-gray-400">Source: {layer.source}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-16 px-4 bg-blue-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Everything You Need
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {INCLUDED_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 mb-8">
              No hidden fees. No per-user charges. One annual subscription.
            </p>

            <div className="max-w-md mx-auto bg-gradient-to-b from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
              <div className="text-sm uppercase tracking-wide text-blue-200 mb-2">
                Municipal Partnership
              </div>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-5xl font-bold">$2,400</span>
                <span className="text-blue-200">/year</span>
              </div>
              <div className="text-blue-200 text-sm mb-6">
                That's just $200/month for unlimited citizen access
              </div>
              <a
                href={`mailto:partnerships@itogeo.com?subject=CityView Partnership Inquiry - ${cityConfig?.name || 'My City'}&body=Hi,%0A%0AI'm interested in learning more about CityView for our municipality.%0A%0ACity: ${cityConfig?.name || '[Your City]'}%0APopulation: %0AMain contact: %0A%0APlease reach out to schedule a demo.%0A%0AThank you!`}
                className="block w-full py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Request a Demo
              </a>
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free data digitization
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                30-day pilot available
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-gray-900 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Transform Citizen Services?
            </h2>
            <p className="text-gray-400 mb-8">
              Join forward-thinking municipalities using CityView to better serve their communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`mailto:partnerships@itogeo.com?subject=CityView Partnership Inquiry - ${cityConfig?.name || 'My City'}`}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Schedule a Demo
              </a>
              <a
                href="tel:4065551234"
                className="px-8 py-3 border border-gray-600 text-gray-300 rounded-lg font-semibold hover:border-gray-500 hover:text-white transition-colors"
              >
                Call (406) 555-1234
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 bg-gray-950 text-gray-400 text-sm">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              &copy; {new Date().getFullYear()} Ito Geo. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link href="/" className="hover:text-white">Map</Link>
              <Link href="/resources" className="hover:text-white">Resources</Link>
              <a href="mailto:partnerships@itogeo.com" className="hover:text-white">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
