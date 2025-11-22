'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface Transfer {
  id: number;
  documentNumber: string;
  status: string;
  warehouse: {
    name: string;
    code: string;
  };
  sourceLocation: {
    name: string;
    warehouse: {
      name: string;
    };
  };
  destinationLocation: {
    name: string;
    warehouse: {
      name: string;
    };
  };
  createdAt: string;
  lines: Array<{
    product: {
      name: string;
    };
    quantity: number;
  }>;
}

export default function TransfersPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    sourceWarehouseId: '',
    destinationWarehouseId: '',
  });
  const [warehouses, setWarehouses] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    fetchWarehouses();
    fetchTransfers();
  }, [filters]);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses');
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.sourceWarehouseId) params.append('sourceWarehouseId', filters.sourceWarehouseId);
      if (filters.destinationWarehouseId) params.append('destinationWarehouseId', filters.destinationWarehouseId);

      const response = await fetch(`/api/operations/transfers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransfers(data.transfers || []);
      } else {
        setError('Failed to load transfers');
      }
    } catch (error) {
      setError('An error occurred while loading transfers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'WAITING':
        return 'warning';
      case 'READY':
        return 'info';
      case 'DONE':
        return 'success';
      case 'CANCELED':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Internal Transfers</h1>
            <p className="mt-1 text-sm text-gray-500">
              Move stock between locations and warehouses
            </p>
          </div>
          <Button onClick={() => router.push('/operations/transfers/new')}>
            + New Transfer
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="WAITING">Waiting</option>
                <option value="READY">Ready</option>
                <option value="DONE">Done</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Warehouse
              </label>
              <select
                value={filters.sourceWarehouseId}
                onChange={(e) => setFilters({ ...filters, sourceWarehouseId: e.target.value })}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Warehouse
              </label>
              <select
                value={filters.destinationWarehouseId}
                onChange={(e) => setFilters({ ...filters, destinationWarehouseId: e.target.value })}
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
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Transfers Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading transfers...</div>
          ) : transfers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transfers found. Create your first transfer to get started.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transfers.map((transfer) => (
                  <tr
                    key={transfer.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/operations/transfers/${transfer.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {transfer.documentNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{transfer.sourceLocation.warehouse.name}</div>
                      <div className="text-gray-500">{transfer.sourceLocation.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{transfer.destinationLocation.warehouse.name}</div>
                      <div className="text-gray-500">{transfer.destinationLocation.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(transfer.status)}>
                        {transfer.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transfer.lines.length} item(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transfer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/operations/transfers/${transfer.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
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
  );
}
