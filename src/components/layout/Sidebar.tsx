'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Products', href: '/products', icon: '📦' },
  {
    name: 'Operations',
    icon: '🔄',
    children: [
      { name: 'Receipts', href: '/operations/receipts' },
      { name: 'Deliveries', href: '/operations/deliveries' },
      { name: 'Transfers', href: '/operations/transfers' },
      { name: 'Adjustments', href: '/operations/adjustments' },
      { name: 'Move History', href: '/operations/move-history' },
    ],
  },
  {
    name: 'Settings',
    icon: '⚙️',
    children: [
      { name: 'Warehouses', href: '/settings/warehouses' },
      { name: 'Locations', href: '/settings/locations' },
      { name: 'Categories', href: '/settings/categories' },
    ],
  },
  { name: 'Profile', href: '/profile', icon: '👤' },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  return (
    <div
      className={cn(
        'flex h-screen w-64 flex-col bg-gray-900 transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:z-0',
        'fixed z-50',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">StockMaster</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <div className="space-y-1">
                <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-300">
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </div>
                <div className="ml-6 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={handleLinkClick}
                      className={cn(
                        'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        pathname === child.href
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <p className="text-xs text-gray-400 text-center">© 2024 StockMaster</p>
      </div>
    </div>
  )
}
