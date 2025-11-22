'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import AdjustmentHeader from '@/components/operations/AdjustmentHeader';
import AdjustmentLines from '@/components/operations/AdjustmentLines';
import { StatusActions } from '@/components/operations/StatusActions';

export default function AdjustmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const adjustmentId = params.id as string;

  const [adjustment, setAdjustment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAdjustment();
  }, [adjustmentId]);

  const fetchAdjustment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/operations/adjustments/${adjustmentId}`);
      if (response.ok) {
        const data = await response.json();
        setAdjustment(data);
      } else {
        setError('Failed to load adjustment');
      }
    } catch (error) {
      setError('An error occurred while loading adjustment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (newStatus: string) => {
    try {
      setError('');
      setSuccess('');
      const response = await fetch(
        `/api/operations/adjustments/${adjustmentId}/transition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newStatus }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Adjustment status updated to ${newStatus}`);
        setAdjustment(data);
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (error) {
      setError('An error occurred while updating status');
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete this adjustment? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      const response = await fetch(`/api/operations/adjustments/${adjustmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Adjustment deleted successfully');
        setTimeout(() => {
          router.push('/operations/adjustments');
        }, 1000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete adjustment');
      }
    } catch (error) {
      setError('An error occurred while deleting adjustment');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading adjustment...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!adjustment) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Adjustment not found</div>
        </div>
      </DashboardLayout>
    );
  }

  const canEdit = adjustment.status === 'DRAFT' || adjustment.status === 'WAITING';
  const canDelete = adjustment.status === 'DRAFT';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Adjustment Details</h1>
            <p className="text-gray-600 mt-1">
              View and manage stock adjustment
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.back()}>
              Back
            </Button>
            {canDelete && (
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
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
        <AdjustmentHeader adjustment={adjustment} />

        {/* Status Actions */}
        <StatusActions
          status={adjustment.status}
          onTransition={handleStatusTransition}
        />

        {/* Adjustment Lines */}
        <AdjustmentLines lines={adjustment.lines} />

        {/* Additional Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Created by:</span>
              <p className="text-gray-900">
                {adjustment.createdByUser?.name} (
                {adjustment.createdByUser?.email})
              </p>
              <p className="text-gray-500 text-xs">
                {new Date(adjustment.createdAt).toLocaleString()}
              </p>
            </div>
            {adjustment.validatedAt && adjustment.validatedByUser && (
              <div>
                <span className="text-gray-600">Validated by:</span>
                <p className="text-gray-900">
                  {adjustment.validatedByUser.name} (
                  {adjustment.validatedByUser.email})
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(adjustment.validatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
