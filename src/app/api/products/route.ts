import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { productFormSchema } from '@/lib/validations'
import { createInitialStockAdjustment, calculateTotalStock, getProductStockStatus } from '@/lib/stock'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: user.userId,
      AND: [],
    }

    // Search filter
    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    // Category filter
    if (categoryId && categoryId !== 'all') {
      where.AND.push({ categoryId: parseInt(categoryId) })
    }

    // Remove AND if empty
    if (where.AND.length === 0) {
      delete where.AND
    }

    // Fetch products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          stockQuants: true,
          reorderRules: true,
        },
        take: limit,
        skip,
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ])

    // Calculate stock status for each product
    const productsWithStatus = products.map((product: any) => {
      const totalStock = calculateTotalStock(product.stockQuants)
      const stockStatus = getProductStockStatus(totalStock, product.reorderRules)

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        category: product.category,
        unitOfMeasure: product.unitOfMeasure,
        isActive: product.isActive,
        totalStock,
        stockStatus,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }
    })

    return NextResponse.json({
      data: productsWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get products error:', error)
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
    const validation = productFormSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, sku, categoryId, unitOfMeasure, isActive, initialStock, reorderRule } = validation.data

    // Check if SKU already exists for this user
    const existingProduct = await prisma.product.findFirst({
      where: { 
        sku,
        userId: user.userId 
      },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 409 }
      )
    }

    // If initial stock is provided, validate warehouse and location exist
    if (initialStock) {
      const location = await prisma.location.findUnique({
        where: { id: initialStock.locationId },
        include: { warehouse: true },
      })

      if (!location) {
        return NextResponse.json(
          { error: 'Selected location does not exist' },
          { status: 400 }
        )
      }

      if (location.warehouseId !== initialStock.warehouseId) {
        return NextResponse.json(
          { error: 'Location does not belong to selected warehouse' },
          { status: 400 }
        )
      }
    }

    // Create product with initial stock in a transaction
    const product = await prisma.$transaction(async (tx: any) => {
      // 1. Create product
      const newProduct = await tx.product.create({
        data: {
          name,
          sku,
          categoryId: categoryId || null,
          unitOfMeasure,
          isActive: isActive !== undefined ? isActive : true,
          userId: user.userId,
        },
      })

      // 2. Create reorder rule if provided
      if (reorderRule && reorderRule.minQty !== undefined && reorderRule.reorderQty !== undefined) {
        await tx.reorderRule.create({
          data: {
            productId: newProduct.id,
            minQty: reorderRule.minQty,
            reorderQty: reorderRule.reorderQty,
            preferredVendor: reorderRule.preferredVendor || null,
          },
        })
      }

      // 3. If initial stock provided, create adjustment
      if (initialStock) {
        await createInitialStockAdjustment(
          newProduct.id,
          initialStock.locationId,
          initialStock.warehouseId,
          initialStock.quantity,
          user.userId,
          unitOfMeasure
        )
      }

      return newProduct
    })

    // Fetch created product with relations
    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
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

    return NextResponse.json(createdProduct, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
