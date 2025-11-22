# StockMaster – Inventory Management System (IMS) Specification (MySQL Version)

## 1. Overview

StockMaster is a modular **Inventory Management System (IMS)** that digitizes and streamlines all stock-related operations within a business. It replaces manual registers, Excel sheets, and scattered tracking methods with a **centralized, real-time, easy-to-use application**.

The system manages:

- Product definitions and stock availability  
- Incoming and outgoing stock movements  
- Internal transfers  
- Inventory adjustments  
- Multi-warehouse, multi-location stock  
- A clear stock ledger for traceability  

---

## 2. Goals

- Centralize all inventory data and operations  
- Provide **real-time stock visibility** per warehouse/location  
- Support **Receipts, Deliveries, Internal Transfers, and Adjustments**  
- Provide **clear dashboards and KPIs** for inventory managers  
- Reduce errors from manual tracking and mismatches between recorded vs physical stock  

---

## 3. Target Users

1. **Inventory Managers**
   - Oversee stock levels, movements, and overall health of inventory.
   - Review KPIs, pending operations, and stock alerts.

2. **Warehouse Staff**
   - Execute receipts, deliveries, transfers, and counting.
   - Perform picking, packing, shelving, and stock adjustments.

---

## 4. Core Modules & Navigation Structure

High-level navigation (sidebar / main menu):

1. **Dashboard**
2. **Products**
3. **Operations**
   - Receipts (Incoming Stock)
   - Delivery Orders (Outgoing Stock)
   - Internal Transfers
   - Inventory Adjustments
   - Move History
4. **Settings**
   - Warehouses
   - Locations
   - (Optionally) Categories, Units of Measure
5. **Profile**
   - My Profile
   - Logout

---

## 5. Functional Requirements

### 5.1 Authentication

- User can **sign up** and **log in**.
- **OTP-based password reset**:
  - User requests reset → system sends OTP (email/SMS implementation is up to the stack).
  - User enters OTP + new password.
- After successful login, user is **redirected to Inventory Dashboard**.
- All inventory operations require an authenticated user.

---

### 5.2 Dashboard

Landing page after login; shows a snapshot of inventory operations.

#### KPIs

- **Total Products in Stock**  
- **Low Stock / Out of Stock Items**  
- **Pending Receipts**  
- **Pending Deliveries**  
- **Internal Transfers Scheduled**  

#### Dynamic Filters

Apply filters to dashboard lists/summary panels:

- By **document type**: Receipts / Delivery / Internal / Adjustments  
- By **status**: Draft, Waiting, Ready, Done, Canceled  
- By **warehouse** or **location**  
- By **product category**  

#### Behavior

- Dashboard loads KPIs and lists via dedicated APIs.
- Clicking a KPI or item navigates to the corresponding detailed page with applied filters.

---

### 5.3 Products Module

**Navigation:** `Products`

#### Features

1. **Create / Update Products**
2. **View Stock Availability per Location**
3. **Manage Product Categories**
4. **Define Reordering Rules**

#### Product Fields

- Name  
- SKU / Code  
- Category  
- Unit of Measure (UOM)  
- Initial stock (optional – if provided, system should create an internal stock entry/adjustment)  

#### Reordering Rules

- Minimum quantity (reorder point)  
- Reorder quantity  
- (Optional) Preferred vendor  

#### Stock View

For each product, show stock per warehouse/location:

- On-hand quantity  
- (Optional) Reserved quantity  
- Available quantity  

---

### 5.4 Operations Module

**Navigation:** `Operations`  
Subsections:

1. Receipts (Incoming Stock)  
2. Delivery Orders (Outgoing Stock)  
3. Internal Transfers  
4. Inventory Adjustments  
5. Move History  

All document types share common behavior:

- Header: document number, date, warehouse, status, etc.  
- Lines: product, quantity, locations, etc.  
- Status lifecycle:  
  - **DRAFT → WAITING → READY → DONE / CANCELED**

#### 5.4.1 Receipts (Incoming Goods)

Used when items arrive from vendors.

**Process:**

1. Create a new **Receipt**.  
2. Add **supplier/vendor** and **products**.  
3. Input **quantities received**.  
4. **Validate** → stock increases automatically.

**Example:**

- Receive 50 units of “Steel Rods” → stock +50 in the destination warehouse/location.

