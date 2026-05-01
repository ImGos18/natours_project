const crypto = require('crypto');
const { promisify } = require('util');
// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    console.log(`hola estoy en produccion ${process.env.NODE_ENV}`);
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  //remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: user
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });

  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) check if email and password exists
  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  //2) check if user exists && password correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  //3) if ok send token to client

  createAndSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) get the token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('you are not logged in, please log in to get access', 401)
    );
  }
  //2)validate the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) return next(new AppError('token does not longer exits', 401));

  //4) check if user changed password after the token was issued

  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('user recently changed password, please login again', 401)
    );
  }

  //grant access to protected route
  req.user = freshUser;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you not have permission to perfom this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1 get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('there is no user with that email', 404));
  }

  //2 generate random token

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });
  //3 send back to users email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? submit a patch request with your new password and passwordConfirm to: ${resetURL}\n if you didn't forget your password, ignore this email`;

  try {
    await sendEmail({
      email: req.body.email,
      subject: 'password reset (valid for 10 minutes)',
      message: message
    });

    res.status(200).json({
      status: 'success',
      message: 'token sent to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('there was an error sendidng the email, try later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2 if token has not expired, and there is user, set new password
  if (!user) {
    return next('Token is invalid or has expired');
  }
  //3 update changedpasswordAt for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //4 log user in, send jwt

  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1 get user from collection
  const user = await User.findById(req.user._id).select('+password');

  //2 check if posted password is correct
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  if (!(await user.correctPassword(oldPassword, user.password))) {
    return next(new AppError('old password is incorrect', 401));
  }

  //3 if so update password

  user.password = newPassword;
  user.passwordConfirm = confirmNewPassword;
  user.save();
  //4 log user in
  createAndSendToken(user, 200, res);
});
