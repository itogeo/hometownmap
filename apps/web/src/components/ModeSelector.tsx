import { MapMode } from '@/types'

interface ModeSelectorProps {
  currentMode: MapMode
  onModeChange: (mode: MapMode) => void
  availableModes: string[]
}

const modeInfo: { [key: string]: { label: string; desc: string; icon: string; tier: 'primary' | 'secondary' } } = {
  property: {
    label: 'Property',
    desc: 'Parcels, services & development',
    icon: '🏠',
    tier: 'primary'
  },
  planning: {
    label: 'Planning',
    desc: 'Zoning & future land use',
    icon: '📋',
    tier: 'primary'
  },
  hazards: {
    label: 'Hazards',
    desc: 'Flood zones & fire risk',
    icon: '⚠️',
    tier: 'primary'
  },
  explore: {
    label: 'Explore',
    desc: 'Parks & attractions',
    icon: '🧭',
    tier: 'secondary'
  },
  business: {
    label: 'Business',
    desc: 'Local businesses',
    icon: '🏪',
    tier: 'secondary'
  },
  // Legacy mappings for backwards compatibility
  resident: {
    label: 'Property',
    desc: 'Parcels, services & development',
    icon: '🏠',
    tier: 'primary'
  },
  services: {
    label: 'Property',
    desc: 'Parcels, services & development',
    icon: '🏠',
    tier: 'primary'
  },
  development: {
    label: 'Property',
    desc: 'Parcels, services & development',
    icon: '🏠',
    tier: 'primary'
  },
  environmental: {
    label: 'Hazards',
    desc: 'Flood zones & fire risk',
    icon: '⚠️',
    tier: 'primary'
  },
  tourism: {
    label: 'Explore',
    desc: 'Parks & attractions',
    icon: '🧭',
    tier: 'secondary'
  },
}

// Order modes: Primary tier first, then Secondary tier
const modeOrder = ['property', 'planning', 'hazards', 'explore', 'business']

export default function ModeSelector({
  currentMode,
  onModeChange,
  availableModes,
}: ModeSelectorProps) {
  // Map legacy modes to new names for display
  const normalizeMode = (mode: string): string => {
    if (mode === 'environmental') return 'hazards'
    if (mode === 'tourism') return 'explore'
    if (mode === 'resident' || mode === 'services' || mode === 'development') return 'property'
    return mode
  }

  // Sort available modes by priority order and dedupe
  const sortedModes = [...new Set(availableModes.map(normalizeMode))]
    .sort((a, b) => {
      const aIndex = modeOrder.indexOf(a)
      const bIndex = modeOrder.indexOf(b)
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })

  // Split into tiers
  const primaryModes = sortedModes.filter(m => modeInfo[m]?.tier === 'primary')
  const secondaryModes = sortedModes.filter(m => modeInfo[m]?.tier === 'secondary')

  const normalizedCurrent = normalizeMode(currentMode)

  return (
    <div className="border-t border-tf-stone-200 bg-gradient-to-r from-tf-stone-50 to-white">
      <div className="flex items-center justify-between px-3 py-1.5 overflow-x-auto">
        {/* Primary Tier - Full buttons */}
        <div className="flex items-center gap-1">
          {primaryModes.map((mode) => {
            const info = modeInfo[mode] || { label: mode, desc: '', icon: '📍', tier: 'primary' }
            return (
              <button
                key={mode}
                onClick={() => onModeChange(mode as MapMode)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap
                  transition-all duration-200 flex items-center gap-1.5
                  ${normalizedCurrent === mode
                    ? 'bg-tf-river-600 text-white shadow-sm'
                    : 'text-tf-stone-600 hover:text-tf-river-700 hover:bg-tf-stone-100'
                  }
                `}
                title={info.desc}
              >
                <span className="text-sm">{info.icon}</span>
                {info.label}
              </button>
            )
          })}
        </div>

        {/* Secondary Tier - Smaller text links */}
        {secondaryModes.length > 0 && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-tf-stone-400 text-[10px]">|</span>
            {secondaryModes.map((mode) => {
              const info = modeInfo[mode] || { label: mode, desc: '', icon: '📍', tier: 'secondary' }
              return (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode as MapMode)}
                  className={`
                    px-2 py-1 text-[11px] rounded whitespace-nowrap
                    transition-all duration-200
                    ${normalizedCurrent === mode
                      ? 'text-tf-river-700 font-medium bg-tf-river-50'
                      : 'text-tf-stone-500 hover:text-tf-river-600'
                    }
                  `}
                  title={info.desc}
                >
                  {info.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
