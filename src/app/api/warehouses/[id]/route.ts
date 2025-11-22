import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { warehouseSchema } from '@/lib/validations'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const warehouseId = parseInt(params.id)

    if (isNaN(warehouseId)) {
      return NextResponse.json({ error: 'Invalid warehouse ID' }, { status: 400 })
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        locations: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { locations: true },
        },
      },
    })

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error('Get warehouse error:', error)
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

    const warehouseId = parseInt(params.id)

    if (isNaN(warehouseId)) {
      return NextResponse.json({ error: 'Invalid warehouse ID' }, { status: 400 })
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

    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    })

    if (!existingWarehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    // Check if code is being changed and if it's already taken
    if (code !== existingWarehouse.code) {
      const codeExists = await prisma.warehouse.findUnique({
        where: { code },
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'A warehouse with this code already exists' },
          { status: 409 }
        )
      }
    }

    // Update warehouse
    const updatedWarehouse = await prisma.warehouse.update({
      where: { id: warehouseId },
      data: {
        name,
        code,
        address: address || null,
        isActive: isActive !== undefined ? isActive : existingWarehouse.isActive,
      },
      include: {
        _count: {
          select: { locations: true },
        },
      },
    })

    return NextResponse.json(updatedWarehouse)
  } catch (error) {
    console.error('Update warehouse error:', error)
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

    const warehouseId = parseInt(params.id)

    if (isNaN(warehouseId)) {
      return NextResponse.json({ error: 'Invalid warehouse ID' }, { status: 400 })
    }

    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        locations: true,
        operations: true,
      },
    })

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    // Check if warehouse has locations
    if (warehouse.locations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete warehouse with existing locations. Please delete or reassign locations first.' },
        { status: 400 }
      )
    }

    // Check if warehouse has operations
    if (warehouse.operations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete warehouse with existing operations.' },
        { status: 400 }
      )
    }

    // Delete warehouse
    await prisma.warehouse.delete({
      where: { id: warehouseId },
    })

    return NextResponse.json({ message: 'Warehouse deleted successfully' })
  } catch (error) {
    console.error('Delete warehouse error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
