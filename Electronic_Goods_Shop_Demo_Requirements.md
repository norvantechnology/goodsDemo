# Electronic Goods Wholesale Business --- Demo Requirements

## 1. Demo Objective

Build a basic working demo of an Accounting + Inventory + Barcode + POS
system so the client can understand the actual product and business
flow.

This is a demo/prototype, not the complete production ERP.

The demo must focus on: - Clean, professional and mobile-responsive UI -
Realistic sample data - Working business flows - Location-wise stock
management - Warehouse hierarchy enforcement - Purchase → Stock →
Transfer → Shop → Sales flow - Basic accounting visibility - Role and
location based access

## 2. Technology Stack

### Frontend

-   React.js
-   React Router
-   Axios
-   Responsive CSS
-   Reusable components
-   Mobile-first responsive UI

### Backend

-   Node.js
-   Express.js
-   REST APIs
-   JWT authentication
-   Role and location based authorization
-   Request validation
-   Centralized error handling

### Database

-   MongoDB
-   Mongoose

## 3. Business Structure

  Location      Type             Function
  ------------- ---------------- ---------------------------------
  Warehouse A   Main Warehouse   Supplies Warehouse B & C
  Warehouse B   Warehouse        Supplies Shop B
  Warehouse C   Warehouse        Supplies Shop C
  Shop B        Retail Shop      Receives stock from Warehouse B
  Shop C        Retail Shop      Receives stock from Warehouse C

### Stock Flow

``` text
Warehouse A
   ├──> Warehouse B ───> Shop B
   └──> Warehouse C ───> Shop C
```

Stock must be maintained separately for every location.

## 4. UI Modules

Main navigation:

``` text
Dashboard
Products
Inventory
Purchases
Sales / POS
Transfers
Customers
Suppliers
Accounting
Reports
Users
Settings
```

On mobile, use a compact menu/drawer or bottom navigation for primary
actions. Avoid a large desktop-only sidebar.

## 5. Login

Fields: - Email - Password

Demo users: - Admin - Accountant - Warehouse A User - Warehouse B User -
Warehouse C User - Shop B User - Shop C User

After login: 1. Identify user and role. 2. Identify assigned location.
3. Load allowed modules/data. 4. Apply permissions on both frontend and
backend.

## 6. Dashboard

Show: - Total stock - Stock value - Today's sales - Today's purchases -
Receivables - Payables - Cash / Bank - Low-stock items

Also show: - Location-wise stock - Shop-wise sales - Sales trend -
Purchase trend - Recent purchases - Recent transfers - Recent sales -
Recent payments

## 7. Product Management

### Product List

-   Product
-   SKU
-   Category
-   Barcode
-   Purchase Price
-   Selling Price
-   Total Stock
-   Status
-   Actions

### Product Form

-   Product name
-   SKU / Item Code
-   Category
-   Brand
-   Barcode
-   Purchase price
-   Selling price
-   Tax/VAT
-   Minimum stock level
-   Unit
-   Status

### Product Details

Show stock by location, stock value, stock movement, purchase history,
sales history and barcode.

## 8. Inventory / Stock Management

Allow filtering by: - All locations - Warehouse A - Warehouse B -
Warehouse C - Shop B - Shop C

Show: - Product - SKU - Location - Available quantity - Damaged
quantity - Average cost - Stock value - Minimum stock - Stock status

Stock statuses: - In Stock - Low Stock - Out of Stock

Stock movement types: - Opening Stock - Purchase - Transfer In -
Transfer Out - Sale - Sales Return - Purchase Return - Adjustment -
Damaged

## 9. Stock Transfer

### Allowed

``` text
Warehouse A → Warehouse B
Warehouse A → Warehouse C
Warehouse B → Shop B
Warehouse C → Shop C
```

### Restricted by Default

``` text
Warehouse B → Shop C
Warehouse C → Shop B
Warehouse B → Warehouse C
Warehouse C → Warehouse B
```

An authorized administrator may allow an exception.

