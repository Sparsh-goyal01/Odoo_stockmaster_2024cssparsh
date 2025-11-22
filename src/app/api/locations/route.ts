import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { locationSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}

    if (!includeInactive) {
      where.isActive = true
    }

    if (warehouseId && warehouseId !== 'all') {
      where.warehouseId = parseInt(warehouseId)
    }

    const locations = await prisma.location.findMany({
      where,
      include: {
        warehouse: true,
        _count: {
          select: { stockQuants: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: locations })
  } catch (error) {
    console.error('Get locations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = locationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { warehouseId, name, type, isActive } = validation.data

    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    })

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Selected warehouse does not exist' },
        { status: 400 }
      )
    }

    // Create location
    const location = await prisma.location.create({
      data: {
        warehouseId,
        name,
        type: type || 'INTERNAL',
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        warehouse: true,
        _count: {
          select: { stockQuants: true },
        },
      },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Create location error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
