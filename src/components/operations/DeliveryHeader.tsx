'use client'

import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'

interface DeliveryHeaderProps {
  documentNumber?: string
  customer: string
  warehouseId: string
  locationId: string
  notes: string
  status?: string
  createdAt?: string
  validatedAt?: string
  warehouses: any[]
  locations: any[]
  onFieldChange: (field: string, value: string) => void
  disabled?: boolean
}

export function DeliveryHeader({
  documentNumber,
  customer,
  warehouseId,
  locationId,
  notes,
  status,
  createdAt,
  validatedAt,
  warehouses,
  locations,
  onFieldChange,
  disabled = false,
}: DeliveryHeaderProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      DRAFT: 'default',
      WAITING: 'warning',
      READY: 'info',
      DONE: 'success',
      CANCELED: 'danger',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  // Filter locations by selected warehouse
  const filteredLocations = warehouseId
    ? locations.filter((loc) => loc.warehouseId === parseInt(warehouseId))
    : []

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Delivery Information</h2>
          {documentNumber && (
            <p className="text-sm text-gray-600 mt-1">Document: {documentNumber}</p>
          )}
        </div>
        {status && <div>{getStatusBadge(status)}</div>}
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Customer"
          type="text"
          value={customer}
          onChange={(e) => onFieldChange('customer', e.target.value)}
          placeholder="Enter customer name"
          disabled={disabled}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Warehouse <span className="text-red-500">*</span>
          </label>
          <select
            value={warehouseId}
            onChange={(e) => {
              onFieldChange('warehouseId', e.target.value)
              // Reset location when warehouse changes
              onFieldChange('locationId', '')
            }}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source Location <span className="text-red-500">*</span>
          </label>
          <select
            value={locationId}
            onChange={(e) => onFieldChange('locationId', e.target.value)}
            disabled={disabled || !warehouseId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select location</option>
            {filteredLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Notes"
          type="text"
          value={notes}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          placeholder="Additional notes"
          disabled={disabled}
        />
      </div>

      {/* Dates */}
      {(createdAt || validatedAt) && (
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            {createdAt && (
              <div>
                <span className="font-medium">Created:</span>{' '}
                {new Date(createdAt).toLocaleString()}
              </div>
            )}
            {validatedAt && (
              <div>
                <span className="font-medium">Validated:</span>{' '}
                {new Date(validatedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
