import { z } from 'zod'

// Auth validations
export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Product validations
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.number().optional().nullable(),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  isActive: z.boolean().optional(),
})

// Initial stock schema
export const initialStockSchema = z.object({
  warehouseId: z.number({ required_error: 'Warehouse is required' }),
  locationId: z.number({ required_error: 'Location is required' }),
  quantity: z.number().positive('Quantity must be positive'),
})

// Product form schema (includes initial stock and reorder rules)
export const productFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(255),
  sku: z.string().min(1, 'SKU is required').max(100),
  categoryId: z.number().optional().nullable(),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required').max(50),
  isActive: z.boolean().default(true),
  initialStock: initialStockSchema.optional(),
  reorderRule: z.object({
    minQty: z.number().min(0, 'Minimum quantity must be 0 or greater').optional(),
    reorderQty: z.number().positive('Reorder quantity must be positive').optional(),
    preferredVendor: z.string().max(255).optional(),
  }).optional(),
})

// Category validations
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
})

// Warehouse validations
export const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  code: z.string().min(1, 'Warehouse code is required'),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
})

// Location validations
export const locationSchema = z.object({
  warehouseId: z.number({ required_error: 'Warehouse is required' }),
  name: z.string().min(1, 'Location name is required'),
  type: z.enum(['INTERNAL', 'VENDOR', 'CUSTOMER', 'SCRAP']).optional(),
  isActive: z.boolean().optional(),
})

// Operation validations
export const operationLineSchema = z.object({
  productId: z.number({ required_error: 'Product is required' }),
  quantity: z.number().positive('Quantity must be positive'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  sourceLocationId: z.number().optional(),
  destinationLocationId: z.number().optional(),
  remarks: z.string().optional(),
})

export const operationSchema = z.object({
  opType: z.enum(['RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT']),
  warehouseId: z.number({ required_error: 'Warehouse is required' }),
  sourceLocationId: z.number().optional(),
  destinationLocationId: z.number().optional(),
  partnerName: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(operationLineSchema).min(1, 'At least one line is required'),
})

// Reorder rule validations
export const reorderRuleSchema = z.object({
  productId: z.number({ required_error: 'Product is required' }),
  warehouseId: z.number().optional(),
  minQty: z.number().positive('Minimum quantity must be positive'),
  reorderQty: z.number().positive('Reorder quantity must be positive'),
  preferredVendor: z.string().optional(),
})
