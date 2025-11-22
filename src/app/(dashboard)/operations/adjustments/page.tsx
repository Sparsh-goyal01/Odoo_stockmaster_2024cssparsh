'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface Warehouse {
  id: number
  name: string
  code: string
}

interface Location {
  id: number
  name: string
  warehouse: Warehouse
}

interface Product {
  id: number
  name: string
  sku: string
  unitOfMeasure: string
}

interface OperationLine {
  id?: number
  productId: number
  product?: Product
  quantity: number
  unitOfMeasure: string
  destinationLocationId: number | null
  destinationLocation?: Location
  remarks: string
}

interface Adjustment {
  id: number
  documentNumber: string
  status: string
  warehouse: Warehouse
  destinationLocation: Location | null
  notes: string | null
  createdAt: string
  lines: OperationLine[]
}

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAdjustment, setEditingAdjustment] = useState<Adjustment | null>(null)
  const [formData, setFormData] = useState({
    warehouseId: '',
    destinationLocationId: '',
    notes: '',
  })
  const [lines, setLines] = useState<OperationLine[]>([
    { productId: 0, quantity: 0, unitOfMeasure: '', destinationLocationId: null, remarks: '' },
  ])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([fetchAdjustments(), fetchWarehouses(), fetchProducts()])
  }, [])

  useEffect(() => {
    if (formData.warehouseId) {
      fetchLocations(parseInt(formData.warehouseId))
    }
  }, [formData.warehouseId])

  const fetchAdjustments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/adjustments?limit=100')
      const data = await response.json()
      setAdjustments(data.data || [])
    } catch (error) {
      console.error('Failed to fetch adjustments:', error)
      toast.error('Failed to load adjustments')
    } finally {
      setLoading(false)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses')
      const data = await response.json()
      setWarehouses(data.data || [])
    } catch (error) {
      console.error('Failed to fetch warehouses:', error)
    }
  }

  const fetchLocations = async (warehouseId: number) => {
    try {
      const response = await fetch(`/api/locations?warehouseId=${warehouseId}`)
      const data = await response.json()
      setLocations(data.data || [])
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=1000')
      const data = await response.json()
      setProducts(data.data || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const handleCreate = () => {
    if (warehouses.length === 0) {
      toast.error('Please create a warehouse first')
      return
    }
    if (products.length === 0) {
      toast.error('Please create products first')
      return
    }
    setEditingAdjustment(null)
    setFormData({
      warehouseId: warehouses[0]?.id.toString() || '',
      destinationLocationId: '',
      notes: '',
    })
    setLines([
      { productId: 0, quantity: 1, unitOfMeasure: '', destinationLocationId: null, remarks: '' },
    ])
    setShowModal(true)
  }

  const addLine = () => {
    setLines([
      ...lines,
      { productId: 0, quantity: 0, unitOfMeasure: '', destinationLocationId: null, remarks: '' },
    ])
  }

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines]
    ;(newLines[index] as any)[field] = value
    
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value))
      if (product) {
        newLines[index].unitOfMeasure = product.unitOfMeasure
      }
    }
    
    setLines(newLines)
  }

  const handleEdit = async (adjustment: Adjustment) => {
    setEditingAdjustment(adjustment)
    setFormData({
      warehouseId: adjustment.warehouse.id.toString(),
      destinationLocationId: adjustment.destinationLocation?.id.toString() || '',
      notes: adjustment.notes || '',
    })
    
    // Fetch locations for the warehouse
    await fetchLocations(adjustment.warehouse.id)
    
    // Set lines
    setLines(adjustment.lines.map(line => ({
      productId: line.product?.id || 0,
      quantity: Number(line.quantity),
      unitOfMeasure: line.unitOfMeasure,
      destinationLocationId: line.destinationLocation?.id || null,
      remarks: line.remarks || '',
    })))
    
    setShowModal(true)
  }

  const handleDelete = async (adjustmentId: number) => {
    if (!confirm('Are you sure you want to delete this adjustment? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/operations/adjustments/${adjustmentId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete adjustment')
      }

      toast.success('Adjustment deleted successfully')
      fetchAdjustments()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (lines.length === 0 || lines.some(l => !l.productId)) {
      toast.error('Please add at least one valid product line')
      return
    }
    
    setSubmitting(true)

    try {
      const url = editingAdjustment 
        ? `/api/operations/adjustments/${editingAdjustment.id}`
        : '/api/operations/adjustments'
      
      const method = editingAdjustment ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: parseInt(formData.warehouseId),
          destinationLocationId: formData.destinationLocationId ? parseInt(formData.destinationLocationId) : null,
          notes: formData.notes || null,
          lines: lines.map(l => ({
            productId: l.productId,
            quantity: l.quantity,
            unitOfMeasure: l.unitOfMeasure,
            destinationLocationId: l.destinationLocationId || null,
            remarks: l.remarks || null,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${editingAdjustment ? 'update' : 'create'} adjustment`)
      }

      toast.success(`Adjustment ${editingAdjustment ? 'updated' : 'created'} successfully!`)
      setShowModal(false)
      fetchAdjustments()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'info'
      case 'CONFIRMED': return 'warning'
      case 'DONE': return 'success'
      case 'CANCELLED': return 'danger'
      default: return 'info'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustments</h1>
        <Button onClick={handleCreate}>New Adjustment</Button>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading adjustments...</p>
          </div>
        </Card>
      ) : adjustments.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No adjustments yet</p>
            <p className="text-sm mt-2">Create an adjustment to correct stock discrepancies</p>
            <Button onClick={handleCreate} className="mt-4">
              Create Adjustment
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {adjustment.documentNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {adjustment.warehouse.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {adjustment.lines.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(adjustment.status)}>
                        {adjustment.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(adjustment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {adjustment.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handleEdit(adjustment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(adjustment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Adjustment</h3>
              <p className="text-sm text-gray-500 mt-1">Positive qty = add stock, Negative qty = remove stock</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={formData.destinationLocationId}
                    onChange={(e) => setFormData({ ...formData, destinationLocationId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- Select Location --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Adjustment</label>
                  <input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="E.g., Physical count correction"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Products</h4>
                  <Button type="button" variant="ghost" onClick={addLine}>+ Add Line</Button>
                </div>

                {lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-5">
                      <select
                        value={line.productId}
                        onChange={(e) => updateLine(index, 'productId', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        required
                      >
                        <option value={0}>-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Qty (+/-)"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        value={line.unitOfMeasure}
                        onChange={(e) => updateLine(index, 'unitOfMeasure', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Unit"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        value={line.remarks}
                        onChange={(e) => updateLine(index, 'remarks', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Remarks"
                      />
                    </div>
                    <div className="col-span-1">
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingAdjustment ? 'Update Adjustment' : 'Create Adjustment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
