# Settings & Profile Quick Reference

## API Endpoints

### Warehouses
```
GET    /api/warehouses              - List all warehouses
POST   /api/warehouses              - Create warehouse
GET    /api/warehouses/[id]         - Get warehouse details
PUT    /api/warehouses/[id]         - Update warehouse
DELETE /api/warehouses/[id]         - Delete warehouse
```

### Locations
```
GET    /api/locations               - List all locations
POST   /api/locations               - Create location
GET    /api/locations/[id]          - Get location details
PUT    /api/locations/[id]          - Update location
DELETE /api/locations/[id]          - Delete location
```

### Categories
```
GET    /api/categories              - List all categories
POST   /api/categories              - Create category
GET    /api/categories/[id]         - Get category details
PUT    /api/categories/[id]         - Update category
DELETE /api/categories/[id]         - Delete category
```

### Profile
```
GET    /api/profile                 - Get current user profile
PUT    /api/profile                 - Update profile
PUT    /api/profile/change-password - Change password
```

## Frontend Routes

### Settings
```
/settings/warehouses                - Warehouses list
/settings/warehouses/new            - Create warehouse
/settings/warehouses/[id]           - Edit warehouse

/settings/locations                 - Locations list
/settings/locations/new             - Create location
/settings/locations/[id]            - Edit location

/settings/categories                - Categories list
/settings/categories/new            - Create category
/settings/categories/[id]           - Edit category
```

### Profile
```
/profile                            - User profile & password change
```

## Request/Response Examples

### Create Warehouse
**Request:**
```json
POST /api/warehouses
{
  "name": "Main Warehouse",
  "code": "WH01",
  "address": "123 Main St, City, Country",
  "isActive": true
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Main Warehouse",
  "code": "WH01",
  "address": "123 Main St, City, Country",
  "isActive": true,
  "_count": {
    "locations": 0
  },
  "createdAt": "2024-12-01T00:00:00.000Z",
  "updatedAt": "2024-12-01T00:00:00.000Z"
}
```

### Create Location
**Request:**
```json
POST /api/locations
{
  "warehouseId": 1,
  "name": "Shelf A-1",
  "type": "INTERNAL",
  "isActive": true
}
```

**Response:**
```json
{
  "id": 1,
  "warehouseId": 1,
  "name": "Shelf A-1",
  "type": "INTERNAL",
  "isActive": true,
  "warehouse": {
    "id": 1,
    "name": "Main Warehouse",
    "code": "WH01"
  },
  "_count": {
    "stockQuants": 0
  },
  "createdAt": "2024-12-01T00:00:00.000Z",
  "updatedAt": "2024-12-01T00:00:00.000Z"
}
```

### Create Category
**Request:**
```json
POST /api/categories
{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "_count": {
    "products": 0
  },
  "createdAt": "2024-12-01T00:00:00.000Z",
  "updatedAt": "2024-12-01T00:00:00.000Z"
}
```

### Update Profile
**Request:**
```json
PUT /api/profile
{
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "createdAt": "2024-11-01T00:00:00.000Z",
  "updatedAt": "2024-12-01T00:00:00.000Z"
}
```

### Change Password
**Request:**
```json
PUT /api/profile/change-password
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456",
  "confirmPassword": "newpass456"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

## Query Parameters

### Warehouses
- `warehouseId` - Filter by warehouse ID
- `includeInactive` - Include inactive warehouses (true/false)

### Locations
- `warehouseId` - Filter by warehouse ID
- `includeInactive` - Include inactive locations (true/false)

## Location Types
- `INTERNAL` - Normal storage locations
- `VENDOR` - Locations representing vendor stock
- `CUSTOMER` - Locations representing customer stock
- `SCRAP` - Locations for scrapped/damaged items

## Validation Rules

### Warehouse
- `code` - Required, must be unique
- `name` - Required, min 1 character
- `address` - Optional
- `isActive` - Optional, default true

### Location
- `warehouseId` - Required, must exist
- `name` - Required, min 1 character
- `type` - Optional, one of: INTERNAL, VENDOR, CUSTOMER, SCRAP
- `isActive` - Optional, default true

### Category
- `name` - Required, min 1 character
- `description` - Optional

### Profile Update
- `name` - Required, min 2 characters, max 255
- `email` - Required, valid email format, must be unique

### Password Change
- `currentPassword` - Required
- `newPassword` - Required, min 6 characters
- `confirmPassword` - Required, must match newPassword

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not logged in)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (unique constraint violation)
- `500` - Internal Server Error

## Common Error Messages

### Warehouses
- "A warehouse with this code already exists"
- "Cannot delete warehouse with existing locations"
- "Cannot delete warehouse with existing operations"

### Locations
- "Selected warehouse does not exist"
- "Cannot delete location with existing stock"

### Categories
- "Cannot delete category with existing products"

### Profile
- "This email is already in use"
- "Current password is incorrect"
- "Passwords do not match"
