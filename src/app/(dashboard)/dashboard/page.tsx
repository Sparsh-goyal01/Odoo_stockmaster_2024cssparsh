import Card from '@/components/ui/Card'
import { cookies } from 'next/headers'

interface DashboardData {
  kpis: {
    totalProducts: number
    lowStockItems: number
    outOfStockItems: number
    pendingReceipts: number
    pendingDeliveries: number
    pendingTransfers: number
    pendingAdjustments: number
    totalPendingOperations: number
  }
  recentOperations: Array<{
    id: number
    documentNumber: string
    opType: string
    status: string
    createdAt: string
    warehouse: { name: string }
    createdByUser: { name: string }
  }>
}

async function fetchDashboardData(): Promise<DashboardData | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) return null

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/kpis`, {
      headers: {
        Cookie: `token=${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) return null

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    return null
  }
}

export default async function DashboardPage() {
  const data = await fetchDashboardData()
  
  const kpis = data?.kpis || {
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0,
    pendingAdjustments: 0,
    totalPendingOperations: 0,
  }
  
  const recentOperations = data?.recentOperations || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {kpis.totalProducts}
              </p>
            </div>
            <div className="rounded-full bg-primary-100 p-3">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="mt-2 text-3xl font-semibold text-orange-600">
                {kpis.lowStockItems}
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">
                {kpis.outOfStockItems}
              </p>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <span className="text-2xl">🚫</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Receipts</p>
              <p className="mt-2 text-3xl font-semibold text-blue-600">
                {kpis.pendingReceipts}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <span className="text-2xl">📥</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Deliveries</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">
                {kpis.pendingDeliveries}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <span className="text-2xl">📤</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Transfers</p>
              <p className="mt-2 text-3xl font-semibold text-purple-600">
                {kpis.pendingTransfers}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card title="Recent Activity" description="Latest inventory operations">
        {recentOperations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity</p>
            <p className="text-sm mt-2">Start by creating products, warehouses, and locations</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOperations.map((op) => (
                  <tr key={op.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {op.documentNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {op.opType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        op.status === 'DONE' ? 'bg-green-100 text-green-800' :
                        op.status === 'CANCELED' ? 'bg-red-100 text-red-800' :
                        op.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {op.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {op.warehouse.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {op.createdByUser.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(op.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Getting Started */}
      <Card title="Getting Started" description="Quick setup guide">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
              <span>1️⃣</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Set up Warehouses & Locations</h4>
              <p className="text-sm text-gray-600">
                Go to Settings to create your warehouses and storage locations
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
              <span>2️⃣</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Add Product Categories</h4>
              <p className="text-sm text-gray-600">
                Organize your inventory with product categories
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
              <span>3️⃣</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Create Products</h4>
              <p className="text-sm text-gray-600">
                Add your products with SKUs, units of measure, and initial stock
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
              <span>4️⃣</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Start Operations</h4>
              <p className="text-sm text-gray-600">
                Begin managing receipts, deliveries, transfers, and adjustments
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
