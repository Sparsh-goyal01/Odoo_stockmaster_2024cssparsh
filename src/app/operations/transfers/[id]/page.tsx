'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import TransferHeader from '@/components/operations/TransferHeader'
import TransferLines from '@/components/operations/TransferLines'
import { StatusActions } from '@/components/operations/StatusActions'

export default function TransferDetailPage() {
  const router = useRouter()
  const params = useParams()
  const transferId = params.id as string

  const [transfer, setTransfer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchTransfer()
  }, [transferId])

  const fetchTransfer = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/operations/transfers/${transferId}`)
      if (response.ok) {
        const data = await response.json()
        setTransfer(data)
      } else {
        setError('Failed to load transfer')
      }
    } catch (error) {
      setError('An error occurred while loading transfer')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusTransition = async (action: string) => {
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/operations/transfers/${transferId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(`Transfer ${action === 'done' ? 'validated' : 'updated'} successfully!`)
        await fetchTransfer() // Refresh data
      } else {
        setError(data.error || 'Failed to process action')
      }
    } catch (err) {
      setError('An error occurred while processing action')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transfer?')) return

    try {
      const res = await fetch(`/api/operations/transfers/${transferId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/operations/transfers')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete transfer')
      }
    } catch (err) {
      setError('An error occurred while deleting transfer')
      console.error(err)
    }
  }

  const isEditable = transfer?.status === 'DRAFT' || transfer?.status === 'WAITING'
  const isDeletable = transfer?.status === 'DRAFT'

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Loading transfer...</p>
      </div>
    )
  }

  if (!transfer) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Transfer not found</p>
        <Button variant="secondary" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transfer Details</h1>
          <p className="text-gray-600 mt-1">{transfer.documentNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          {isDeletable && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.back()}>
            Back to List
          </Button>
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

      {/* Transfer Header */}
      <TransferHeader transfer={transfer} />

      {/* Status Actions */}
      <StatusActions
        status={transfer.status}
        onTransition={handleStatusTransition}
      />

      {/* Transfer Lines */}
      <TransferLines lines={transfer.lines} />

      {/* Additional Info */}
      {(transfer.creator || transfer.validator) && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            {transfer.creator && (
              <div>
                <span className="font-medium">Created by:</span> {transfer.creator.name} (
                {transfer.creator.email})
              </div>
            )}
            {transfer.validator && (
              <div>
                <span className="font-medium">Validated by:</span> {transfer.validator.name} (
                {transfer.validator.email})
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
