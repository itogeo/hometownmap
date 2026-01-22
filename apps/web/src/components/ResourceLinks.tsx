import { useState } from 'react'

interface ResourceLink {
  name: string
  url: string
  description: string
  icon: string
}

interface ResourceLinksProps {
  resources: ResourceLink[]
}

export default function ResourceLinks({ resources }: ResourceLinksProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!resources || resources.length === 0) return null

  return (
    <aside className="absolute left-4 top-36 z-10 w-72 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <h3 className="font-bold">Helpful Resources</h3>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Links */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{resource.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 group-hover:text-blue-700 flex items-center gap-1">
                    {resource.name}
                    <svg
                      className="w-3 h-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {resource.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </aside>
  )
}
