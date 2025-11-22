import { prisma } from './prisma'
import { generateDocumentNumber } from './utils'

/**
 * Creates an initial stock adjustment for a new product
 * This creates the necessary records to track the stock entry
 */
export async function createInitialStockAdjustment(
  productId: number,
  locationId: number,
  warehouseId: number,
  quantity: number,
  userId: number,
  unitOfMeasure: string
) {
  return await prisma.$transaction(async (tx: any) => {
    // 1. Get next operation number
    const count = await tx.operation.count({
      where: { opType: 'ADJUSTMENT' },
    })
    const documentNumber = generateDocumentNumber('ADJUSTMENT', count)

    // 2. Create operation
    const operation = await tx.operation.create({
      data: {
        opType: 'ADJUSTMENT',
        documentNumber,
        status: 'DONE',
        warehouseId,
        destinationLocationId: locationId,
        createdBy: userId,
        validatedBy: userId,
        validatedAt: new Date(),
        notes: 'Initial stock entry',
      },
    })

    // 3. Create operation line
    await tx.operationLine.create({
      data: {
        operationId: operation.id,
        productId,
        quantity,
        unitOfMeasure,
        destinationLocationId: locationId,
      },
    })

    // 4. Create or update stock quant
    const existingQuant = await tx.stockQuant.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
    })

    if (existingQuant) {
      await tx.stockQuant.update({
        where: { id: existingQuant.id },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      })
    } else {
      await tx.stockQuant.create({
        data: {
          productId,
          locationId,
          quantity,
        },
      })
    }

    // 5. Create stock move
    await tx.stockMove.create({
      data: {
        operationId: operation.id,
        productId,
        toLocationId: locationId,
        quantity,
        userId,
        reason: 'Initial stock entry',
      },
    })

    return operation
  })
}

/**
 * Calculate stock status based on reorder rules
 */
export function getProductStockStatus(
  totalStock: number,
  reorderRules: Array<{ minQty: number }> = []
): 'OK' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (totalStock === 0) {
    return 'OUT_OF_STOCK'
  }

  if (reorderRules.length > 0) {
    const minQty = Math.min(...reorderRules.map((r) => Number(r.minQty)))
    if (totalStock < minQty) {
      return 'LOW_STOCK'
    }
  }

  return 'OK'
}

/**
 * Calculate available stock (on-hand minus reserved)
 */
export function calculateAvailableStock(
  quantity: number,
  reservedQuantity: number
): number {
  return Math.max(0, quantity - reservedQuantity)
}

/**
 * Calculate total stock for a product across all locations
 */
export function calculateTotalStock(
  stockQuants: Array<{ quantity: number }>
): number {
  return stockQuants.reduce((sum, quant) => sum + Number(quant.quantity), 0)
}

/**
 * Validate stock availability for operations
 */
export function validateStockAvailability(
  availableQuantity: number,
  requiredQuantity: number
): { valid: boolean; error?: string } {
  if (availableQuantity < requiredQuantity) {
    return {
      valid: false,
      error: `Insufficient stock. Available: ${availableQuantity}, Required: ${requiredQuantity}`,
    }
  }
  return { valid: true }
}

/**
 * Validate receipt before processing
 * Ensures destination location exists and belongs to the warehouse
 */
export async function validateReceiptOperation(
  warehouseId: number,
  destinationLocationId: number
): Promise<{ valid: boolean; error?: string }> {
  const location = await prisma.location.findUnique({
    where: { id: destinationLocationId },
    include: { warehouse: true },
  })

  if (!location) {
    return {
      valid: false,
      error: 'Destination location does not exist',
    }
  }

  if (location.warehouseId !== warehouseId) {
    return {
      valid: false,
      error: 'Destination location does not belong to the selected warehouse',
    }
  }

  return { valid: true }
}

/**
 * Process receipt validation (DONE status transition)
 * Increases stock at destination location for each line
 */
