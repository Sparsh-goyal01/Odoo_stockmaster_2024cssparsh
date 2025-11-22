import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link href="/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>

      <Card>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No products yet</p>
          <p className="text-sm mt-2">Create your first product to get started</p>
          <Link href="/products/new">
            <Button className="mt-4">Create Product</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
