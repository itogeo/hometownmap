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

interface FormInfo {
  name: string
  url: string
  size?: string
}

interface FormCategory {
  title: string
  forms: FormInfo[]
}

const FORM_CATEGORIES: FormCategory[] = [
  {
    title: 'Zoning & Land Use',
    forms: [
      { name: 'Zoning Permit Application', url: 'https://threeforksmontana.us/documents/650/Zoning_Permit_2024.pdf' },
      { name: 'Zone Change / Amendment Application', url: 'https://threeforksmontana.us/documents/650/Zone_Change_Amendment_Application.pdf' },
      { name: 'Conditional Use Permit', url: 'https://threeforksmontana.us/documents/650/Conditional_Use_Permit_2023.pdf' },
      { name: 'Variance Application & Criteria', url: 'https://threeforksmontana.us/documents/650/Variance_Application_and_Criteria.pdf' },
    ],
  },
  {
    title: 'Subdivision',
    forms: [
      { name: 'Preliminary Plat Application', url: 'https://threeforksmontana.us/documents/650/Preliminary_Plat_Application.pdf' },
      { name: 'Final Plat Application', url: 'https://threeforksmontana.us/documents/650/Final_Plat_Application.pdf' },
      { name: 'Exemption from Subdivision Review', url: 'https://threeforksmontana.us/documents/650/Exemption_from_Subdivision_Review_Application.pdf' },
      { name: 'Improvements Agreement', url: 'https://threeforksmontana.us/documents/650/Subdivision_Improvements_Agreement_or_Guaranty.pdf' },
      { name: 'Subdivision Regulations', url: 'https://threeforksmontana.us/documents/650/City_of_Three_Forks_Subdivision_Regs_OCR.pdf' },
    ],
  },
  {
    title: 'Floodplain',
    forms: [
      { name: 'Flood Permit Application', url: 'https://threeforksmontana.us/documents/650/flood_permit_Three_Forks.pdf' },
      { name: 'Floodplain Variance Application', url: 'https://threeforksmontana.us/documents/650/Floodplain_Variance_Application.pdf' },
      { name: 'Non-Residential Floodproofing Certificate (FEMA)', url: 'https://threeforksmontana.us/documents/650/FEMA_Form_FF-206-FY-22-153_floodproofing_nonresidential.pdf' },
    ],
  },
  {
    title: 'Water & Sewer',
    forms: [
      { name: 'New Water/Sewer Signup', url: 'https://threeforksmontana.us/documents/650/Sign_Up___Sewer_Determination.pdf' },
      { name: 'New Connection Request', url: 'https://threeforksmontana.us/documents/650/New_Water_or_Sewer_Connection_Form_with_Contractor_info.pdf' },
      { name: 'Public Design Standards', url: 'https://threeforksmontana.us/documents/650/ThreeForksDsnStds_20230411__version_2___1_.pdf' },
    ],
  },
  {
    title: 'Annexation',
    forms: [
      { name: 'Annexation Application', url: 'https://threeforksmontana.us/documents/650/Annexation_Application.pdf' },
      { name: 'Petition to Vacate/Abandon', url: 'https://threeforksmontana.us/documents/650/Petition_to_Abandon_form_v1.pdf' },
    ],
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Zoning & Land Use')

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

              {/* Forms & Applications */}
              <section className="bg-white rounded-lg p-5 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Forms & Applications
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Official forms from the City of Three Forks. Click a category to see available forms.
                </p>
                <div className="space-y-2">
                  {FORM_CATEGORIES.map((category) => (
                    <div key={category.title} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedCategory(
                          expandedCategory === category.title ? null : category.title
                        )}
                        className={`w-full text-left p-3 flex items-center justify-between transition-colors ${
                          expandedCategory === category.title
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <span className="font-medium text-gray-900">{category.title}</span>
                        <span className="text-gray-400 text-sm">
                          {expandedCategory === category.title ? '▼' : '▶'}
                        </span>
                      </button>
                      {expandedCategory === category.title && (
                        <div className="p-3 space-y-2 bg-white">
                          {category.forms.map((form) => (
                            <a
                              key={form.name}
                              href={form.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 text-sm group"
                            >
                              <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-blue-600 group-hover:text-blue-800 group-hover:underline">
                                {form.name}
                              </span>
                              <span className="text-xs text-gray-400 ml-auto">PDF</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <a
                  href="https://threeforksmontana.us/forms-and-applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-800"
                >
                  View all forms on City website →
                </a>
              </section>

              {/* Key Documents */}
              <section className="bg-white rounded-lg p-5 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Documents
                </h2>
                <div className="space-y-3">
                  <a
                    href="https://threeforksmontana.us/documents/650/City_of_Three_Forks_Subdivision_Regs_OCR.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">Subdivision Regulations</h3>
                      <p className="text-xs text-gray-500">Requirements for subdividing land</p>
                    </div>
                  </a>
                  <a
                    href="https://threeforksmontana.us/documents/650/ThreeForksDsnStds_20230411__version_2___1_.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">Public Design Standards</h3>
                      <p className="text-xs text-gray-500">Water, sewer, streets infrastructure</p>
                    </div>
                  </a>
                  <a
                    href="https://threeforksmontana.us/documents/650/FINAL_ADOPTED_220913_EnvisionThreeForks_AdoptedDocument_LowRes__1_.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">Growth Policy (2022)</h3>
                      <p className="text-xs text-gray-500">Envision Three Forks planning document</p>
                    </div>
                  </a>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Contact City Hall for zoning code and setback requirements specific to your property.
                </p>
              </section>
            </div>

            {/* Right Column - Map */}
            <div className="lg:sticky lg:top-4 space-y-4">
              <div className="h-[400px] lg:h-[600px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
                <MapView
                  cityConfig={devConfig}
                  currentMode="property"
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="https://threeforksmontana.us/documents/650/FINAL_ADOPTED_220913_EnvisionThreeForks_AdoptedDocument_LowRes__1_.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <h3 className="font-medium text-gray-900">Growth Policy</h3>
                <p className="text-sm text-gray-600">Envision Three Forks 2022</p>
              </a>
              <a
                href="https://experience.arcgis.com/experience/6c5d3097540f4895be52c11b0bda0731/page/Clerk-%26-Recorder-Map"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <h3 className="font-medium text-gray-900">Gallatin County Clerk & Recorder</h3>
                <p className="text-sm text-gray-600">Property records, deeds, plats</p>
              </a>
              <a
                href="https://experience.arcgis.com/experience/150750a84b804bf6b76cfa32fd0f5db2/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <h3 className="font-medium text-gray-900">Gallatin County FLUM</h3>
                <p className="text-sm text-gray-600">Future Land Use Map</p>
              </a>
              <a
                href="https://threeforksmontana.us/documents/650/Fee_Schedule_Exhibit_for_Res.__465-2026_1.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <h3 className="font-medium text-gray-900">Fee Schedule</h3>
                <p className="text-sm text-gray-600">Current permit and application fees</p>
              </a>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <a
                href="https://threeforksmontana.us"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <h3 className="font-medium text-gray-900">City of Three Forks</h3>
                <p className="text-sm text-gray-600">Official city website</p>
              </a>
              <a
                href="https://gis.gallatin.mt.gov/arcgis/rest/services/MapServices/Planning/MapServer"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <h3 className="font-medium text-gray-900">County GIS Data</h3>
                <p className="text-sm text-gray-600">Planning & mapping services</p>
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
