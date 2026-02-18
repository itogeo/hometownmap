import { useState, useCallback, useEffect } from 'react'

type MeasurementMode = 'none' | 'distance' | 'area' | 'radius'

interface Point {
  lng: number
  lat: number
}

interface MeasurementToolsProps {
  onModeChange: (mode: MeasurementMode) => void
  onPointsChange: (points: Point[]) => void
  onRadiusChange?: (center: Point | null, radius: number) => void
  currentMode: MeasurementMode
  points: Point[]
}

// Calculate distance between two points using Haversine formula
function haversineDistance(p1: Point, p2: Point): number {
  const R = 6371000 // Earth's radius in meters
  const lat1 = p1.lat * Math.PI / 180
  const lat2 = p2.lat * Math.PI / 180
  const deltaLat = (p2.lat - p1.lat) * Math.PI / 180
  const deltaLng = (p2.lng - p1.lng) * Math.PI / 180

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// Calculate total distance of a path
function calculatePathDistance(points: Point[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1], points[i])
  }
  return total
}

// Calculate polygon area using Shoelace formula (approximate for small areas)
function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0

  // Convert to meters (approximate)
  const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length
  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos(avgLat * Math.PI / 180)

  const pointsMeters = points.map(p => ({
    x: p.lng * metersPerDegreeLng,
    y: p.lat * metersPerDegreeLat
  }))

  // Shoelace formula
  let area = 0
  const n = pointsMeters.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += pointsMeters[i].x * pointsMeters[j].y
    area -= pointsMeters[j].x * pointsMeters[i].y
  }

  return Math.abs(area) / 2
}

// Format distance for display
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  const km = meters / 1000
  if (km < 10) {
    return `${km.toFixed(2)} km`
  }
  return `${km.toFixed(1)} km`
}

// Format area for display
function formatArea(sqMeters: number): string {
  const sqFeet = sqMeters * 10.764
  const acres = sqMeters / 4047

  if (acres >= 1) {
    return `${acres.toFixed(2)} acres`
  }
  if (sqFeet >= 1000) {
    return `${(sqFeet / 1000).toFixed(1)}K sq ft`
  }
  return `${Math.round(sqFeet)} sq ft`
}

export default function MeasurementTools({
  onModeChange,
  onPointsChange,
  onRadiusChange,
  currentMode,
  points,
}: MeasurementToolsProps) {
  const [radiusValue, setRadiusValue] = useState(500) // Default 500 feet

  const handleModeSelect = (mode: MeasurementMode) => {
    if (currentMode === mode) {
      // Toggle off
      onModeChange('none')
      onPointsChange([])
      if (onRadiusChange) onRadiusChange(null, 0)
    } else {
      onModeChange(mode)
      onPointsChange([])
      if (onRadiusChange) onRadiusChange(null, 0)
    }
  }

  const handleClear = () => {
    onPointsChange([])
    if (onRadiusChange) onRadiusChange(null, 0)
  }

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setRadiusValue(value)
    if (points.length > 0 && onRadiusChange) {
      onRadiusChange(points[0], value * 0.3048) // Convert feet to meters
    }
  }

  // Calculate measurements
  const distance = currentMode === 'distance' && points.length > 1
    ? calculatePathDistance(points)
    : 0

  const area = currentMode === 'area' && points.length > 2
    ? calculatePolygonArea(points)
    : 0

  const isActive = currentMode !== 'none'

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tool buttons */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => handleModeSelect('distance')}
          className={`flex-1 flex flex-col items-center py-2 px-1 text-[10px] transition-colors ${
            currentMode === 'distance'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
          title="Measure distance between points"
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Distance
        </button>

        <button
          onClick={() => handleModeSelect('area')}
          className={`flex-1 flex flex-col items-center py-2 px-1 text-[10px] border-l border-gray-100 transition-colors ${
            currentMode === 'area'
              ? 'bg-green-50 text-green-700'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
          title="Measure area of a polygon"
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Area
        </button>

        <button
          onClick={() => handleModeSelect('radius')}
          className={`flex-1 flex flex-col items-center py-2 px-1 text-[10px] border-l border-gray-100 transition-colors ${
            currentMode === 'radius'
              ? 'bg-purple-50 text-purple-700'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
          title="Draw a radius circle"
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="M12 12h5" />
          </svg>
          Radius
        </button>
      </div>

      {/* Active measurement display */}
      {isActive && (
        <div className="p-2 text-[11px]">
          {currentMode === 'distance' && (
            <div>
              <div className="text-gray-500 mb-1">
                Click points to measure. Double-click to finish.
              </div>
              {points.length > 1 && (
                <div className="font-semibold text-blue-700 text-sm">
                  {formatDistance(distance)}
                </div>
              )}
              <div className="text-gray-400">
                {points.length} point{points.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {currentMode === 'area' && (
            <div>
              <div className="text-gray-500 mb-1">
                Click to draw polygon. Double-click to close.
              </div>
              {points.length > 2 && (
                <div className="font-semibold text-green-700 text-sm">
                  {formatArea(area)}
                </div>
              )}
              <div className="text-gray-400">
                {points.length} vertices
              </div>
            </div>
          )}

          {currentMode === 'radius' && (
            <div>
              <div className="text-gray-500 mb-1">
                Click to set center point.
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="100"
                  max="2640"
                  step="100"
                  value={radiusValue}
                  onChange={handleRadiusChange}
                  className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <span className="font-semibold text-purple-700 w-16 text-right">
                  {radiusValue} ft
                </span>
              </div>
              {radiusValue >= 5280 && (
                <div className="text-purple-600 text-[10px] mt-0.5">
                  ({(radiusValue / 5280).toFixed(2)} miles)
                </div>
              )}
            </div>
          )}

          {/* Clear button */}
          {points.length > 0 && (
            <button
              onClick={handleClear}
              className="mt-2 w-full px-2 py-1 text-[10px] text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              Clear measurement
            </button>
          )}
        </div>
      )}

      {/* Instructions when not active */}
      {!isActive && (
        <div className="p-2 text-[10px] text-gray-400 text-center">
          Select a tool to measure
        </div>
      )}
    </div>
  )
}

// Export types for use in MapView
export type { MeasurementMode, Point }
export { haversineDistance, calculatePathDistance, calculatePolygonArea, formatDistance, formatArea }
