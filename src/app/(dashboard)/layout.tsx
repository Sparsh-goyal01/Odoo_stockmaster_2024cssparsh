import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  // Temporarily bypassing auth - showing dummy user
  const dummyUser = {
    name: 'Test User',
    email: 'test@example.com'
  }

  return (
    <DashboardLayout user={dummyUser}>
      {children}
    </DashboardLayout>
  )
}
