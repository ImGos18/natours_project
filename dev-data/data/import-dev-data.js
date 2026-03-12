const fs = require('fs');
const mongoose = require('mongoose');
const dontenv = require('dotenv');
const Tour = require('./../../models/toursModel');

dontenv.config({ path: './config.env' });

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

//readJson
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

//import data

async function importData() {
  try {
    await Tour.create(tours);
    console.log('Data loaded');
  } catch (err) {
    console.log(err);
  }
}

//delete all data from db

async function deleteData() {
  try {
    await Tour.deleteMany();
    console.log('Data deleted');
  } catch (err) {
    console.log(err);
  }
}

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
