import { useState, useEffect } from 'react'

interface WelcomeModalProps {
  cityName: string
}

export default function WelcomeModal({ cityName }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if user has seen welcome before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
  }

  const handleDontShowAgain = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <h2 className="text-3xl font-bold mb-2">
            Welcome to {cityName} Interactive Maps!
          </h2>
          <p className="text-blue-100">
            Your comprehensive portal for exploring properties, businesses, and
            community resources
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Guide */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              🗺️ How to Use This Map
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Choose a Mode</div>
                  <div className="text-sm text-gray-600">
                    Select from Resident, Business, Recreation, Services, or
                    Development modes at the top of the screen
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    Toggle Map Layers
                  </div>
                  <div className="text-sm text-gray-600">
                    Use the layer control panel on the right to show/hide
                    different data layers
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    Search & Explore
                  </div>
                  <div className="text-sm text-gray-600">
                    Use the search bar to find specific addresses, property
                    owners, or businesses
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    Click for Details
                  </div>
                  <div className="text-sm text-gray-600">
                    Click any feature on the map to view detailed information in
                    a popup
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Descriptions */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              📋 Available Modes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🏠</span>
                  <span className="font-semibold text-gray-800">Resident</span>
                </div>
                <p className="text-sm text-gray-600">
                  Property information, zoning, and community resources
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🏢</span>
                  <span className="font-semibold text-gray-800">Business</span>
                </div>
                <p className="text-sm text-gray-600">
                  Available properties, demographics, and business opportunities
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🏞️</span>
                  <span className="font-semibold text-gray-800">
                    Recreation
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Parks, trails, and recreational facilities
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🏛️</span>
                  <span className="font-semibold text-gray-800">Services</span>
                </div>
                <p className="text-sm text-gray-600">
                  City services, utilities, and government facilities
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 sm:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🏗️</span>
                  <span className="font-semibold text-gray-800">
                    Development
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Building permits, development projects, and planning resources
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">💡 Pro Tips</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Use Ctrl+Scroll (or pinch) to zoom in/out</li>
              <li>• Click and drag to pan around the map</li>
              <li>• Try different base map styles for better visibility</li>
              <li>• Combine multiple layers to discover relationships</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-between items-center">
          <button
            onClick={handleDontShowAgain}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Don't show again
          </button>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}
