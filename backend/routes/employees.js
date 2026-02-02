const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// @route   GET /api/employees
// @desc    Get all employees
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/employees/:id
// @desc    Get single employee by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/employees/search/:employeeId
// @desc    Search employee by employee ID
// @access  Public
router.get('/search/:employeeId', async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ 
      employeeId: { $regex: new RegExp(req.params.employeeId, 'i') } 
    });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/employees
// @desc    Create new employee
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    // Check if employee with same ID already exists
    const existingEmployee = await Employee.findOne({ employeeId: req.body.employeeId });
    
    if (existingEmployee) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee with this ID already exists' 
      });
    }

    const employee = await Employee.create(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Public
router.put('/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if trying to update employeeId to one that already exists
    if (req.body.employeeId && req.body.employeeId !== employee.employeeId) {
      const existingEmployee = await Employee.findOne({ employeeId: req.body.employeeId });
      if (existingEmployee) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee with this ID already exists' 
        });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Public
router.delete('/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await employee.deleteOne();
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;