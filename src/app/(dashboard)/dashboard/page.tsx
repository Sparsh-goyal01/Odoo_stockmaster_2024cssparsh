'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface DashboardKPIs {
  totalProducts: number
  lowStock: number
  outOfStock: number
  pendingReceipts: number
  pendingDeliveries: number
  pendingTransfers: number
}

interface RecentReceipt {
  id: number
  documentNumber: string
  partnerName: string | null
  status: string
  validatedAt: string
  warehouse: { name: string }
}

interface RecentDelivery {
  id: number
  documentNumber: string
  partnerName: string | null
  status: string
  validatedAt: string
  warehouse: { name: string }
}

interface RecentMove {
  id: number
  moveDate: string
  quantity: string
  product: {
    id: number
    name: string
    sku: string
  }
  fromLocation: {
    id: number
    name: string
    warehouse: { name: string }
  } | null
  toLocation: {
    id: number
    name: string
    warehouse: { name: string }
  } | null
  operation: {
    documentNumber: string
    opType: string
  }
}

interface Warehouse {
  id: number
  name: string
  code: string
}

interface Category {
  id: number
  name: string
}

export default function DashboardPage() {
  const router = useRouter()
  
  // State
  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0,
  })
  const [recentReceipts, setRecentReceipts] = useState<RecentReceipt[]>([])
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([])
  const [recentMoves, setRecentMoves] = useState<RecentMove[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [warehouseId, setWarehouseId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [warehouseId, categoryId])

  const fetchFilterOptions = async () => {
    try {
      const [warehousesRes, categoriesRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/categories'),
      ])

      if (warehousesRes.ok) {
        const data = await warehousesRes.json()
        setWarehouses(data.data || [])
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch filter options:', err)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (warehouseId) params.append('warehouseId', warehouseId)
      if (categoryId) params.append('categoryId', categoryId)

      const response = await fetch(`/api/dashboard/summary?${params}`)
      const data = await response.json()

      if (response.ok) {
        setKpis(data.kpis)
        setRecentReceipts(data.recentActivity.receipts)
        setRecentDeliveries(data.recentActivity.deliveries)
        setRecentMoves(data.recentActivity.moves)
      } else {
        setError(data.error || 'Failed to load dashboard data')
      }
    } catch (err) {
      setError('An error occurred while loading dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setWarehouseId('')
    setCategoryId('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your inventory operations</p>
        </div>
      </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {(warehouseId || categoryId) && (
              <div className="pt-6">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading dashboard...</span>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
                  onClick={() => router.push('/products')}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Products in Stock
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                      {kpis.totalProducts}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">With quantity &gt; 0</p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    <span className="text-2xl">📦</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
                  onClick={() => router.push('/products?status=low-stock')}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                    <p className="mt-2 text-3xl font-semibold text-orange-600">
                      {kpis.lowStock}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Below reorder point</p>
                  </div>
                  <div className="rounded-full bg-orange-100 p-3">
                    <span className="text-2xl">⚠️</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
                  onClick={() => router.push('/products?status=out-of-stock')}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                    <p className="mt-2 text-3xl font-semibold text-red-600">
                      {kpis.outOfStock}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Need restocking</p>
                  </div>
                  <div className="rounded-full bg-red-100 p-3">
                    <span className="text-2xl">🚫</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
                  onClick={() => router.push('/operations/receipts')}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Receipts
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-blue-600">
                      {kpis.pendingReceipts}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Awaiting validation</p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    <span className="text-2xl">📥</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
                  onClick={() => router.push('/operations/deliveries')}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Deliveries
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-green-600">
                      {kpis.pendingDeliveries}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Ready to ship</p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3">
                    <span className="text-2xl">📤</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
                  onClick={() => router.push('/operations/transfers')}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Transfers
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-purple-600">
                      {kpis.pendingTransfers}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Internal moves</p>
                  </div>
                  <div className="rounded-full bg-purple-100 p-3">
                    <span className="text-2xl">🔄</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Receipts */}
              <Card title="Recent Receipts" description="Latest completed incoming stock">
                {recentReceipts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent receipts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentReceipts.map((receipt) => (
                      <div
                        key={receipt.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/operations/receipts/${receipt.id}`)
                        }
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {receipt.documentNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            {receipt.partnerName || 'No vendor'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {receipt.warehouse.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="success">{receipt.status}</Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(receipt.validatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Recent Deliveries */}
              <Card
                title="Recent Deliveries"
                description="Latest completed outgoing stock"
              >
                {recentDeliveries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent deliveries</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentDeliveries.map((delivery) => (
                      <div
                        key={delivery.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/operations/deliveries/${delivery.id}`)
                        }
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {delivery.documentNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            {delivery.partnerName || 'No customer'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {delivery.warehouse.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="success">{delivery.status}</Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(delivery.validatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Recent Stock Moves */}
            <Card title="Recent Stock Moves" description="Latest inventory movements">
              {recentMoves.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent stock movements</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Movement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentMoves.map((move) => (
                        <tr
                          key={move.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push('/operations/move-history')}
                        >
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-gray-900">
                              {move.product.name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              SKU: {move.product.sku}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <span className="text-xs">
                                {move.fromLocation
                                  ? `${move.fromLocation.name} (${move.fromLocation.warehouse.name})`
                                  : 'External'}
                              </span>
                              <span>→</span>
                              <span className="text-xs">
                                {move.toLocation
                                  ? `${move.toLocation.name} (${move.toLocation.warehouse.name})`
                                  : 'External'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {Number(move.quantity).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  move.operation.opType === 'RECEIPT'
                                    ? 'info'
                                    : move.operation.opType === 'DELIVERY'
                                    ? 'success'
                                    : move.operation.opType === 'TRANSFER'
                                    ? 'warning'
                                    : 'danger'
                                }
                              >
                                {move.operation.opType}
                              </Badge>
                              <span className="text-xs text-gray-600">
                                {move.operation.documentNumber}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(move.moveDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Getting Started Guide */}
            {kpis.totalProducts === 0 && (
              <Card title="Getting Started" description="Quick setup guide">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                      <span>1️⃣</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Set up Warehouses & Locations
                      </h4>
                      <p className="text-sm text-gray-600">
                        Go to Settings to create your warehouses and storage
                        locations
                      </p>
                      <button
                        onClick={() => router.push('/settings/warehouses')}
                        className="text-sm text-primary-600 hover:text-primary-700 mt-1"
                      >
                        Go to Warehouses →
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                      <span>2️⃣</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Add Product Categories
                      </h4>
                      <p className="text-sm text-gray-600">
                        Organize your inventory with product categories
                      </p>
                      <button
                        onClick={() => router.push('/settings/categories')}
                        className="text-sm text-primary-600 hover:text-primary-700 mt-1"
                      >
                        Go to Categories →
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                      <span>3️⃣</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Create Products</h4>
                      <p className="text-sm text-gray-600">
                        Add your products with SKUs, units of measure, and initial
                        stock
                      </p>
                      <button
                        onClick={() => router.push('/products/new')}
                        className="text-sm text-primary-600 hover:text-primary-700 mt-1"
                      >
                        Create Product →
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                      <span>4️⃣</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Start Operations
                      </h4>
                      <p className="text-sm text-gray-600">
                        Begin managing receipts, deliveries, transfers, and
                        adjustments
                      </p>
                      <button
                        onClick={() => router.push('/operations/receipts/new')}
                        className="text-sm text-primary-600 hover:text-primary-700 mt-1"
                      >
                        Create Receipt →
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
    </div>
  )
}
