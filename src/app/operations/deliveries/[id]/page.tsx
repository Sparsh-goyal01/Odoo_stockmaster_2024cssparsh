'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { DeliveryHeader } from '@/components/operations/DeliveryHeader'
import { DeliveryLines } from '@/components/operations/DeliveryLines'
import { StatusActions } from '@/components/operations/StatusActions'

export default function DeliveryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const deliveryId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [delivery, setDelivery] = useState<any>(null)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  const [formData, setFormData] = useState({
    customer: '',
    warehouseId: '',
    locationId: '',
    notes: '',
  })

  const [lines, setLines] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [deliveryId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [deliveryRes, warehousesRes, locationsRes, productsRes] = await Promise.all([
        fetch(`/api/operations/deliveries/${deliveryId}`),
        fetch('/api/warehouses'),
        fetch('/api/locations'),
        fetch('/api/products?limit=1000'),
      ])

      const [deliveryData, warehousesData, locationsData, productsData] = await Promise.all([
        deliveryRes.json(),
        warehousesRes.json(),
        locationsRes.json(),
        productsRes.json(),
      ])

      if (deliveryRes.ok) {
        setDelivery(deliveryData)
        setFormData({
          customer: deliveryData.partnerName || '',
          warehouseId: deliveryData.warehouseId?.toString() || '',
          locationId: deliveryData.sourceLocationId?.toString() || '',
          notes: deliveryData.notes || '',
        })
        setLines(
          deliveryData.lines?.map((line: any) => ({
            id: line.id,
            productId: line.productId?.toString() || '',
            quantity: line.quantity?.toString() || '',
            unitOfMeasure: line.unitOfMeasure || '',
            sourceLocationId: line.sourceLocationId?.toString() || '',
            remarks: line.remarks || '',
          })) || []
        )
      } else {
        setError(deliveryData.error || 'Failed to fetch delivery')
      }

      if (warehousesRes.ok) setWarehouses(warehousesData.data || [])
      if (locationsRes.ok) setLocations(locationsData.data || [])
      if (productsRes.ok) setProducts(productsData.data || [])
    } catch (err) {
      setError('An error occurred while fetching data')
      console.error(err)
    } finally {
      setLoading(false)
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
      setError('Please select a source location')
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

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        warehouseId: parseInt(formData.warehouseId),
        sourceLocationId: parseInt(formData.locationId),
        partnerName: formData.customer || null,
        notes: formData.notes || null,
        lines: lines.map((line) => ({
          productId: parseInt(line.productId),
          quantity: parseFloat(line.quantity),
          unitOfMeasure: line.unitOfMeasure,
          sourceLocationId: line.sourceLocationId
            ? parseInt(line.sourceLocationId)
            : null,
          remarks: line.remarks || null,
        })),
      }

      const res = await fetch(`/api/operations/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('Delivery updated successfully!')
        await fetchData() // Refresh data
      } else {
        setError(data.error || 'Failed to update delivery')
      }
    } catch (err) {
      setError('An error occurred while updating delivery')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleTransition = async (action: string) => {
    setTransitioning(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/operations/deliveries/${deliveryId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(`Delivery ${action === 'done' ? 'validated' : 'updated'} successfully!`)
        await fetchData() // Refresh data
      } else {
        setError(data.error || 'Failed to process action')
      }
    } catch (err) {
      setError('An error occurred while processing action')
      console.error(err)
    } finally {
      setTransitioning(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this delivery?')) return

    try {
      const res = await fetch(`/api/operations/deliveries/${deliveryId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/operations/deliveries')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete delivery')
      }
    } catch (err) {
      setError('An error occurred while deleting delivery')
      console.error(err)
    }
  }

  const isEditable = delivery?.status === 'DRAFT' || delivery?.status === 'WAITING'
  const isDeletable = delivery?.status === 'DRAFT'

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Loading delivery...</p>
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Delivery not found</p>
        <Button variant="secondary" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Details</h1>
          <p className="text-gray-600 mt-1">{delivery.documentNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          {isDeletable && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.back()}>
            Back to List
          </Button>
        </div>
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

      {/* Delivery Header */}
      <DeliveryHeader
        documentNumber={delivery.documentNumber}
        customer={formData.customer}
        warehouseId={formData.warehouseId}
        locationId={formData.locationId}
        notes={formData.notes}
        status={delivery.status}
        createdAt={delivery.createdAt}
        validatedAt={delivery.validatedAt}
        warehouses={warehouses}
        locations={locations}
        onFieldChange={handleFieldChange}
        disabled={!isEditable}
      />

      {/* Delivery Lines */}
      <DeliveryLines
        lines={lines}
        products={products}
        locations={locations}
        onLinesChange={setLines}
        disabled={!isEditable}
      />

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          {isEditable && (
            <Button onClick={handleSave} disabled={saving || transitioning}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
        <StatusActions
          status={delivery.status}
          onTransition={handleTransition}
          loading={transitioning}
        />
      </div>

      {/* Additional Info */}
      {(delivery.creator || delivery.validator) && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            {delivery.creator && (
              <div>
                <span className="font-medium">Created by:</span> {delivery.creator.name} (
                {delivery.creator.email})
              </div>
            )}
            {delivery.validator && (
              <div>
                <span className="font-medium">Validated by:</span> {delivery.validator.name} (
                {delivery.validator.email})
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
