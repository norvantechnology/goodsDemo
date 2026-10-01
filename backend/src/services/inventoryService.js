const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

/**
 * Get or create inventory record for product+location
 */
const getOrCreateInventory = async (productId, locationId, session = null) => {
  const opts = session ? { session } : {};
  let inv = await Inventory.findOne({ productId, locationId }).session(session || null);
  if (!inv) {
    const created = await Inventory.create([{ productId, locationId }], opts);
    inv = created[0];
  }
  return inv;
};

/**
 * Add stock to a location
 */
const addStock = async ({ productId, locationId, quantity, averageCost, movementType, referenceType, referenceId, notes, userId, session }) => {
  const inv = await getOrCreateInventory(productId, locationId, session);
  const balanceBefore = inv.quantity;

  // Recalculate average cost if provided
  if (averageCost && averageCost > 0) {
    const totalValue = (inv.quantity * inv.averageCost) + (quantity * averageCost);
    const newQuantity = inv.quantity + quantity;
    inv.averageCost = newQuantity > 0 ? totalValue / newQuantity : averageCost;
  }

  inv.quantity += quantity;
  inv.stockValue = inv.quantity * inv.averageCost;
  
  if (session) await inv.save({ session });
  else await inv.save();

  // Create movement record
  const movData = {
    productId, locationId,
    type: movementType,
    quantity,
    referenceType, referenceId,
    balanceBefore, balanceAfter: inv.quantity,
    notes, createdBy: userId
  };
  if (session) await StockMovement.create([movData], { session });
  else await StockMovement.create(movData);

  return inv;
};

/**
 * Deduct stock from a location (with negative stock prevention)
 */
const deductStock = async ({ productId, locationId, quantity, movementType, referenceType, referenceId, notes, userId, session }) => {
  const inv = await getOrCreateInventory(productId, locationId, session);
  if (inv.quantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${inv.quantity}, Requested: ${quantity}`);
  }
  const balanceBefore = inv.quantity;
  inv.quantity -= quantity;
  inv.stockValue = inv.quantity * inv.averageCost;
  
  if (session) await inv.save({ session });
  else await inv.save();

  const movData = {
    productId, locationId,
    type: movementType,
    quantity: -quantity,
    referenceType, referenceId,
    balanceBefore, balanceAfter: inv.quantity,
    notes, createdBy: userId
  };
  if (session) await StockMovement.create([movData], { session });
  else await StockMovement.create(movData);

  return inv;
};

/**
 * Get stock for a product at a location
 */
const getStock = async (productId, locationId) => {
  const inv = await Inventory.findOne({ productId, locationId });
  return inv ? inv.quantity : 0;
};

module.exports = { addStock, deductStock, getStock, getOrCreateInventory };
