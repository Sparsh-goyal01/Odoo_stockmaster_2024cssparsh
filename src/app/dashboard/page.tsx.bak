'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome to StockMaster. Manage your inventory operations efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Receipts Card */}
          <Link
            href="/operations/receipts"
            className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Receipts</h2>
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              Manage incoming stock operations. Create and track receipts from vendors.
            </p>
          </Link>

          {/* Deliveries Card */}
          <Link
            href="/operations/deliveries"
            className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Deliveries</h2>
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              Manage outgoing stock operations. Create and track deliveries to customers.
            </p>
          </Link>

          {/* Stock Overview Card */}
          <Link
            href="/stock"
            className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Stock</h2>
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              View current stock levels by warehouse and location. Check inventory status.
            </p>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Receipts</span>
                <span className="text-sm font-semibold text-blue-600">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Deliveries</span>
                <span className="text-sm font-semibold text-green-600">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Products</span>
                <span className="text-sm font-semibold text-gray-900">-</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/operations/receipts/new"
                className="block px-4 py-2 text-sm text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
              >
                + New Receipt
              </Link>
              <Link
                href="/operations/deliveries/new"
                className="block px-4 py-2 text-sm text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
              >
                + New Delivery
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
