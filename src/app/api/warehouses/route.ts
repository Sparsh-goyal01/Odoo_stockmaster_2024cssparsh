import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')

    const where: any = {
      isActive: true,
    }

    if (warehouseId && warehouseId !== 'all') {
      where.id = parseInt(warehouseId)
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: warehouses })
  } catch (error) {
    console.error('Get warehouses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
