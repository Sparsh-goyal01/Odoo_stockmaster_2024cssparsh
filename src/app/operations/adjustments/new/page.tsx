'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';

interface Product {
  id: number;
  name: string;
  sku: string;
  unitOfMeasure: string;
}

interface Line {
  productId: string;
  recordedQuantity: number;
  countedQuantity: string;
  unitOfMeasure: string;
  remarks: string;
}

export default function NewAdjustmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    warehouseId: '',
    locationId: '',
    notes: '',
  });

  const [lines, setLines] = useState<Line[]>([
    {
      productId: '',
      recordedQuantity: 0,
      countedQuantity: '',
      unitOfMeasure: '',
      remarks: '',
    },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [warehousesRes, locationsRes, productsRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/locations'),
        fetch('/api/products?limit=1000'),
      ]);

      const [warehousesData, locationsData, productsData] = await Promise.all([
        warehousesRes.json(),
        locationsRes.json(),
        productsRes.json(),
      ]);

      if (warehousesRes.ok) setWarehouses(warehousesData.warehouses || []);
      if (locationsRes.ok) setLocations(locationsData.data || []);
      if (productsRes.ok) setProducts(productsData.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  const filteredLocations = formData.warehouseId
    ? locations.filter((loc: any) => loc.warehouseId === parseInt(formData.warehouseId))
    : [];

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'warehouseId') {
      setFormData({ ...formData, warehouseId: value, locationId: '' });
    } else {
      setFormData({ ...formData, [field]: value });
    }
    setError('');
  };

  const handleLineChange = async (index: number, field: string, value: string) => {
    const updatedLines = [...lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };

    // If product changed, fetch current stock and set UOM
    if (field === 'productId' && value && formData.locationId) {
      const product = products.find((p) => p.id === parseInt(value));
      if (product) {
        updatedLines[index].unitOfMeasure = product.unitOfMeasure;

        // Fetch current stock quantity
        try {
          const response = await fetch(
            `/api/products/${value}/stock?locationId=${formData.locationId}`
          );
          if (response.ok) {
            const data = await response.json();
            const stockQuant = data.stockQuants?.find(
              (sq: any) => sq.locationId === parseInt(formData.locationId)
            );
            updatedLines[index].recordedQuantity = stockQuant
              ? Number(stockQuant.quantity)
              : 0;
          }
        } catch (err) {
          console.error('Failed to fetch stock:', err);
          updatedLines[index].recordedQuantity = 0;
        }
      }
    }

    setLines(updatedLines);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        productId: '',
        recordedQuantity: 0,
        countedQuantity: '',
        unitOfMeasure: '',
        remarks: '',
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (!formData.warehouseId) {
      setError('Please select a warehouse');
      return false;
    }

    if (!formData.locationId) {
      setError('Please select a location');
      return false;
    }

    if (lines.length === 0) {
      setError('Please add at least one line');
      return false;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.productId) {
        setError(`Line ${i + 1}: Please select a product`);
        return false;
      }
      if (line.countedQuantity === '' || parseFloat(line.countedQuantity) < 0) {
        setError(`Line ${i + 1}: Please enter a valid counted quantity`);
        return false;
      }
    }

    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        warehouseId: parseInt(formData.warehouseId),
        destinationLocationId: parseInt(formData.locationId),
        notes: formData.notes || null,
        lines: lines.map((line) => ({
          productId: parseInt(line.productId),
          quantity: parseFloat(line.countedQuantity), // This is the counted quantity
          unitOfMeasure: line.unitOfMeasure,
          remarks: line.remarks || null,
        })),
      };

      const res = await fetch('/api/operations/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Adjustment created successfully!');
        setTimeout(() => {
          router.push(`/operations/adjustments/${data.id}`);
        }, 1000);
      } else {
        setError(data.error || 'Failed to create adjustment');
      }
    } catch (err) {
      setError('An error occurred while creating adjustment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Stock Adjustment</h1>
            <p className="text-gray-600 mt-1">
              Adjust inventory based on physical count
            </p>
          </div>
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Adjustment Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Adjustment Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse *
              </label>
              <select
                value={formData.warehouseId}
                onChange={(e) => handleFieldChange('warehouseId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => handleFieldChange('locationId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.warehouseId}
              >
                <option value="">Select Location</option>
                {filteredLocations.map((location: any) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason / Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Annual stock count, Damage, Loss, Expiry..."
              />
            </div>
          </div>
        </div>

        {/* Adjustment Lines */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Products to Adjust</h2>
            <Button onClick={addLine} disabled={!formData.locationId}>
              + Add Product
            </Button>
          </div>

          {!formData.locationId && (
            <div className="text-sm text-gray-500 mb-4">
              Please select a warehouse and location first.
            </div>
          )}

          <div className="space-y-4">
            {lines.map((line, index) => {
              const difference =
                line.countedQuantity !== ''
                  ? parseFloat(line.countedQuantity) - line.recordedQuantity
                  : 0;
              const diffColor =
                difference > 0
                  ? 'text-green-600'
                  : difference < 0
                  ? 'text-red-600'
                  : 'text-gray-600';

              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product *
                      </label>
                      <select
                        value={line.productId}
                        onChange={(e) =>
                          handleLineChange(index, 'productId', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!formData.locationId}
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recorded Qty
                      </label>
                      <input
                        type="number"
                        value={line.recordedQuantity}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Counted Qty *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.countedQuantity}
                        onChange={(e) =>
                          handleLineChange(index, 'countedQuantity', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difference
                      </label>
                      <div
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold ${diffColor}`}
                      >
                        {difference > 0 ? '+' : ''}
                        {difference.toFixed(2)} {line.unitOfMeasure}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Action
                      </label>
                      <Button
                        variant="danger"
                        onClick={() => removeLine(index)}
                        disabled={lines.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Line Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      value={line.remarks}
                      onChange={(e) =>
                        handleLineChange(index, 'remarks', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Specific reason for this product..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSaveDraft} disabled={loading}>
            {loading ? 'Saving...' : 'Save as Draft'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
