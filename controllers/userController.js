const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  //1 create error if user post password data

  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('This route is not for password update', 500));

  //2 filtere out unwanted fields that should not be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  //3 update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({ status: 'success', data: updatedUser });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const deleteUser = await User.findByIdAndUpdate(req.user._id, {
    active: false
  });

  res.status(204).json({
    status: 'success',
    data: deleteUser
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Route not yet defined, please use /signup'
  });
};

exports.getUser = factory.getOne(User);

//dont update password with this
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
