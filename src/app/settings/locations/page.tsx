'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface Location {
  id: number
  name: string
  type: string
  warehouse: {
    id: number
    name: string
  }
  isActive: boolean
  _count: {
    stockQuants: number
  }
  createdAt: string
}

export default function LocationsPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [warehouses, setWarehouses] = useState<Array<{ id: number; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    warehouseId: '',
    includeInactive: false,
  })

  useEffect(() => {
    fetchWarehouses()
    fetchLocations()
  }, [filters])

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses')
      if (response.ok) {
        const result = await response.json()
        setWarehouses(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.warehouseId) params.append('warehouseId', filters.warehouseId)
      if (filters.includeInactive) params.append('includeInactive', 'true')

      const response = await fetch(`/api/locations?${params}`)
      if (response.ok) {
        const result = await response.json()
        setLocations(result.data || [])
      } else {
        setError('Failed to load locations')
      }
    } catch (error) {
      setError('An error occurred while loading locations')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete location "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchLocations()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete location')
      }
    } catch (error) {
      alert('An error occurred while deleting the location')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INTERNAL':
        return 'info'
      case 'VENDOR':
        return 'warning'
      case 'CUSTOMER':
        return 'success'
      case 'SCRAP':
        return 'danger'
      default:
        return 'default'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage storage locations within warehouses
            </p>
          </div>
          <Button onClick={() => router.push('/settings/locations/new')}>
            + New Location
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse
              </label>
              <select
                value={filters.warehouseId}
                onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeInactive"
                checked={filters.includeInactive}
                onChange={(e) => setFilters({ ...filters, includeInactive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="includeInactive" className="ml-2 block text-sm text-gray-700">
                Include inactive locations
              </label>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Locations Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading locations...</div>
          ) : locations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No locations yet</p>
              <p className="text-sm mt-2">Create your first location to get started</p>
              <Button
                className="mt-4"
                onClick={() => router.push('/settings/locations/new')}
              >
                Create Location
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {location.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {location.warehouse.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getTypeColor(location.type)}>
                        {location.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {location._count.stockQuants}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={location.isActive ? 'success' : 'default'}>
                        {location.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => router.push(`/settings/locations/${location.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(location.id, location.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
