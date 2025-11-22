'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface DeliveryLine {
  id?: number
  productId: string
  quantity: string
  unitOfMeasure: string
  sourceLocationId?: string
  remarks?: string
}

interface DeliveryLinesProps {
  lines: DeliveryLine[]
  products: any[]
  locations: any[]
  onLinesChange: (lines: DeliveryLine[]) => void
  disabled?: boolean
}

export function DeliveryLines({
  lines,
  products,
  locations,
  onLinesChange,
  disabled = false,
}: DeliveryLinesProps) {
  const addLine = () => {
    onLinesChange([
      ...lines,
      {
        productId: '',
        quantity: '',
        unitOfMeasure: '',
        remarks: '',
      },
    ])
  }

  const removeLine = (index: number) => {
    onLinesChange(lines.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...lines]
    newLines[index] = { ...newLines[index], [field]: value }

    // Auto-fill UOM when product is selected
    if (field === 'productId' && value) {
      const product = products.find((p) => p.id === parseInt(value))
      if (product) {
        newLines[index].unitOfMeasure = product.unitOfMeasure
      }
    }

    onLinesChange(newLines)
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Delivery Lines</h2>
        {!disabled && (
          <Button variant="secondary" onClick={addLine} size="sm">
            + Add Line
          </Button>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No lines added yet. Click &quot;Add Line&quot; to start.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UOM *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location Override
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                {!disabled && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lines.map((line, index) => (
                <tr key={index}>
                  <td className="px-4 py-3">
                    <select
                      value={line.productId}
                      onChange={(e) => updateLine(index, 'productId', e.target.value)}
                      disabled={disabled}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                      disabled={disabled}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={line.unitOfMeasure}
                      onChange={(e) => updateLine(index, 'unitOfMeasure', e.target.value)}
                      disabled={disabled}
                      placeholder="Unit"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={line.sourceLocationId || ''}
                      onChange={(e) => updateLine(index, 'sourceLocationId', e.target.value)}
                      disabled={disabled}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Use default</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.warehouse.name} / {loc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={line.remarks || ''}
                      onChange={(e) => updateLine(index, 'remarks', e.target.value)}
                      disabled={disabled}
                      placeholder="Optional"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </td>
                  {!disabled && (
                    <td className="px-4 py-3">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeLine(index)}
                      >
                        Remove
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
