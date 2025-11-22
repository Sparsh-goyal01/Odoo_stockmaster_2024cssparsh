'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface StockMove {
  id: number
  moveDate: string
  operationType: string
  documentNumber: string
  product: {
    id: number
    name: string
    sku: string
  }
  fromLocation: {
    id: number
    name: string
    warehouseName: string
    warehouseId: number
  } | null
  toLocation: {
    id: number
    name: string
    warehouseName: string
    warehouseId: number
  } | null
  quantity: string
  user: {
    id: number
    name: string
    email: string
  }
  reason: string | null
}

interface Product {
  id: number
  name: string
  sku: string
}

interface Warehouse {
  id: number
  name: string
  code: string
}

interface Location {
  id: number
  name: string
  warehouseId: number
}

export default function MoveHistoryPage() {
  const router = useRouter()
  const [moves, setMoves] = useState<StockMove[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Filters
  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [opType, setOpType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Filter options
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    if (warehouseId) {
      setFilteredLocations(
        locations.filter((loc) => loc.warehouseId === parseInt(warehouseId))
      )
      setLocationId('')
    } else {
      setFilteredLocations(locations)
    }
  }, [warehouseId, locations])

  useEffect(() => {
    fetchMoves()
  }, [page, productId, warehouseId, locationId, opType, dateFrom, dateTo])

  const fetchFilterOptions = async () => {
    try {
      const [productsRes, warehousesRes, locationsRes] = await Promise.all([
        fetch('/api/products?limit=1000'),
        fetch('/api/warehouses'),
        fetch('/api/locations?limit=1000'),
      ])

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products || [])
      }

      if (warehousesRes.ok) {
        const data = await warehousesRes.json()
        setWarehouses(data.warehouses || [])
      }

      if (locationsRes.ok) {
        const data = await locationsRes.json()
        setLocations(data.locations || [])
        setFilteredLocations(data.locations || [])
      }
    } catch (err) {
      console.error('Failed to fetch filter options:', err)
    }
  }

  const fetchMoves = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (productId) params.append('productId', productId)
      if (warehouseId) params.append('warehouseId', warehouseId)
      if (locationId) params.append('locationId', locationId)
      if (opType) params.append('opType', opType)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(`/api/stock-moves?${params}`)
      const data = await response.json()

      if (response.ok) {
        setMoves(data.moves)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
      } else {
        setError(data.error || 'Failed to load stock moves')
      }
    } catch (err) {
      setError('An error occurred while loading stock moves')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setProductId('')
    setWarehouseId('')
    setLocationId('')
    setOpType('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const getOperationTypeBadge = (type: string) => {
    const colors: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
      RECEIPT: 'info',
      DELIVERY: 'success',
      TRANSFER: 'warning',
      ADJUSTMENT: 'danger',
    }
    return colors[type] || 'default'
  }

  const handleDocumentClick = (type: string, docNumber: string) => {
    const typeMap: Record<string, string> = {
      RECEIPT: 'receipts',
      DELIVERY: 'deliveries',
      TRANSFER: 'transfers',
      ADJUSTMENT: 'adjustments',
    }
    
    // Extract ID from document number (assuming format TYPE/XXXX)
    // We'll need to fetch the actual operation to get its ID
    // For now, just show an alert or navigate to the list page
    const path = typeMap[type]
    if (path) {
      router.push(`/operations/${path}`)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Move History</h1>
            <p className="text-gray-600 mt-1">View all inventory movements and changes</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Product Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product
              </label>
              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse
              </label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value)
                  setPage(1)
                }}
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

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!warehouseId && filteredLocations.length > 50}
              >
                <option value="">All Locations</option>
                {filteredLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              {!warehouseId && filteredLocations.length > 50 && (
                <p className="text-xs text-gray-500 mt-1">
                  Select a warehouse first to filter locations
                </p>
              )}
            </div>

            {/* Operation Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation Type
              </label>
              <select
                value={opType}
                onChange={(e) => {
                  setOpType(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                <option value="RECEIPT">Receipt</option>
                <option value="DELIVERY">Delivery</option>
                <option value="TRANSFER">Transfer</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>

            {/* Date From Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4">
            <Button variant="secondary" onClick={handleClearFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stock Moves Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Stock Movements {total > 0 && `(${total} records)`}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading stock moves...</span>
            </div>
          ) : moves.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No stock movements found</p>
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your filters or create new operations
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {moves.map((move) => (
                      <tr key={move.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(move.moveDate).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getOperationTypeBadge(move.operationType)}>
                            {move.operationType}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() =>
                              handleDocumentClick(
                                move.operationType,
                                move.documentNumber
                              )
                            }
                            className="text-primary-600 hover:text-primary-800 font-medium"
                          >
                            {move.documentNumber}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{move.product.name}</div>
                            <div className="text-gray-500 text-xs">
                              SKU: {move.product.sku}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {move.fromLocation ? (
                            <div>
                              <div>{move.fromLocation.name}</div>
                              <div className="text-gray-500 text-xs">
                                {move.fromLocation.warehouseName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">External</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {move.toLocation ? (
                            <div>
                              <div>{move.toLocation.name}</div>
                              <div className="text-gray-500 text-xs">
                                {move.toLocation.warehouseName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">External</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {Number(move.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div>{move.user.name}</div>
                            <div className="text-gray-500 text-xs">
                              {move.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {move.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {page} of {totalPages} ({total} total records)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