Transfer fields: - Source location - Destination location - Product -
Quantity - Transfer date - Notes

Flow:

``` text
Create Transfer
      ↓
Approve
      ↓
Validate permission + stock + hierarchy
      ↓
Deduct source stock
      ↓
Add destination stock
      ↓
Create movement history
      ↓
Completed
```

## 10. Purchase Management

Supplier fields: - Name - Contact - Email - Phone - Address -
Outstanding balance

Purchase flow:

``` text
Supplier
   ↓
Purchase
   ↓
Goods Received
   ↓
Stock Added to Selected Location
   ↓
Supplier Payable Updated
```

Support: - Purchase order - Purchase invoice - Goods receiving -
Purchase return - Supplier payment - Purchase history

## 11. Sales / POS

The POS must work well on both desktop and mobile.

Features: - Product search - SKU search - Barcode search/scanning - Add
to cart - Quantity change - Remove item - Discount - Tax/VAT - Payment
method - Complete sale - Invoice number - Invoice preview

Payment methods: - Cash - Card - Bank - Other

Sales flow:

``` text
Select Shop
   ↓
Search / Scan Product
   ↓
Add to Cart
   ↓
Discount / Tax
   ↓
Payment
   ↓
Complete Sale
   ↓
Reduce Shop Stock
   ↓
Create Sales Record
   ↓
Update Payment / Accounting
```

Only available stock at that shop can be sold.

## 12. Sales Return

``` text
Find Invoice
   ↓
Select Product + Return Quantity
   ↓
Confirm Return
   ↓
Update Stock
   ↓
Update Refund / Customer Balance
```

## 13. Customers

Fields: - Customer name - Phone - Email - Address - Opening balance -
Credit limit - Current outstanding

Details: - Sales history - Payments - Returns - Outstanding

## 14. Suppliers

Fields: - Supplier name - Contact person - Phone - Email - Address -
Opening balance

Details: - Purchase history - Payments - Returns - Outstanding

## 15. Accounting

Basic accounting screens: - Accounts - Ledger - Payments - Receipts -
Expenses - Journal Entries - Profit & Loss - Balance Sheet

Transaction examples:

### Sale

``` text
Customer / Cash
      ↓
Sales
```

### Purchase

``` text
Purchase
      ↓
Supplier Payable
```

### Customer Payment

``` text
Cash / Bank
      ↓
Customer Receivable
```

### Supplier Payment

``` text
Supplier Payable
      ↓
Cash / Bank
```

For the demo, accounting can be simplified but must be connected to
actual demo transactions.

## 16. Expenses

Fields: - Date - Category - Description - Amount - Payment method -
Location - Notes

Example categories: - Rent - Electricity - Transport - Salary - Office
Expense - Other

Expenses must appear in the dashboard and Profit & Loss.

## 17. Reports

### Inventory

-   Stock by location
-   Stock movement
-   Stock valuation
-   Low stock
-   Fast/slow-moving items

### Purchase

-   Purchase report
-   Purchase by supplier
-   Purchase return

### Sales

-   Sales report
-   Sales by shop
-   Sales by product
-   Sales return

### Accounting

-   Customer outstanding
-   Supplier outstanding
-   Expenses
-   Ledger
-   Profit & Loss
-   Balance Sheet

### Transfers

-   Warehouse transfer report

Common filters: - Date From / To - Location - Product - Category -
Supplier - Customer

## 18. User & Access Control

Roles: - Admin - Accountant - Warehouse User - Shop User

Location assignment: - Admin → All locations - Accountant → All
locations - Warehouse A User → Warehouse A - Warehouse B User →
Warehouse B - Warehouse C User → Warehouse C - Shop B User → Shop B -
Shop C User → Shop C

Permissions: - View - Create - Edit - Delete - Approve - Transfer -
Sell - Purchase - Reports - Accounting

Backend must validate permissions; frontend restrictions alone are not
sufficient.

## 19. Core Business Logic

### Location-Based Stock

Example:

