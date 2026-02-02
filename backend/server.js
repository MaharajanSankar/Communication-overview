const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const personalDetailsRoutes = require('./routes/personalDetails');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files - Match your exact folder structure
app.use('/login', express.static(path.join(__dirname, '../frontend/Login')));
app.use('/personal-details', express.static(path.join(__dirname, '../frontend/PersonalDetails')));
app.use('/employee-directory', express.static(path.join(__dirname, '../frontend/Employee')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/details', personalDetailsRoutes);
app.use('/api/employees', employeeRoutes);

// Root route - redirect to login page
app.get('/', (req, res) => {
  res.redirect('/login/index.html');
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend index for client-side routing (catch-all before 404)
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(__dirname, '../frontend/Login/index.html'));
});

// 404 handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     Communication Overview - Server Running                ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Server:              http://localhost:${PORT}          ║
║  🔐 Login:               http://localhost:${PORT}/login/index.html
║  📝 Personal Details:    http://localhost:${PORT}/personal-details/index.html
║  📋 Employee Directory:  http://localhost:${PORT}/employee-directory/index.html
║  ❤️  Health Check:        http://localhost:${PORT}/api/health
╠════════════════════════════════════════════════════════════╣
║  📁 Folder Structure:                                      ║
║     ├── backend/                                           ║
║     │   ├── config/         ✅                             ║
║     │   ├── middleware/     ✅                             ║
║     │   ├── models/         ✅                             ║
║     │   ├── routes/         ✅                             ║
║     │   └── uploads/        ✅                             ║
║     └── frontend/                                          ║
║         ├── Login/          ✅                             ║
║         ├── PersonalDetails/ ✅                            ║
║         └── Employee/       ✅                             ║
╠════════════════════════════════════════════════════════════╣
║  💡 Press Ctrl+C to stop the server                       ║
╚════════════════════════════════════════════════════════════╝
  `);
});