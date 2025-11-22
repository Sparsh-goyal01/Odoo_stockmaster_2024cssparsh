'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'

interface Category {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  sku: string
  unitOfMeasure: string
  isActive: boolean
  totalStock: number
  stockStatus: string
  category: Category | null
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    unitOfMeasure: 'Units',
    price: '',
    isActive: true,
    warehouseId: '',
    locationId: '',
    initialQuantity: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories(), fetchWarehouses()])
  }, [])

  useEffect(() => {
    if (formData.warehouseId) {
      fetchLocations(parseInt(formData.warehouseId))
    }
  }, [formData.warehouseId])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products?limit=100')
      const data = await response.json()
      setProducts(data.data || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
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

  const handleCreate = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      sku: '',
      categoryId: '',
      unitOfMeasure: 'Units',
      price: '',
      isActive: true,
      warehouseId: '',
      locationId: '',
      initialQuantity: '',
    })
    setLocations([])
    setShowModal(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      categoryId: product.category?.id.toString() || '',
      unitOfMeasure: product.unitOfMeasure,
      price: '',
      isActive: product.isActive,
      warehouseId: '',
      locationId: '',
      initialQuantity: '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      
      const method = editingProduct ? 'PUT' : 'POST'

      const submitData: any = {
        name: formData.name,
        sku: formData.sku,
        unitOfMeasure: formData.unitOfMeasure,
        isActive: formData.isActive,
      }

      if (formData.categoryId) {
        submitData.categoryId = parseInt(formData.categoryId)
      }

      if (formData.price) {
        submitData.price = parseFloat(formData.price)
      }

      // Only include initial stock for new products
      if (!editingProduct && formData.warehouseId && formData.locationId && formData.initialQuantity) {
        submitData.initialStock = {
          warehouseId: parseInt(formData.warehouseId),
          locationId: parseInt(formData.locationId),
          quantity: parseFloat(formData.initialQuantity),
        }
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product')
      }

      toast.success(editingProduct ? 'Product updated!' : 'Product created!')
      setShowModal(false)
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete product')
      }

      toast.success('Product deleted!')
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'success'
      case 'LOW_STOCK':
        return 'warning'
      case 'OUT_OF_STOCK':
        return 'danger'
      default:
        return 'info'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <span className="sm:hidden">+ Add</span>
          <span className="hidden sm:inline">Add Product</span>
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No products yet</p>
            <p className="text-sm mt-2">Create your first product to get started</p>
            <Button onClick={handleCreate} className="mt-4">
              Create Product
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                        Stock
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.unitOfMeasure}
                          </div>
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            SKU: {product.sku}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.sku}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.category?.name || '-'}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.totalStock}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStockStatusColor(product.stockStatus)}>
                            {product.stockStatus.replace('_', ' ')}
                          </Badge>
                          {!product.isActive && (
                            <Badge variant="danger" className="ml-2">
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-primary-600 hover:text-primary-900 mr-2 sm:mr-4"
                          >
                            <span className="hidden sm:inline">Edit</span>
                            <span className="sm:hidden">✏️</span>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <span className="hidden sm:inline">Delete</span>
                            <span className="sm:hidden">🗑️</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProduct ? 'Edit Product' : 'Create Product'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Laptop"
              />

              <Input
                label="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                required
                placeholder="PROD001"
                disabled={!!editingProduct}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Unit of Measure"
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                required
                placeholder="Units, Kg, Liters, etc."
              />

              <Input
                label="Price (Optional)"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />

              {!editingProduct && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Initial Stock (Optional)</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Warehouse
                        </label>
                        <select
                          value={formData.warehouseId}
                          onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value, locationId: '' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">-- Select Warehouse --</option>
                          {warehouses.map((wh) => (
                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <select
                          value={formData.locationId}
                          onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          disabled={!formData.warehouseId}
                        >
                          <option value="">-- Select Location --</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="Initial Quantity"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.initialQuantity}
                        onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
                        placeholder="0"
                        disabled={!formData.locationId}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