**Header Fields (example):**

- Document number (e.g., `RCPT/0001`)  
- Vendor / Supplier  
- Destination warehouse and location  
- Status (Draft, Waiting, Ready, Done, Canceled)  
- Creation date, validation date  
- Notes  

**Line Fields:**

- Product  
- Quantity  
- Unit of Measure  
- (Optional) per-line destination override  

**Validation:**

- On status **DONE**:
  - Increase stock at destination location in `StockQuant`.  
  - Insert entry in **StockMove / Ledger**.

---

#### 5.4.2 Delivery Orders (Outgoing Goods)

Used when stock leaves warehouse for customers.

**Process:**

1. Create a **Delivery Order**.  
2. Pick & pack items (simple checkboxes or separate flags).  
3. **Validate** → stock decreases automatically.

**Example:**

- Sales order for 10 chairs → Delivery order reduces chairs by 10 from source warehouse/location.

**Header Fields:**

- Document number (e.g., `DO/0001`)  
- Customer  
- Source warehouse and location  
- Status (Draft, Waiting, Ready, Done, Canceled)  
- Dates  

**Line Fields:**

- Product  
- Quantity  
- Unit of Measure  

**Validation:**

- On status **DONE**:
  - Decrease stock at source location.  
  - Prevent negative stock (validation error if insufficient).  
  - Insert StockMove entry.

---

#### 5.4.3 Internal Transfers

Moves stock inside the company.

**Examples:**

- Main Warehouse → Production Floor  
- Rack A → Rack B  
- Warehouse 1 → Warehouse 2  

**Behavior:**

- Total stock (across all locations) remains unchanged.  
- Only the **location/warehouse distribution** changes.

**Header Fields:**

- Document number (e.g., `TRF/0001`)  
- Source warehouse/location  
- Destination warehouse/location  
- Status  
- Dates  

**Line Fields:**

- Product  
- Quantity  

**Validation:**

- On status **DONE**:
  - Subtract quantity from source location.  
  - Add quantity to destination location.  
  - Record moves in StockMove / Ledger.

---

#### 5.4.4 Stock Adjustments

Fix mismatches between **recorded stock** and **physical count**.

**Steps:**

1. Select product and location.  
2. Display current recorded quantity.  
3. User inputs counted physical quantity.  
4. On validate:
   - System computes difference = counted – recorded.  
   - Adjusts stock up/down.  
   - Logs adjustment with reason.

**Features:**

- Reason field (e.g., Damage, Loss, Expiry, Counting Error).  
- Adjustment affects:
  - StockQuant for that product/location  
  - StockMove ledger  
  - Low stock status, if applicable  

---

#### 5.4.5 Move History (Stock Ledger)

Read-only log of all stock movements.

**Each entry includes:**

- Date/time  
- Operation type: RECEIPT / DELIVERY / TRANSFER / ADJUSTMENT  
- Document reference (e.g., `RCPT/0001`)  
- Product  
- From location  
- To location  
- Quantity (in a consistent sign convention)  
- User who validated  
- Optional: Reason (especially for adjustments)  

**Filters:**

- Date range  
- Product  
- Warehouse / Location  
- Operation type  
- (Optional) Status  

---

### 5.5 Stock, Warehouses & Locations

#### Warehouses

- Each **Warehouse** is a physical site / storage facility.  
- Fields:
  - Name  
  - Code  
  - Address (optional)  
  - Active flag  

#### Locations

- Locations belong to a warehouse.
- Represent sub-areas: racks, shelves, production floor, staging area, scrap area, etc.
- Fields:
  - Name  
  - Type (e.g., INTERNAL, VENDOR, CUSTOMER, SCRAP – optional classification)  
  - Warehouse reference  

#### Stock Quantities

- System maintains **StockQuant** records for current stock per product per location.  
- On each validated operation (Receipt, Delivery, Transfer, Adjustment), StockQuant is updated.

---

### 5.6 Settings Module

**Navigation:** `Settings`

Manage configuration entities:

1. **Warehouses**
   - List, create, update, delete.
2. **Locations**
   - List, create, update, delete within warehouses.
3. **(Optional) Product Categories**
4. **(Optional) UOM definitions** (if you want them centralized)

Settings should typically be restricted to admin/inventory manager roles.

---

### 5.7 Profile Module

**Navigation:** `Profile` (often in top-right profile menu or sidebar)

