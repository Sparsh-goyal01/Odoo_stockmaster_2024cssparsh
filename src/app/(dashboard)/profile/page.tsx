'use client'

import Card from '@/components/ui/Card'
import { getCurrentUserFromDB } from '@/lib/auth'

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <Card title="User Information">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Manage your profile settings and change your password.
          </p>
          <p className="text-sm text-gray-500 italic">
            Profile management features coming soon...
          </p>
        </div>
      </Card>
    </div>
  )
}
