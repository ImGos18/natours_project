/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//global MiddleWares
//set security http headers
app.use(helmet());

// app.use((req, res, next) => {
//   console.log('Log from middleWare');
//   next();
// });

//development login
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit request from same ip
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'to many request from this ip, try again in an hour'
});
app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '10kb'
  })
);

//data sanitization agaist noSQL query injection
app.use(mongoSanitize());

//data sanitization agaist XSS
app.use(xss());

//prevent paramter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//serving static files
app.use(express.static(`${__dirname}/public`));

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});

//Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'failed',
  //   message: `Can't find ${req.originalUrl} on this server`
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'failed';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
