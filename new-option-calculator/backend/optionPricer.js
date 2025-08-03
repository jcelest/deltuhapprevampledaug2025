// A hardcoded list of risk-free rates, as in your original code.
const RISK_FREE_RATES = [-0.0062, -0.0030, 0.0000, 0.10, 0.30];

// --- Market Holiday and Trading Day Logic ---

// A list of US stock market holidays (YYYY-MM-DD format).
const US_HOLIDAYS = [
    // 2024
    "2024-01-01", "2024-01-15", "2024-02-19", "2024-03-29", "2024-05-27", 
    "2024-06-19", "2024-07-04", "2024-09-02", "2024-11-28", "2024-12-25",
    // 2025
    "2025-01-01", "2025-01-20", "2025-02-17", "2025-04-18", "2025-05-26",
    "2025-06-19", "2025-07-04", "2025-09-01", "2025-11-27", "2025-12-25",
    // 2026
    "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25",
    "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25"
];

/**
 * [FIXED] Checks if a given date is a valid US stock market trading day, 
 * explicitly using the America/New_York timezone.
 * @param {Date} date - The date to check.
 * @returns {boolean} True if the date is a trading day.
 */
function isTradingDay(date) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short', // 'Sat'
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const parts = formatter.formatToParts(date).reduce((acc, part) => {
        if(part.type !== 'literal') acc[part.type] = part.value;
        return acc;
    }, {});

    const weekday = parts.weekday;
    if (['Sat', 'Sun'].includes(weekday)) {
        return false;
    }

    const dateString = `${parts.year}-${parts.month}-${parts.day}`;
    return !US_HOLIDAYS.includes(dateString);
}


// --- Market Hours Logic ---

/**
 * [FIXED] Determines the correct timestamp for a calculation based on whether the
 * US stock market is currently open, explicitly using the America/New_York timezone.
 * @returns {{calculationTime: Date, isMarketOpen: boolean}} An object containing the correct time and market status.
 */
function getCalculationTime() {
    const now = new Date();
    
    const etFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    });

    const parts = etFormatter.formatToParts(now).reduce((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = part.value;
        return acc;
    }, {});

    const etHour = parseInt(parts.hour);
    const etMinute = parseInt(parts.minute);

    const timeInMinutes = etHour * 60 + etMinute;
    const marketOpen = 9 * 60 + 30;
    const marketClose = 16 * 60;

    // Check if market is currently open using the new timezone-aware isTradingDay function
    if (isTradingDay(now) && timeInMinutes >= marketOpen && timeInMinutes < marketClose) {
        return { calculationTime: now, isMarketOpen: true };
    }

    // Market is closed. Determine the last closing date.
    let lastCloseDate = new Date(now);

    // If it's before market open on a trading day, the last close was the previous day.
    if (isTradingDay(now) && timeInMinutes < marketOpen) {
        lastCloseDate.setDate(lastCloseDate.getDate() - 1);
    }

    // Keep rewinding until we find a valid trading day
    while (!isTradingDay(lastCloseDate)) {
         lastCloseDate.setDate(lastCloseDate.getDate() - 1);
    }
    
    // Now we have the correct date. We need to represent 4 PM ET on this date.
    const closeDateParts = etFormatter.formatToParts(lastCloseDate).reduce((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = part.value;
        return acc;
    }, {});

    const finalYear = parseInt(closeDateParts.year);
    const finalMonth = String(closeDateParts.month).padStart(2, '0');
    const finalDay = String(closeDateParts.day).padStart(2, '0');

    // A simple check for DST in the US (March to November)
    const monthNum = parseInt(finalMonth);
    const timezoneOffset = (monthNum > 3 && monthNum < 11) ? "-04:00" : "-05:00";
    
    const finalIsoString = `${finalYear}-${finalMonth}-${finalDay}T16:00:00.000${timezoneOffset}`;
    const finalDate = new Date(finalIsoString);

    return { calculationTime: finalDate, isMarketOpen: false };
}


// --- Helper Functions (ported directly from your original optioncalculator.js) ---

