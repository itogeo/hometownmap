import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-gray-600">Loading map...</div>
    </div>
  ),
})

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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  return (
    <PageLayout
      title="Development Guide"
      subtitle="Building and zoning information for {cityName}"
      maxWidth="6xl"
      mapboxCss
    >
      {(cityConfig) => {
        const dev = cityConfig.development || {}
        const formCategories = dev.forms || []
        const keyDocs = dev.key_documents || []
        const additionalResources = dev.additional_resources || []
        const zoningLayer = dev.zoning_layer || 'zoningdistricts'
        const formsUrl = dev.forms_url

        // Set initial expanded category on first render
        if (expandedCategory === null && formCategories.length > 0) {
          setExpandedCategory(formCategories[0].title)
        }

        const devConfig = {
          ...cityConfig,
          modes: {
            planning: {
              ...cityConfig.modes.planning,
              layers: [zoningLayer, 'parcels', 'cities'],
            }
          }
        }

        return (
          <>
            {/* Quick Contact */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-blue-900">Questions about your project?</h2>
                  <p className="text-sm text-blue-700">Contact City Hall for a free pre-application consultation</p>
                </div>
                <div className="flex gap-3">
                  {cityConfig.contact?.phone && (
                    <a
                      href={`tel:${cityConfig.contact.phone.replace(/\D/g, '')}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      {cityConfig.contact.phone}
                    </a>
                  )}
                  {cityConfig.contact?.email && (
                    <a
                      href={`mailto:${cityConfig.contact.email}`}
                      className="bg-white text-blue-600 px-4 py-2 rounded-lg border border-blue-300 hover:bg-blue-50"
                    >
                      Email
                    </a>
                  )}
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
                {formCategories.length > 0 && (
                  <section className="bg-white rounded-lg p-5 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Forms & Applications
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Official forms from {cityConfig.name}. Click a category to see available forms.
                    </p>
                    <div className="space-y-2">
                      {formCategories.map((category: any) => (
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
                              {category.forms.map((form: any) => (
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
                    {formsUrl && (
                      <a
                        href={formsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        View all forms on official website →
                      </a>
                    )}
                  </section>
                )}

                {/* Key Documents */}
                {keyDocs.length > 0 && (
                  <section className="bg-white rounded-lg p-5 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Key Documents
                    </h2>
                    <div className="space-y-3">
                      {keyDocs.map((doc: any) => (
                        <a
                          key={doc.name}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                        >
                          <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <h3 className="font-medium text-gray-900">{doc.name}</h3>
                            {doc.description && (
                              <p className="text-xs text-gray-500">{doc.description}</p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Contact City Hall for zoning code and setback requirements specific to your property.
                    </p>
                  </section>
                )}
              </div>

              {/* Right Column - Map */}
              <div className="lg:sticky lg:top-4 space-y-4">
                <div className="h-[400px] lg:h-[600px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
                  <MapView
                    cityConfig={devConfig}
                    currentMode="property"
                    visibleLayers={[zoningLayer, 'parcels', 'cities']}
                    layerOrder={['cities', zoningLayer, 'parcels']}
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

            {/* Additional Resources */}
            {additionalResources.length > 0 && (
              <section className="mt-8 bg-white rounded-lg p-5 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Resources
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {additionalResources.map((resource: any) => (
                    <a
                      key={resource.name}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <h3 className="font-medium text-gray-900">{resource.name}</h3>
                      <p className="text-sm text-gray-600">{resource.description}</p>
                    </a>
                  ))}
                  <Link
                    href="/resources"
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <h3 className="font-medium text-gray-900">City Contacts</h3>
                    <p className="text-sm text-gray-600">Who to call for help</p>
                  </Link>
                </div>
              </section>
            )}
          </>
        )
      }}
    </PageLayout>
  )
}
