const path = require('path');
const express = require('express');
const config = require('./db/config');
const { initDatabase } = require('./db/init');
const { errorHandler } = require('./routes/errors');

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Reports must be mounted before the generic CRUD routes.
app.use('/api/reports', require('./routes/reports'));
app.use('/api', require('./routes/crud'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));
app.use(errorHandler);

async function start(port = config.port) {
  await initDatabase(); // creates database + tables (+ sample data) if missing
  return new Promise((resolve) => {
    const server = app.listen(port, () => resolve(server));
  });
}

if (require.main === module) {
  start()
    .then((server) => {
      console.log(`Connected to MySQL database "${config.database}".`);
      console.log(`Open http://localhost:${server.address().port} in your browser.`);
    })
    .catch((err) => {
      console.error('\nCould not start the application.');
      if (err.code === 'ECONNREFUSED') {
        console.error('MySQL is not running. Start the MySQL server and try again.');
      } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('MySQL rejected the username or password. Check DB_USER and DB_PASSWORD in the .env file.');
      } else {
        console.error(err.message);
      }
      process.exit(1);
    });
}

module.exports = { app, start };