/**
 * Rounds a stock price to the nearest specified preference.
 * @param {number} stockPrice - The price to round.
 * @param {number} roundingPreference - The value to round to (e.g., 0.5, 1, 5).
 * @returns {number} The rounded price.
 */
function roundStockPrice(stockPrice, roundingPreference) {
    switch (roundingPreference) {
        case 0.5: return Math.round(stockPrice * 2) / 2;
        case 1: return Math.round(stockPrice);
        case 2.5: return Math.round(stockPrice / 2.5) * 2.5;
        case 5: return Math.round(stockPrice / 5) * 5;
        case 10: return Math.round(stockPrice / 10) * 10;
        default: return stockPrice;
    }
}

/**
 * Calculates a dynamic range of stock prices for the table rows, matching the original app's logic.
 * @param {number} S - Current stock price.
 * @param {number} K - Strike price.
 * @param {number} priceIncrement - The increment value for the price range.
 * @returns {number[]} An array of stock prices.
 */
function calculateStockPriceRange(S, K, priceIncrement) {
    let stockPriceRange = [];
    // This logic now exactly matches your original code for a wider range.
    let lowerBound = Math.min(S, K) - priceIncrement * 5;
    let upperBound = Math.max(S, K) + priceIncrement * 5;

    lowerBound = Math.floor(lowerBound / priceIncrement) * priceIncrement;
    upperBound = Math.ceil(upperBound / priceIncrement) * priceIncrement;

    for (let price = lowerBound; price <= upperBound; price += priceIncrement) {
        stockPriceRange.push(roundStockPrice(price, priceIncrement));
    }

    // Ensure the actual current stock price and strike price are included in the list.
    if (!stockPriceRange.includes(S)) stockPriceRange.push(S);
    if (!stockPriceRange.includes(K)) stockPriceRange.push(K);
    
    // Sort the final list and remove any duplicates.
    stockPriceRange = [...new Set(stockPriceRange)].sort((a, b) => a - b);

    return stockPriceRange;
}


// --- Core Calculation Engine ---

/**
 * Calculates the value of a call or put option using the Black-Scholes model.
 * @param {boolean} isCall - True for a call option, false for a put option.
 * @param {number} S - Current stock price.
 * @param {number} K - Strike price.
 * @param {number} T - Time to expiration in years.
 * @param {number} sigma - Implied volatility as a decimal (e.g., 0.2 for 20%).
 * @param {number} r - Risk-free interest rate.
 * @returns {number} The calculated option price.
 */
