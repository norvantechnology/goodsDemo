const Location = require('../models/Location');

/**
 * Validate if a transfer is allowed between source and destination
 * Returns { allowed, isException, reason }
 */
const validateTransferHierarchy = async (sourceLocationId, destLocationId) => {
  const source = await Location.findById(sourceLocationId).populate('allowedDestinationLocationIds');
  const dest = await Location.findById(destLocationId);

  if (!source) return { allowed: false, reason: 'Source location not found' };
  if (!dest) return { allowed: false, reason: 'Destination location not found' };
  if (sourceLocationId.toString() === destLocationId.toString()) {
    return { allowed: false, reason: 'Source and destination cannot be the same' };
  }

  // Check if destination is in the allowed list
  const allowedIds = source.allowedDestinationLocationIds.map(l => l._id.toString());
  if (allowedIds.includes(destLocationId.toString())) {
    return { allowed: true, isException: false };
  }

  // Not in allowed list - this is a restricted transfer
  return {
    allowed: false,
    isException: true,
    reason: `Transfer from ${source.name} to ${dest.name} is not allowed. ${source.name} can only transfer to its designated locations.`
  };
};

/**
 * Get all locations
 */
const getAllLocations = async () => {
  return Location.find({ status: 'active' }).sort({ name: 1 });
};

module.exports = { validateTransferHierarchy, getAllLocations };