``` text
Samsung Charger

Warehouse A: 100
Warehouse B: 40
Warehouse C: 25
Shop B: 15
Shop C: 10
```

A Shop B sale reduces only Shop B stock.

A Warehouse A → Warehouse B transfer must:

``` text
Warehouse A: -10
Warehouse B: +10
```

### Transfer Validation

Before completing a transfer: 1. Check user permission. 2. Check source
location. 3. Check destination location. 4. Validate allowed hierarchy.
5. Check available stock. 6. Create transfer record. 7. Deduct source
stock. 8. Add destination stock. 9. Create stock movement records.

For production, use MongoDB transactions for stock-changing operations.

## 20. MongoDB Collections

Recommended collections:

``` text
users
roles
locations
categories
products
inventory
stockMovements
stockTransfers
suppliers
purchaseOrders
purchases
purchaseReturns
customers
sales
salesReturns
payments
receipts
expenses
accounts
ledgerEntries
journalEntries
settings
```

### User

``` js
{
  name,
  email,
  passwordHash,
  roleId,
  locationIds,
  permissions,
  status,
  createdAt,
  updatedAt
}
```

### Location

``` js
{
  name,
  code,
  type,
  parentLocationId,
  allowedDestinationLocationIds,
  status
}
```

### Product

``` js
{
  name,
  sku,
  barcode,
  categoryId,
  brand,
  purchasePrice,
  sellingPrice,
  taxRate,
  minimumStock,
  unit,
  status
}
```

### Inventory

One record per product + location:

``` js
{
  productId,
  locationId,
  quantity,
  reservedQuantity,
  damagedQuantity,
  averageCost,
  stockValue,
  updatedAt
}
```

Use a unique index on:

``` text
productId + locationId
```

### Stock Movement

``` js
{
  productId,
  locationId,
  type,
  quantity,
  referenceType,
  referenceId,
  balanceAfter,
  createdBy,
  createdAt
}
```

### Stock Transfer

``` js
{
  transferNumber,
  sourceLocationId,
  destinationLocationId,
  items: [
    { productId, quantity }
  ],
  status,
  transferDate,
  createdBy,
  approvedBy,
  notes
}
```

### Sale

``` js
{
  invoiceNumber,
  locationId,
  customerId,
  items: [
    {
      productId,
      quantity,
      price,
      discount,
      tax,
      total
    }
  ],
  subtotal,
  discount,
  tax,
  grandTotal,
  paymentMethod,
  paymentStatus,
  createdBy,
  createdAt
}
```

### Purchase

``` js
{
  purchaseNumber,
  supplierId,
  locationId,
  items: [
    {
      productId,
      quantity,
      purchasePrice,
      tax,
      total
    }
  ],
  subtotal,
  discount,
  tax,
  grandTotal,
  paymentStatus,
  createdAt
}
```

## 21. Backend API Structure

### Auth

``` text
POST /api/auth/login
GET  /api/auth/me
```

### Dashboard

``` text
GET /api/dashboard
```

### Products

``` text
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/products/barcode/:barcode
```

### Inventory

``` text
GET  /api/inventory
GET  /api/inventory/location/:locationId
GET  /api/inventory/movements
POST /api/inventory/adjustment
```

### Transfers

``` text
GET  /api/transfers
POST /api/transfers
GET  /api/transfers/:id
POST /api/transfers/:id/approve
POST /api/transfers/:id/complete
POST /api/transfers/:id/cancel
```

### Purchases

``` text
GET  /api/purchases
POST /api/purchases
GET  /api/purchases/:id
POST /api/purchases/:id/receive
POST /api/purchases/:id/return
```

### Sales

``` text
GET  /api/sales
POST /api/sales
GET  /api/sales/:id
POST /api/sales/:id/return
```

### Customers / Suppliers

``` text
GET  /api/customers
POST /api/customers
GET  /api/customers/:id
PUT  /api/customers/:id

GET  /api/suppliers
POST /api/suppliers
GET  /api/suppliers/:id
PUT  /api/suppliers/:id
```

### Accounting

