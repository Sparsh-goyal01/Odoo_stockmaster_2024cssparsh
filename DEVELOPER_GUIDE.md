# StockMaster - Developer Quick Reference

## 🚀 Quick Commands

```bash
# Development
npm run dev                    # Start dev server (http://localhost:3000)
npm run build                  # Build for production
npm start                      # Start production server

# Database
npx prisma generate           # Generate Prisma client
npx prisma db push            # Push schema to database
npx prisma studio             # Open database GUI (http://localhost:5555)
npx prisma migrate dev        # Create migration

# Linting
npm run lint                  # Check code quality
```

---

## 📁 File Structure Quick Guide

```
src/
├── app/
│   ├── (auth)/              → Auth pages (login, signup, etc.)
│   ├── (dashboard)/         → Protected pages (dashboard, products, etc.)
│   ├── api/                 → API routes
│   ├── layout.tsx           → Root layout
│   ├── page.tsx             → Root page (redirects to /dashboard)
│   └── globals.css          → Global styles
│
├── components/
│   ├── layout/              → Sidebar, Header, DashboardLayout
│   └── ui/                  → Button, Input, Card, Table, Badge, Modal
│
├── lib/
│   ├── prisma.ts           → Prisma client singleton
│   ├── jwt.ts              → JWT sign/verify
│   ├── auth.ts             → Auth utilities
│   ├── validations.ts      → Zod schemas
│   └── utils.ts            → Helper functions
│
└── types/
    └── index.ts            → TypeScript types
```

---

## 🔐 Authentication Flow

### Get Current User in API Route
```typescript
import { getCurrentUser, getCurrentUserFromDB } from '@/lib/auth'

// Get JWT payload only
const user = await getCurrentUser()

// Get full user from database
const user = await getCurrentUserFromDB()
```

### Get Current User in Server Component
```typescript
import { getCurrentUserFromDB } from '@/lib/auth'

export default async function Page() {
  const user = await getCurrentUserFromDB()
  // user is null if not authenticated
}
```

### Protect API Route
```typescript
import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Your logic here
}
```

---

## 🗄️ Database Operations

### Query Examples

```typescript
import { prisma } from '@/lib/prisma'

// Find one
const product = await prisma.product.findUnique({
  where: { id: 1 },
  include: { category: true }
})

// Find many with filters
const products = await prisma.product.findMany({
  where: {
    isActive: true,
    category: {
      name: 'Electronics'
    }
  },
  include: {
    category: true,
    stockQuants: {
      include: { location: true }
    }
  },
  orderBy: { name: 'asc' },
  take: 10,
  skip: 0
})

// Create
const product = await prisma.product.create({
  data: {
    name: 'New Product',
    sku: 'SKU001',
    unitOfMeasure: 'pcs',
    categoryId: 1
  }
})

// Update
await prisma.product.update({
  where: { id: 1 },
  data: { isActive: false }
})

// Delete
await prisma.product.delete({
  where: { id: 1 }
})

// Transaction
await prisma.$transaction(async (tx) => {
  await tx.operation.create({ data: {...} })
  await tx.stockQuant.update({ where: {...}, data: {...} })
  await tx.stockMove.create({ data: {...} })
})
```

---

## 🎨 Component Usage

### Button
```tsx
import Button from '@/components/ui/Button'

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

// Variants: primary, secondary, danger, ghost
// Sizes: sm, md, lg
```

### Input
```tsx
import Input from '@/components/ui/Input'

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
  required
/>
```

### Card
```tsx
import Card from '@/components/ui/Card'

<Card title="Title" description="Description">
  Content
</Card>
```

### Table
```tsx
import Table from '@/components/ui/Table'

<Table
  data={products}
  columns={[
    { header: 'Name', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    { 
      header: 'Status', 
      accessor: (row) => <Badge>{row.status}</Badge> 
    }
  ]}
  onRowClick={(row) => router.push(`/products/${row.id}`)}
/>
```

