const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

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
