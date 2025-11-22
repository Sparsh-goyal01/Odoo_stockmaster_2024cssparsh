import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function AdjustmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustments</h1>
        <Button>New Adjustment</Button>
      </div>

      <Card>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No adjustments yet</p>
          <p className="text-sm mt-2">Create an adjustment to correct stock discrepancies</p>
        </div>
      </Card>
    </div>
  )
}
