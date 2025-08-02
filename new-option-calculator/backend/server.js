// Import necessary packages
const express = require('express');
const cors = require('cors');
const connectDB = require('./db'); // Import our database connection function
require('dotenv').config(); // Allows us to use environment variables from a .env file

// Import the calculation logic from our optionPricer file
const { calculateOptionPriceRange, generateTableData, getCalculationTime } = require('./optionPricer');

// --- INITIALIZATION ---

// Connect to MongoDB
connectDB();

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5001; // Use port from .env or default to 5001

// --- MIDDLEWARE ---

// Enable Cross-Origin Resource Sharing (CORS) to allow our frontend to make requests
const allowedOrigins = [
  'https://deltuhapprevampledaug2025.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., curl or mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS BLOCKED for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Enable the Express app to parse JSON formatted request bodies
app.use(express.json());


// --- API ROUTES ---

// 1. Authentication Routes
app.use('/api/auth', require('./routes/auth'));


// 2. Market Data Routes (Placeholder)
app.post('/api/fetch-market-data', (req, res) => {
  const { ticker } = req.body;
  console.log(`Simulating market data fetch for: ${ticker}`);
  
  res.json({
    currentStockPrice: 150.00,
    impliedVolatility: 25.5,
  });
});


// 3. Calculator Route
app.post('/api/calculate', (req, res) => {
  try {
    const { 
        stockPrice, 
        strikePrice, 
        expirationDate, 
        volatility, 
        optionType = 'call',
        priceIncrement = 1.0,
    } = req.body;

    if (!stockPrice || !strikePrice || !expirationDate || !volatility) {
      return res.status(400).json({ message: "Missing required parameters." });
    }
    
    // Use the new function to get the correct time
    const { calculationTime, isMarketOpen } = getCalculationTime();
    
    const params = {
      S: parseFloat(stockPrice),
      K: parseFloat(strikePrice),
      sigma: parseFloat(volatility) / 100,
      currentDateTime: calculationTime, // Use the smart timestamp
      expirationDateTime: new Date(expirationDate + "T16:00:00-04:00"),
      priceIncrement: parseFloat(priceIncrement),
      optionType,
    };
    
    const timeToExpiration = (params.expirationDateTime - params.currentDateTime) / (1000 * 60 * 60 * 24 * 365.25);
    
    const callPriceRange = calculateOptionPriceRange(true, params.S, params.K, timeToExpiration, params.sigma);
    const putPriceRange = calculateOptionPriceRange(false, params.S, params.K, timeToExpiration, params.sigma);
    const tableData = generateTableData(params);
    
    // Send the new data back to the frontend
    res.json({
      callPriceRange,
      putPriceRange,
      tableData,
      calculationTime, // The timestamp used for the calculation
      isMarketOpen,    // Whether the market was open
    });

  } catch (error) {
    console.error("Calculation Error:", error);
    res.status(500).json({ message: "An error occurred during calculation." });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
