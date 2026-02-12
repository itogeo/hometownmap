import Head from 'next/head'
import Link from 'next/link'

interface ContactItem {
  title: string
  description: string
  phone?: string
  email?: string
  website?: string
  address?: string
  hours?: string
}

const EMERGENCY_CONTACTS: ContactItem[] = [
  {
    title: 'Emergency Services',
    description: 'Fire, Police, Ambulance',
    phone: '911',
  },
  {
    title: 'Gallatin County Sheriff',
    description: 'Non-emergency police services',
    phone: '(406) 582-2100',
  },
  {
    title: 'Three Forks Ambulance',
    description: 'Non-emergency medical transport',
    phone: '(406) 285-3261',
  },
]

const CITY_SERVICES: ContactItem[] = [
  {
    title: 'City Hall',
    description: 'General inquiries, permits, licenses, utility billing',
    phone: '(406) 285-3431',
    email: 'cityclerk@threeforksmontana.us',
    address: '206 Main Street, Three Forks, MT 59752',
    hours: 'Mon-Fri 8:00 AM - 5:00 PM',
    website: 'https://threeforksmontana.us',
  },
  {
    title: 'Water & Sewer',
    description: 'Water service, billing questions, report leaks',
    phone: '(406) 285-3431',
  },
  {
    title: 'Streets & Roads',
    description: 'Potholes, street lights, snow removal',
    phone: '(406) 285-3431',
  },
  {
    title: 'Building Permits',
    description: 'Construction permits, inspections, zoning questions',
    phone: '(406) 285-3431',
  },
]

const UTILITIES: ContactItem[] = [
  {
    title: 'NorthWestern Energy',
    description: 'Electric and natural gas service',
    phone: '(888) 467-2669',
    website: 'https://www.northwesternenergy.com',
  },
  {
    title: 'Republic Services',
    description: 'Garbage and recycling pickup',
    phone: '(406) 587-6075',
    website: 'https://www.republicservices.com',
  },
  {
    title: '3 Rivers Communications',
    description: 'Internet, phone, and TV service',
    phone: '(406) 467-2535',
    website: 'https://www.3rivers.net',
  },
]

const SCHOOLS: ContactItem[] = [
  {
    title: 'Three Forks Schools',
    description: 'K-12 public school district',
    phone: '(406) 285-3224',
    website: 'https://www.threeforks.k12.mt.us',
    address: '216 East Neal Street',
  },
]

const COMMUNITY: ContactItem[] = [
  {
    title: 'Three Forks Library',
    description: 'Public library services',
    phone: '(406) 285-3747',
    address: '607 South Main Street',
  },
  {
    title: 'Three Forks Post Office',
    description: 'Mail and package services',
    phone: '(406) 285-3224',
    address: '115 North Main Street',
    hours: 'Mon-Fri 8:30 AM - 4:30 PM, Sat 9:00 AM - 11:00 AM',
  },
  {
    title: 'Chamber of Commerce',
    description: 'Local business and tourism information',
    phone: '(406) 285-4753',
    website: 'https://www.threeforksmontana.com',
  },
]

function ContactCard({ item }: { item: ContactItem }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
      <div>
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
    </div>
  )
}

function ContactSection({ title, items, className = '' }: { title: string; items: ContactItem[]; className?: string }) {
  return (
    <section className={className}>
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
    <>
      <Head>
        <title>Who Do I Call? | Three Forks Resources</title>
        <meta
          name="description"
          content="Find contact information for Three Forks city services, utilities, emergency services, and community resources."
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
              Back to Map
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Who Do I Call?
            </h1>
            <p className="text-gray-600">Quick access to Three Forks services and contacts</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
          {/* Emergency - Highlighted */}
          <section className="bg-red-50 rounded-lg p-4 border border-red-200">
            <h2 className="text-lg font-semibold text-red-800 mb-3">Emergency Contacts</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {EMERGENCY_CONTACTS.map((item) => (
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

          <ContactSection title="City Services" items={CITY_SERVICES} />
          <ContactSection title="Utilities" items={UTILITIES} />
          <ContactSection title="Schools" items={SCHOOLS} />
          <ContactSection title="Community" items={COMMUNITY} />

          {/* Quick Links */}
          <section className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">Quick Links</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              <a
                href="https://gallatincomt.virtualtownhall.net/gis"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 text-center"
              >
                <div className="text-sm font-medium text-gray-900">Gallatin County GIS</div>
                <div className="text-xs text-gray-500">Property records & maps</div>
              </a>
              <a
                href="https://svc.mt.gov/msl/mtcadastral"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 text-center"
              >
                <div className="text-sm font-medium text-gray-900">Montana Cadastral</div>
                <div className="text-xs text-gray-500">Statewide property data</div>
              </a>
              <Link
                href="/development"
                className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 text-center"
              >
                <div className="text-sm font-medium text-gray-900">Development Guide</div>
                <div className="text-xs text-gray-500">Permits & zoning</div>
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
            <p>Three Forks, Montana</p>
            <p className="mt-1">
              Information current as of 2024. Please verify contact details before visiting.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
