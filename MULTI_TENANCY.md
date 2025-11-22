# Multi-Tenancy Migration Guide

## Overview
This update implements data isolation where each user's data (warehouses, categories, products, locations, etc.) is completely separate from other users.

## Database Changes

### Schema Updates
The following tables now have a `userId` column:
- `categories` - userId INT, INDEX, FK to users
- `products` - userId INT, INDEX, FK to users (SKU unique per user)
- `warehouses` - userId INT, INDEX, FK to users (code unique per user)

### Migration Steps

1. **Backup your database first!**

2. **Apply schema changes:**
```bash
npx prisma db push
```

3. **Assign existing data to a user (if you have existing data):**
```sql
-- Get your first user's ID
SELECT id FROM users LIMIT 1;

-- Update all existing records with that user ID (replace 1 with actual user ID)
UPDATE categories SET userId = 1 WHERE userId IS NULL;
UPDATE products SET userId = 1 WHERE userId IS NULL;
UPDATE warehouses SET userId = 1 WHERE userId IS NULL;
```

4. **Verify migrations:**
```bash
npx prisma studio
```

## API Changes

All API routes now filter data by `userId`:

### Warehouses
- GET /api/warehouses - Only returns user's warehouses
- POST /api/warehouses - Creates warehouse for current user
- Code uniqueness checked per user

### Categories
- GET /api/categories - Only returns user's categories
- POST /api/categories - Creates category for current user

### Products
- GET /api/products - Only returns user's products  
- POST /api/products - Creates product for current user
- SKU uniqueness checked per user

### Locations
- Belong to warehouses, automatically isolated
- Operations filtered by user's warehouses

## Testing

1. **Create two test users:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"User 1","email":"user1@test.com","password":"password123"}'

curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"User 2","email":"user2@test.com","password":"password123"}'
```

2. **Test data isolation:**
   - Login as User 1, create warehouses/products
   - Logout and login as User 2
   - Verify User 2 sees empty dashboard
   - Create data for User 2
   - Login back as User 1, verify their data is still there

## Breaking Changes

- Existing data needs to be assigned to a user
- SKU and warehouse codes are now unique per user (not globally unique)
- All API endpoints now require authentication

## Rollback Plan

If you need to rollback:
1. Remove userId columns from schema
2. Change unique constraints back to global
3. Run `npx prisma db push`

Note: This will lose the multi-tenancy feature and all data will be shared again.
