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


// --- Helper Functions ---

/**
 * Rounds a stock price to the nearest specified preference.
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
 * [MODIFIED] Calculates a stock price range that encompasses the current price and all strike prices in a strategy.
 * @param {number} S - Current stock price.
 * @param {number[]} strikePrices - An array of all strike prices from the strategy legs.
 * @param {number} priceIncrement - The increment value for the price range.
 * @returns {number[]} An array of stock prices.
 */
function calculateStockPriceRange(S, strikePrices, priceIncrement) {
    let stockPriceRange = [];
    const allPrices = [S, ...strikePrices];
    
    let lowerBound = Math.min(...allPrices) - priceIncrement * 5;
    let upperBound = Math.max(...allPrices) + priceIncrement * 5;

    lowerBound = Math.floor(lowerBound / priceIncrement) * priceIncrement;
    upperBound = Math.ceil(upperBound / priceIncrement) * priceIncrement;

    for (let price = lowerBound; price <= upperBound; price += priceIncrement) {
        stockPriceRange.push(roundStockPrice(price, priceIncrement));
    }

    // Ensure the actual current stock price and all strike prices are included.
    allPrices.forEach(p => {
        if (!stockPriceRange.includes(p)) stockPriceRange.push(p);
    });
    
    // Sort the final list and remove any duplicates.
    stockPriceRange = [...new Set(stockPriceRange)].sort((a, b) => a - b);

    return stockPriceRange;
}


// --- Core Calculation Engine: Cox-Ross-Rubinstein Binomial Model ---

/**
 * Calculates the value of a single American-style option leg.
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

    const prices = new Array(steps + 1);
    const optionValues = new Array(steps + 1);

    for (let i = 0; i <= steps; i++) {
        prices[i] = S * Math.pow(u, i) * Math.pow(d, steps - i);
        optionValues[i] = isCall ? Math.max(0, prices[i] - K) : Math.max(0, K - prices[i]);
    }

    for (let step = steps - 1; step >= 0; step--) {
        for (let i = 0; i <= step; i++) {
            const holdValue = (p * optionValues[i + 1] + (1 - p) * optionValues[i]) * discount;
            const priceAtNode = S * Math.pow(u, i) * Math.pow(d, step - i);
            const exerciseValue = isCall ? Math.max(0, priceAtNode - K) : Math.max(0, K - priceAtNode);
            optionValues[i] = Math.max(holdValue, exerciseValue);
        }
    }

    return optionValues[0];
}

// --- [NEW] Strategy Calculation Logic ---

/**
 * Calculates the average price of a single option leg by running the Binomial model
 * across the range of risk-free interest rates.
 * @returns {number} The average calculated premium for the leg.
 */
function calculateLegValue(leg, S, T, sigma) {
    const isCall = leg.type === 'call';
    const prices = RISK_FREE_RATES.map(r => coxRossRubinstein(isCall, S, leg.K, T, sigma, r));
    const minPrice = Math.max(0, Math.min(...prices));
    const maxPrice = Math.max(0, Math.max(...prices));
    // We return the average for combining into a strategy value
    return (minPrice + maxPrice) / 2;
}

/**
 * Calculates the total value of a strategy (a collection of legs) at a specific stock price and time.
 * @returns {number} The total value of the strategy.
 */
function calculateStrategyValue(strategy, S, T, sigma) {
    let totalValue = 0;
    for (const leg of strategy.legs) {
        const legValue = calculateLegValue(leg, S, T, sigma);
        if (leg.action === 'buy') {
            totalValue += legValue;
        } else { // 'sell'
            totalValue -= legValue;
        }
    }
    return totalValue;
}


/**
 * [MODIFIED] Generates the full P/L data set for an options strategy table.
 * @param {object} params - Input parameters for the calculation, including the strategy object.
 * @returns {object} A structured object containing headers, rows, and initial cost.
 */
function generateTableData(params) {
    // [MODIFIED] Destructure strategy object instead of single leg params
    const { S, sigma, currentDateTime, expirationDateTime, priceIncrement, strategy } = params;
    
    const allStrikePrices = strategy.legs.map(leg => leg.K);

    const timeToExpirationInitial = (expirationDateTime - currentDateTime) / (1000 * 60 * 60 * 24 * 365.25);
    if (timeToExpirationInitial <= 0) {
        return { error: "Expiration must be in the future." };
    }

    // [MODIFIED] Pass all strike prices to generate a comprehensive range
    const stockPriceHeaders = calculateStockPriceRange(S, allStrikePrices, priceIncrement);

    // This logic correctly calculates time increments within market hours.
    const timeHeaders = [];
    const incrementsCount = 13;
    let totalTradingMinutes = 0;
    let tempDate = new Date(currentDateTime);
    while (tempDate < expirationDateTime) {
        if (isTradingDay(tempDate)) {
            const startOfDay = new Date(tempDate);
            startOfDay.setUTCHours(13, 30, 0, 0);
            const endOfDay = new Date(tempDate);
            endOfDay.setUTCHours(20, 0, 0, 0);
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
        let safetyBreak = 1000;
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

    // [NEW] Calculate the initial cost (net debit/credit) of the strategy
    const initialCost = calculateStrategyValue(strategy, S, timeToExpirationInitial, sigma);

    // [MODIFIED] Generate table rows with Profit/Loss data for the strategy
    const rows = stockPriceHeaders.map(stockPrice => {
        const values = timeHeaders.map(timeHeader => {
            const T_increment = (expirationDateTime.getTime() - timeHeader.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            const projectedValue = calculateStrategyValue(strategy, stockPrice, T_increment, sigma);
            const profitLoss = projectedValue - initialCost;
            return profitLoss.toFixed(2); // Each cell is now a P/L value
        });
        return { stockPrice, values }; // Changed 'premiums' to 'values'
    });

    // [MODIFIED] Return the initial cost along with the table data
    return { 
        stockPriceHeaders, 
        timeHeaders, 
        rows,
        initialCost: {
            value: Math.abs(initialCost),
            type: initialCost > 0 ? 'Debit' : 'Credit'
        }
    };
}


module.exports = {
    getCalculationTime,
    generateTableData,
};