Features:

- View **My Profile** (name, email, etc.).
- Change password.  
- **Logout**:
  - Clears session/JWT and redirects to login.

---

### 5.8 Additional Features & Behaviors

#### Low Stock Alerts

- Compare product stock against **ReorderRule**:
  - If quantity < `min_qty` → mark as **Low Stock**  
  - If quantity = 0 → mark as **Out of Stock**  
- Display:
  - On Dashboard KPI  
  - On Products listing (badges, highlighting)

#### Multi-Warehouse Support

- All operations must be warehouse/location-aware.  
- Reports and views should allow filtering by warehouse and location.

#### SKU Search & Smart Filters

- Search by:
  - Product name  
  - SKU / code  
- Filters across the app:
  - Status  
  - Warehouse / Location  
  - Product category  
  - Date range  
  - Operation type  

---

## 6. Data Model – High-Level Entities (Conceptual, MySQL-Oriented)

> This section is conceptual. Implementation will map to concrete **MySQL tables** and types.

- **users**
  - id (INT/BIGINT, PK, AUTO_INCREMENT)
  - name (VARCHAR)
  - email (VARCHAR, UNIQUE)
  - password_hash (VARCHAR)
  - role (ENUM or VARCHAR)
  - created_at (DATETIME)
  - updated_at (DATETIME)

- **otp_tokens**
  - id (INT/BIGINT, PK, AUTO_INCREMENT)
  - user_id (FK → users.id)
  - code (VARCHAR)
  - expires_at (DATETIME)
  - used (BOOLEAN / TINYINT)

- **categories**
  - id (INT/BIGINT, PK, AUTO_INCREMENT)
  - name (VARCHAR)
  - description (TEXT NULL)

- **products**
  - id (INT/BIGINT, PK, AUTO_INCREMENT)
  - name (VARCHAR)
  - sku (VARCHAR, UNIQUE if desired)
  - category_id (FK → categories.id, nullable)
  - unit_of_measure (VARCHAR)
  - is_active (BOOLEAN/TINYINT)
  - created_at, updated_at

- **warehouses**
  - id (INT/BIGINT, PK, AUTO_INCREMENT)
  - name (VARCHAR)
  - code (VARCHAR, UNIQUE)
  - address (TEXT NULL)
  - is_active (BOOLEAN/TINYINT)

- **locations**
  - id (INT/BIGINT, PK, AUTO_INCREMENT)
  - warehouse_id (FK → warehouses.id)
  - name (VARCHAR)
  - type (ENUM('INTERNAL','VENDOR','CUSTOMER','SCRAP') or VARCHAR)
  - is_active (BOOLEAN/TINYINT)

- **reorder_rules**
  - id (INT/BIGINT, PK, AUTO_INCREMENT)
  - product_id (FK → products.id)
  - warehouse_id (FK → warehouses.id, nullable if global)
  - min_qty (DECIMAL)
  - reorder_qty (DECIMAL)
  - preferred_vendor (VARCHAR or separate vendor table later)

- **operations**
  - id (INT/BIGINT, PK, AUTO_INCREMENT)
  - op_type (ENUM('RECEIPT','DELIVERY','TRANSFER','ADJUSTMENT'))
  - document_number (VARCHAR, UNIQUE if desired)
  - status (ENUM('DRAFT','WAITING','READY','DONE','CANCELED'))
  - warehouse_id (FK → warehouses.id, main context)
  - source_location_id (FK → locations.id, NULL allowed)
  - destination_location_id (FK → locations.id, NULL allowed)
  - partner_name or partner_id (for vendor/customer, can be simplified at first)
  - created_by (FK → users.id)
  - validated_by (FK → users.id, nullable)
  - created_at, updated_at, validated_at (DATETIME)
  - notes (TEXT NULL)

- **operation_lines**
  - id (INT/BIGINT, PK, AUTO_INCREMENT)
  - operation_id (FK → operations.id)
  - product_id (FK → products.id)
  - quantity (DECIMAL)
  - unit_of_measure (VARCHAR)
  - source_location_id (FK → locations.id, nullable – override)
  - destination_location_id (FK → locations.id, nullable – override)
  - remarks (TEXT NULL)

