import { useState, useEffect } from 'react'

interface WelcomeModalProps {
  cityName: string
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: '', // filled dynamically with cityName
    description: 'Your interactive guide to property info, city services, and local resources all in one place.',
    icon: (
      <svg className="w-12 h-12 text-civic-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    id: 'click-map',
    title: 'Click Anywhere on the Map',
    description: 'Tap any parcel to see property details, owner information, assessed values, and more.',
    icon: (
      <svg className="w-12 h-12 text-civic-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
  {
    id: 'modes',
    title: 'Switch Between Modes',
    description: 'Use the mode selector at the top to change what information is displayed on the map.',
    modes: [
      { name: 'Property', desc: 'Parcels, ownership, and assessed values', color: 'bg-blue-100 text-blue-700' },
      { name: 'Planning', desc: 'Zoning districts and future land use', color: 'bg-green-100 text-green-700' },
      { name: 'Hazards', desc: 'Flood zones, fire risk, and natural hazards', color: 'bg-amber-100 text-amber-700' },
    ],
  },
  {
    id: 'layers',
    title: 'Control Your Layers',
    description: 'Toggle layers on/off and reorder them using the layer panel. Each layer shows different data.',
    icon: (
      <svg className="w-12 h-12 text-civic-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'search',
    title: 'Search for Properties',
    description: 'Use the search bar to find specific addresses, owner names, or local businesses.',
    icon: (
      <svg className="w-12 h-12 text-civic-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
]

export default function WelcomeModal({ cityName }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

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

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleClose()
  }

  if (!isOpen) return null

  const step = ONBOARDING_STEPS[currentStep]
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-4 pb-2">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-civic-blue-600 w-4'
                  : index < currentStep
                  ? 'bg-civic-blue-300'
                  : 'bg-gray-200'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-4 text-center min-h-[280px] flex flex-col justify-center">
          {/* Icon or special content */}
          <div className="mb-4 flex justify-center">
            {step.icon && step.icon}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {step.id === 'welcome' ? `Welcome to ${cityName} Map` : step.title}
          </h2>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Special content for modes step */}
          {step.id === 'modes' && step.modes && (
            <div className="space-y-2 mt-2">
              {step.modes.map((mode) => (
                <div
                  key={mode.name}
                  className={`rounded-lg px-4 py-2.5 text-left ${mode.color}`}
                >
                  <div className="font-medium text-sm">{mode.name}</div>
                  <div className="text-xs opacity-80">{mode.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-civic-blue-600 text-white rounded-lg hover:bg-civic-blue-700
                         font-medium text-sm transition-colors flex items-center gap-1"
            >
              {isLastStep ? 'Start Exploring' : 'Next'}
              {!isLastStep && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
