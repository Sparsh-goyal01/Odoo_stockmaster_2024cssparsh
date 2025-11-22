'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface HeaderProps {
  user?: {
    name: string
    email: string
  } | null
  onMenuClick?: () => void
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <h2 className="text-sm sm:text-lg font-semibold text-gray-900">
          <span className="hidden sm:inline">Inventory Management</span>
          <span className="sm:hidden">StockMaster</span>
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {user && (
          <>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
