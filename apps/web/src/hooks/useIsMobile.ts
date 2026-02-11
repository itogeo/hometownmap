import { useState, useEffect } from 'react'

/**
 * Hook to detect if the current viewport is mobile-sized
 * @param breakpoint - Width threshold in pixels (default: 768px, matches Tailwind md:)
 * @returns boolean indicating if viewport is below the breakpoint
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Initial check
    checkMobile()

    // Listen for resize
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [breakpoint])

  return isMobile
}

/**
 * Hook to get current viewport width
 * Useful for more granular responsive logic
 */
export function useViewportWidth(): number {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => setWidth(window.innerWidth)
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  return width
}
