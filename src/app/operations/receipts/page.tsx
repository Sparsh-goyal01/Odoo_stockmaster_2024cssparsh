'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'

interface Receipt {
  id: number
  documentNumber: string
  partnerName: string | null
  status: string
  createdAt: string
  warehouse: {
    id: number
    name: string
  }
  lines: any[]
}

export default function ReceiptsPage() {
  const router = useRouter()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warehouses, setWarehouses] = useState<any[]>([])

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    warehouseId: 'all',
    vendor: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    fetchWarehouses()
    fetchReceipts()
  }, [filters])

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses')
      const data = await res.json()
      if (res.ok) {
        setWarehouses(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch warehouses:', err)
    }
  }

  const fetchReceipts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.warehouseId !== 'all') params.append('warehouseId', filters.warehouseId)
      if (filters.vendor) params.append('vendor', filters.vendor)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      params.append('page', filters.page.toString())

      const res = await fetch(`/api/operations/receipts?${params}`)
      const data = await res.json()

      if (res.ok) {
        setReceipts(data.data || [])
        setPagination(data.pagination)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch receipts')
      }
    } catch (err) {
      setError('An error occurred while fetching receipts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      DRAFT: 'default',
      WAITING: 'warning',
      READY: 'info',
      DONE: 'success',
      CANCELED: 'danger',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const columns = [
    {
      header: 'Document #',
      accessor: 'documentNumber' as const,
      render: (receipt: Receipt) => (
        <button
          onClick={() => router.push(`/operations/receipts/${receipt.id}`)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {receipt.documentNumber}
        </button>
      ),
    },
    {
      header: 'Vendor',
      accessor: 'partnerName' as const,
      render: (receipt: Receipt) => receipt.partnerName || '-',
    },
    {
      header: 'Warehouse',
      accessor: 'warehouse' as const,
      render: (receipt: Receipt) => receipt.warehouse.name,
    },
    {
      header: 'Status',
      accessor: 'status' as const,
      render: (receipt: Receipt) => getStatusBadge(receipt.status),
    },
    {
      header: 'Lines',
      accessor: 'lines' as const,
      render: (receipt: Receipt) => receipt.lines?.length || 0,
    },
    {
      header: 'Created',
      accessor: 'createdAt' as const,
      render: (receipt: Receipt) => new Date(receipt.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600 mt-1">Manage incoming stock from vendors</p>
        </div>
        <Button onClick={() => router.push('/operations/receipts/new')}>
          + New Receipt
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="WAITING">Waiting</option>
              <option value="READY">Ready</option>
              <option value="DONE">Done</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse
            </label>
            <select
              value={filters.warehouseId}
              onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <Input
              type="text"
              placeholder="Search vendor..."
              value={filters.vendor}
              onChange={(e) => handleFilterChange('vendor', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setFilters({
                status: 'all',
                warehouseId: 'all',
                vendor: '',
                dateFrom: '',
                dateTo: '',
                page: 1,
              })
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading receipts...</p>
        </div>
      ) : receipts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No receipts found</p>
          <Button
            variant="secondary"
            onClick={() => router.push('/operations/receipts/new')}
            className="mt-4"
          >
            Create First Receipt
          </Button>
        </div>
      ) : (
        <>
          <Table data={receipts} columns={columns} />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
