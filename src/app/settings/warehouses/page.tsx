'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface Warehouse {
  id: number
  name: string
  code: string
  address: string | null
  isActive: boolean
  _count: {
    locations: number
  }
  createdAt: string
}

export default function WarehousesPage() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)

  useEffect(() => {
    fetchWarehouses()
  }, [includeInactive])

  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (includeInactive) params.append('includeInactive', 'true')

      const response = await fetch(`/api/warehouses?${params}`)
      if (response.ok) {
        const result = await response.json()
        setWarehouses(result.data || [])
      } else {
        setError('Failed to load warehouses')
      }
    } catch (error) {
      setError('An error occurred while loading warehouses')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete warehouse "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/warehouses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchWarehouses()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete warehouse')
      }
    } catch (error) {
      alert('An error occurred while deleting the warehouse')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage warehouse locations where inventory is stored
            </p>
          </div>
          <Button onClick={() => router.push('/settings/warehouses/new')}>
            + New Warehouse
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeInactive"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="includeInactive" className="ml-2 block text-sm text-gray-700">
              Include inactive warehouses
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Warehouses Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading warehouses...</div>
          ) : warehouses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No warehouses yet</p>
              <p className="text-sm mt-2">Create your first warehouse to get started</p>
              <Button
                className="mt-4"
                onClick={() => router.push('/settings/warehouses/new')}
              >
                Create Warehouse
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locations
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
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {warehouse.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {warehouse.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {warehouse.address || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {warehouse._count.locations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={warehouse.isActive ? 'success' : 'default'}>
                        {warehouse.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => router.push(`/settings/warehouses/${warehouse.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(warehouse.id, warehouse.name)}
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
