require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { seedDefaultUser } = require('./services/userService');
const { seedDefaultVendorInfo } = require('./services/vendorInfoService');

const app = express();

// Enable CORS
const corsOptions = {
  origin: '*', // Allow all origins, useful for split deployment on Vercel and local testing
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect Database
connectDB().then(() => {
  // Seed default admin/vendor user once DB (MongoDB or Local File) is ready
  seedDefaultUser();
  seedDefaultVendorInfo();
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/vendor-info', require('./routes/vendorInfo'));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Sekar Dairy Farm Livestock Trading API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
