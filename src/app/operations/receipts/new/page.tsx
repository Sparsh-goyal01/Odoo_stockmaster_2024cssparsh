'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { ReceiptHeader } from '@/components/operations/ReceiptHeader'
import { ReceiptLines } from '@/components/operations/ReceiptLines'

export default function NewReceiptPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [warehouses, setWarehouses] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  const [formData, setFormData] = useState({
    vendor: '',
    warehouseId: '',
    locationId: '',
    notes: '',
  })

  const [lines, setLines] = useState<any[]>([
    {
      productId: '',
      quantity: '',
      unitOfMeasure: '',
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

  const validateForm = () => {
    if (!formData.warehouseId) {
      setError('Please select a warehouse')
      return false
    }

    if (!formData.locationId) {
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
        warehouseId: parseInt(formData.warehouseId),
        destinationLocationId: parseInt(formData.locationId),
        partnerName: formData.vendor || null,
        notes: formData.notes || null,
        lines: lines.map((line) => ({
          productId: parseInt(line.productId),
          quantity: parseFloat(line.quantity),
          unitOfMeasure: line.unitOfMeasure,
          destinationLocationId: line.destinationLocationId
            ? parseInt(line.destinationLocationId)
            : null,
          remarks: line.remarks || null,
        })),
      }

      const res = await fetch('/api/operations/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('Receipt created successfully!')
        setTimeout(() => {
          router.push(`/operations/receipts/${data.id}`)
        }, 1000)
      } else {
        setError(data.error || 'Failed to create receipt')
      }
    } catch (err) {
      setError('An error occurred while creating receipt')
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
          <h1 className="text-3xl font-bold text-gray-900">New Receipt</h1>
          <p className="text-gray-600 mt-1">Create a new incoming stock receipt</p>
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

      {/* Receipt Header */}
      <ReceiptHeader
        vendor={formData.vendor}
        warehouseId={formData.warehouseId}
        locationId={formData.locationId}
        notes={formData.notes}
        warehouses={warehouses}
        locations={locations}
        onFieldChange={handleFieldChange}
      />

      {/* Receipt Lines */}
      <ReceiptLines
        lines={lines}
        products={products}
        locations={locations}
        onLinesChange={setLines}
      />

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
