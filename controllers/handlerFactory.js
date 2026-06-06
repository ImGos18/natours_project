const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      next(new AppError('No document found with that id', 404));

      return;
    }

    res.status(204).json({
      status: 'delete success',
      data: doc
    });
  });
};

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const docUpdated = await Model.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true
    });

    if (!docUpdated) {
      next(new AppError('No document found with that id', 404));

      return;
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: docUpdated
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const newdoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        doc: newdoc
      }
    });
    // try {

    // } catch (err) {
    //   res.status(400).json({
    //     status: 'failed',
    //     message: err
    //   });
    // }
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) {
      query = query.populate(popOptions);
    }

    const doc = await query;

    if (!doc) {
      next(new AppError('No document found with that id', 404));

      return;
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //to allow for nested get reviews on tours
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs
      }
    });
  });
