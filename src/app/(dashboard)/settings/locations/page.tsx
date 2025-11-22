import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        <Button>Add Location</Button>
      </div>

      <Card>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No locations yet</p>
          <p className="text-sm mt-2">Create warehouses first, then add storage locations</p>
        </div>
      </Card>
    </div>
  )
}
