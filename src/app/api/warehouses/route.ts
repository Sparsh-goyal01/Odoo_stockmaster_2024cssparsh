import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { warehouseSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {
      userId: user.userId,
    }

    if (!includeInactive) {
      where.isActive = true
    }

    if (warehouseId && warehouseId !== 'all') {
      where.id = parseInt(warehouseId)
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        _count: {
          select: { locations: true },
        },
      },
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

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = warehouseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, code, address, isActive } = validation.data

    // Check if code already exists for this user
    const existingWarehouse = await prisma.warehouse.findFirst({
      where: { 
        code,
        userId: user.userId,
      },
    })

    if (existingWarehouse) {
      return NextResponse.json(
        { error: 'A warehouse with this code already exists' },
        { status: 409 }
      )
    }

    // Create warehouse
    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        address: address || null,
        userId: user.userId,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        _count: {
          select: { locations: true },
        },
      },
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error) {
    console.error('Create warehouse error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
