import Card from '@/components/ui/Card'

export default function MoveHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Stock Move History</h1>

      <Card>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No stock movements yet</p>
          <p className="text-sm mt-2">Stock movements will appear here once you start operations</p>
        </div>
      </Card>
    </div>
  )
}
