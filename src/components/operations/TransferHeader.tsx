'use client';

import Badge from '@/components/ui/Badge';

interface TransferHeaderProps {
  transfer: {
    documentNumber: string;
    status: string;
    warehouse?: {
      name: string;
      code: string;
    };
    sourceLocation?: {
      name: string;
      warehouse: {
        name: string;
      };
    };
    destinationLocation?: {
      name: string;
      warehouse: {
        name: string;
      };
    };
    notes?: string | null;
    createdAt: string;
    validatedAt?: string | null;
    createdByUser?: {
      name: string;
      email: string;
    };
    validatedByUser?: {
      name: string;
      email: string;
    } | null;
  };
}

export default function TransferHeader({ transfer }: TransferHeaderProps) {
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
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {transfer.documentNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Internal Transfer</p>
        </div>
        <Badge variant={getStatusColor(transfer.status)}>
          {transfer.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Source Information
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Warehouse:</span>
              <p className="text-sm font-medium text-gray-900">
                {transfer.warehouse?.name} ({transfer.warehouse?.code})
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Location:</span>
              <p className="text-sm font-medium text-gray-900">
                {transfer.sourceLocation?.name}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Destination Information
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Warehouse:</span>
              <p className="text-sm font-medium text-gray-900">
                {transfer.destinationLocation?.warehouse.name}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Location:</span>
              <p className="text-sm font-medium text-gray-900">
                {transfer.destinationLocation?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {transfer.notes && (
        <div className="mt-4">
          <span className="text-sm text-gray-600">Notes:</span>
          <p className="text-sm text-gray-900 mt-1">{transfer.notes}</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Created by:</span>
            <p className="text-gray-900">
              {transfer.createdByUser?.name} on{' '}
              {new Date(transfer.createdAt).toLocaleString()}
            </p>
          </div>
          {transfer.validatedAt && transfer.validatedByUser && (
            <div>
              <span className="text-gray-600">Validated by:</span>
              <p className="text-gray-900">
                {transfer.validatedByUser.name} on{' '}
                {new Date(transfer.validatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
