import { MapMode } from '@/types'

interface ModeSelectorProps {
  currentMode: MapMode
  onModeChange: (mode: MapMode) => void
  availableModes: string[]
}

const modeInfo: { [key: string]: { label: string; desc: string; cluster: 'public' | 'city' } } = {
  resident: {
    label: 'Resident',
    desc: 'Property, parks & services',
    cluster: 'public'
  },
  explore: {
    label: 'Explore',
    desc: 'Places to visit',
    cluster: 'public'
  },
  business: {
    label: 'Business',
    desc: 'Local businesses',
    cluster: 'public'
  },
  services: {
    label: 'Services',
    desc: 'Water, sewer & infrastructure',
    cluster: 'city'
  },
  planning: {
    label: 'Planning',
    desc: 'Zoning & future land use',
    cluster: 'city'
  },
  hazards: {
    label: 'Hazards',
    desc: 'Flood zones & fire risk',
    cluster: 'city'
  },
  development: {
    label: 'Development',
    desc: 'Permits & projects',
    cluster: 'city'
  },
  // Legacy mappings for backwards compatibility
  environmental: {
    label: 'Hazards',
    desc: 'Flood zones & fire risk',
    cluster: 'city'
  },
  tourism: {
    label: 'Explore',
    desc: 'Places to visit',
    cluster: 'public'
  },
}

// Order modes: Public cluster first, then City cluster
const modeOrder = ['resident', 'explore', 'business', 'services', 'planning', 'hazards', 'development']

export default function ModeSelector({
  currentMode,
  onModeChange,
  availableModes,
}: ModeSelectorProps) {
  // Map legacy modes to new names for display
  const normalizeMode = (mode: string): string => {
    if (mode === 'environmental') return 'hazards'
    if (mode === 'tourism') return 'explore'
    return mode
  }

  // Sort available modes by priority order
  const sortedModes = [...availableModes]
    .map(normalizeMode)
    .filter((mode, index, arr) => arr.indexOf(mode) === index) // dedupe
    .sort((a, b) => {
      const aIndex = modeOrder.indexOf(a)
      const bIndex = modeOrder.indexOf(b)
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })

  // Find the divider position (after public cluster)
  const publicModes = sortedModes.filter(m => modeInfo[m]?.cluster === 'public')
  const cityModes = sortedModes.filter(m => modeInfo[m]?.cluster === 'city')

  return (
    <div className="border-t border-tf-stone-200 bg-gradient-to-r from-tf-stone-50 to-white">
      <div className="flex items-center px-3 py-1.5 overflow-x-auto">
        {/* Public Cluster */}
        <div className="flex items-center gap-1">
          {publicModes.map((mode) => {
            const info = modeInfo[mode] || { label: mode, desc: '', cluster: 'public' }
            // Map back to original mode name for the callback
            const originalMode = mode === 'hazards' && availableModes.includes('environmental') ? 'environmental' :
                               mode === 'explore' && availableModes.includes('tourism') ? 'tourism' : mode
            const normalizedCurrent = normalizeMode(currentMode)
            return (
              <button
                key={mode}
                onClick={() => onModeChange(originalMode as MapMode)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap
                  transition-all duration-200
                  ${normalizedCurrent === mode
                    ? 'bg-tf-river-600 text-white shadow-sm'
                    : 'text-tf-stone-600 hover:text-tf-river-700 hover:bg-tf-stone-100'
                  }
                `}
                title={info.desc}
              >
                {info.label}
              </button>
            )
          })}
        </div>

        {/* Divider between clusters */}
        {publicModes.length > 0 && cityModes.length > 0 && (
          <div className="mx-2 h-5 w-px bg-tf-stone-300" />
        )}

        {/* City Cluster */}
        <div className="flex items-center gap-1">
          {cityModes.map((mode) => {
            const info = modeInfo[mode] || { label: mode, desc: '', cluster: 'city' }
            const originalMode = mode === 'hazards' && availableModes.includes('environmental') ? 'environmental' :
                               mode === 'explore' && availableModes.includes('tourism') ? 'tourism' : mode
            const normalizedCurrent = normalizeMode(currentMode)
            return (
              <button
                key={mode}
                onClick={() => onModeChange(originalMode as MapMode)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap
                  transition-all duration-200
                  ${normalizedCurrent === mode
                    ? 'bg-tf-forest-600 text-white shadow-sm'
                    : 'text-tf-stone-500 hover:text-tf-forest-700 hover:bg-tf-stone-100'
                  }
                `}
                title={info.desc}
              >
                {info.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