- **stock_quants**
  - id (INT/BIGINT, PK, AUTO_INCREMENT)
  - product_id (FK → products.id)
  - location_id (FK → locations.id)
  - quantity (DECIMAL)
  - reserved_quantity (DECIMAL, default 0)
  - UNIQUE INDEX on (product_id, location_id)

- **stock_moves**
  - id (INT/BIGINT, PK, AUTO_INCREMENT)
  - operation_id (FK → operations.id)
  - product_id (FK → products.id)
  - from_location_id (FK → locations.id, nullable)
  - to_location_id (FK → locations.id, nullable)
  - quantity (DECIMAL)  // store as positive; direction from from_location to to_location
  - move_date (DATETIME)
  - user_id (FK → users.id)
  - reason (VARCHAR / TEXT NULL)

Indices (MySQL):

- Index on `stock_quants(product_id, location_id)` for quick lookups.  
- Indices on `operations(op_type, status, warehouse_id, created_at)`.  
- Indices on `stock_moves(product_id, move_date, from_location_id, to_location_id)`.

---

## 7. Core Business Workflows (Narrative)

### 7.1 Receive Goods from Vendor

1. User creates a Receipt:
   - Vendor, destination warehouse/location, product lines.  
2. User confirms/validates document.  
3. System:
   - For each line, updates `stock_quants` (insert or increment).  
   - Inserts corresponding `stock_moves`.  
4. Example:
   - Receive 100 kg Steel → `stock_quants.quantity += 100` at target location.

---

### 7.2 Move Goods Internally

1. User creates Internal Transfer:
   - Source and destination locations, product lines.  
2. On validation:
   - Decrease quantity from `stock_quants` at source.  
   - Increase quantity at destination.  
   - Create `stock_moves` entries.  
3. Total quantity across all locations stays the same.

---

### 7.3 Deliver Goods to Customer

1. User creates Delivery Order:
   - Customer, source warehouse/location, product lines.  
2. On validation:
   - Check `stock_quants` has enough quantity at source.  
   - Decrease quantity accordingly.  
   - Insert `stock_moves` entries (internal → customer location or null).  

---

### 7.4 Adjust Damaged or Mismatched Items

1. User creates an Adjustment document:
   - Product & location, counted quantity.  
2. System reads current quantity from `stock_quants`.  
3. Difference = counted – recorded.  
4. On validation:
   - Update `stock_quants` to counted value.  
   - Insert `stock_moves` entry with reason (e.g., “damage”).  

---

## 8. Non-Functional Requirements

- **Database:**  
  - Use **MySQL** as the primary relational database.  
  - Ensure proper indexing (see Data Model section) for fast dashboard and reporting queries.
- **Security:**  
  - Authentication for all inventory-related actions.  
  - OTP-based password reset flow.  
- **Auditability:**  
  - Track `created_by` and `validated_by` for operations.  
  - Rely on `stock_moves` as the single source of truth for historical stock movements.  
- **Data Integrity:**  
  - Enforce foreign keys at MySQL level (InnoDB).  
  - Prevent negative stock on validation of deliveries/transfers.  
- **Performance:**  
  - Paginate product, operations, and ledger lists.  
  - Use proper indexes for frequent filters (product, warehouse, date, type).  
- **Usability:**  
  - Clear navigation, filters, and error messages.  
  - Keyboard-friendly forms and responsive layout (if web-based).

---

## 9. Implementation Notes (for Code Generation Tools – MySQL)

> This section is to guide tools like GitHub Copilot Agent / framework generators.

- Use **MySQL** as the database and map entities in Section 6 to tables.  
- Implement migrations (e.g., using Prisma, Sequelize, TypeORM, or framework-native tools) to create these tables in MySQL.  
- Application layers to implement:
  - **Routing & UI:**  
    - Pages/views for Dashboard, Products, Operations, Settings, Profile.
  - **API / Services:**  
    - CRUD endpoints for Products, Warehouses, Locations.  
    - Endpoints for operations with status transitions and validation logic.  
    - Aggregation endpoints for Dashboard KPIs and filtered lists.  
  - **Business Logic:**  
    - On validating operations, update `stock_quants` and write `stock_moves`.  
    - Enforce no negative stock on deliveries and transfers.  
    - Compute low stock vs reorder rules.  

This MySQL-oriented specification is the **single source of truth** for generating and evolving the StockMaster IMS project with GitHub Copilot or any other code generation tools.
