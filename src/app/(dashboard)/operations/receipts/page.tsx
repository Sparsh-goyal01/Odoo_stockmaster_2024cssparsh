'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
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

interface Receipt {
  id: number
  documentNumber: string
  status: string
  partnerName: string | null
  warehouse: Warehouse
  destinationLocation: Location | null
  notes: string | null
  createdAt: string
  lines: OperationLine[]
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    warehouseId: '',
    destinationLocationId: '',
    partnerName: '',
    notes: '',
  })
  const [lines, setLines] = useState<OperationLine[]>([
    { productId: 0, quantity: 1, unitOfMeasure: '', destinationLocationId: null, remarks: '' },
  ])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([fetchReceipts(), fetchWarehouses(), fetchProducts()])
  }, [])

  useEffect(() => {
    if (formData.warehouseId) {
      fetchLocations(parseInt(formData.warehouseId))
    }
  }, [formData.warehouseId])

  const fetchReceipts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/receipts?limit=100')
      const data = await response.json()
      setReceipts(data.data || [])
    } catch (error) {
      console.error('Failed to fetch receipts:', error)
      toast.error('Failed to load receipts')
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
    setFormData({
      warehouseId: warehouses[0]?.id.toString() || '',
      destinationLocationId: '',
      partnerName: '',
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
      { productId: 0, quantity: 1, unitOfMeasure: '', destinationLocationId: null, remarks: '' },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (lines.length === 0 || lines.some(l => !l.productId || l.quantity <= 0)) {
      toast.error('Please add at least one valid product line')
      return
    }
    
    setSubmitting(true)

    try {
      const response = await fetch('/api/operations/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: parseInt(formData.warehouseId),
          destinationLocationId: formData.destinationLocationId ? parseInt(formData.destinationLocationId) : null,
          partnerName: formData.partnerName || null,
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
        throw new Error(data.error || 'Failed to create receipt')
      }

      toast.success('Receipt created!')
      setShowModal(false)
      fetchReceipts()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleValidate = async (receiptId: number) => {
    if (!confirm('Are you sure you want to validate this receipt? This will increase stock levels.')) {
      return
    }

    try {
      const response = await fetch(`/api/operations/receipts/${receiptId}/validate`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate receipt')
      }

      toast.success('Receipt validated successfully! Stock has been increased.')
      fetchReceipts()
    } catch (error: any) {
      toast.error(error.message)
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
        <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
        <Button onClick={handleCreate}>New Receipt</Button>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading receipts...</p>
          </div>
        </Card>
      ) : receipts.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No receipts yet</p>
            <p className="text-sm mt-2">Create a receipt to record incoming stock</p>
            <Button onClick={handleCreate} className="mt-4">
              Create Receipt
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {receipt.documentNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.partnerName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.warehouse.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.lines.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(receipt.status)}>
                        {receipt.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(receipt.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {receipt.status === 'DRAFT' && (
                        <button
                          onClick={() => handleValidate(receipt.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Validate
                        </button>
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
              <h3 className="text-lg font-medium text-gray-900">Create Receipt</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination Location</label>
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

                <Input
                  label="Vendor Name"
                  value={formData.partnerName}
                  onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                  placeholder="Vendor name"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Optional notes"
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
                        placeholder="Qty"
                        min="0.01"
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
                  {submitting ? 'Creating...' : 'Create Receipt'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