export async function processReceiptValidation(
  operationId: number,
  userId: number
) {
  return await prisma.$transaction(async (tx: any) => {
    // 1. Get operation with lines
    const operation = await tx.operation.findUnique({
      where: { id: operationId },
      include: {
        lines: {
          include: { product: true },
        },
      },
    })

    if (!operation) {
      throw new Error('Receipt not found')
    }

    if (operation.status === 'DONE') {
      throw new Error('Receipt already validated')
    }

    if (operation.status === 'CANCELED') {
      throw new Error('Cannot validate a canceled receipt')
    }

    // 2. Process each line
    for (const line of operation.lines) {
      const destinationLocationId =
        line.destinationLocationId || operation.destinationLocationId

      if (!destinationLocationId) {
        throw new Error(
          `No destination location specified for product ${line.product.name}`
        )
      }

      // 3. Upsert stock quant
      const existingQuant = await tx.stockQuant.findUnique({
        where: {
          productId_locationId: {
            productId: line.productId,
            locationId: destinationLocationId,
          },
        },
      })

      if (existingQuant) {
        await tx.stockQuant.update({
          where: { id: existingQuant.id },
          data: {
            quantity: {
              increment: Number(line.quantity),
            },
          },
        })
      } else {
        await tx.stockQuant.create({
          data: {
            productId: line.productId,
            locationId: destinationLocationId,
            quantity: Number(line.quantity),
          },
        })
      }

      // 4. Create stock move
      await tx.stockMove.create({
        data: {
          operationId: operation.id,
          productId: line.productId,
          toLocationId: destinationLocationId,
          quantity: Number(line.quantity),
          userId,
          reason: `Receipt ${operation.documentNumber}`,
        },
      })
    }

    // 5. Update operation status
    const updatedOperation = await tx.operation.update({
      where: { id: operationId },
      data: {
        status: 'DONE',
        validatedBy: userId,
        validatedAt: new Date(),
      },
    })

    return updatedOperation
  })
}

/**
 * Validate delivery before processing
 * Ensures source location exists and belongs to the warehouse
 */
export async function validateDeliveryOperation(
  warehouseId: number,
  sourceLocationId: number
): Promise<{ valid: boolean; error?: string }> {
  const location = await prisma.location.findUnique({
    where: { id: sourceLocationId },
    include: { warehouse: true },
  })

  if (!location) {
    return {
      valid: false,
      error: 'Source location does not exist',
    }
  }

  if (location.warehouseId !== warehouseId) {
    return {
      valid: false,
      error: 'Source location does not belong to the selected warehouse',
    }
  }

  return { valid: true }
}

/**
 * Process delivery validation (DONE status transition)
 * Decreases stock at source location for each line
 * Prevents negative stock
 */
export async function processDeliveryValidation(
  operationId: number,
  userId: number
) {
  return await prisma.$transaction(async (tx: any) => {
    // 1. Get operation with lines
    const operation = await tx.operation.findUnique({
      where: { id: operationId },
      include: {
        lines: {
          include: { product: true },
        },
      },
    })

    if (!operation) {
      throw new Error('Delivery not found')
    }

    if (operation.status === 'DONE') {
      throw new Error('Delivery already validated')
    }

    if (operation.status === 'CANCELED') {
      throw new Error('Cannot validate a canceled delivery')
    }

    // 2. Validate stock availability for each line
    for (const line of operation.lines) {
      const sourceLocationId =
        line.sourceLocationId || operation.sourceLocationId

      if (!sourceLocationId) {
        throw new Error(
          `No source location specified for product ${line.product.name}`
        )
      }

      // Check stock availability
      const existingQuant = await tx.stockQuant.findUnique({
        where: {
          productId_locationId: {
            productId: line.productId,
            locationId: sourceLocationId,
          },
        },
      })

      const availableQty = existingQuant
        ? Number(existingQuant.quantity) - Number(existingQuant.reservedQuantity)
        : 0

      if (availableQty < Number(line.quantity)) {
        throw new Error(
          `Insufficient stock for product ${line.product.name}. Available: ${availableQty}, Required: ${line.quantity}`
        )
      }
    }

    // 3. Process each line - decrease stock
    for (const line of operation.lines) {
      const sourceLocationId =
        line.sourceLocationId || operation.sourceLocationId

      // Decrease stock quant
      const existingQuant = await tx.stockQuant.findUnique({
        where: {
          productId_locationId: {
            productId: line.productId,
            locationId: sourceLocationId!,
          },
        },
      })

      if (existingQuant) {
        const newQuantity = Number(existingQuant.quantity) - Number(line.quantity)
        
        if (newQuantity < 0) {
          throw new Error(
            `Cannot create negative stock for product ${line.product.name}`
          )
        }

        await tx.stockQuant.update({
          where: { id: existingQuant.id },
          data: {
            quantity: newQuantity,
          },
        })
      }

      // 4. Create stock move (from internal to customer/null)
      await tx.stockMove.create({
        data: {
          operationId: operation.id,
          productId: line.productId,
          fromLocationId: sourceLocationId!,
          toLocationId: null, // Outgoing to customer
          quantity: Number(line.quantity),
          userId,
          reason: `Delivery ${operation.documentNumber}`,
        },
      })
    }

    // 5. Update operation status
    const updatedOperation = await tx.operation.update({
      where: { id: operationId },
      data: {
        status: 'DONE',
        validatedBy: userId,
        validatedAt: new Date(),
      },
    })

    return updatedOperation
  })
}
