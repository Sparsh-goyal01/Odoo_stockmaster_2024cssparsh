'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={cn(
            'relative bg-white shadow-xl w-full',
            'rounded-t-xl sm:rounded-lg',
            'max-h-[90vh] overflow-y-auto',
            sizes[size]
          )}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 z-10">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none p-1"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="sticky bottom-0 bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
