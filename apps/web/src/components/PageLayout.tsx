import { useState, useEffect, ReactNode } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getCityConfigPath } from '@/lib/cityConfig'

interface PageLayoutProps {
  title: string
  subtitle?: string
  maxWidth?: '4xl' | '6xl' | '7xl'
  children: (cityConfig: any) => ReactNode
  mapboxCss?: boolean
}

const maxWidthClasses = {
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
}

export default function PageLayout({ title, subtitle, maxWidth = '4xl', children, mapboxCss }: PageLayoutProps) {
  const [cityConfig, setCityConfig] = useState<any>(null)

  useEffect(() => {
    fetch(getCityConfigPath())
      .then((res) => res.json())
      .then(setCityConfig)
      .catch(() => {})
  }, [])

  if (!cityConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full" />
        <div className="mt-3 text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  const container = maxWidthClasses[maxWidth]
  const resolvedSubtitle = subtitle?.replace('{cityName}', cityConfig.name)

  return (
    <>
      <Head>
        <title>{title} | {cityConfig.name}</title>
        <meta name="description" content={`${title} - ${cityConfig.name}, Montana`} />
        {mapboxCss && (
          <link
            href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
            rel="stylesheet"
          />
        )}
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className={`${container} mx-auto px-4 py-4`}>
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
              ← Back to Map
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{title}</h1>
            {resolvedSubtitle && <p className="text-gray-600">{resolvedSubtitle}</p>}
          </div>
        </header>

        <main className={`${container} mx-auto px-4 py-6`}>
          {children(cityConfig)}
        </main>

        <footer className="bg-white border-t border-gray-200 mt-8">
          <div className={`${container} mx-auto px-4 py-4 text-center text-sm text-gray-500`}>
            <p>{cityConfig.name}, Montana</p>
            {cityConfig.contact?.phone && (
              <p className="mt-1">
                Questions? Call{' '}
                <a
                  href={`tel:${cityConfig.contact.phone.replace(/\D/g, '')}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {cityConfig.contact.phone}
                </a>
              </p>
            )}
          </div>
        </footer>
      </div>
    </>
  )
}
