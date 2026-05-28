const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');

exports.getReviews = catchAsync(async (req, res, next) => {
  let filter;
  if (req.params.tourId) filter = { tour: req.params.tourId };
  const reviews = await Review.find(filter);
  res.status(200).json({ status: 'success', data: { reviews } });
});

exports.createReview = catchAsync(async (req, res, next) => {
  //allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const { tour, review, rating } = req.body;
  const { user } = req;
  const newReview = await Review.create({
    user,
    tour,
    review,
    rating
  });

  res.status(201).json({ status: 'created', newReview });
});
