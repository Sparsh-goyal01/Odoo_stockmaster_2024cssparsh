import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { productSchema } from '@/lib/validations'
import { calculateTotalStock, getProductStockStatus } from '@/lib/stock'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productId = parseInt(params.id)

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        stockQuants: {
          include: {
            location: {
              include: { warehouse: true },
            },
          },
          orderBy: {
            location: {
              warehouse: { name: 'asc' },
            },
          },
        },
        reorderRules: {
          include: { warehouse: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Calculate stock status
    const totalStock = calculateTotalStock(product.stockQuants)
    const stockStatus = getProductStockStatus(totalStock, product.reorderRules)

    return NextResponse.json({
      ...product,
      totalStock,
      stockStatus,
    })
  } catch (error) {
    console.error('Get product error:', error)
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

    const productId = parseInt(params.id)

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const body = await request.json()
    const validation = productSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, sku, categoryId, unitOfMeasure, isActive } = validation.data

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if SKU is being changed and if it's already taken
    if (sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku },
      })

      if (skuExists) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 409 }
        )
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        sku,
        categoryId: categoryId || null,
        unitOfMeasure,
        isActive: isActive !== undefined ? isActive : existingProduct.isActive,
      },
      include: {
        category: true,
        stockQuants: {
          include: {
            location: {
              include: { warehouse: true },
            },
          },
        },
        reorderRules: true,
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Update product error:', error)
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

    const productId = parseInt(params.id)

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { stockQuants: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product has stock
    const hasStock = product.stockQuants.some((quant: any) => Number(quant.quantity) > 0)

    if (hasStock) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing stock. Please adjust stock to zero first.' },
        { status: 400 }
      )
    }

    // Delete product (cascades to related records)
    await prisma.product.delete({
      where: { id: productId },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
