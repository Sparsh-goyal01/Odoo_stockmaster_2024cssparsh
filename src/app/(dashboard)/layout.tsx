import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getCurrentUserFromDB } from '@/lib/auth'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserFromDB()

  if (!user) {
    redirect('/login')
  }

  return (
    <DashboardLayout user={user}>
      {children}
    </DashboardLayout>
  )
}
