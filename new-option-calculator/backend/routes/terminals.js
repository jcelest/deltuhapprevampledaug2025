const express = require('express');
const router = express.Router();
const Terminal = require('../models/Terminal');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// GET all terminals for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const terminals = await Terminal.find({ userId: req.user.user.id })
      .sort({ updatedAt: -1 }) // Most recently updated first
      .select('-__v'); // Exclude version key
    
    res.json(terminals);
  } catch (error) {
    console.error('Error fetching terminals:', error);
    res.status(500).json({ message: 'Failed to fetch terminals' });
  }
});

// GET a specific terminal by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const terminal = await Terminal.findOne({
      _id: req.params.id,
      userId: req.user.user.id // Ensure user can only access their own terminals
    });

    if (!terminal) {
      return res.status(404).json({ message: 'Terminal not found' });
    }

    res.json(terminal);
  } catch (error) {
    console.error('Error fetching terminal:', error);
    res.status(500).json({ message: 'Failed to fetch terminal' });
  }
});

// POST create a new terminal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, layout, calculationResults, inputData, ticker, optionType } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Terminal name is required' });
    }

    if (!layout || !Array.isArray(layout)) {
      return res.status(400).json({ message: 'Terminal layout is required' });
    }

    const terminal = new Terminal({
      userId: req.user.user.id,
      name: name.trim(),
      description: description?.trim() || '',
      layout,
      calculationResults: calculationResults || null,
      inputData: inputData || {},
      ticker: ticker?.trim()?.toUpperCase() || '',
      optionType: optionType || ''
    });

    await terminal.save();

    res.status(201).json({
      message: 'Terminal saved successfully',
      terminal
    });
  } catch (error) {
    console.error('Error creating terminal:', error);
    res.status(500).json({ message: 'Failed to save terminal' });
  }
});

// PUT update an existing terminal
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, layout, calculationResults, inputData, ticker, optionType } = req.body;

    const terminal = await Terminal.findOne({
      _id: req.params.id,
      userId: req.user.user.id
    });

    if (!terminal) {
      return res.status(404).json({ message: 'Terminal not found' });
    }

    // Update fields
    if (name && name.trim()) terminal.name = name.trim();
    if (description !== undefined) terminal.description = description?.trim() || '';
    if (layout) terminal.layout = layout;
    if (calculationResults !== undefined) terminal.calculationResults = calculationResults;
    if (inputData !== undefined) terminal.inputData = inputData;
    if (ticker !== undefined) terminal.ticker = ticker?.trim()?.toUpperCase() || '';
    if (optionType !== undefined) terminal.optionType = optionType;

    await terminal.save();

    res.json({
      message: 'Terminal updated successfully',
      terminal
    });
  } catch (error) {
    console.error('Error updating terminal:', error);
    res.status(500).json({ message: 'Failed to update terminal' });
  }
});

// DELETE a terminal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const terminal = await Terminal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.user.id
    });

    if (!terminal) {
      return res.status(404).json({ message: 'Terminal not found' });
    }

    res.json({
      message: 'Terminal deleted successfully',
      terminalId: req.params.id
    });
  } catch (error) {
    console.error('Error deleting terminal:', error);
    res.status(500).json({ message: 'Failed to delete terminal' });
  }
});

module.exports = router;