### Badge
```tsx
import Badge, { getStatusBadgeVariant } from '@/components/ui/Badge'

<Badge variant="success">Active</Badge>
<Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
```

### Modal
```tsx
import Modal from '@/components/ui/Modal'

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </>
  }
>
  Modal content
</Modal>
```

---

## 📝 Validation

### Using Zod Schemas
```typescript
import { productSchema } from '@/lib/validations'

// In API route
const validation = productSchema.safeParse(body)

if (!validation.success) {
  return NextResponse.json(
    { error: 'Invalid input', details: validation.error.errors },
    { status: 400 }
  )
}

const data = validation.data // Type-safe!
```

### Available Schemas
- `signupSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- `productSchema`, `categorySchema`
- `warehouseSchema`, `locationSchema`
- `operationSchema`, `operationLineSchema`
- `reorderRuleSchema`

---

## 🛠️ Utility Functions

```typescript
import { cn, formatDate, formatDateTime, generateDocumentNumber } from '@/lib/utils'

// Combine class names
<div className={cn('base-class', isActive && 'active-class')} />

// Format dates
formatDate(new Date())          // "Nov 22, 2024"
formatDateTime(new Date())      // "Nov 22, 2024, 02:30 PM"

// Generate document numbers
generateDocumentNumber('RECEIPT', 0)    // "RCPT/0001"
generateDocumentNumber('DELIVERY', 5)   // "DO/0006"
```

---

## 🔄 Creating New API Routes

### Template for CRUD API

```typescript
// app/api/[resource]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - List with pagination
export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const skip = (page - 1) * limit

  const items = await prisma.resource.findMany({
    take: limit,
    skip,
    orderBy: { createdAt: 'desc' }
  })

  const total = await prisma.resource.count()

  return NextResponse.json({
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}

// POST - Create
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  // Add validation here

  const item = await prisma.resource.create({ data: body })

  return NextResponse.json(item, { status: 201 })
}
```

```typescript
// app/api/[resource]/[id]/route.ts

// GET - Get by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await prisma.resource.findUnique({
    where: { id: parseInt(params.id) }
  })

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(item)
}

// PUT - Update
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  
  const item = await prisma.resource.update({
    where: { id: parseInt(params.id) },
    data: body
  })

  return NextResponse.json(item)
}

// DELETE
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.resource.delete({
    where: { id: parseInt(params.id) }
  })

  return NextResponse.json({ message: 'Deleted successfully' })
}
```

---

## 🐛 Common Issues & Solutions

### Database Connection Error
```bash
# Check MySQL is running
mysql --version

# Recreate Prisma client
npx prisma generate

# Reset database
npx prisma db push --force-reset
```

### TypeScript Errors
```bash
# Regenerate Prisma types
npx prisma generate

# Restart TypeScript server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Port in Use
```bash
# Use different port
npm run dev -- -p 3001
```

### Clear Node Modules
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Database GUI

```bash
npx prisma studio
```
Opens at http://localhost:5555
- View all tables
- Edit data directly
- Test relationships

---

## 🔍 Debugging Tips

### Server-Side Logging
```typescript
console.log('Debug:', { user, data })
```
Shows in terminal, not browser console

### Client-Side Logging
```typescript
console.log('Debug:', { state, props })
```
Shows in browser console

### Prisma Query Logging
```typescript
// In lib/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})
```

---

## 🎯 Next Steps Checklist

For adding new features:

1. **Define API Route**
   - [ ] Create route file
   - [ ] Add authentication check
   - [ ] Add validation
   - [ ] Implement logic
   - [ ] Return proper responses

2. **Create Page**
   - [ ] Create page file
   - [ ] Add layout
   - [ ] Fetch data
   - [ ] Handle loading state
   - [ ] Handle errors

3. **Build Components**
   - [ ] Create form component
   - [ ] Create list component
   - [ ] Add empty states
   - [ ] Add success messages

4. **Test**
   - [ ] Test happy path
   - [ ] Test error cases
   - [ ] Test edge cases
   - [ ] Test on different devices

---

**Keep this file open while developing! 🚀**
