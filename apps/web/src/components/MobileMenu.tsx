import { useEffect } from 'react'
import Link from 'next/link'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  cityName?: string
}

export default function MobileMenu({ isOpen, onClose, cityName = 'Three Forks' }: MobileMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const navLinks = [
    { href: '/', label: 'Map' },
    { href: '/visit', label: 'Visit' },
    { href: '/development', label: 'Development' },
    { href: '/projects', label: 'Projects' },
    { href: '/resources', label: 'Resources' },
  ]

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-tf-stone-200">
          <div>
            <h2 className="font-semibold text-tf-river-800">{cityName}</h2>
            <p className="text-xs text-tf-stone-500">Interactive Map</p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full
                       bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="block px-4 py-3 rounded-lg font-medium
                             text-tf-river-700 hover:bg-tf-stone-100 active:bg-tf-stone-200
                             transition-colors touch-manipulation"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-tf-stone-200 safe-area-bottom">
          <p className="text-xs text-tf-stone-500 text-center">
            Powered by HometownMap
          </p>
        </div>
      </div>
    </div>
  )
}
