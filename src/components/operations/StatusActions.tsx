'use client'

import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface StatusActionsProps {
  status: string
  onTransition: (action: string) => Promise<void>
  loading?: boolean
}

export function StatusActions({ status, onTransition, loading = false }: StatusActionsProps) {
  const getAvailableActions = () => {
    switch (status) {
      case 'DRAFT':
        return [
          { label: 'Move to Waiting', action: 'waiting', variant: 'secondary' as const },
          { label: 'Cancel', action: 'cancel', variant: 'danger' as const },
        ]
      case 'WAITING':
        return [
          { label: 'Move to Ready', action: 'ready', variant: 'secondary' as const },
          { label: 'Cancel', action: 'cancel', variant: 'danger' as const },
        ]
      case 'READY':
        return [
          { label: 'Validate (Mark as Done)', action: 'done', variant: 'primary' as const },
          { label: 'Cancel', action: 'cancel', variant: 'danger' as const },
        ]
      default:
        return []
    }
  }

  const actions = getAvailableActions()

  if (actions.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      {actions.map((action) => (
        <Button
          key={action.action}
          variant={action.variant}
          onClick={() => onTransition(action.action)}
          disabled={loading}
        >
          {loading ? 'Processing...' : action.label}
        </Button>
      ))}
    </div>
  )
}
