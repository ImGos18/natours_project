const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');

exports.getReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();
  res.status(200).json({ status: 'success', data: { reviews } });
});

exports.createReview = catchAsync(async (req, res, next) => {
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
