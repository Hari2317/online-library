const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Security Middlewares
app.use(helmet()); 
app.use(cors()); 
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global Rate Limiting
const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: { status: 'fail', message: 'Too many requests from this IP, please try again in an hour!' }
});
app.use('/api', limiter);

// Placeholder connection for DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/library')
  .then(async () => {
    console.log('DB connection successful!');
    // Seed admin user
    try {
      const User = require('./models/User');
      const bcrypt = require('bcryptjs');
      
      // Force admin@library.com to be a librarian
      const existingUser = await User.findOne({ email: 'admin@library.com' });
      if (existingUser && existingUser.role !== 'librarian') {
          existingUser.role = 'librarian';
          await existingUser.save({ validateBeforeSave: false });
          console.log('Forced admin@library.com to librarian role');
      }

      const adminExists = await User.findOne({ role: 'librarian' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await User.create({
          name: 'System Admin',
          email: 'admin@library.com',
          password: hashedPassword,
          role: 'librarian'
        });
        console.log('Default Admin Account Created: admin@library.com / admin123');
      }
    } catch (err) {
      console.log('Error seeding admin:', err.message);
    }
  })
  .catch(err => console.log('DB Connection Error:', err));

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/books', require('./routes/books'));
app.use('/api/v1/transactions', require('./routes/transactions'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/v1/settings', require('./routes/settings'));

app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message || 'Internal Server Error'
  });
});

// Initialize Cron Jobs
const initCronJobs = require('./utils/cronJobs');
initCronJobs();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
