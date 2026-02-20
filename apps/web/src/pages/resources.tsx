import Link from 'next/link'
import PageLayout from '@/components/PageLayout'

interface ContactItem {
  title: string
  description: string
  phone?: string
  email?: string
  website?: string
  address?: string
  hours?: string
}

function ContactCard({ item }: { item: ContactItem }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
      <h3 className="font-semibold text-gray-900">{item.title}</h3>
      <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>

      <div className="mt-3 space-y-1.5 text-sm">
        {item.phone && (
          <div className="flex justify-between">
            <span className="text-gray-500">Phone:</span>
            <a
              href={`tel:${item.phone.replace(/\D/g, '')}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {item.phone}
            </a>
          </div>
        )}
        {item.email && (
          <div className="flex justify-between">
            <span className="text-gray-500">Email:</span>
            <a
              href={`mailto:${item.email}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {item.email}
            </a>
          </div>
        )}
        {item.website && (
          <div className="flex justify-between">
            <span className="text-gray-500">Website:</span>
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Visit
            </a>
          </div>
        )}
        {item.address && (
          <div className="flex justify-between">
            <span className="text-gray-500">Address:</span>
            <span className="text-gray-700 text-right">{item.address}</span>
          </div>
        )}
        {item.hours && (
          <div className="flex justify-between">
            <span className="text-gray-500">Hours:</span>
            <span className="text-gray-700 text-right">{item.hours}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ContactSection({ title, items }: { title: string; items: ContactItem[] }) {
  if (!items || items.length === 0) return null
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <ContactCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  )
}

export default function ResourcesPage() {
  return (
    <PageLayout
      title="Who Do I Call?"
      subtitle="Quick access to {cityName} services and contacts"
    >
      {(cityConfig) => {
        const contacts = cityConfig.contacts || {}

        return (
          <div className="space-y-8">
            {/* Emergency - Highlighted */}
            {contacts.emergency && contacts.emergency.length > 0 && (
              <section className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h2 className="text-lg font-semibold text-red-800 mb-3">Emergency Contacts</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {contacts.emergency.map((item: ContactItem) => (
                    <div key={item.title} className="bg-white rounded-lg p-3 border border-red-200">
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-xs text-gray-600">{item.description}</p>
                        {item.phone && (
                          <a
                            href={`tel:${item.phone.replace(/\D/g, '')}`}
                            className="mt-2 inline-block text-xl font-bold text-red-600 hover:text-red-800"
                          >
                            {item.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Development Guide Link */}
            <Link
              href="/development"
              className="block bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Development Guide</h2>
                  <p className="text-blue-100 text-sm mt-0.5">
                    Permits, zoning, building requirements & how to develop in {cityConfig.name}
                  </p>
                </div>
                <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <ContactSection title="City Services" items={contacts.city_services} />
            <ContactSection title="Utilities" items={contacts.utilities} />
            <ContactSection title="Schools" items={contacts.schools} />
            <ContactSection title="Community" items={contacts.community} />

            {/* Quick Links from resources */}
            {cityConfig.resources && cityConfig.resources.length > 0 && (
              <section className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h2 className="text-lg font-semibold text-blue-800 mb-3">Quick Links</h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {cityConfig.resources.slice(0, 6).map((resource: any) => (
                    <a
                      key={resource.name}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 transition-all"
                    >
                      <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                      <div className="text-xs text-gray-500">{resource.description}</div>
                    </a>
                  ))}
                  <Link
                    href="/development"
                    className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 transition-all"
                  >
                    <div className="text-sm font-medium text-gray-900">Development Guide</div>
                    <div className="text-xs text-gray-500">Permits & zoning</div>
                  </Link>
                </div>
              </section>
            )}
          </div>
        )
      }}
    </PageLayout>
  )
}
