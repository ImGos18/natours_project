const mongoose = require('mongoose');
const dontenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('uncaught exception... shutting down');
  console.log(err.name, err.message);
  process.exit(1);
});

dontenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<DB_PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('db connected');
  });

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('unhandled rejection... shutting down');
  server.close(() => {
    process.exit(1);
  });
});
