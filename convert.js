const fs = require('fs');
const csv = require('csv-parser');

const results = [];
fs.createReadStream('nasdaq_stocks.csv')
  .pipe(csv())
  .on('data', (row) => {
    results.push({
      ticker: row.Symbol,
      name: row.Name
    });
  })
  .on('end', () => {
    fs.writeFileSync('stocks.json', JSON.stringify(results, null, 2));
    console.log(`Converted ${results.length} stocks to stocks.json`);
  })
  .on('error', (err) => console.error('Error:', err));

