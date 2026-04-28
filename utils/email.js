/* eslint-disable import/no-extraneous-dependencies */
const nodemailer = require('nodemailer');

// const sendEmail = options => {
//   //1) create a transporter
//   const transporter = nodemailer.createTransport({
//     service: 'Gmail',
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD

//       //activate less secure app in gmail
//     }
//   });
//   //2) Define email options
//   //3) send email
// };

const sendEmail = async options => {
  //1) create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 2525,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD

      //activate less secure app in gmail
    }
  });
  //2) Define email options
  const mailOptions = {
    from: 'Gustavo Soler <hello@gsoler.dev',
    to: options.email,
    subject: options.subject,
    text: options.message
    //htmls
  };
  //3) send email

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
