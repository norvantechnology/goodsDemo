require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Location = require('../models/Location');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');

const connectDB = require('../config/database');

const seed = async () => {
  await connectDB();
  console.log('Seeding database...');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Location.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    StockMovement.deleteMany({}),
    Supplier.deleteMany({}),
    Customer.deleteMany({}),
    Purchase.deleteMany({}),
    Sale.deleteMany({}),
    Expense.deleteMany({}),
    Payment.deleteMany({})
  ]);

  // ─── Locations ────────────────────────────────────────────────────────────
  const [warehouseA, warehouseB, warehouseC, shopB, shopC] = await Location.insertMany([
    { name: 'Warehouse A', code: 'WHA', type: 'warehouse', allowedDestinationLocationIds: [] },
    { name: 'Warehouse B', code: 'WHB', type: 'warehouse', allowedDestinationLocationIds: [] },
    { name: 'Warehouse C', code: 'WHC', type: 'warehouse', allowedDestinationLocationIds: [] },
    { name: 'Shop B', code: 'SHB', type: 'shop', allowedDestinationLocationIds: [] },
    { name: 'Shop C', code: 'SHC', type: 'shop', allowedDestinationLocationIds: [] }
  ]);

  // Set allowed destinations (hierarchy)
  warehouseA.allowedDestinationLocationIds = [warehouseB._id, warehouseC._id];
  warehouseA.parentLocationId = null;
  await warehouseA.save();

  warehouseB.allowedDestinationLocationIds = [shopB._id];
  warehouseB.parentLocationId = warehouseA._id;
  await warehouseB.save();

  warehouseC.allowedDestinationLocationIds = [shopC._id];
  warehouseC.parentLocationId = warehouseA._id;
  await warehouseC.save();

  console.log('✓ Locations created');

  // ─── Categories ─────────────────────────────────────────────────────────────
  const [chargers, speakers, cables, powerBanks, accessories] = await Category.insertMany([
    { name: 'Chargers & Adapters' },
    { name: 'Audio & Speakers' },
    { name: 'Cables & Connectors' },
    { name: 'Power Banks' },
    { name: 'Accessories' }
  ]);

  console.log('✓ Categories created');

  // ─── Products ─────────────────────────────────────────────────────────────────
  const products = await Product.insertMany([
    { name: 'USB-C Charger 65W', sku: 'USBC-65W', barcode: '8901234567890', categoryId: chargers._id, brand: 'PowerTech', purchasePrice: 850, sellingPrice: 1299, taxRate: 5, minimumStock: 10, unit: 'pcs' },
    { name: 'Bluetooth Speaker Mini', sku: 'BTS-MINI', barcode: '8901234567891', categoryId: speakers._id, brand: 'SoundWave', purchasePrice: 1200, sellingPrice: 1999, taxRate: 5, minimumStock: 8, unit: 'pcs' },
    { name: 'Wireless Earbuds Pro', sku: 'WEBD-PRO', barcode: '8901234567892', categoryId: speakers._id, brand: 'SoundWave', purchasePrice: 1800, sellingPrice: 2999, taxRate: 5, minimumStock: 5, unit: 'pcs' },
    { name: 'HDMI Cable 2m', sku: 'HDMI-2M', barcode: '8901234567893', categoryId: cables._id, brand: 'ConnectPro', purchasePrice: 280, sellingPrice: 499, taxRate: 0, minimumStock: 20, unit: 'pcs' },
    { name: 'Power Bank 10000mAh', sku: 'PB-10K', barcode: '8901234567894', categoryId: powerBanks._id, brand: 'ChargePlus', purchasePrice: 950, sellingPrice: 1599, taxRate: 5, minimumStock: 10, unit: 'pcs' },
    { name: 'Mobile Adapter Type-C', sku: 'ADPT-TC', barcode: '8901234567895', categoryId: chargers._id, brand: 'PowerTech', purchasePrice: 120, sellingPrice: 199, taxRate: 0, minimumStock: 30, unit: 'pcs' },
    { name: 'USB Cable Braided 1m', sku: 'USBC-1M', barcode: '8901234567896', categoryId: cables._id, brand: 'ConnectPro', purchasePrice: 90, sellingPrice: 149, taxRate: 0, minimumStock: 50, unit: 'pcs' },
    { name: 'Extension Board 4-Port', sku: 'EXT-4P', barcode: '8901234567897', categoryId: accessories._id, brand: 'SafePower', purchasePrice: 450, sellingPrice: 799, taxRate: 5, minimumStock: 15, unit: 'pcs' }
  ]);

  console.log('✓ Products created');

  // ─── Suppliers ──────────────────────────────────────────────────────────────
  const [suppABC, suppGlobal, suppSmart] = await Supplier.insertMany([
    { name: 'ABC Electronics', contactPerson: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@abcelectronics.com', address: 'Mumbai, Maharashtra', openingBalance: 0, currentBalance: 45000 },
    { name: 'Global Tech Supplies', contactPerson: 'Amit Shah', phone: '9876543211', email: 'amit@globaltech.com', address: 'Delhi, India', openingBalance: 0, currentBalance: 28000 },
    { name: 'Smart Accessories Ltd.', contactPerson: 'Priya Nair', phone: '9876543212', email: 'priya@smartacc.com', address: 'Bangalore, Karnataka', openingBalance: 0, currentBalance: 15000 }
  ]);

  console.log('✓ Suppliers created');

  // ─── Customers ──────────────────────────────────────────────────────────────
  const [custWalkin, custCity, custTech] = await Customer.insertMany([
    { name: 'Walk-in Customer', phone: '0000000000', email: 'walkin@demo.com', address: 'Local', openingBalance: 0, creditLimit: 0, currentBalance: 0 },
    { name: 'City Mobile Store', phone: '9876543220', email: 'city@mobileshop.com', address: 'City Center, Main Market', openingBalance: 0, creditLimit: 50000, currentBalance: 12000 },
    { name: 'Tech Zone', phone: '9876543221', email: 'techzone@example.com', address: 'IT Park, Sector 5', openingBalance: 0, creditLimit: 30000, currentBalance: 8500 }
  ]);

  console.log('✓ Customers created');

  // ─── Users ────────────────────────────────────────────────────────────────
  const hashPwd = async (pwd) => bcrypt.hash(pwd, 10);

  const adminPerms = { view: true, create: true, edit: true, delete: true, approve: true, transfer: true, sell: true, purchase: true, reports: true, accounting: true, allowExceptionTransfer: true };
  const accountantPerms = { view: true, create: true, edit: true, delete: false, approve: true, transfer: false, sell: false, purchase: true, reports: true, accounting: true, allowExceptionTransfer: false };
  const warehousePerms = { view: true, create: true, edit: true, delete: false, approve: false, transfer: true, sell: false, purchase: true, reports: true, accounting: false, allowExceptionTransfer: false };
  const shopPerms = { view: true, create: true, edit: false, delete: false, approve: false, transfer: false, sell: true, purchase: false, reports: true, accounting: false, allowExceptionTransfer: false };

  await User.insertMany([
    { name: 'Admin User', email: 'admin@demo.com', passwordHash: await hashPwd('admin123'), role: 'admin', locationIds: [warehouseA._id, warehouseB._id, warehouseC._id, shopB._id, shopC._id], permissions: adminPerms },
    { name: 'Accountant User', email: 'accountant@demo.com', passwordHash: await hashPwd('account123'), role: 'accountant', locationIds: [warehouseA._id, warehouseB._id, warehouseC._id, shopB._id, shopC._id], permissions: accountantPerms },
    { name: 'Warehouse A Manager', email: 'wha@demo.com', passwordHash: await hashPwd('wha123'), role: 'warehouse_user', locationIds: [warehouseA._id], permissions: warehousePerms },
    { name: 'Warehouse B Manager', email: 'whb@demo.com', passwordHash: await hashPwd('whb123'), role: 'warehouse_user', locationIds: [warehouseB._id], permissions: warehousePerms },
    { name: 'Warehouse C Manager', email: 'whc@demo.com', passwordHash: await hashPwd('whc123'), role: 'warehouse_user', locationIds: [warehouseC._id], permissions: warehousePerms },
    { name: 'Shop B Staff', email: 'shopb@demo.com', passwordHash: await hashPwd('shopb123'), role: 'shop_user', locationIds: [shopB._id], permissions: shopPerms },
    { name: 'Shop C Staff', email: 'shopc@demo.com', passwordHash: await hashPwd('shopc123'), role: 'shop_user', locationIds: [shopC._id], permissions: shopPerms }
  ]);

  console.log('✓ Users created');

  // ─── Inventory (Opening Stock at Warehouse A) ──────────────────────────────
  const stockData = [
    { product: products[0], warehouseA: 120, warehouseB: 45, warehouseC: 30, shopB: 20, shopC: 15, cost: 850 },
    { product: products[1], warehouseA: 80, warehouseB: 35, warehouseC: 20, shopB: 12, shopC: 8, cost: 1200 },
    { product: products[2], warehouseA: 60, warehouseB: 25, warehouseC: 15, shopB: 8, shopC: 5, cost: 1800 },
    { product: products[3], warehouseA: 200, warehouseB: 80, warehouseC: 60, shopB: 30, shopC: 25, cost: 280 },
    { product: products[4], warehouseA: 90, warehouseB: 40, warehouseC: 25, shopB: 15, shopC: 10, cost: 950 },
    { product: products[5], warehouseA: 300, warehouseB: 100, warehouseC: 80, shopB: 50, shopC: 40, cost: 120 },
    { product: products[6], warehouseA: 400, warehouseB: 150, warehouseC: 120, shopB: 60, shopC: 50, cost: 90 },
    { product: products[7], warehouseA: 100, warehouseB: 45, warehouseC: 35, shopB: 20, shopC: 15, cost: 450 }
  ];

  const inventoryDocs = [];
  const movementDocs = [];

  for (const sd of stockData) {
    const locs = [
      { loc: warehouseA._id, qty: sd.warehouseA },
      { loc: warehouseB._id, qty: sd.warehouseB },
      { loc: warehouseC._id, qty: sd.warehouseC },
      { loc: shopB._id, qty: sd.shopB },
      { loc: shopC._id, qty: sd.shopC }
    ];
    for (const { loc, qty } of locs) {
      const stockValue = qty * sd.cost;
      inventoryDocs.push({ productId: sd.product._id, locationId: loc, quantity: qty, averageCost: sd.cost, stockValue });
      movementDocs.push({ productId: sd.product._id, locationId: loc, type: 'opening_stock', quantity: qty, referenceType: 'opening', balanceBefore: 0, balanceAfter: qty });
    }
  }

  await Inventory.insertMany(inventoryDocs);
  await StockMovement.insertMany(movementDocs);
  console.log('✓ Inventory seeded');

  // ─── Sample Purchases ───────────────────────────────────────────────────────
  const adminUser = await User.findOne({ role: 'admin' });

  const purchase1 = await Purchase.create({
    purchaseNumber: 'PO-001',
    supplierId: suppABC._id,
    locationId: warehouseA._id,
    items: [
      { productId: products[0]._id, quantity: 50, purchasePrice: 850, taxAmount: 2125, total: 44625 },
      { productId: products[1]._id, quantity: 30, purchasePrice: 1200, taxAmount: 1800, total: 37800 }
    ],
    subtotal: 78000,
    discount: 0,
    taxAmount: 3925,
    grandTotal: 81925,
    status: 'received',
    paymentStatus: 'partial',
    paidAmount: 36925,
    notes: 'First batch purchase',
    purchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    receivedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    createdBy: adminUser._id
  });

  const purchase2 = await Purchase.create({
    purchaseNumber: 'PO-002',
    supplierId: suppGlobal._id,
    locationId: warehouseA._id,
    items: [
      { productId: products[2]._id, quantity: 20, purchasePrice: 1800, taxAmount: 1800, total: 37800 },
      { productId: products[4]._id, quantity: 40, purchasePrice: 950, taxAmount: 1900, total: 39900 }
    ],
    subtotal: 77000,
    discount: 2000,
    taxAmount: 3700,
    grandTotal: 78700,
    status: 'received',
    paymentStatus: 'unpaid',
    paidAmount: 0,
    notes: 'Second batch - earbuds and power banks',
    purchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    receivedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    createdBy: adminUser._id
  });

  console.log('✓ Sample purchases created');

  // ─── Sample Sales ───────────────────────────────────────────────────────────
  const saleItems1 = [
    { productId: products[0]._id, quantity: 2, price: 1299, discount: 0, taxAmount: 130, total: 2728 },
    { productId: products[3]._id, quantity: 3, price: 499, discount: 0, taxAmount: 0, total: 1497 }
  ];
  await Sale.create({
    invoiceNumber: 'INV-001',
    locationId: shopB._id,
    customerId: custCity._id,
    items: saleItems1,
    subtotal: 4225, discount: 0, taxAmount: 130, grandTotal: 4355,
    paymentMethod: 'cash', paymentStatus: 'paid', paidAmount: 4355,
    saleDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdBy: adminUser._id
  });

  // Update inventory for sale 1 (shopB)
  await Inventory.findOneAndUpdate({ productId: products[0]._id, locationId: shopB._id }, { $inc: { quantity: -2 } });
  await Inventory.findOneAndUpdate({ productId: products[3]._id, locationId: shopB._id }, { $inc: { quantity: -3 } });

  const saleItems2 = [
    { productId: products[1]._id, quantity: 1, price: 1999, discount: 100, taxAmount: 95, total: 1994 },
    { productId: products[4]._id, quantity: 2, price: 1599, discount: 0, taxAmount: 160, total: 3358 }
  ];
  await Sale.create({
    invoiceNumber: 'INV-002',
    locationId: shopC._id,
    customerId: custTech._id,
    items: saleItems2,
    subtotal: 5097, discount: 100, taxAmount: 255, grandTotal: 5252,
    paymentMethod: 'card', paymentStatus: 'paid', paidAmount: 5252,
    saleDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdBy: adminUser._id
  });

  // Today's sale
  const saleItems3 = [
    { productId: products[5]._id, quantity: 5, price: 199, discount: 0, taxAmount: 0, total: 995 },
    { productId: products[6]._id, quantity: 10, price: 149, discount: 50, taxAmount: 0, total: 1440 }
  ];
  await Sale.create({
    invoiceNumber: 'INV-003',
    locationId: shopB._id,
    customerId: custWalkin._id,
    items: saleItems3,
    subtotal: 2435, discount: 50, taxAmount: 0, grandTotal: 2385,
    paymentMethod: 'cash', paymentStatus: 'paid', paidAmount: 2385,
    saleDate: new Date(),
    createdBy: adminUser._id
  });

  // Credit sale
  const saleItems4 = [
    { productId: products[2]._id, quantity: 2, price: 2999, discount: 0, taxAmount: 300, total: 6298 }
  ];
  await Sale.create({
    invoiceNumber: 'INV-004',
    locationId: shopB._id,
    customerId: custCity._id,
    items: saleItems4,
    subtotal: 5998, discount: 0, taxAmount: 300, grandTotal: 6298,
    paymentMethod: 'credit', paymentStatus: 'credit', paidAmount: 0,
    saleDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdBy: adminUser._id
  });

  // Recalculate customer balance
  await Customer.findByIdAndUpdate(custCity._id, { currentBalance: 12000 });
  await Customer.findByIdAndUpdate(custTech._id, { currentBalance: 8500 });

  console.log('✓ Sample sales created');

  // ─── Sample Expenses ────────────────────────────────────────────────────────
  await Expense.insertMany([
    { expenseNumber: 'EXP-001', date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), category: 'rent', description: 'Monthly shop rent - Shop B', amount: 25000, paymentMethod: 'bank', locationId: shopB._id, createdBy: adminUser._id },
    { expenseNumber: 'EXP-002', date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), category: 'rent', description: 'Monthly shop rent - Shop C', amount: 20000, paymentMethod: 'bank', locationId: shopC._id, createdBy: adminUser._id },
    { expenseNumber: 'EXP-003', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), category: 'electricity', description: 'Electricity bill - Warehouse A', amount: 8500, paymentMethod: 'bank', locationId: warehouseA._id, createdBy: adminUser._id },
    { expenseNumber: 'EXP-004', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), category: 'transport', description: 'Delivery charges for stock transfer', amount: 3200, paymentMethod: 'cash', locationId: warehouseA._id, createdBy: adminUser._id },
    { expenseNumber: 'EXP-005', date: new Date(), category: 'salary', description: 'Staff salary - Shop B', amount: 18000, paymentMethod: 'bank', locationId: shopB._id, createdBy: adminUser._id }
  ]);

  console.log('✓ Sample expenses created');

  // ─── Sample Payments ────────────────────────────────────────────────────────
  await Payment.insertMany([
    { paymentNumber: 'RCP-001', type: 'receipt', partyType: 'customer', partyId: custCity._id, partyModel: 'Customer', amount: 4355, paymentMethod: 'cash', referenceType: 'sale', notes: 'Payment for INV-001', paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), createdBy: adminUser._id },
    { paymentNumber: 'RCP-002', type: 'receipt', partyType: 'customer', partyId: custTech._id, partyModel: 'Customer', amount: 5252, paymentMethod: 'card', referenceType: 'sale', notes: 'Payment for INV-002', paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), createdBy: adminUser._id },
    { paymentNumber: 'PAY-001', type: 'payment', partyType: 'supplier', partyId: suppABC._id, partyModel: 'Supplier', amount: 36925, paymentMethod: 'bank', referenceType: 'purchase', notes: 'Partial payment for PO-001', paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), createdBy: adminUser._id }
  ]);

  console.log('✓ Sample payments created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Demo Login Credentials:');
  console.log('─────────────────────────────────────────────────────');
  console.log('Admin:       admin@demo.com       / admin123');
  console.log('Accountant:  accountant@demo.com  / account123');
  console.log('Warehouse A: wha@demo.com         / wha123');
  console.log('Warehouse B: whb@demo.com         / whb123');
  console.log('Warehouse C: whc@demo.com         / whc123');
  console.log('Shop B:      shopb@demo.com       / shopb123');
  console.log('Shop C:      shopc@demo.com       / shopc123');
  console.log('─────────────────────────────────────────────────────\n');

  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
