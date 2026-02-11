import { useState, useEffect } from 'react'

interface WelcomeModalProps {
  cityName: string
}

export default function WelcomeModal({ cityName }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-tf-river-600 to-tf-river-700 text-white p-5">
          <h2 className="text-2xl font-bold mb-1">
            Welcome to {cityName}
          </h2>
          <p className="text-tf-river-100 text-sm">
            Your interactive map for property info, services, and local resources
          </p>
        </div>

        {/* Quick Actions */}
        <div className="p-5 space-y-4">
          <div className="text-sm text-gray-700 leading-relaxed">
            <strong>Click anywhere on the map</strong> to see property details,
            owner information, and tax assessments.
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-tf-stone-50 rounded-lg p-3">
              <div className="text-lg mb-1">🏠</div>
              <div className="text-xs font-medium text-gray-800">My Area</div>
              <div className="text-[10px] text-gray-500">Property & services</div>
            </div>
            <div className="bg-tf-stone-50 rounded-lg p-3">
              <div className="text-lg mb-1">⚠️</div>
              <div className="text-xs font-medium text-gray-800">Hazards</div>
              <div className="text-[10px] text-gray-500">Flood zones & fire</div>
            </div>
            <div className="bg-tf-stone-50 rounded-lg p-3">
              <div className="text-lg mb-1">🏗️</div>
              <div className="text-xs font-medium text-gray-800">Building</div>
              <div className="text-[10px] text-gray-500">Permits & zoning</div>
            </div>
            <div className="bg-tf-stone-50 rounded-lg p-3">
              <div className="text-lg mb-1">🗺️</div>
              <div className="text-xs font-medium text-gray-800">Explore</div>
              <div className="text-[10px] text-gray-500">Parks & attractions</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            Use the <strong>search bar</strong> to find addresses, or switch
            <strong> modes</strong> in the header to see different information.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 flex justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-tf-river-600 text-white rounded-lg hover:bg-tf-river-700
                       font-medium text-sm transition-colors"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  )
}
