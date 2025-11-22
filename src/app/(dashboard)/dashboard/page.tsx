import Card from '@/components/ui/Card'

export default async function DashboardPage() {
  // TODO: Fetch real KPIs from API
  const kpis = {
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    internalTransfers: 0,
  }

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
              <p className="text-sm font-medium text-gray-600">Internal Transfers</p>
              <p className="mt-2 text-3xl font-semibold text-purple-600">
                {kpis.internalTransfers}
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
        <div className="text-center py-8 text-gray-500">
          <p>No recent activity</p>
          <p className="text-sm mt-2">Start by creating products, warehouses, and locations</p>
        </div>
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
