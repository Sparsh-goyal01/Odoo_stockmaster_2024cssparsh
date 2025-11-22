import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { locationSchema } from '@/lib/validations'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locationId = parseInt(params.id)

    if (isNaN(locationId)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    const location = await prisma.location.findFirst({
      where: { 
        id: locationId,
        warehouse: {
          userId: user.userId,
        },
      },
      include: {
        warehouse: true,
        stockQuants: {
          include: {
            product: true,
          },
          orderBy: { product: { name: 'asc' } },
        },
        _count: {
          select: { stockQuants: true },
        },
      },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Get location error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locationId = parseInt(params.id)

    if (isNaN(locationId)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
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

    // Check if location exists and belongs to user's warehouse
    const existingLocation = await prisma.location.findFirst({
      where: { 
        id: locationId,
        warehouse: {
          userId: user.userId,
        },
      },
    })

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check if warehouse exists and belongs to user
    const warehouse = await prisma.warehouse.findFirst({
      where: { 
        id: warehouseId,
        userId: user.userId 
      },
    })

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Selected warehouse does not exist or you do not have access' },
        { status: 400 }
      )
    }

    // Update location
    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: {
        warehouseId,
        name,
        type: type || existingLocation.type,
        isActive: isActive !== undefined ? isActive : existingLocation.isActive,
      },
      include: {
        warehouse: true,
        _count: {
          select: { stockQuants: true },
        },
      },
    })

    return NextResponse.json(updatedLocation)
  } catch (error) {
    console.error('Update location error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locationId = parseInt(params.id)

    if (isNaN(locationId)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    // Check if location exists and belongs to user's warehouse
    const location = await prisma.location.findFirst({
      where: { 
        id: locationId,
        warehouse: {
          userId: user.userId,
        },
      },
      include: { stockQuants: true },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check if location has stock
    const hasStock = location.stockQuants.some((quant: any) => Number(quant.quantity) > 0)

    if (hasStock) {
      return NextResponse.json(
        { error: 'Cannot delete location with existing stock. Please move stock to another location first.' },
        { status: 400 }
      )
    }

    // Delete location
    await prisma.location.delete({
      where: { id: locationId },
    })

    return NextResponse.json({ message: 'Location deleted successfully' })
  } catch (error) {
    console.error('Delete location error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
