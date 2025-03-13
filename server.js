const express = require('express');
const yahooFinance = require('yahoo-finance2').default;
const NodeCache = require('node-cache');
const cors = require('cors');
const fs = require('fs'); // Added for reading stocks.json
const app = express();
const cache = new NodeCache({ stdTTL: 86400 });

const PORT = 3000;

// Enable CORS for http://localhost:8000
app.use(cors({
  origin: 'http://localhost:8000'
}));
app.use(express.json());

// New endpoint to serve all stocks
app.get('/stocks', (req, res) => {
  try {
    const stocks = JSON.parse(fs.readFileSync('stocks.json', 'utf8'));
    res.json(stocks);
  } catch (error) {
    console.error('Error loading stocks:', error);
    res.status(500).json({ error: 'Failed to load stocks' });
  }
});

// Existing endpoint for stock prices
app.get('/stock/:ticker/:date', async (req, res) => {
  const { ticker, date } = req.params;
  const cacheKey = `${ticker}-${date}`;

  const cachedPrice = cache.get(cacheKey);
  if (cachedPrice) {
    console.log(`Cache hit for ${cacheKey}`);
    return res.json({ price: cachedPrice });
  }

  try {
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    const result = await yahooFinance.chart(ticker, {
      period1: date,
      period2: endDate,
      interval: '1d'
    });

    if (!result.quotes || !result.quotes.length) {
      return res.status(404).json({ error: 'No data for that date' });
    }

    const price = result.quotes[0].close;
    console.log(`Fetched ${ticker} on ${date}: ${price}`);
    cache.set(cacheKey, price);
    res.json({ price });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});