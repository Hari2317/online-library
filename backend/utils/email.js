const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // 1) Create a transporter
    // Defaulting to Gmail settings as requested (standard email)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
          rejectUnauthorized: false
      }
    });

    // 2) Define the email options
    const mailOptions = {
      from: '"RIT Library" <noreply@ritlibrary.com>',
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    // 3) Actually send the email
    // Check if credentials exist so it doesn't crash the server if you forget to add them to .env
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Missing EMAIL_USER or EMAIL_PASS in .env. Skipping real email delivery.');
      console.log('Simulated Email Sent to:', options.email);
      console.log('Subject:', options.subject);
      return; 
    }

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.email}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