function blackScholes(isCall, S, K, T, sigma, r) {
  if (T <= 0 || sigma <= 0) {
    // If at or past expiration, return the intrinsic value.
    if (isCall) return Math.max(0, S - K);
    return Math.max(0, K - S);
  }

  const d1 = (Math.log(S / K) + (r + (sigma ** 2) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const cdf_d1 = normalCdf(d1);
  const cdf_d2 = normalCdf(d2);

  if (isCall) {
    return S * cdf_d1 - K * Math.exp(-r * T) * cdf_d2;
  } else {
    return K * Math.exp(-r * T) * (1 - cdf_d2) - S * (1 - cdf_d1);
  }
}

/**
 * Approximates the cumulative distribution function (CDF) for the standard normal distribution.
 * @param {number} Z - The value to compute the CDF for.
 * @returns {number} The CDF value.
 */
function normalCdf(Z) {
  const p = 0.2316419;
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;

  const t = 1.0 / (1.0 + p * Math.abs(Z));
  const pdf = Math.exp(-Z * Z / 2.0) / Math.sqrt(2 * Math.PI);
  let cdf = 1.0 - pdf * (b1 * t + b2 * t ** 2 + b3 * t ** 3 + b4 * t ** 4 + b5 * t ** 5);
  
  if (Z < 0) {
    return 1.0 - cdf;
  }
  return cdf;
}

/**
 * Calculates a price range for an option by running the Black-Scholes model
 * against a list of different risk-free interest rates.
 * @returns {string} A string representing the min-max price range, e.g., "1.23-1.45".
 */
function calculateOptionPriceRange(isCall, S, K, T, sigma) {
  const prices = RISK_FREE_RATES.map(r => blackScholes(isCall, S, K, T, sigma, r));
  const minPrice = Math.max(0, Math.min(...prices));
  const maxPrice = Math.max(0, Math.max(...prices));
  return `${minPrice.toFixed(2)}-${maxPrice.toFixed(2)}`;
}

/**
 * Generates the full data set for the options pricing table.
 * @param {object} params - Input parameters for the calculation.
 * @returns {object} A structured object containing headers and rows for the table.
 */
function generateTableData(params) {
  const { S, K, sigma, currentDateTime, expirationDateTime, priceIncrement, optionType } = params;

  // 1. Calculate Time to Expiration (T) in years
  const timeToExpiration = (expirationDateTime - currentDateTime) / (1000 * 60 * 60 * 24 * 365.25);
  if (timeToExpiration <= 0) {
      return { error: "Expiration must be in the future." };
  }

  // 2. Generate Stock Price Headers for the table rows using the advanced logic
  const stockPriceHeaders = calculateStockPriceRange(S, K, priceIncrement);

  // 3. This logic is now a direct port of your original 'getDynamicIncrements' function
  const timeHeaders = [];
  const incrementsCount = 13; // As used in your original code
  let totalTradingMinutes = 0;
  let tempDate = new Date(currentDateTime);

  // Correctly calculate total trading minutes from the start time to expiration
  while(tempDate < expirationDateTime) {
      if(isTradingDay(tempDate)) {
          const startOfDay = new Date(tempDate);
          startOfDay.setHours(9, 30, 0, 0);
          const endOfDay = new Date(tempDate);
          endOfDay.setHours(16, 0, 0, 0);
          
          if (tempDate < endOfDay) {
              const startCalc = tempDate < startOfDay ? startOfDay : tempDate;
              const endCalc = expirationDateTime < endOfDay ? expirationDateTime : endOfDay;
              if (startCalc < endCalc) {
                  totalTradingMinutes += (endCalc - startCalc) / (1000 * 60);
              }
          }
      }
      tempDate.setDate(tempDate.getDate() + 1);
      tempDate.setHours(0, 0, 0, 0);
  }

  const incrementMinutes = totalTradingMinutes > 0 ? totalTradingMinutes / (incrementsCount - 1) : 0;
  timeHeaders.push(new Date(currentDateTime));

  for (let i = 1; i < incrementsCount; i++) {
      let minutesToAdd = incrementMinutes * i;
      let nextTime = new Date(currentDateTime);
      
      let safetyBreak = 1000; // Prevent infinite loops
      while(minutesToAdd > 0 && safetyBreak > 0) {
          const hours = nextTime.getHours();
          const minutes = nextTime.getMinutes();

          if (isTradingDay(nextTime) && (hours > 9 || (hours === 9 && minutes >= 30)) && hours < 16) {
              let minutesLeftInDay = (16 * 60) - (hours * 60 + minutes);
              let addNow = Math.min(minutesToAdd, minutesLeftInDay);
              nextTime.setMinutes(nextTime.getMinutes() + addNow);
              minutesToAdd -= addNow;
          } else {
              nextTime.setDate(nextTime.getDate() + 1);
              nextTime.setHours(9, 30, 0, 0);
          }
          safetyBreak--;
      }
      timeHeaders.push(nextTime);
  }
  timeHeaders[timeHeaders.length - 1] = new Date(expirationDateTime);


  // 4. Generate the table rows with premium data based on the selected option type
  const isCall = optionType === 'call';
  const rows = stockPriceHeaders.map(stockPrice => {
      const premiums = timeHeaders.map(timeHeader => {
          const T_increment = (expirationDateTime.getTime() - timeHeader.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          return calculateOptionPriceRange(isCall, stockPrice, K, T_increment, sigma);
      });
      return { stockPrice, premiums };
  });

  return { stockPriceHeaders, timeHeaders, rows };
}


module.exports = {
  getCalculationTime, // Export the new function
  blackScholes,
  calculateOptionPriceRange,
  generateTableData,
};