``` text
GET  /api/accounts
GET  /api/ledger
GET  /api/payments
POST /api/payments
GET  /api/expenses
POST /api/expenses
GET  /api/reports/profit-loss
GET  /api/reports/balance-sheet
```

### Reports

``` text
GET /api/reports/stock
GET /api/reports/stock-movement
GET /api/reports/purchases
GET /api/reports/sales
GET /api/reports/outstanding
GET /api/reports/transfers
```

## 22. React Route Structure

``` text
/login

/dashboard

/products
/products/new
/products/:id

/inventory
/inventory/movements
/inventory/adjustment

/transfers
/transfers/new
/transfers/:id

/purchases
/purchases/new
/purchases/:id

/pos
/sales
/sales/:id
/sales/returns

/customers
/customers/:id

/suppliers
/suppliers/:id

/accounting
/accounting/ledger
/accounting/payments
/accounting/expenses
/accounting/profit-loss
/accounting/balance-sheet

/reports

/users
/settings
```

## 23. Frontend Structure

Recommended:

``` text
src/
  components/
  pages/
  layouts/
  routes/
  services/
  hooks/
  utils/
  context/
```

Create reusable components:

``` text
Button
Input
Select
Modal
Table
Card
Badge
Dropdown
DatePicker
Search
Pagination
ConfirmDialog
EmptyState
LoadingState
Toast
```

Keep API calls inside service modules:

``` text
authService
productService
inventoryService
transferService
purchaseService
salesService
customerService
supplierService
accountingService
reportService
```

## 24. Backend Structure

Recommended:

``` text
src/
  controllers/
  services/
  models/
  routes/
  middleware/
  validators/
  utils/
  config/
```

Keep business logic in services rather than putting all logic inside
route files.

Example:

``` text
transferController
      ↓
transferService
      ↓
inventoryService
      ↓
MongoDB
```

## 25. Barcode

Demo requirements: - Assign barcode to product - Search by barcode -
Barcode-based POS billing - Barcode-based receiving - Barcode-based
stock transfer - Support existing product barcodes - Basic barcode
generation/printing UI

For the demo, camera scanning can be included if practical; otherwise
barcode input/search should still work.

## 26. Sample Data

The application should open with realistic sample data.

### Locations

``` text
Warehouse A
Warehouse B
Warehouse C
Shop B
Shop C
```

### Products

``` text
USB-C Charger
Bluetooth Speaker
Wireless Earbuds
HDMI Cable
Power Bank
Mobile Adapter
USB Cable
Extension Board
```

### Suppliers

``` text
ABC Electronics
Global Tech Supplies
Smart Accessories Ltd.
```

### Customers

``` text
Walk-in Customer
City Mobile Store
Tech Zone
```

Create enough stock to demonstrate both transfer and sales flows.

## 27. Complete Demo Flow

### Flow 1 --- Purchase

``` text
Login as Admin
      ↓
Select Supplier
      ↓
Create Purchase
      ↓
Receive Goods at Warehouse A
      ↓
Warehouse A Stock Increases
      ↓
Supplier Payable Updated
```

### Flow 2 --- Warehouse A to B

``` text
Warehouse A
      ↓
Create Transfer
      ↓
Select Warehouse B
      ↓
Select Product + Quantity
      ↓
Approve / Complete
      ↓
Warehouse A Stock Decreases
      ↓
Warehouse B Stock Increases
```

### Flow 3 --- Warehouse B to Shop B

``` text
Warehouse B
      ↓
Create Transfer
      ↓
Select Shop B
      ↓
Transfer Stock
      ↓
Warehouse B Stock Decreases
      ↓
Shop B Stock Increases
```

### Flow 4 --- Shop B POS Sale

``` text
Login as Shop B User
      ↓
Open POS
      ↓
Scan / Search Product
      ↓
Add to Cart
      ↓
Take Payment
      ↓
Complete Sale
      ↓
Shop B Stock Decreases
      ↓
Sales Record Created
      ↓
Payment / Accounting Updated
```

