export interface User {
  id: number
  name: string
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: number
  name: string
  sku: string
  categoryId?: number | null
  unitOfMeasure: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  category?: Category | null
}

export interface Category {
  id: number
  name: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Warehouse {
  id: number
  name: string
  code: string
  address?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Location {
  id: number
  warehouseId: number
  name: string
  type: 'INTERNAL' | 'VENDOR' | 'CUSTOMER' | 'SCRAP'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  warehouse?: Warehouse
}

export interface StockQuant {
  id: number
  productId: number
  locationId: number
  quantity: number
  reservedQuantity: number
  updatedAt: Date
  product?: Product
  location?: Location
}

export type OperationType = 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT'
export type OperationStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED'

export interface Operation {
  id: number
  opType: OperationType
  documentNumber: string
  status: OperationStatus
  warehouseId: number
  sourceLocationId?: number | null
  destinationLocationId?: number | null
  partnerName?: string | null
  createdBy: number
  validatedBy?: number | null
  createdAt: Date
  updatedAt: Date
  validatedAt?: Date | null
  notes?: string | null
  warehouse?: Warehouse
  sourceLocation?: Location | null
  destinationLocation?: Location | null
  lines?: OperationLine[]
}

export interface OperationLine {
  id: number
  operationId: number
  productId: number
  quantity: number
  unitOfMeasure: string
  sourceLocationId?: number | null
  destinationLocationId?: number | null
  remarks?: string | null
  product?: Product
}

export interface StockMove {
  id: number
  operationId: number
  productId: number
  fromLocationId?: number | null
  toLocationId?: number | null
  quantity: number
  moveDate: Date
  userId: number
  reason?: string | null
  product?: Product
  fromLocation?: Location | null
  toLocation?: Location | null
  operation?: Operation
}

export interface DashboardKPIs {
  totalProducts: number
  lowStockItems: number
  outOfStockItems: number
  pendingReceipts: number
  pendingDeliveries: number
  internalTransfers: number
}

export interface ReorderRule {
  id: number
  productId: number
  warehouseId?: number | null
  minQty: number
  reorderQty: number
  preferredVendor?: string | null
  createdAt: Date
  updatedAt: Date
  product?: Product
  warehouse?: Warehouse | null
}
