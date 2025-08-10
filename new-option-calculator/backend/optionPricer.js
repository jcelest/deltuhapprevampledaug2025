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
 * Checks if a given date is a valid US stock market trading day, 
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
 * Determines the correct timestamp for a calculation based on whether the
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

    const etHour = parseInt(parts.hour === '24' ? '0' : parts.hour);
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
    const timezoneOffset = (monthNum >= 3 && monthNum < 11) ? "-04:00" : "-05:00";
    
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


// --- [NEW] Core Calculation Engine: Cox-Ross-Rubinstein Binomial Model ---

/**
 * Calculates the value of an American-style option using the CRR Binomial Tree model.
 * @param {boolean} isCall - True for a call option, false for a put option.
 * @param {number} S - Current stock price.
 * @param {number} K - Strike price.
 * @param {number} T - Time to expiration in years.
 * @param {number} sigma - Implied volatility as a decimal (e.g., 0.2 for 20%).
 * @param {number} r - Risk-free interest rate.
 * @param {number} steps - The number of steps in the binomial tree.
 * @returns {number} The calculated option price.
 */
function coxRossRubinstein(isCall, S, K, T, sigma, r, steps = 100) {
    if (T <= 0 || sigma <= 0) {
        return isCall ? Math.max(0, S - K) : Math.max(0, K - S);
    }

    const dt = T / steps;
    const u = Math.exp(sigma * Math.sqrt(dt));
    const d = 1 / u;
    const p = (Math.exp(r * dt) - d) / (u - d);
    const discount = Math.exp(-r * dt);

    // Initialize asset prices at maturity
    const prices = new Array(steps + 1);
    for (let i = 0; i <= steps; i++) {
        prices[i] = S * Math.pow(u, i) * Math.pow(d, steps - i);
    }

    // Initialize option values at maturity
    const optionValues = new Array(steps + 1);
    for (let i = 0; i <= steps; i++) {
        optionValues[i] = isCall ? Math.max(0, prices[i] - K) : Math.max(0, K - prices[i]);
    }

    // Step back through the tree
    for (let step = steps - 1; step >= 0; step--) {
        for (let i = 0; i <= step; i++) {
            const holdValue = (p * optionValues[i + 1] + (1 - p) * optionValues[i]) * discount;
            const priceAtNode = S * Math.pow(u, i) * Math.pow(d, step - i);
            const exerciseValue = isCall ? Math.max(0, priceAtNode - K) : Math.max(0, K - priceAtNode);
            optionValues[i] = Math.max(holdValue, exerciseValue); // Key for American options
        }
    }

    return optionValues[0];
}


/**
 * Calculates a price range for an option by running the Binomial model
 * against a list of different risk-free interest rates.
 * @returns {string} A string representing the min-max price range, e.g., "1.23-1.45".
 */
function calculateOptionPriceRange(isCall, S, K, T, sigma) {
    // [MODIFIED] Using the new, more accurate Binomial model.
    const prices = RISK_FREE_RATES.map(r => coxRossRubinstein(isCall, S, K, T, sigma, r));
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

    // 3. This logic now correctly calculates time increments within market hours.
    const timeHeaders = [];
    const incrementsCount = 13;
    
    let totalTradingMinutes = 0;
    let tempDate = new Date(currentDateTime);
    
    // Calculate total trading minutes accurately
    while (tempDate < expirationDateTime) {
        if (isTradingDay(tempDate)) {
            const startOfDay = new Date(tempDate);
            startOfDay.setUTCHours(13, 30, 0, 0); // 9:30 AM ET in UTC (approx)
            const endOfDay = new Date(tempDate);
            endOfDay.setUTCHours(20, 0, 0, 0); // 4:00 PM ET in UTC (approx)

            if (tempDate < endOfDay) {
                const startCalc = tempDate < startOfDay ? startOfDay : tempDate;
                const endCalc = expirationDateTime < endOfDay ? expirationDateTime : endOfDay;
                if (startCalc < endCalc) {
                    totalTradingMinutes += (endCalc - startCalc) / (1000 * 60);
                }
            }
        }
        tempDate.setUTCDate(tempDate.getUTCDate() + 1);
        tempDate.setUTCHours(0, 0, 0, 0);
    }

    const incrementMinutes = totalTradingMinutes > 0 ? totalTradingMinutes / (incrementsCount - 1) : 0;
    
    for (let i = 0; i < incrementsCount; i++) {
        const minutesToAdd = i * incrementMinutes;
        let nextTime = new Date(currentDateTime);
        let remainingMinutes = minutesToAdd;

        let safetyBreak = 1000; // Prevent infinite loops
        while (remainingMinutes > 0 && safetyBreak > 0) {
            const startOfDay = new Date(nextTime);
            startOfDay.setUTCHours(13, 30, 0, 0);
            const endOfDay = new Date(nextTime);
            endOfDay.setUTCHours(20, 0, 0, 0);

            if (isTradingDay(nextTime) && nextTime >= startOfDay && nextTime < endOfDay) {
                const minutesLeftInDay = (endOfDay - nextTime) / (1000 * 60);
                if (remainingMinutes <= minutesLeftInDay) {
                    nextTime.setUTCMinutes(nextTime.getUTCMinutes() + remainingMinutes);
                    remainingMinutes = 0;
                } else {
                    nextTime = new Date(endOfDay);
                    remainingMinutes -= minutesLeftInDay;
                }
            } else {
                nextTime.setUTCDate(nextTime.getUTCDate() + 1);
                nextTime.setUTCHours(13, 30, 0, 0);
                 if (!isTradingDay(nextTime)) {
                    continue;
                }
            }
            safetyBreak--;
        }
        timeHeaders.push(nextTime);
    }


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
    getCalculationTime,
    calculateOptionPriceRange,
    generateTableData,
};