### Flow 5 --- Restricted Transfer

Try:

``` text
Warehouse B → Shop C
```

Expected:

``` text
Transfer Not Allowed

Reason:
Warehouse B is assigned only to Shop B.
```

## 28. Mobile Responsive Requirements

The complete demo must work on: - Desktop - Laptop - Tablet - Mobile

Requirements: - No horizontal overflow - Compact spacing -
Touch-friendly buttons - Responsive forms - Responsive tables -
Mobile-friendly POS - Compact navigation - Sticky important actions -
Easy search/filter access - Mobile-friendly modals - Dashboard cards
stack cleanly - No overlapping elements - No important information
hidden by truncation

## 29. UI Design Guidelines

The demo should look like a modern business application, not a
collection of basic CRUD pages.

Style: - Clean - Professional - Minimal - Compact - Easy to understand -
Consistent spacing - Clear typography - Reusable components - Clear
loading, empty, success and error states

Avoid: - Excessive padding - Unnecessary animations - Heavy borders -
Cluttered dashboards - Duplicate headers - Desktop-only layouts

## 30. Security & Validation

Implement basic production-style validation: - Password hashing - JWT
authentication - Role-based authorization - Location-based
authorization - Request validation - ObjectId validation - Prevent
negative stock - Prevent unauthorized transfers - Prevent cross-location
data access - Centralized error handling

Frontend restrictions are for usability only; the backend must enforce
the rules.

## 31. Audit Trail

Important stock/accounting changes should record: - User - Date/time -
Location - Product - Quantity - Previous balance - New balance -
Reference transaction

## 32. Demo Priority

### Must Work

-   Login
-   Dashboard
-   Locations
-   Products
-   Inventory
-   Stock transfers
-   Purchase
-   Goods receiving
-   POS
-   Sales
-   Customers
-   Suppliers
-   Basic permissions
-   Stock movement

### Basic Demo

-   Accounting
-   Payments
-   Expenses
-   Outstanding
-   Reports
-   Profit & Loss
-   Balance Sheet

### Future / Production Enhancement

-   Advanced barcode printing
-   Advanced accounting
-   Full financial controls
-   Advanced analytics
-   PDF invoice templates
-   CSV/PDF exports
-   Advanced audit reports
-   External integrations

## 33. Client Demo Success Criteria

The client should be able to see:

1.  Product creation.
2.  Purchase and stock receiving into Warehouse A.
3.  Warehouse A supplying Warehouse B and C.
4.  Warehouse B supplying only Shop B.
5.  Warehouse C supplying only Shop C.
6.  Separate stock by location.
7.  Barcode/POS sales.
8.  Shop stock reduction after a sale.
9.  Customer and supplier balances.
10. Basic accounting connection.
11. Business reports.
12. Different user permissions.
13. Invalid stock transfers being blocked.

## 34. End-to-End Demo Scenario

The primary demonstration should follow:

``` text
Supplier
   ↓
Purchase
   ↓
Warehouse A
   ↓
Warehouse B
   ↓
Shop B
   ↓
POS Sale
   ↓
Stock Reduction
   ↓
Customer Payment
   ↓
Accounting
   ↓
Dashboard / Reports
```

And separately:

``` text
Warehouse A
   ↓
Warehouse C
   ↓
Shop C
   ↓
POS Sale
```

The demo must prevent:

``` text
Warehouse B → Shop C
Warehouse C → Shop B
```

unless an authorized administrator explicitly allows it.

## 35. Future Production Scope

After demo approval, the production system can be expanded with: -
Complete accounting - Advanced tax/VAT - Hardware barcode
scanner/printer integration - Advanced POS - Purchase order workflows -
Advanced inventory costing - Concurrent multi-user operations - Advanced
financial reports - Full audit trail - Custom PDF invoices - Excel/CSV
import/export - Backup and restore - Notifications and low-stock
alerts - Advanced analytics - Cloud deployment - Automated testing -
Production security - Performance optimization - Multi-company support
if required
