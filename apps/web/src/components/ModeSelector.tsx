import { MapMode } from '@/types'

interface ModeSelectorProps {
  currentMode: MapMode
  onModeChange: (mode: MapMode) => void
  availableModes: string[]
}

const modeIcons: { [key: string]: string } = {
  resident: '🏠',
  business: '🏢',
  recreation: '🏞️',
  services: '🏛️',
  development: '🏗️',
}

const modeLabels: { [key: string]: string } = {
  resident: 'Resident',
  business: 'Business',
  recreation: 'Parks & Recreation',
  services: 'City Services',
  development: 'Development',
}

export default function ModeSelector({
  currentMode,
  onModeChange,
  availableModes,
}: ModeSelectorProps) {
  return (
    <div className="border-t border-gray-200 bg-gray-50">
      <div className="flex items-center justify-center gap-2 px-4 py-2">
        {availableModes.map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode as MapMode)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                currentMode === mode
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }
            `}
          >
            <span className="text-lg">{modeIcons[mode]}</span>
            <span>{modeLabels[mode]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
