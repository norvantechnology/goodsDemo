const User = require('../models/User');
const Location = require('../models/Location');
const Category = require('../models/Category');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().populate('locationIds', 'name code').select('-passwordHash').sort({ name: 1 });
    res.json({ success: true, data: users });
  } catch (error) { next(error); }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, locationIds, permissions } = req.body;
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role, locationIds: locationIds || [], permissions: permissions || {} });
    const populated = await User.findById(user._id).populate('locationIds', 'name code').select('-passwordHash');
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.passwordHash = await User.hashPassword(updates.password);
      delete updates.password;
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('locationIds', 'name code').select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await User.findByIdAndUpdate(req.params.id, { status: 'inactive' });
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) { next(error); }
};

exports.getLocations = async (req, res, next) => {
  try {
    const locations = await Location.find().populate('allowedDestinationLocationIds', 'name code').sort({ name: 1 });
    res.json({ success: true, data: locations });
  } catch (error) { next(error); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) { next(error); }
};
