import { getCurrentUserFromDB } from '@/lib/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserFromDB()

  return (
    <DashboardLayout user={user}>
      {children}
    </DashboardLayout>
  )
}
