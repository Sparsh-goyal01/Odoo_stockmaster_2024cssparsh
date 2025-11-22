'use client';

import Badge from '@/components/ui/Badge';

interface AdjustmentLinesProps {
  lines: Array<{
    id: number;
    product: {
      id: number;
      name: string;
      sku: string;
    };
    quantity: number;
    unitOfMeasure: string;
    recordedQuantity?: number;
    countedQuantity?: number;
    difference?: number;
    remarks?: string | null;
  }>;
}

export default function AdjustmentLines({ lines }: AdjustmentLinesProps) {
  const getDifferenceColor = (diff: number) => {
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getDifferenceSign = (diff: number) => {
    if (diff > 0) return '+';
    return '';
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Adjustment Lines
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recorded Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Counted Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Difference
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                UOM
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lines.map((line) => {
              const recorded = line.recordedQuantity ?? 0;
              const counted = line.countedQuantity ?? line.quantity;
              const diff = line.difference ?? (counted - recorded);

              return (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {line.product.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {line.product.sku}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                    {recorded}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {counted}
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${getDifferenceColor(
                      diff
                    )}`}
                  >
                    {getDifferenceSign(diff)}
                    {diff}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {line.unitOfMeasure}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {line.remarks || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {lines.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No adjustment lines added yet.
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Positive differences indicate stock increases,
          negative differences indicate stock decreases. The system will update
          stock quantities to the counted values when validated.
        </p>
      </div>
    </div>
  );
}
