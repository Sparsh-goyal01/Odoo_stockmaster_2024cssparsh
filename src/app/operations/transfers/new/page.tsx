'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

export default function NewTransferPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [warehouses, setWarehouses] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  const [formData, setFormData] = useState({
    sourceWarehouseId: '',
    sourceLocationId: '',
    destinationWarehouseId: '',
    destinationLocationId: '',
    notes: '',
  })

  const [lines, setLines] = useState<any[]>([
    {
      productId: '',
      quantity: '',
      unitOfMeasure: '',
      sourceLocationId: '',
      destinationLocationId: '',
      remarks: '',
    },
  ])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [warehousesRes, locationsRes, productsRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/locations'),
        fetch('/api/products?limit=1000'),
      ])

      const [warehousesData, locationsData, productsData] = await Promise.all([
        warehousesRes.json(),
        locationsRes.json(),
        productsRes.json(),
      ])

      if (warehousesRes.ok) setWarehouses(warehousesData.data || [])
      if (locationsRes.ok) setLocations(locationsData.data || [])
      if (productsRes.ok) setProducts(productsData.data || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleLineChange = (index: number, field: string, value: string) => {
    const updatedLines = [...lines]
    updatedLines[index] = { ...updatedLines[index], [field]: value }
    setLines(updatedLines)
    setError('')
  }

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        productId: '',
        quantity: '',
        unitOfMeasure: '',
        sourceLocationId: '',
        destinationLocationId: '',
        remarks: '',
      },
    ])
  }

  const handleRemoveLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index))
    }
  }

  const getFilteredSourceLocations = () => {
    if (!formData.sourceWarehouseId) return locations
    return locations.filter(
      (loc) => loc.warehouseId === parseInt(formData.sourceWarehouseId)
    )
  }

  const getFilteredDestinationLocations = () => {
    if (!formData.destinationWarehouseId) return locations
    return locations.filter(
      (loc) => loc.warehouseId === parseInt(formData.destinationWarehouseId)
    )
  }

  const validateForm = () => {
    if (!formData.sourceWarehouseId) {
      setError('Please select a source warehouse')
      return false
    }

    if (!formData.sourceLocationId) {
      setError('Please select a source location')
      return false
    }

    if (!formData.destinationWarehouseId) {
      setError('Please select a destination warehouse')
      return false
    }

    if (!formData.destinationLocationId) {
      setError('Please select a destination location')
      return false
    }

    if (lines.length === 0) {
      setError('Please add at least one line')
      return false
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line.productId) {
        setError(`Line ${i + 1}: Please select a product`)
        return false
      }
      if (!line.quantity || parseFloat(line.quantity) <= 0) {
        setError(`Line ${i + 1}: Please enter a valid quantity`)
        return false
      }
      if (!line.unitOfMeasure) {
        setError(`Line ${i + 1}: Unit of measure is required`)
        return false
      }
    }

    return true
  }

  const handleSaveDraft = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        sourceWarehouseId: parseInt(formData.sourceWarehouseId),
        sourceLocationId: parseInt(formData.sourceLocationId),
        destinationWarehouseId: parseInt(formData.destinationWarehouseId),
        destinationLocationId: parseInt(formData.destinationLocationId),
        notes: formData.notes || null,
        lines: lines.map((line) => ({
          productId: parseInt(line.productId),
          quantity: parseFloat(line.quantity),
          unitOfMeasure: line.unitOfMeasure,
          sourceLocationId: line.sourceLocationId
            ? parseInt(line.sourceLocationId)
            : null,
          destinationLocationId: line.destinationLocationId
            ? parseInt(line.destinationLocationId)
            : null,
          remarks: line.remarks || null,
        })),
      }

      const res = await fetch('/api/operations/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('Transfer created successfully!')
        setTimeout(() => {
          router.push(`/operations/transfers/${data.id}`)
        }, 1000)
      } else {
        setError(data.error || 'Failed to create transfer')
      }
    } catch (err) {
      setError('An error occurred while creating transfer')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Transfer</h1>
          <p className="text-gray-600 mt-1">Create a new internal transfer</p>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Transfer Header */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Transfer Details</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Source Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Source</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.sourceWarehouseId}
                  onChange={(e) => {
                    handleFieldChange('sourceWarehouseId', e.target.value)
                    handleFieldChange('sourceLocationId', '')
                  }}
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Location <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.sourceLocationId}
                  onChange={(e) => handleFieldChange('sourceLocationId', e.target.value)}
                  disabled={!formData.sourceWarehouseId}
                >
                  <option value="">Select location</option>
                  {getFilteredSourceLocations().map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Destination Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Destination</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.destinationWarehouseId}
                  onChange={(e) => {
                    handleFieldChange('destinationWarehouseId', e.target.value)
                    handleFieldChange('destinationLocationId', '')
                  }}
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Location <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.destinationLocationId}
                  onChange={(e) => handleFieldChange('destinationLocationId', e.target.value)}
                  disabled={!formData.destinationWarehouseId}
                >
                  <option value="">Select location</option>
                  {getFilteredDestinationLocations().map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Add any additional notes..."
            />
          </div>
        </div>
      </Card>

      {/* Transfer Lines */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Items to Transfer</h2>
            <Button onClick={handleAddLine} variant="secondary">
              + Add Line
            </Button>
          </div>

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Line {index + 1}</h3>
                  {lines.length > 1 && (
                    <button
                      onClick={() => handleRemoveLine(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={line.productId}
                      onChange={(e) =>
                        handleLineChange(index, 'productId', e.target.value)
                      }
                    >
                      <option value="">Select product</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} - {prod.sku}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={line.quantity}
                      onChange={(e) =>
                        handleLineChange(index, 'quantity', e.target.value)
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit of Measure <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={line.unitOfMeasure}
                      onChange={(e) =>
                        handleLineChange(index, 'unitOfMeasure', e.target.value)
                      }
                    >
                      <option value="">Select unit</option>
                      <option value="UNITS">Units</option>
                      <option value="KG">Kilograms</option>
                      <option value="LBS">Pounds</option>
                      <option value="LITERS">Liters</option>
                      <option value="GALLONS">Gallons</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Location Override
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={line.sourceLocationId}
                      onChange={(e) =>
                        handleLineChange(index, 'sourceLocationId', e.target.value)
                      }
                    >
                      <option value="">Use default</option>
                      {getFilteredSourceLocations().map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination Location Override
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={line.destinationLocationId}
                      onChange={(e) =>
                        handleLineChange(index, 'destinationLocationId', e.target.value)
                      }
                    >
                      <option value="">Use default</option>
                      {getFilteredDestinationLocations().map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={line.remarks}
                      onChange={(e) =>
                        handleLineChange(index, 'remarks', e.target.value)
                      }
                      placeholder="Add remarks for this line..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSaveDraft} disabled={loading}>
          {loading ? 'Saving...' : 'Save as Draft'}
        </Button>
      </div>
    </div>
  )
}
