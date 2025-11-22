'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', description: 'Overview & KPIs' },
  { name: 'Products', href: '/products', icon: '📦', description: 'Product catalog' },
  {
    name: 'Operations',
    icon: '🔄',
    description: 'Stock operations',
    children: [
      { name: 'Receipts', href: '/operations/receipts', icon: '📥' },
      { name: 'Deliveries', href: '/operations/deliveries', icon: '📤' },
      { name: 'Transfers', href: '/operations/transfers', icon: '🔀' },
      { name: 'Adjustments', href: '/operations/adjustments', icon: '⚖️' },
      { name: 'Move History', href: '/operations/move-history', icon: '📋' },
    ],
  },
  {
    name: 'Settings',
    icon: '⚙️',
    description: 'Configuration',
    children: [
      { name: 'Warehouses', href: '/settings/warehouses', icon: '🏢' },
      { name: 'Locations', href: '/settings/locations', icon: '📍' },
      { name: 'Categories', href: '/settings/categories', icon: '🏷️' },
    ],
  },
  { name: 'Profile', href: '/profile', icon: '👤', description: 'User settings' },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>(['Operations', 'Settings'])

  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    )
  }

  return (
    <div
      className={cn(
        'flex h-screen w-64 flex-col bg-gradient-to-b from-gray-900 to-gray-800 transition-transform duration-300 ease-in-out shadow-2xl',
        'lg:translate-x-0 lg:static lg:z-0',
        'fixed z-50',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-xl font-bold text-white">StockMaster</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        <div className="space-y-2">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div className="space-y-1">
                  <button
                    onClick={() => toggleSection(item.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-lg transition-all',
                      'text-gray-300 hover:bg-gray-800 hover:text-white group'
                    )}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{item.icon}</span>
                      <div className="text-left">
                        <div>{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 font-normal">{item.description}</div>
                        )}
                      </div>
                    </div>
                    <svg
                      className={cn(
                        'w-4 h-4 transition-transform text-gray-500',
                        expandedSections.includes(item.name) && 'rotate-180'
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.includes(item.name) && (
                    <div className="ml-3 pl-6 border-l-2 border-gray-700 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={handleLinkClick}
                          className={cn(
                            'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all',
                            pathname === child.href
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          )}
                        >
                          {child.icon && <span className="mr-2.5 text-base">{child.icon}</span>}
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all group',
                    pathname === item.href
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  <div className="text-left">
                    <div>{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400 font-normal group-hover:text-gray-300">
                        {item.description}
                      </div>
                    )}
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4 bg-gray-900">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>© 2024 StockMaster</span>
          <span className="text-blue-400">v1.0.0</span>
        </div>
      </div>
    </div>
  )
}
